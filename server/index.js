const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 4000;
const isProd = process.env.NODE_ENV === 'production';

const DATA_PATH = path.join(__dirname, 'data.json');

function loadData() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return {
      students: [],
      publishLeaderboard: true,
      quizScores: {},
      prCounts: {},
    };
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

const ADMIN_CREDENTIALS = {
  rollNumber: 'ADMIN001',
  password: 'adminpass',
  name: 'Event Admin',
};

const corsOptions = isProd
  ? { origin: process.env.CORS_ORIGIN || true, credentials: true }
  : { origin: true };

app.use(cors(corsOptions));
app.use(express.json());

function makeToken(payload) {
  const json = JSON.stringify(payload);
  return Buffer.from(json).toString('base64url');
}

function parseToken(token) {
  try {
    const json = Buffer.from(token, 'base64url').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function buildLeaderboards(data) {
  const byRoll = (a, b) => (data.quizScores[b] ?? 0) - (data.quizScores[a] ?? 0);
  const sorted = [...new Set([...Object.keys(data.quizScores), ...Object.keys(data.prCounts)])].sort(byRoll);
  const quizLeaderboard = sorted
    .map((roll, i) => {
      const s = data.students.find((x) => x.rollNumber === roll);
      if (!s) return null;
      return {
        rank: i + 1,
        name: s.name,
        rollNumber: s.rollNumber,
        githubUsername: s.githubUsername,
        score: data.quizScores[roll] ?? 0,
      };
    })
    .filter(Boolean);

  const prSorted = Object.entries(data.prCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([roll], i) => {
      const s = data.students.find((x) => x.rollNumber === roll);
      if (!s) return null;
      return {
        rank: i + 1,
        githubUsername: s.githubUsername,
        rollNumber: s.rollNumber,
        prCount: data.prCounts[roll] ?? 0,
      };
    })
    .filter(Boolean);

  return { quizLeaderboard, prLeaderboard: prSorted };
}

// Signup
app.post('/api/signup', (req, res) => {
  const { name, email, githubUsername, year, password } = req.body || {};

  if (!name || !email || !githubUsername || !year || !password) {
    return res.status(400).json({
      message: 'Name, email, GitHub username, year, and password are required.',
    });
  }

  const emailLower = String(email).trim().toLowerCase();
  if (!emailLower.endsWith('@mmmut.ac.in')) {
    return res.status(400).json({
      message: 'Please use your university email address (@mmmut.ac.in).',
    });
  }

  const rollNumber = emailLower.slice(0, -'@mmmut.ac.in'.length);
  if (!rollNumber || !/^[a-zA-Z0-9_.+-]+$/.test(rollNumber)) {
    return res.status(400).json({
      message: 'Invalid email format. The part before @ should be your roll number.',
    });
  }

  const data = loadData();
  const exists = data.students.some(
    (s) => s.rollNumber === rollNumber || s.email?.toLowerCase() === emailLower
  );
  if (exists) {
    return res.status(409).json({
      message: 'An account with this email or roll number already exists.',
    });
  }

  const validYears = ['1st', '2nd', '3rd', '4th'];
  const yearNorm = validYears.includes(year) ? year : validYears[0];

  const id = Math.max(0, ...data.students.map((s) => s.id)) + 1;
  const student = {
    id,
    name: String(name).trim(),
    rollNumber,
    email: emailLower,
    year: yearNorm,
    githubUsername: String(githubUsername).trim().replace(/^@/, ''),
    password: String(password),
  };

  data.students.push(student);
  if (!data.quizScores[rollNumber]) data.quizScores[rollNumber] = 0;
  if (!data.prCounts[rollNumber]) data.prCounts[rollNumber] = 0;
  saveData(data);

  res.status(201).json({
    message: 'Account created successfully.',
    rollNumber: student.rollNumber,
  });
});

// Login (email or roll number)
app.post('/api/login', (req, res) => {
  // Accept a few common field names to avoid client/server mismatches.
  const { identifier, email, rollNumber, password, pass } = req.body || {};
  const ident = String(identifier || email || rollNumber || '').trim();
  const pwd = password ?? pass;

  if (!ident || !pwd) {
    return res.status(400).json({ message: 'Email/roll number and password are required.' });
  }

  if (ident === ADMIN_CREDENTIALS.rollNumber && pwd === ADMIN_CREDENTIALS.password) {
    const token = makeToken({ role: 'admin', rollNumber: ident });
    return res.json({
      role: 'admin',
      name: ADMIN_CREDENTIALS.name,
      rollNumber: ident,
      token,
    });
  }

  const data = loadData();
  const rollFromEmail = ident.toLowerCase().endsWith('@mmmut.ac.in')
    ? ident.slice(0, -'@mmmut.ac.in'.length)
    : null;

  const student = data.students.find(
    (s) =>
      (s.rollNumber === ident || s.email?.toLowerCase() === ident.toLowerCase() || s.rollNumber === rollFromEmail) &&
      s.password === pwd
  );

  if (!student) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const token = makeToken({ role: 'student', rollNumber: student.rollNumber });

  res.json({
    role: 'student',
    name: student.name,
    rollNumber: student.rollNumber,
    githubUsername: student.githubUsername,
    token,
  });
});

function requireAdmin(req, res, next) {
  const token = req.headers['x-auth-token'];
  if (!token) return res.status(401).json({ message: 'Missing auth token.' });
  const payload = parseToken(token);
  if (!payload || payload.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  req.user = payload;
  next();
}

// Public leaderboard
app.get('/api/leaderboard', (req, res) => {
  const data = loadData();
  if (!data.publishLeaderboard) {
    return res.json({ published: false });
  }

  const { quizLeaderboard, prLeaderboard } = buildLeaderboards(data);
  const withStatus = prLeaderboard.map((e) => ({
    ...e,
    status: `${e.prCount}/5 PRs Completed`,
    qualified: e.prCount >= 5,
  }));

  res.json({ published: true, quizLeaderboard, prLeaderboard: withStatus });
});

// Admin overview
app.get('/api/admin/overview', requireAdmin, (req, res) => {
  const data = loadData();
  const { quizLeaderboard, prLeaderboard } = buildLeaderboards(data);
  const withStatus = prLeaderboard.map((e) => ({
    ...e,
    status: `${e.prCount}/5 PRs Completed`,
    qualified: e.prCount >= 5,
  }));

  res.json({
    totalRegistrations: data.students.length,
    publishLeaderboard: data.publishLeaderboard,
    students: data.students.map(({ password, ...s }) => ({
      ...s,
      quizScore: data.quizScores[s.rollNumber] ?? 0,
      prCount: data.prCounts[s.rollNumber] ?? 0,
    })),
    quizLeaderboard,
    prLeaderboard: withStatus,
  });
});

app.post('/api/admin/publish-leaderboard', requireAdmin, (req, res) => {
  const data = loadData();
  data.publishLeaderboard = !!req.body?.publish;
  saveData(data);
  res.json({ publishLeaderboard: data.publishLeaderboard });
});

app.put('/api/admin/participant/:rollNumber', requireAdmin, (req, res) => {
  const roll = String(req.params.rollNumber || '').trim();
  if (!roll) return res.status(400).json({ message: 'Roll number is required.' });

  const data = loadData();
  const student = data.students.find((s) => s.rollNumber === roll);
  if (!student) return res.status(404).json({ message: 'Participant not found.' });

  const { quizScore, prCount } = req.body || {};
  let changed = false;

  if (quizScore !== undefined) {
    const v = Number(quizScore);
    if (!Number.isFinite(v) || v < 0) {
      return res.status(400).json({ message: 'quizScore must be a non-negative number.' });
    }
    data.quizScores[roll] = Math.floor(v);
    changed = true;
  }

  if (prCount !== undefined) {
    const v = Number(prCount);
    if (!Number.isFinite(v) || v < 0) {
      return res.status(400).json({ message: 'prCount must be a non-negative number.' });
    }
    data.prCounts[roll] = Math.floor(v);
    changed = true;
  }

  if (changed) saveData(data);

  return res.json({
    rollNumber: roll,
    quizScore: data.quizScores[roll] ?? 0,
    prCount: data.prCounts[roll] ?? 0,
  });
});

app.delete('/api/admin/participant/:rollNumber', requireAdmin, (req, res) => {
  const roll = String(req.params.rollNumber || '').trim();
  if (!roll) return res.status(400).json({ message: 'Roll number is required.' });

  const data = loadData();
  const before = data.students.length;
  data.students = data.students.filter((s) => s.rollNumber !== roll);
  if (data.students.length === before) {
    return res.status(404).json({ message: 'Participant not found.' });
  }

  delete data.quizScores[roll];
  delete data.prCounts[roll];
  saveData(data);

  return res.json({ deleted: true, rollNumber: roll });
});

if (isProd && process.env.SERVE_STATIC === 'true') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`GDG MMMUT FOSS dashboard API running on port ${PORT}`);
});
