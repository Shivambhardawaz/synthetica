"""
Playwright Automation Runner for Email-Based Website Visit Tracking
Runs in authorized test environments. Simulates realistic test-user page navigation,
records performance metrics, manages scrolling duration, and respects pause/resume/stop signals.
"""

import os
import sys
import json
import time
import argparse
import threading
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

# Thread-safe control flags for pause/resume/stop
is_paused = False
is_stopped = False
control_lock = threading.Lock()

def listen_for_stdin_commands():
    """Listens for PAUSE, RESUME, STOP commands sent from the Node.js runner process."""
    global is_paused, is_stopped
    try:
        for line in sys.stdin:
            cmd = line.strip().upper()
            with control_lock:
                if cmd == "PAUSE":
                    is_paused = True
                    sys.stderr.write("[RUNNER_SIGNAL] Execution Paused\n")
                    sys.stderr.flush()
                elif cmd == "RESUME":
                    is_paused = False
                    sys.stderr.write("[RUNNER_SIGNAL] Execution Resumed\n")
                    sys.stderr.flush()
                elif cmd == "STOP":
                    is_stopped = True
                    sys.stderr.write("[RUNNER_SIGNAL] Execution Stop Requested\n")
                    sys.stderr.flush()
                    break
    except Exception as e:
        sys.stderr.write(f"[RUNNER_SIGNAL_ERROR] {e}\n")

def emit_event(event_type, **kwargs):
    """Outputs structured JSON event line to stdout for Node.js process consumption."""
    payload = {"type": event_type, "timestamp": time.time(), **kwargs}
    sys.stdout.write(json.dumps(payload) + "\n")
    sys.stdout.flush()

