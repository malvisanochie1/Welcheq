<div align="center">

# Welcheq

**You can't always be there. Now you'll always know.**

![Android](https://img.shields.io/badge/Android-first-0F5C5A)
![iOS](https://img.shields.io/badge/iOS-supported-0F5C5A)
![Web](https://img.shields.io/badge/Web-supported-0F5C5A)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-12201F)
![Version](https://img.shields.io/badge/version-0.3.0-B8692A)

<img src="docs/screenshots/mobile-welcome.webp" width="230" alt="Welcome screen" />
&nbsp;&nbsp;
<img src="docs/screenshots/mobile-sign-in.webp" width="230" alt="Sign in on a phone" />

<img src="docs/screenshots/web-sign-in.webp" width="720" alt="Sign in on desktop web" />

</div>

## About

Welcheq helps families know whether the care they arrange for a loved one is really happening.
Caregivers check in at the home, follow a daily care plan and record what they did. Families see
every visit from anywhere, and each patient's health details live in one secure record.

## Features

| Feature                       | What it does                                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Verified attendance**       | Check-in only works at the patient's home. Families can add a selfie, rotating code or surprise check. |
| **Daily care plan**           | The family sets the routine once; caregivers get it as a daily checklist.                              |
| **Daily call to the patient** | A reminder to call, then a short checklist that flags answers that don't match the caregiver's.        |
| **Health record**             | Medicines, allergies, conditions, readings and documents in one place, with who recorded each.         |
| **One product, three apps**   | Native Android and iOS apps and a full desktop web app on one shared backend.                          |

## How it works

1. A family member creates an account and registers their loved one.
2. They set the daily routine and choose how caregivers prove they came.
3. The caregiver checks in at the home and ticks off each task.
4. The family follows every visit and is alerted when something is late, missed or wrong.

## Tech stack

| Layer    | Technology                                                    |
| -------- | ------------------------------------------------------------- |
| App      | Expo, React Native, Expo Router, React Native Web             |
| UI       | NativeWind (Tailwind), Reanimated, Lucide icons, Inter        |
| State    | TanStack Query for server data, Zustand for app state         |
| Auth     | Supabase Auth, tokens kept in the device keystore             |
| API      | Node.js, Express 5, Zod, Pino                                 |
| Database | PostgreSQL (Supabase) with Prisma                             |
| Quality  | Vitest, Supertest, ESLint, Prettier, GitHub Actions, Gitleaks |

## Project structure

```text
welcheq/
  frontend/        Expo app for Android, iOS and web
    src/app/         screens and routes
    src/features/    one folder per feature (auth, patients, attendance...)
    src/components/  shared UI and layout
    src/theme/       design tokens and motion
  backend/         REST API
    prisma/          schema and migrations
    src/modules/     one folder per domain (routes, controller, service, repository)
    src/middleware/  authentication, rate limiting, errors
  shared/          validation schemas, domain constants and logic used by both sides
  docs/            screenshots and the launch checklist
```

## Getting started

**Prerequisites:** Node.js 22+, npm 10+, and a free Supabase project.

```bash
git clone https://github.com/malvisanochie1/Welcheq.git
cd Welcheq
npm install
```

Configure both sides from their examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Create the database tables, then start the API and the app:

```bash
npm run db:migrate -w backend
npm run dev:api
npm run dev:app
```

Press `a` for Android, `i` for iOS or `w` for web in the Expo terminal.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
```

Backend tests need a local PostgreSQL database named `welcheq_test`.

## Configuration

**Backend** (`backend/.env`)

| Variable              | Description                                   | Example                          |
| --------------------- | --------------------------------------------- | -------------------------------- |
| `DATABASE_URL`        | Connection used by the running API            | `postgresql://...:5432/postgres` |
| `DIRECT_DATABASE_URL` | Connection used for migrations                | `postgresql://...:5432/postgres` |
| `SUPABASE_URL`        | Supabase project URL, used to verify sign-ins | `https://abc.supabase.co`        |
| `SUPABASE_SECRET_KEY` | Server-only key for private selfie storage    | `sb_secret_...`                  |
| `CORS_ORIGINS`        | Web origins allowed to call the API           | `http://localhost:8081`          |
| `PORT`                | Port the API listens on                       | `4000`                           |

**App** (`frontend/.env`, public values only)

| Variable                               | Description                          | Example                   |
| -------------------------------------- | ------------------------------------ | ------------------------- |
| `EXPO_PUBLIC_API_URL`                  | Welcheq API address                  | `http://localhost:4000`   |
| `EXPO_PUBLIC_WEB_URL`                  | Web app address, used in email links | `http://localhost:8081`   |
| `EXPO_PUBLIC_SUPABASE_URL`             | Supabase project URL                 | `https://abc.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key             | `sb_publishable_...`      |

## Before launch

Some settings are relaxed while the app is being built. See the [launch checklist](docs/launch-checklist.md) before inviting real families.

## License

Proprietary. All rights reserved.
