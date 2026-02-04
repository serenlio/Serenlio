import { db } from "./db";
import {
  users,
  teachers,
  sessions,
  favorites,
  userProgress,
  type User,
  type InsertUser,
  type Teacher,
  type InsertTeacher,
  type Session,
  type InsertSession,
  type Favorite,
  type InsertFavorite,
  type UserProgress,
  type InsertProgress,
  type SessionWithTeacher,
} from "@shared/schema";
import { eq, and, like, ilike, or, desc, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStats(userId: number, minutes: number): Promise<void>;

  getTeachers(): Promise<Teacher[]>;
  getTeacher(id: number): Promise<Teacher | undefined>;
  getTeacherWithSessions(id: number): Promise<{ teacher: Teacher; sessions: Session[] } | undefined>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  updateTeacher(id: number, teacher: Partial<InsertTeacher>): Promise<Teacher | undefined>;
  deleteTeacher(id: number): Promise<boolean>;

  getSessions(filters?: { category?: string; duration?: number; search?: string; featured?: boolean }): Promise<SessionWithTeacher[]>;
  getSession(id: number): Promise<SessionWithTeacher | undefined>;
  getSessionsByTeacher(teacherId: number): Promise<Session[]>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: number, session: Partial<InsertSession>): Promise<Session | undefined>;
  deleteSession(id: number): Promise<boolean>;
  incrementPlayCount(id: number): Promise<Session | undefined>;
  getDailySession(): Promise<SessionWithTeacher | undefined>;
  getFeaturedSessions(): Promise<SessionWithTeacher[]>;
  getPopularSessions(): Promise<SessionWithTeacher[]>;

  getFavorites(userId: number): Promise<SessionWithTeacher[]>;
  isFavorite(userId: number, sessionId: number): Promise<boolean>;
  toggleFavorite(userId: number, sessionId: number): Promise<boolean>;

  recordProgress(userId: number, sessionId: number, minutes: number): Promise<void>;
  getUserStats(userId: number): Promise<{ totalMinutes: number; currentStreak: number; sessionsCompleted: number }>;
  getUsageStats(): Promise<{ userCount: number; sessions: { id: number; title: string; playCount: number }[] }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async updateUserStats(userId: number, minutes: number): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastSession = user.lastSessionDate ? new Date(user.lastSessionDate) : null;
    
    let newStreak = user.currentStreak || 0;
    if (lastSession) {
      lastSession.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today.getTime() - lastSession.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    await db.update(users)
      .set({
        totalMinutes: (user.totalMinutes || 0) + minutes,
        currentStreak: newStreak,
        lastSessionDate: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async getTeachers(): Promise<Teacher[]> {
    return await db.select().from(teachers);
  }

  async getTeacher(id: number): Promise<Teacher | undefined> {
    const [teacher] = await db.select().from(teachers).where(eq(teachers.id, id));
    return teacher;
  }

  async getTeacherWithSessions(id: number): Promise<{ teacher: Teacher; sessions: Session[] } | undefined> {
    const teacher = await this.getTeacher(id);
    if (!teacher) return undefined;
    const teacherSessions = await db.select().from(sessions).where(eq(sessions.teacherId, id));
    return { teacher, sessions: teacherSessions };
  }

  async createTeacher(teacher: InsertTeacher): Promise<Teacher> {
    const [created] = await db.insert(teachers).values(teacher).returning();
    return created;
  }

  async updateTeacher(id: number, teacher: Partial<InsertTeacher>): Promise<Teacher | undefined> {
    const [updated] = await db.update(teachers).set(teacher).where(eq(teachers.id, id)).returning();
    return updated;
  }

  async deleteTeacher(id: number): Promise<boolean> {
    const result = await db.delete(teachers).where(eq(teachers.id, id)).returning();
    return result.length > 0;
  }

  async getSessions(filters?: { category?: string; duration?: number; search?: string; featured?: boolean }): Promise<SessionWithTeacher[]> {
    let query = db.select({
      id: sessions.id,
      title: sessions.title,
      description: sessions.description,
      category: sessions.category,
      duration: sessions.duration,
      audioUrl: sessions.audioUrl,
      imageUrl: sessions.imageUrl,
      teacherId: sessions.teacherId,
      isPremium: sessions.isPremium,
      playCount: sessions.playCount,
      isFeatured: sessions.isFeatured,
      teacher: teachers,
    })
    .from(sessions)
    .leftJoin(teachers, eq(sessions.teacherId, teachers.id));

    const conditions = [];
    if (filters?.category) {
      conditions.push(eq(sessions.category, filters.category));
    }
    if (filters?.duration) {
      conditions.push(eq(sessions.duration, filters.duration));
    }
    if (filters?.search) {
      conditions.push(
        or(
          ilike(sessions.title, `%${filters.search}%`),
          ilike(sessions.description, `%${filters.search}%`)
        )
      );
    }
    if (filters?.featured) {
      conditions.push(eq(sessions.isFeatured, true));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query;
  }

  async getSession(id: number): Promise<SessionWithTeacher | undefined> {
    const [result] = await db.select({
      id: sessions.id,
      title: sessions.title,
      description: sessions.description,
      category: sessions.category,
      duration: sessions.duration,
      audioUrl: sessions.audioUrl,
      imageUrl: sessions.imageUrl,
      teacherId: sessions.teacherId,
      isPremium: sessions.isPremium,
      playCount: sessions.playCount,
      isFeatured: sessions.isFeatured,
      teacher: teachers,
    })
    .from(sessions)
    .leftJoin(teachers, eq(sessions.teacherId, teachers.id))
    .where(eq(sessions.id, id));
    return result;
  }

  async getSessionsByTeacher(teacherId: number): Promise<Session[]> {
    return await db.select().from(sessions).where(eq(sessions.teacherId, teacherId));
  }

  async createSession(session: InsertSession): Promise<Session> {
    const [created] = await db.insert(sessions).values(session).returning();
    return created;
  }

  async updateSession(id: number, session: Partial<InsertSession>): Promise<Session | undefined> {
    const [updated] = await db.update(sessions).set(session).where(eq(sessions.id, id)).returning();
    return updated;
  }

  async deleteSession(id: number): Promise<boolean> {
    const result = await db.delete(sessions).where(eq(sessions.id, id)).returning();
    return result.length > 0;
  }

  async incrementPlayCount(id: number): Promise<Session | undefined> {
    const [updated] = await db.update(sessions)
      .set({ playCount: sql`${sessions.playCount} + 1` })
      .where(eq(sessions.id, id))
      .returning();
    return updated;
  }

  async getDailySession(): Promise<SessionWithTeacher | undefined> {
    const allSessions = await this.getSessions();
    if (allSessions.length === 0) return undefined;
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return allSessions[dayOfYear % allSessions.length];
  }

  async getFeaturedSessions(): Promise<SessionWithTeacher[]> {
    return await this.getSessions({ featured: true });
  }

  async getPopularSessions(): Promise<SessionWithTeacher[]> {
    const results = await db.select({
      id: sessions.id,
      title: sessions.title,
      description: sessions.description,
      category: sessions.category,
      duration: sessions.duration,
      audioUrl: sessions.audioUrl,
      imageUrl: sessions.imageUrl,
      teacherId: sessions.teacherId,
      isPremium: sessions.isPremium,
      playCount: sessions.playCount,
      isFeatured: sessions.isFeatured,
      teacher: teachers,
    })
    .from(sessions)
    .leftJoin(teachers, eq(sessions.teacherId, teachers.id))
    .orderBy(desc(sessions.playCount))
    .limit(10);
    return results;
  }

  async getFavorites(userId: number): Promise<SessionWithTeacher[]> {
    const results = await db.select({
      id: sessions.id,
      title: sessions.title,
      description: sessions.description,
      category: sessions.category,
      duration: sessions.duration,
      audioUrl: sessions.audioUrl,
      imageUrl: sessions.imageUrl,
      teacherId: sessions.teacherId,
      isPremium: sessions.isPremium,
      playCount: sessions.playCount,
      isFeatured: sessions.isFeatured,
      teacher: teachers,
    })
    .from(favorites)
    .innerJoin(sessions, eq(favorites.sessionId, sessions.id))
    .leftJoin(teachers, eq(sessions.teacherId, teachers.id))
    .where(eq(favorites.userId, userId));
    return results;
  }

  async isFavorite(userId: number, sessionId: number): Promise<boolean> {
    const [result] = await db.select()
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.sessionId, sessionId)));
    return !!result;
  }

  async toggleFavorite(userId: number, sessionId: number): Promise<boolean> {
    const exists = await this.isFavorite(userId, sessionId);
    if (exists) {
      await db.delete(favorites)
        .where(and(eq(favorites.userId, userId), eq(favorites.sessionId, sessionId)));
      return false;
    } else {
      await db.insert(favorites).values({ userId, sessionId });
      return true;
    }
  }

  async recordProgress(userId: number, sessionId: number, minutes: number): Promise<void> {
    await db.insert(userProgress).values({ userId, sessionId, minutesListened: minutes });
    await this.updateUserStats(userId, minutes);
  }

  async getUserStats(userId: number): Promise<{ totalMinutes: number; currentStreak: number; sessionsCompleted: number }> {
    const user = await this.getUser(userId);
    const [countResult] = await db.select({ count: sql<number>`count(*)` })
      .from(userProgress)
      .where(eq(userProgress.userId, userId));
    
    return {
      totalMinutes: user?.totalMinutes || 0,
      currentStreak: user?.currentStreak || 0,
      sessionsCompleted: Number(countResult?.count) || 0,
    };
  }

  async getUsageStats(): Promise<{ userCount: number; sessions: { id: number; title: string; playCount: number }[] }> {
    const [userCountResult] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const sessionRows = await db
      .select({ id: sessions.id, title: sessions.title, playCount: sessions.playCount })
      .from(sessions)
      .orderBy(desc(sessions.playCount));
    return {
      userCount: Number(userCountResult?.count) || 0,
      sessions: sessionRows.map((s) => ({ id: s.id, title: s.title, playCount: s.playCount ?? 0 })),
    };
  }
}

export const storage = new DatabaseStorage();
