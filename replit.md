# Serenlio - Meditation & Sleep Wellness App

## Overview
Serenlio is a calm, modern wellness app for meditation and sleep. It features guided meditations, sleep stories, breathwork exercises, and ambient sounds.

## Current State
- Backend complete with JWT authentication, session management, favorites, and progress tracking
- Database seeded with sample teachers and sessions
- Frontend in development

## Tech Stack
- **Frontend**: React with TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Email/password with JWT tokens

## Key Features
1. User authentication (register/login)
2. Home screen with daily recommendations and featured content
3. Meditation library with categories (Meditation, Sleep, Breathwork, Music)
4. Filter by duration (5, 10, 20, 30+ minutes)
5. Search functionality
6. Teacher profiles
7. Favorites system
8. Progress tracking (streaks, total minutes)

## API Endpoints
All endpoints are in `shared/routes.ts`:
- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- Sessions: CRUD at `/api/sessions`
- Teachers: CRUD at `/api/teachers`
- Favorites: `/api/favorites`
- Progress: `/api/progress`, `/api/progress/stats`
- Home: `/api/home/daily`, `/api/home/featured`, `/api/home/popular`

## Running Locally
1. Database is auto-provisioned via Replit
2. Run `npm run db:push` to sync schema
3. Run `npm run dev` to start the app

## Future Enhancements
- **Stripe Integration**: Payment processing was not set up. To add subscriptions:
  1. Set up Stripe integration in Replit
  2. Create subscription products/prices in Stripe dashboard
  3. Add checkout endpoints
  4. Add webhook handling for subscription events

## User Preferences
- Calm, minimal, premium aesthetic
- Soft gradients and neutral tones
- Mobile-first responsive layout
