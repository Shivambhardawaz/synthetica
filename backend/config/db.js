const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/db.json');
let storageMode = 'json-fallback';

function getStorageMode() { return storageMode; }

// Ensure data directory and db.json exist
function ensureDB() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({
      websites: [], identities: [], testSessions: [], auditLogs: [], mockEmails: []
    }, null, 2));
  }
}

function readDB() {
  ensureDB();
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')); }
  catch { return { websites: [], identities: [], testSessions: [], auditLogs: [], mockEmails: [] }; }
}

function writeDB(data) {
  ensureDB();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// MockQuery — supports chaining .sort() .limit() .skip() .select() .lean()
class MockQuery {
  constructor(results) { this._results = [...results]; }
  sort(criteria) {
    if (criteria && typeof criteria === 'object') {
      const [key, dir] = Object.entries(criteria)[0];
      this._results.sort((a, b) => {
        if (a[key] < b[key]) return dir === -1 ? 1 : -1;
        if (a[key] > b[key]) return dir === -1 ? -1 : 1;
        return 0;
      });
    }
    return this;
  }
  limit(n) { if (n > 0) this._results = this._results.slice(0, n); return this; }
  skip(n) { this._results = this._results.slice(n); return this; }
  select() { return this; }
  lean() { return this; }
  then(resolve, reject) { return Promise.resolve(this._results).then(resolve, reject); }
  catch(fn) { return Promise.resolve(this._results).catch(fn); }
}

function createModelWrapper(collectionName) {
  return {
    find(query = {}) {
      const db = readDB();
      const col = db[collectionName] || [];
      const filtered = col.filter(doc => {
        return Object.entries(query).every(([k, v]) => doc[k] === v);
      });
      return new MockQuery(filtered);
    },
    findOne(query = {}) {
      const db = readDB();
      const col = db[collectionName] || [];
      const doc = col.find(doc => Object.entries(query).every(([k, v]) => doc[k] === v)) || null;
      return { then: (r) => Promise.resolve(doc).then(r), catch: (f) => Promise.resolve(doc).catch(f), lean: () => ({ then: (r) => Promise.resolve(doc).then(r) }) };
    },
    findById(id) {
      const db = readDB();
      const col = db[collectionName] || [];
      const doc = col.find(d => d._id === id) || null;
      return { then: (r) => Promise.resolve(doc).then(r), lean: () => ({ then: (r) => Promise.resolve(doc).then(r) }) };
    },
    async create(data) {
      const db = readDB();
      if (!db[collectionName]) db[collectionName] = [];
      const doc = { _id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      db[collectionName].push(doc);
      writeDB(db);
      return doc;
    },
    async findByIdAndUpdate(id, update, opts = {}) {
      const db = readDB();
      const col = db[collectionName] || [];
      const idx = col.findIndex(d => d._id === id);
      if (idx === -1) return null;
      const upd = update.$set || update;
      col[idx] = { ...col[idx], ...upd, updatedAt: new Date().toISOString() };
      writeDB(db);
      return opts.new ? col[idx] : col[idx];
    },
    async findByIdAndDelete(id) {
      const db = readDB();
      const col = db[collectionName] || [];
      const idx = col.findIndex(d => d._id === id);
      if (idx === -1) return null;
      const [doc] = col.splice(idx, 1);
      db[collectionName] = col;
      writeDB(db);
      return doc;
    },
    async deleteMany(query = {}) {
      const db = readDB();
      const col = db[collectionName] || [];
      const before = col.length;
      db[collectionName] = col.filter(doc => !Object.entries(query).every(([k, v]) => doc[k] === v));
      writeDB(db);
      return { deletedCount: before - db[collectionName].length };
    },
    async countDocuments(query = {}) {
      const db = readDB();
      const col = db[collectionName] || [];
      return col.filter(doc => Object.entries(query).every(([k, v]) => doc[k] === v)).length;
    },
    async distinct(field) {
      const db = readDB();
      const col = db[collectionName] || [];
      return [...new Set(col.map(d => d[field]).filter(Boolean))];
    },
    async insertMany(docs) {
      const db = readDB();
      if (!db[collectionName]) db[collectionName] = [];
      const inserted = docs.map(d => ({ _id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, ...d, createdAt: new Date().toISOString() }));
      db[collectionName].push(...inserted);
      writeDB(db);
      return inserted;
    }
  };
}

async function connectDB() {
  ensureDB();
  const mongoose = require('mongoose');
  const MONGO_URI = process.env.MONGO_URI || '';
  if (MONGO_URI) {
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 3000 });
      storageMode = 'mongodb';
      console.log('✅ MongoDB connected');
      return;
    } catch (e) {
      console.log('⚠️  MongoDB unavailable, using JSON fallback');
    }
  } else {
    console.log('ℹ️  No MONGO_URI set — using JSON file storage');
  }
  storageMode = 'json-fallback';
}

module.exports = { connectDB, getStorageMode, createModelWrapper };
