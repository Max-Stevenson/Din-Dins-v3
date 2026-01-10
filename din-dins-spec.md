# Din-Dins v3 — Spec Sheet

A full-stack MERN recipe + dinner meal planning app.

**Primary use:** Frequent mobile recipe entry + weekly dinner planning for Max + wife.  
**Secondary use:** Portfolio project demonstrating full-stack skills, clean UX, and maintainable architecture.

---

## 1) Goals

### 1.1 Core goals
- Fast, frequent **mobile** recipe creation (wizard flow)
- CRUD for recipes (create, view, edit, delete)
- Browse/search/filter/sort recipes (paginated list)
- Dinner-only meal planning (7+ day ranges)
- Save meal plans, allow swapping suggested meals
- Bias toward **novel** recipes (avoid recently planned)

### 1.2 Non-goals (v1)
- Complex user onboarding flows (users can be seeded directly in DB)
- Breakfast/lunch planning

---

## 2) Tech Stack

### 2.1 Frontend
- React (Vite)
- Tailwind CSS v4.x (mobile-first)
- Icons: `lucide-react`
- Routing: optional later (wizard currently single-route)

### 2.2 Backend
- Node + Express (REST API)
- MongoDB (MongoDB Atlas likely)
- Image storage: TBD (Cloudinary recommended)

### 2.3 Hosting (target)
- Frontend: Vercel or Netlify (free tier)
- Backend: Render / Railway / Fly.io (as needed)
- DB: MongoDB Atlas free tier (if viable)

---

## 3) Repo Structure

```text
Din-Dins-v3/
  frontend/
  backend/
  DIN_DINS_SPEC.md
