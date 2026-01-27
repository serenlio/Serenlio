import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, serial } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  isPremium: boolean("is_premium").default(false),
  totalMinutes: integer("total_minutes").default(0),
  currentStreak: integer("current_streak").default(0),
  lastSessionDate: timestamp("last_session_date"),
});

export const teachers = pgTable("teachers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  bio: text("bio").notNull(),
  avatarUrl: text("avatar_url"),
  specialty: text("specialty").notNull(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  duration: integer("duration").notNull(),
  audioUrl: text("audio_url"),
  imageUrl: text("image_url"),
  teacherId: integer("teacher_id").references(() => teachers.id),
  isPremium: boolean("is_premium").default(false),
  playCount: integer("play_count").default(0),
  isFeatured: boolean("is_featured").default(false),
});

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sessionId: integer("session_id").references(() => sessions.id).notNull(),
});

export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sessionId: integer("session_id").references(() => sessions.id).notNull(),
  completedAt: timestamp("completed_at").defaultNow(),
  minutesListened: integer("minutes_listened").notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  favorites: many(favorites),
  progress: many(userProgress),
}));

export const teachersRelations = relations(teachers, ({ many }) => ({
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  teacher: one(teachers, { fields: [sessions.teacherId], references: [teachers.id] }),
  favorites: many(favorites),
  progress: many(userProgress),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
  session: one(sessions, { fields: [favorites.sessionId], references: [sessions.id] }),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, { fields: [userProgress.userId], references: [users.id] }),
  session: one(sessions, { fields: [userProgress.sessionId], references: [sessions.id] }),
}));

export const insertUserSchema = createInsertSchema(users).omit({ id: true, totalMinutes: true, currentStreak: true, lastSessionDate: true });
export const insertTeacherSchema = createInsertSchema(teachers).omit({ id: true });
export const insertSessionSchema = createInsertSchema(sessions).omit({ id: true, playCount: true });
export const insertFavoriteSchema = createInsertSchema(favorites).omit({ id: true });
export const insertProgressSchema = createInsertSchema(userProgress).omit({ id: true, completedAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type UserProgress = typeof userProgress.$inferSelect;
export type InsertProgress = z.infer<typeof insertProgressSchema>;

export type SessionWithTeacher = Session & { teacher: Teacher | null };

export type RegisterRequest = { email: string; password: string; name: string };
export type LoginRequest = { email: string; password: string };
export type AuthResponse = { user: Omit<User, 'password'>; token: string };

export type CreateSessionRequest = InsertSession;
export type UpdateSessionRequest = Partial<InsertSession>;

export type CreateTeacherRequest = InsertTeacher;
export type UpdateTeacherRequest = Partial<InsertTeacher>;

export type ToggleFavoriteRequest = { sessionId: number };
export type RecordProgressRequest = { sessionId: number; minutesListened: number };

export type UserStats = {
  totalMinutes: number;
  currentStreak: number;
  sessionsCompleted: number;
};

export const categories = ["meditation", "sleep", "breathwork", "music"] as const;
export type Category = typeof categories[number];

export const durations = [5, 10, 20, 30] as const;
export type Duration = typeof durations[number];
