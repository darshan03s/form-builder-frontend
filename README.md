# Form Builder

[![Watch the demo](https://res.cloudinary.com/dqzusd5rw/image/upload/v1764669218/Screenshot_2025-12-02_152237_jw8rvh.png)](https://res.cloudinary.com/dqzusd5rw/video/upload/v1764668862/form_builder_demo_2_dg9t4y.mp4)


A React + TypeScript + Vite application that lets authenticated Airtable users:

* Sign in using Airtable OAuth (handled by backend).
* Create forms by selecting Airtable Bases & Tables.
* Add questions mapped to Airtable fields.
* Configure conditional logic per question.
* Fill forms and submit responses (with file upload).
* View all saved form responses stored in the database.

## Tech Stack

* React 19
* TypeScript
* Vite
* React Router
* TailwindCSS

---

## 1. Local Development Setup

### Install dependencies

Use pnpm:

```bash
pnpm install
```

### Environment variables

Create a `.env` file based on the example:

```bash
cp sample.env.example .env
```

Fill in:

```
VITE_API_BASE_URL=
```

This must point to your backend’s URL (local or deployed).

### Run the development server

```bash
pnpm dev
```

App runs at:

```
http://localhost:5173
```

---

## 2. Build for Production

```bash
pnpm build
```

Preview build locally:

```bash
pnpm preview
```

---

## 3. Deployment (Vercel)

### Steps

1. Push to GitHub (frontend repo)
2. Import repository in Vercel
3. Set **Environment Variables**:

```
VITE_API_BASE_URL=https://your-backend-url.com
```

4. Build command:

```
pnpm build
```

5. Output directory:

```
dist
```

---

## Backend github:
https://github.com/darshan03s/form-builder-backend