def main():
    parser = argparse.ArgumentParser(description="Playwright Visit Runner")
    parser.add_argument("--url", required=True, help="Target website URL")
    parser.add_argument("--email", required=True, help="Synthetic test user email")
    parser.add_argument("--session-id", required=True, help="Session tracking ID")
    parser.add_argument("--scroll-duration", type=int, default=30, help="Scroll duration in seconds (e.g. 10, 30, 60, 120)")
    parser.add_argument("--headless", type=str, default="true", help="Run browser in headless mode (true/false)")
    parser.add_argument("--screenshots-dir", default="./automation/screenshots", help="Directory to save run screenshots")

    args = parser.parse_args()
    headless_mode = args.headless.lower() != "false"
    os.makedirs(args.screenshots_dir, exist_ok=True)
    screenshot_path = os.path.join(args.screenshots_dir, f"{args.session_id}.png")

    # Start stdin listener for real-time control (pause/resume/stop)
    listener_thread = threading.Thread(target=listen_for_stdin_commands, daemon=True)
    listener_thread.start()

    emit_event("started", sessionId=args.session_id, url=args.url, email=args.email, scrollDuration=args.scroll_duration)

    metrics = {
        "status_code": 0,
        "page_title": "",
        "dom_content_loaded_ms": 0,
        "load_time_ms": 0,
        "scroll_depth_percent": 0,
        "navigation_error": None,
        "screenshot_saved": False,
        "screenshot_path": None,
        "duration_seconds": 0,
        "completed": False,
        "interrupted": False
    }

    start_timestamp = time.time()

    with sync_playwright() as p:
        try:
            # Launch chromium with safe test automation flags
            browser = p.chromium.launch(
                headless=headless_mode,
                args=[
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-gpu"
                ]
            )

            # Create context with explicit identification headers & user agent
            parsed_url = urlparse(args.url)
            domain = parsed_url.hostname or "localhost"

            context = browser.new_context(
                user_agent=f"Mozilla/5.0 (Windows NT 10.0; Win64; x64) TestAutomator/2.0 (Identity: {args.email}; Session: {args.session_id})",
                viewport={"width": 1280, "height": 800},
                extra_http_headers={
                    "X-Automated-Test-User": args.email,
                    "X-Test-Session-Id": args.session_id,
                    "X-Automation-Purpose": "AuthorizedAnalyticsValidation"
                }
            )

            # Pre-set tracking cookie on target domain for email-based visitor count
            try:
                context.add_cookies([{
                    "name": "test_user_email",
                    "value": args.email,
                    "domain": domain,
                    "path": "/"
                }])
            except Exception as cookie_err:
                # Some local URLs or custom domains might reject strict cookie domain matching
                pass

            page = context.new_page()

            # Record navigation timing
            t0 = time.time()
            response = None

            emit_event("progress", stage="navigating", message=f"Connecting to {args.url} as {args.email}...", percent=5)
            
            try:
                response = page.goto(args.url, wait_until="domcontentloaded", timeout=45000)
                dom_time = (time.time() - t0) * 1000
                metrics["dom_content_loaded_ms"] = round(dom_time, 2)
            except Exception as nav_err:
                metrics["navigation_error"] = str(nav_err)
                emit_event("error", error=f"Navigation failed: {str(nav_err)}")
                raise

            if response:
                metrics["status_code"] = response.status

            try:
                page.wait_for_load_state("load", timeout=15000)
            except Exception:
                pass # Non-blocking if third party trackers hang
            
            full_load_time = (time.time() - t0) * 1000
            metrics["load_time_ms"] = round(full_load_time, 2)
            metrics["page_title"] = page.title() or "Untitled Document"

            emit_event("progress", stage="loaded", 
                       message=f"Page loaded in {metrics['load_time_ms']}ms (HTTP {metrics['status_code']}): '{metrics['page_title']}'",
                       statusCode=metrics["status_code"], 
                       loadTimeMs=metrics["load_time_ms"], 
                       percent=20)

            # If the page has our custom test tracker listener or counter hook, inject session ping
            try:
                page.evaluate("""(data) => {
                    if (window.__ON_TEST_USER_VISIT) {
                        window.__ON_TEST_USER_VISIT(data);
                    }
                    // Dispatch synthetic visit event for local demo site
                    window.dispatchEvent(new CustomEvent('test-user-visit', { detail: data }));
                }""", {"email": args.email, "sessionId": args.session_id, "timestamp": time.time()})
            except Exception:
                pass

            # Scroll execution phase
            total_duration = max(5, args.scroll_duration)
            time_spent = 0.0
            interval_step = 1.0  # Check every 1 second
            
            emit_event("progress", stage="scrolling", message=f"Starting {total_duration}s active scroll simulation...", percent=25)

            while time_spent < total_duration:
                # Check for stop signal
                with control_lock:
                    if is_stopped:
                        metrics["interrupted"] = True
                        emit_event("progress", stage="stopped", message="Test execution halted by user request.", percent=int(25 + 70 * (time_spent / total_duration)))
                        break
                    
                    if is_paused:
                        emit_event("progress", stage="paused", message="Test session paused. Waiting for resume signal...", percent=int(25 + 70 * (time_spent / total_duration)))
                
                # If paused, sleep briefly and loop without advancing time_spent
                if is_paused:
                    time.sleep(0.5)
                    continue

                # Calculate smooth scroll position
                fraction = time_spent / total_duration
                # Smooth sinusoidal-like down-and-up scroll behavior
                scroll_percent = int(fraction * 100)
                
                try:
                    # Scroll dynamically
                    page.evaluate("""(pct) => {
                        const maxScroll = Math.max(
                            document.body.scrollHeight,
                            document.documentElement.scrollHeight,
                            1000
                        ) - window.innerHeight;
                        if (maxScroll > 0) {
                            window.scrollTo({
                                top: Math.floor(maxScroll * (pct / 100)),
                                behavior: 'smooth'
                            });
                        }
                    }""", scroll_percent)
                    metrics["scroll_depth_percent"] = max(metrics["scroll_depth_percent"], scroll_percent)
                except Exception as scroll_err:
                    sys.stderr.write(f"[SCROLL_WARN] {scroll_err}\n")

                time.sleep(interval_step)
                time_spent += interval_step

                progress_percent = int(25 + (65 * (time_spent / total_duration)))
                emit_event("progress", stage="scrolling",
                           message=f"Reading & scrolling: {scroll_percent}% depth ({int(time_spent)}s / {total_duration}s)",
                           percent=progress_percent,
                           scrollPercent=scroll_percent,
                           elapsedSeconds=round(time_spent, 1))

            # Final capture: screenshot
            try:
                page.screenshot(path=screenshot_path, full_page=False)
                metrics["screenshot_saved"] = True
                metrics["screenshot_path"] = screenshot_path
            except Exception as ss_err:
                metrics["screenshot_saved"] = False
                sys.stderr.write(f"[SCREENSHOT_WARN] {ss_err}\n")

            metrics["completed"] = not metrics["interrupted"]
            metrics["duration_seconds"] = round(time.time() - start_timestamp, 2)

            browser.close()

            emit_event("complete", 
                       success=True, 
                       metrics=metrics, 
                       message="Session completed successfully" if metrics["completed"] else "Session stopped early")

        except Exception as e:
            metrics["completed"] = False
            metrics["navigation_error"] = str(e)
            metrics["duration_seconds"] = round(time.time() - start_timestamp, 2)
            emit_event("complete", success=False, metrics=metrics, error=str(e))
            sys.exit(1)

if __name__ == "__main__":
    main()
