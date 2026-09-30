import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { cloudDb } from './src/server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Body parsers with 10MB limit for cloud file/image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure upload directory exists for local/cloud file storage
const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

// Simple Bearer token auth middleware
// In our cloud architecture, tokens format: "token_<userId>" or verified JWT
interface AuthRequest extends Request {
  userId?: string;
}

const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Invalid authentication token.' });
  }

  // Token is "token_<userId>" or direct userId for simulation
  const userId = token.startsWith('token_') ? token.replace('token_', '') : token;
  const user = cloudDb.getUserById(userId);
  if (!user) {
    return res.status(401).json({ error: 'Session expired or user not found. Please log in again.' });
  }

  req.userId = userId;
  next();
};

// Optional auth helper (for feed queries that can show user-specific "liked_by_me" state)
const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const userId = token.startsWith('token_') ? token.replace('token_', '') : token;
    if (cloudDb.getUserById(userId)) {
      req.userId = userId;
    }
  }
  next();
};

// ==========================================
// 1. AUTH REST APIS
// ==========================================

// POST /api/register
app.post('/api/register', (req: Request, res: Response) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ error: 'All fields (name, username, email, password) are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existingEmail = cloudDb.getUserByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const existingUsername = cloudDb.getUserByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ error: 'This username is already taken. Please choose another.' });
    }

    const newUser = cloudDb.createUser({
      name,
      username,
      email,
      password_hash: password // In real cloud deployment, hashed via bcrypt / Firebase Auth
    });

    res.status(201).json({
      message: 'Registration successful',
      token: `token_${newUser.user_id}`,
      user: newUser
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error during registration.' });
  }
});

// POST /api/login
app.post('/api/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = cloudDb.getUserByEmail(email);
    if (!user || user.password_hash !== password) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const { password_hash, ...publicUser } = user;
    res.json({
      message: 'Login successful',
      token: `token_${user.user_id}`,
      user: publicUser
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error during login.' });
  }
});

