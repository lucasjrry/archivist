# Archivist

A personal fashion archive and social platform.

*Digitize your wardrobe, curate your personal style, and connect with a global catalog.*

<img width="1440" height="670" alt="archivist_mvp" src="https://github.com/user-attachments/assets/af90cedc-33f3-4b9e-a861-4a54c9710263" />

## 🛠 Tech Stack
* **Framework:** Next.js 15 (App Router)
* **Language:** TypeScript
* **Styling:** Tailwind CSS
* **Database:** Supabase (PostgreSQL)
    * *Schema Location:* `/supabase/schema_mvp.sql`
    * *Client Location:* `/utils/supabase/`
* **Auth:** Supabase Auth (SSR + Middleware)
* **Deployment:** Vercel

## 🔗 Project Links
* **Live Site:** [\[Vercel URL\]](https://archivist-tan.vercel.app/)
* **Supabase Dashboard:** [\[Supabase Project\]](https://supabase.com/dashboard/project/tgqwdebycbdcitmmukhp)
* **Vercel Dashboard:** [\[Vercel Project\]](https://vercel.com/lucasjerrys-projects/archivist)

## Local Development Setup

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Environment Variables:**
    Ensure `.env.local` is present with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000)

## 📂 Architecture Notes
* **Images:** Stored in Supabase Storage buckets, referenced by URL in `closet_items` table.
* **RLS (Row Level Security):** * `profiles`: Publicly viewable.
    * `closet_items`: Viewable if owner is you OR owner has `is_public = true`.
