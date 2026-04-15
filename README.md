# JobGenius FYP

Career platform for job seekers, recruiters, and admins, built as a full-stack final year project with a polished portfolio demo experience.

## Overview

JobGenius is a hiring and profile management platform that brings together job discovery, applications, interviews, offers, recruiter workflows, and admin oversight in one system. The app is designed to be easy to demo, with fallback content where needed so the core experience still looks complete in screenshots and presentations.

## Core Capabilities

- Job seeker dashboard with profile insights, recommendations, applications, interviews, and offers
- Recruiter dashboard for jobs, applicants, interviews, and offer management
- Admin dashboard for platform-level summaries and user oversight
- Authentication flows for login and signup
- Resume and profile-related workflows supported through backend services and integrations
- Portfolio-friendly demo states for sections that depend on external APIs

## Tech Stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, React Router
- UI and utilities: Axios, Lucide React, Heroicons, Recharts, GSAP
- Backend: Node.js, Express.js, MongoDB, PostgreSQL, Mongoose, JWT, bcryptjs, Multer
- Integrations: OpenAI API, Google authentication, PDF and document processing libraries

## Screenshots

The screenshots live in the [screenshots](screenshots) folder and are grouped by feature area.

### Landing and Authentication

| Landing page | Login page | Signup page |
| --- | --- | --- |
| ![Landing page](screenshots/landing-page/landing_page.png) | ![Login page](screenshots/authentication/LoginPage.png) | ![Signup page](screenshots/authentication/signUp.png) |

### Job Seeker Experience

| Dashboard | Jobs | Profile |
| --- | --- | --- |
| ![Job seeker dashboard](screenshots/jobseeker/Dashboard.png) | ![Jobs](screenshots/jobseeker/Jobs.png) | ![Profile](screenshots/jobseeker/profile.png) |

| Posts | Cover letter |
| --- | --- |
| ![Posts](screenshots/jobseeker/posts.png) | ![Cover letter](screenshots/jobseeker/coverLetter.png) |

### Recruiter and Admin

| Recruiter dashboard | Admin dashboard |
| --- | --- |
| ![Recruiter dashboard](screenshots/recruiter/dashboard.png) | ![Admin dashboard](screenshots/admin/dashboard.png) |

## Project Structure

```text
JobGenius-FYP/
├── backend/          # Express API, database config, routes, controllers
├── screenshots/      # Portfolio images used in this README
├── src/              # React application source
├── package.json      # Frontend scripts and dependencies
├── backend/package.json
├── vite.config.ts
└── README.md
```

## Local Setup

### Prerequisites

- Node.js 18 or newer
- MongoDB connection string
- PostgreSQL if you want recruiter database features enabled

### Install

```bash
npm install
cd backend
npm install
```

### Configure Environment

Create `backend/.env` from `backend/.env.example` and add your database and auth values.

If you use the frontend integrations, add the required `VITE_*` values in your local Vite environment as well.

### Run the App

Start the backend from the `backend` folder:

```bash
cd backend
npm run dev
```

Start the frontend from the project root in a second terminal:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Setup Files

- Backend environment template: [backend/.env.example](backend/.env.example)
- Extra setup notes: [SETUP_GUIDE.md](SETUP_GUIDE.md)

## Project Highlights

- Built as a complete hiring workflow rather than a single-page demo
- Includes separate experiences for job seekers, recruiters, and admins
- Uses graceful fallback data so the UI remains presentable for portfolio screenshots
- Public-repo safe after removing hardcoded secrets from the source code

## Security Note

Sensitive values are intentionally kept out of the repository. Configure your own environment variables locally before running the app.

## Closing

JobGenius shows the full product flow of a career platform in a clean, recruiter-friendly format and is ready for GitHub portfolio presentation.