// POST /api/logout
app.post('/api/logout', requireAuth, (_req: AuthRequest, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

// ==========================================
// 2. USER PROFILE REST APIS
// ==========================================

// GET /api/profile
app.get('/api/profile', requireAuth, (req: AuthRequest, res: Response) => {
  const profile = cloudDb.getUserById(req.userId!);
  if (!profile) return res.status(404).json({ error: 'User profile not found.' });
  res.json(profile);
});

// PUT /api/profile
app.put('/api/profile', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { name, bio, interests, profile_picture } = req.body;
    const updated = cloudDb.updateUserProfile(req.userId!, {
      name,
      bio,
      interests,
      profile_picture
    });
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/users/:uid
app.get('/api/users/:uid', (req: Request, res: Response) => {
  const profile = cloudDb.getUserById(req.params.uid);
  if (!profile) return res.status(404).json({ error: 'User not found.' });
  res.json(profile);
});

// ==========================================
// 3. SKILLS REST APIS
// ==========================================

// POST /api/skills
app.post('/api/skills', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { skill_name, category, current_level, target_level, start_date, target_date, status, description } = req.body;

    if (!skill_name || !category) {
      return res.status(400).json({ error: 'Skill name and category are required.' });
    }

    const skill = cloudDb.createSkill({
      user_id: req.userId!,
      skill_name: skill_name.trim(),
      category: category.trim(),
      current_level: current_level || 'BEGINNER',
      target_level: target_level || 'INTERMEDIATE',
      start_date: start_date || new Date().toISOString().split('T')[0],
      target_date: target_date || '',
      status: status || 'ACTIVE',
      description: description || ''
    });

    res.status(201).json(skill);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/skills
app.get('/api/skills', requireAuth, (req: AuthRequest, res: Response) => {
  const skills = cloudDb.getSkillsByUser(req.userId!);
  res.json(skills);
});

// GET /api/skills/:id
app.get('/api/skills/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const skill = cloudDb.getSkillById(req.params.id);
  if (!skill) return res.status(404).json({ error: 'Skill not found.' });
  if (skill.user_id !== req.userId) {
    return res.status(403).json({ error: 'Access denied to private skill.' });
  }
  res.json(skill);
});

// PUT /api/skills/:id
app.put('/api/skills/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const updated = cloudDb.updateSkill(req.params.id, req.userId!, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/skills/:id
app.delete('/api/skills/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    cloudDb.deleteSkill(req.params.id, req.userId!);
    res.json({ message: 'Skill deleted successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 4. PRACTICE SESSION REST APIS
// ==========================================

// POST /api/practice
app.post('/api/practice', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { skill_id, duration_minutes, activity, notes, practiced_at } = req.body;

    if (!skill_id || !duration_minutes || !activity) {
      return res.status(400).json({ error: 'Skill, duration, and activity description are required.' });
    }

    const durationNum = Number(duration_minutes);
    if (isNaN(durationNum) || durationNum <= 0) {
      return res.status(400).json({ error: 'Practice duration must be a positive number of minutes.' });
    }

    const result = cloudDb.createPracticeSession({
      user_id: req.userId!,
      skill_id,
      duration_minutes: durationNum,
      activity,
      notes,
      practiced_at
    });

    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/practice
app.get('/api/practice', requireAuth, (req: AuthRequest, res: Response) => {
  const sessions = cloudDb.getPracticeSessionsByUser(req.userId!);
  res.json(sessions);
});

// GET /api/skills/:id/practice
app.get('/api/skills/:id/practice', requireAuth, (req: AuthRequest, res: Response) => {
  const sessions = cloudDb.getPracticeSessionsByUser(req.userId!, req.params.id);
  res.json(sessions);
});

// ==========================================
// 5. GOALS & MILESTONES REST APIS
// ==========================================

// POST /api/goals
app.post('/api/goals', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { skill_id, title, target_value, unit, deadline, initial_milestones } = req.body;

    if (!skill_id || !title || !target_value) {
      return res.status(400).json({ error: 'Skill ID, title, and target value are required.' });
    }

    const goal = cloudDb.createGoal({
      user_id: req.userId!,
      skill_id,
      title: title.trim(),
      target_value: Number(target_value),
      unit: unit || 'hours',
      deadline: deadline || '',
      initial_milestones
    });

    res.status(201).json(goal);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/goals
app.get('/api/goals', requireAuth, (req: AuthRequest, res: Response) => {
  const goals = cloudDb.getGoalsByUser(req.userId!);
  res.json(goals);
});

// PUT /api/goals/:id
app.put('/api/goals/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const updated = cloudDb.updateGoal(req.params.id, req.userId!, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/goals/:id
app.delete('/api/goals/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    cloudDb.deleteGoal(req.params.id, req.userId!);
    res.json({ message: 'Goal deleted successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// 6. COMMUNITY POSTS REST APIS
// ==========================================

// POST /api/posts
app.post('/api/posts', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { content, skill_id, milestone, media_url } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Post content cannot be empty.' });
    }

    const post = cloudDb.createPost({
      user_id: req.userId!,
      content,
      skill_id,
      milestone,
      media_url
    });

    res.status(201).json(post);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/feed
app.get('/api/feed', optionalAuth, (req: AuthRequest, res: Response) => {
  const { category, search, sort, limit } = req.query;
  const posts = cloudDb.getCommunityFeed({
    category: category as string,
    search: search as string,
    sort: sort as 'recent' | 'likes',
    limit: limit ? Number(limit) : 50,
    currentUserId: req.userId
  });
  res.json(posts);
});

// DELETE /api/posts/:id
app.delete('/api/posts/:id', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    cloudDb.deletePost(req.params.id, req.userId!);
    res.json({ message: 'Post deleted successfully' });
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// ==========================================
// 7. LIKES & COMMENTS REST APIS
// ==========================================

// POST /api/posts/:id/like
app.post('/api/posts/:id/like', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const result = cloudDb.toggleLike(req.params.id, req.userId!);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/posts/:id/like
app.delete('/api/posts/:id/like', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const result = cloudDb.toggleLike(req.params.id, req.userId!);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/posts/:id/comments
app.post('/api/posts/:id/comments', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text cannot be empty.' });
    }

    const comment = cloudDb.addComment(req.params.id, req.userId!, text);
    res.status(201).json(comment);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/posts/:id/comments
app.get('/api/posts/:id/comments', (req: Request, res: Response) => {
  const comments = cloudDb.getComments(req.params.id);
  res.json(comments);
});

// DELETE /api/posts/:id/comments/:commentId
app.delete('/api/posts/:id/comments/:commentId', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    cloudDb.deleteComment(req.params.commentId, req.userId!);
    res.json({ message: 'Comment deleted successfully' });
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// ==========================================
// 8. CLOUD OBJECT STORAGE / FILE UPLOAD REST APIS
// ==========================================

// POST /api/files/upload
app.post('/api/files/upload', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const { data, filename, mimeType } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'No file data received.' });
    }

    // Security validation: allowed MIME types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const detectedType = mimeType || (data.startsWith('data:') ? data.split(';')[0].replace('data:', '') : '');

    if (detectedType && !allowedTypes.includes(detectedType)) {
      return res.status(400).json({
        error: 'Invalid file format. Only JPEG, PNG, WEBP, and GIF images are permitted.'
      });
    }

    // Parse base64
    let base64Data = data;
    if (data.includes(',')) {
      base64Data = data.split(',')[1];
    }

    const buffer = Buffer.from(base64Data, 'base64');

    // Security validation: max size 5MB (5 * 1024 * 1024 bytes)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (buffer.length > MAX_SIZE) {
      return res.status(400).json({
        error: 'File size exceeds maximum permitted limit of 5MB.'
      });
    }

    // Create cloud storage path: users/{uid}/posts/{timestamp}_{filename}
    const ext = filename ? path.extname(filename) : '.jpg';
    const safeName = `${req.userId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}${ext}`;
    const filePath = path.join(UPLOADS_DIR, safeName);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${safeName}`;
    res.status(201).json({
      url: publicUrl,
      size: buffer.length,
      mimeType: detectedType || 'image/jpeg'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'File upload failed.' });
  }
});

// ==========================================
// 9. CLOUD ANALYTICS REST APIS
// ==========================================

// GET /api/analytics/dashboard
app.get('/api/analytics/dashboard', requireAuth, (req: AuthRequest, res: Response) => {
  try {
    const analytics = cloudDb.getAnalytics(req.userId!);
    res.json(analytics);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/seed - reseed sample users
app.post('/api/seed', (_req: Request, res: Response) => {
  try {
    cloudDb.seedInitialData();
    res.json({ message: 'Sample dataset seeded successfully with Alex and Sam.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 10. VITE DEV SERVER / STATIC SERVING
// ==========================================

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
