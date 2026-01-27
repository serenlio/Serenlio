import { z } from 'zod';
import { insertUserSchema, insertSessionSchema, insertTeacherSchema, sessions, teachers, users, favorites, userProgress } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

const userResponseSchema = z.object({
  id: z.number(),
  email: z.string(),
  name: z.string(),
  isPremium: z.boolean().nullable(),
  totalMinutes: z.number().nullable(),
  currentStreak: z.number().nullable(),
});

const authResponseSchema = z.object({
  user: userResponseSchema,
  token: z.string(),
});

const teacherSchema = z.object({
  id: z.number(),
  name: z.string(),
  bio: z.string(),
  avatarUrl: z.string().nullable(),
  specialty: z.string(),
});

const sessionSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  duration: z.number(),
  audioUrl: z.string().nullable(),
  imageUrl: z.string().nullable(),
  teacherId: z.number().nullable(),
  isPremium: z.boolean().nullable(),
  playCount: z.number().nullable(),
  isFeatured: z.boolean().nullable(),
});

const sessionWithTeacherSchema = sessionSchema.extend({
  teacher: teacherSchema.nullable(),
});

const userStatsSchema = z.object({
  totalMinutes: z.number(),
  currentStreak: z.number(),
  sessionsCompleted: z.number(),
});

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/auth/register',
      input: z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(1),
      }),
      responses: {
        201: authResponseSchema,
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login',
      input: z.object({
        email: z.string().email(),
        password: z.string(),
      }),
      responses: {
        200: authResponseSchema,
        401: errorSchemas.unauthorized,
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me',
      responses: {
        200: userResponseSchema,
        401: errorSchemas.unauthorized,
      },
    },
  },
  sessions: {
    list: {
      method: 'GET' as const,
      path: '/api/sessions',
      input: z.object({
        category: z.string().optional(),
        duration: z.string().optional(),
        search: z.string().optional(),
        featured: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(sessionWithTeacherSchema),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/sessions/:id',
      responses: {
        200: sessionWithTeacherSchema,
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/sessions',
      input: insertSessionSchema,
      responses: {
        201: sessionSchema,
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/sessions/:id',
      input: insertSessionSchema.partial(),
      responses: {
        200: sessionSchema,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/sessions/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    incrementPlay: {
      method: 'POST' as const,
      path: '/api/sessions/:id/play',
      responses: {
        200: sessionSchema,
        404: errorSchemas.notFound,
      },
    },
  },
  teachers: {
    list: {
      method: 'GET' as const,
      path: '/api/teachers',
      responses: {
        200: z.array(teacherSchema),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/teachers/:id',
      responses: {
        200: teacherSchema.extend({ sessions: z.array(sessionSchema) }),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/teachers',
      input: insertTeacherSchema,
      responses: {
        201: teacherSchema,
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/teachers/:id',
      input: insertTeacherSchema.partial(),
      responses: {
        200: teacherSchema,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/teachers/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  favorites: {
    list: {
      method: 'GET' as const,
      path: '/api/favorites',
      responses: {
        200: z.array(sessionWithTeacherSchema),
        401: errorSchemas.unauthorized,
      },
    },
    toggle: {
      method: 'POST' as const,
      path: '/api/favorites/:sessionId',
      responses: {
        200: z.object({ isFavorite: z.boolean() }),
        401: errorSchemas.unauthorized,
      },
    },
    check: {
      method: 'GET' as const,
      path: '/api/favorites/:sessionId/check',
      responses: {
        200: z.object({ isFavorite: z.boolean() }),
        401: errorSchemas.unauthorized,
      },
    },
  },
  progress: {
    record: {
      method: 'POST' as const,
      path: '/api/progress',
      input: z.object({
        sessionId: z.number(),
        minutesListened: z.number(),
      }),
      responses: {
        201: z.object({ success: z.boolean() }),
        401: errorSchemas.unauthorized,
      },
    },
    stats: {
      method: 'GET' as const,
      path: '/api/progress/stats',
      responses: {
        200: userStatsSchema,
        401: errorSchemas.unauthorized,
      },
    },
  },
  home: {
    daily: {
      method: 'GET' as const,
      path: '/api/home/daily',
      responses: {
        200: sessionWithTeacherSchema,
      },
    },
    featured: {
      method: 'GET' as const,
      path: '/api/home/featured',
      responses: {
        200: z.array(sessionWithTeacherSchema),
      },
    },
    popular: {
      method: 'GET' as const,
      path: '/api/home/popular',
      responses: {
        200: z.array(sessionWithTeacherSchema),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type AuthResponse = z.infer<typeof authResponseSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
export type TeacherResponse = z.infer<typeof teacherSchema>;
export type SessionResponse = z.infer<typeof sessionSchema>;
export type SessionWithTeacherResponse = z.infer<typeof sessionWithTeacherSchema>;
export type UserStatsResponse = z.infer<typeof userStatsSchema>;
