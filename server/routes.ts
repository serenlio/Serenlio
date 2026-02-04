import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET;

if (!JWT_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required for JWT authentication");
}

interface AuthRequest extends Request {
  userId?: number;
}

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function getSupabaseAudioUrl(filename: string): string | null {
  const base = process.env.SUPABASE_AUDIO_BASE_URL;
  if (!base) return null;
  return base.endsWith("/") ? `${base}${filename}` : `${base}/${filename}`;
}

async function seedDatabase() {
  const existingTeachers = await storage.getTeachers();
  if (existingTeachers.length > 0) return;

  const teacher1 = await storage.createTeacher({
    name: "Sarah Chen",
    bio: "Sarah specializes in curating continuous ambient soundscapes for deep relaxation and distraction-free rest.",
    avatarUrl: null,
    specialty: "Ambient Soundscapes",
  });

  const teacher2 = await storage.createTeacher({
    name: "Marcus Williams",
    bio: "Marcus provides background sound to support breathing practice and rhythmic calm.",
    avatarUrl: null,
    specialty: "Breathwork Support",
  });

  const teacher3 = await storage.createTeacher({
    name: "Elena Rodriguez",
    bio: "Elena curates ambient meditation audio for self-directed practice and inner focus.",
    avatarUrl: null,
    specialty: "Pure Ambient Meditation",
  });

  const teacher4 = await storage.createTeacher({
    name: "James Park",
    bio: "James creates ambient soundscapes and music-only sessions designed for focus and relaxation.",
    avatarUrl: null,
    specialty: "Ambient Music",
  });

  await storage.createSession({
    title: "Morning Calm",
    description: "Start your day with this gentle 10-minute ambient sound designed to set a peaceful tone.",
    category: "meditation",
    duration: 10,
    audioUrl: getSupabaseAudioUrl("morning-calm.mp3"),
    imageUrl: null,
    teacherId: teacher3.id,
    isPremium: false,
    isFeatured: true,
  });

  await storage.createSession({
    title: "Deep Sleep Journey",
    description: "Soothing sleep audio that helps you drift off naturally through ambient nature sounds.",
    category: "sleep",
    duration: 30,
    audioUrl: getSupabaseAudioUrl("deep-sleep-journey.mp3"),
    imageUrl: null,
    teacherId: teacher1.id,
    isPremium: false,
    isFeatured: true,
  });

  await storage.createSession({
    title: "Rhythmic Breath Support",
    description: "Background audio to support breathing practice. On-screen pattern: Inhale 4 · Hold 4 · Exhale 4 · Hold 4.",
    category: "breathwork",
    duration: 5,
    audioUrl: getSupabaseAudioUrl("rhythmic-breath-support.mp3"),
    imageUrl: null,
    teacherId: teacher2.id,
    isPremium: false,
    isFeatured: true,
  });

  await storage.createSession({
    title: "Ocean Waves",
    description: "Gentle ocean sounds to help you relax, focus, or drift off to sleep.",
    category: "music",
    duration: 20,
    audioUrl: getSupabaseAudioUrl("ocean-waves.mp3"),
    imageUrl: null,
    teacherId: teacher4.id,
    isPremium: false,
    isFeatured: false,
  });

  await storage.createSession({
    title: "Rainforest Ambience",
    description: "Immerse yourself in the peaceful sounds of a tropical rainforest.",
    category: "music",
    duration: 30,
    audioUrl: getSupabaseAudioUrl("rainforest-ambience.mp3"),
    imageUrl: null,
    teacherId: teacher4.id,
    isPremium: true,
    isFeatured: false,
  });

  await storage.createSession({
    title: "Evening Wind Down",
    description: "A 20-minute calming background audio session to help you release the day's stress and prepare for rest.",
    category: "meditation",
    duration: 20,
    audioUrl: getSupabaseAudioUrl("evening-wind-down.mp3"),
    imageUrl: null,
    teacherId: teacher1.id,
    isPremium: false,
    isFeatured: false,
  });

  await storage.createSession({
    title: "Focus & Clarity",
    description: "Ambient sound designed to sharpen your mind and improve concentration through distraction-free audio.",
    category: "meditation",
    duration: 15,
    audioUrl: getSupabaseAudioUrl("focus-clarity.mp3"),
    imageUrl: null,
    teacherId: teacher3.id,
    isPremium: true,
    isFeatured: true,
  });

  await storage.createSession({
    title: "Square Breath Audio",
    description: "Background sound to support rhythmic breathing. On-screen pattern: Inhale, Hold, Exhale, Hold.",
    category: "breathwork",
    duration: 10,
    audioUrl: getSupabaseAudioUrl("square-breath-audio.mp3"),
    imageUrl: null,
    teacherId: teacher2.id,
    isPremium: false,
    isFeatured: false,
  });

  await storage.createSession({
    title: "Starlit Ambience",
    description: "Continuous ambient sound that takes you on a journey through the cosmos for deep sleep.",
    category: "sleep",
    duration: 25,
    audioUrl: getSupabaseAudioUrl("starlit-ambience.mp3"),
    imageUrl: null,
    teacherId: teacher1.id,
    isPremium: true,
    isFeatured: false,
  });

  await storage.createSession({
    title: "White Noise",
    description: "Pure white noise to mask distractions and promote deep focus or sleep.",
    category: "music",
    duration: 60,
    audioUrl: getSupabaseAudioUrl("white-noise.mp3"),
    imageUrl: null,
    teacherId: null,
    isPremium: false,
    isFeatured: false,
  });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await seedDatabase();

  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      
      const existing = await storage.getUserByEmail(input.email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);
      const user = await storage.createUser({
        email: input.email,
        password: hashedPassword,
        name: input.name,
        isPremium: false,
      });

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json({ user: userWithoutPassword, token });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
      }
      throw err;
    }
  });

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      
      const user = await storage.getUserByEmail(input.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const valid = await bcrypt.compare(input.password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      const { password: _, ...userWithoutPassword } = user;

      res.json({ user: userWithoutPassword, token });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      throw err;
    }
  });

  app.get(api.auth.me.path, authMiddleware, async (req: AuthRequest, res) => {
    const user = await storage.getUser(req.userId!);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.get(api.sessions.list.path, async (req, res) => {
    const filters = {
      category: req.query.category as string | undefined,
      duration: req.query.duration ? parseInt(req.query.duration as string) : undefined,
      search: req.query.search as string | undefined,
      featured: req.query.featured === "true",
    };
    const sessions = await storage.getSessions(filters);
    res.json(sessions);
  });

  app.get(api.sessions.get.path, async (req, res) => {
    const session = await storage.getSession(parseInt(req.params.id));
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    res.json(session);
  });

  app.post(api.sessions.create.path, async (req, res) => {
    try {
      const input = api.sessions.create.input.parse(req.body);
      const session = await storage.createSession(input);
      res.status(201).json(session);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
      }
      throw err;
    }
  });

  app.put(api.sessions.update.path, async (req, res) => {
    try {
      const input = api.sessions.update.input.parse(req.body);
      const session = await storage.updateSession(parseInt(req.params.id), input);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
      }
      throw err;
    }
  });

  app.delete(api.sessions.delete.path, async (req, res) => {
    const deleted = await storage.deleteSession(parseInt(req.params.id));
    if (!deleted) {
      return res.status(404).json({ message: "Session not found" });
    }
    res.status(204).send();
  });

  app.post(api.sessions.incrementPlay.path, async (req, res) => {
    const session = await storage.incrementPlayCount(parseInt(req.params.id));
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    res.json(session);
  });

  app.get(api.teachers.list.path, async (req, res) => {
    const teachers = await storage.getTeachers();
    res.json(teachers);
  });

  app.get(api.teachers.get.path, async (req, res) => {
    const result = await storage.getTeacherWithSessions(parseInt(req.params.id));
    if (!result) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    res.json({ ...result.teacher, sessions: result.sessions });
  });

  app.post(api.teachers.create.path, async (req, res) => {
    try {
      const input = api.teachers.create.input.parse(req.body);
      const teacher = await storage.createTeacher(input);
      res.status(201).json(teacher);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
      }
      throw err;
    }
  });

  app.put(api.teachers.update.path, async (req, res) => {
    try {
      const input = api.teachers.update.input.parse(req.body);
      const teacher = await storage.updateTeacher(parseInt(req.params.id), input);
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      res.json(teacher);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join(".") });
      }
      throw err;
    }
  });

  app.delete(api.teachers.delete.path, async (req, res) => {
    const deleted = await storage.deleteTeacher(parseInt(req.params.id));
    if (!deleted) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    res.status(204).send();
  });

  app.get(api.favorites.list.path, authMiddleware, async (req: AuthRequest, res) => {
    const favorites = await storage.getFavorites(req.userId!);
    res.json(favorites);
  });

  app.post(api.favorites.toggle.path, authMiddleware, async (req: AuthRequest, res) => {
    const isFavorite = await storage.toggleFavorite(req.userId!, parseInt(req.params.sessionId));
    res.json({ isFavorite });
  });

  app.get(api.favorites.check.path, authMiddleware, async (req: AuthRequest, res) => {
    const isFavorite = await storage.isFavorite(req.userId!, parseInt(req.params.sessionId));
    res.json({ isFavorite });
  });

  app.post(api.progress.record.path, authMiddleware, async (req: AuthRequest, res) => {
    try {
      const input = api.progress.record.input.parse(req.body);
      await storage.recordProgress(req.userId!, input.sessionId, input.minutesListened);
      res.status(201).json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.progress.stats.path, authMiddleware, async (req: AuthRequest, res) => {
    const stats = await storage.getUserStats(req.userId!);
    res.json(stats);
  });

  app.get(api.stats.usage.path, async (_req, res) => {
    const stats = await storage.getUsageStats();
    res.json(stats);
  });

  app.get(api.home.daily.path, async (req, res) => {
    const session = await storage.getDailySession();
    if (!session) {
      return res.status(404).json({ message: "No sessions available" });
    }
    res.json(session);
  });

  app.get(api.home.featured.path, async (req, res) => {
    const sessions = await storage.getFeaturedSessions();
    res.json(sessions);
  });

  app.get(api.home.popular.path, async (req, res) => {
    const sessions = await storage.getPopularSessions();
    res.json(sessions);
  });

  return httpServer;
}
