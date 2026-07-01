# Archivist: Product Roadmap


## 🛠️ Implementation Backlog
*(Features ordered by current priority. Move items between lists as focus shifts.)*

### 🟢 Current Focus (Core MVP)
- [x] **Personal Closet Profile:** The central authenticated hub for viewing logged pieces.
    - [x] Working filters/sorting by recently added or category
    - [x] functionality for favoriting
- [ ] **Item Ingestion:** Data entry for core metadata (Name, Strict Category, Brand, Color, Image URL).
    - Differentiate methods of item adding: (give users options)
        - Auto scrape from retail link (mvp -> clean up)
        - Receipt/email ingestion? 
        - screenshot if autoscrape fails??
        - Manual entry
    - Add logic for upserting items into global database
        - want item ingestion to be frictionless for users, but work consistently for metadata, etc.
        - how do we let users add items, but also check for existing?
    - Upload outfit pictures / associate/tag with your items
        - multiple pics associated with each item (GLOBAL cover + additional maybe personal)
    - Pull/verify retail or purchase price on item add
- [ ] **Dynamic Layouts:** Seamless switching between visual grid and data-focused list views.

### Up Next (Identity & Habit Building)
- [x] **Better Profile Visuals**: (avatars, bio, etc.)
- [ ] **Complete settings/notifications**
- [ ] **Auth** (passwords, sign in, etc.)
- [ ] **Testing** (Jest? Playwright?)
- [x] **Personal Timeline (Single-Player Feed):** A dedicated profile tab showing a chronological history of a user's style evolution (items added, tags created), powered by a scalable `activity_logs` ledger.
    - ability to post short written content (i.e tweets) or longer blogs (ex.recent purchases/wishlist per season or trip, etc.)
- [x] **The "Top 4" Showcase:** A pinned profile section for highlighting favorite brands or individual pieces.
- [x] **Wishlist Database:** An isolated area for tracking wanted items separate from owned items.
- [ ] **Hybrid Tagging:** A combobox interface allowing users to dynamically search existing tags or create new ones during item entry.
- [ ] **The Spec Sheet:** A secure database store for exact user measurements and brand-specific sizing preferences.

### In the Backlog (Social & Data Scaling)
- [ ] **Moodboard System:** A visual pinning interface for outfit inspiration and external aesthetic references.
    - able to create/publish moodboards linked to global database (think like streetnightlive post)
    - keep on your profile and/or post on your feed
- [ ] **Global Database Migration:** Transitioning plain-text brands and categories into a normalized, globally shared registry.
- [ ] **Social Graph:** Implementation of friend requests, followings, and privacy controls (public vs. private closets).
- [ ] **Multiplayer Feed:** A real-time activity stream showcasing friends' recent additions and wishlist updates.
- [ ] **Advanced Analytics:** Machine learning recommendation models and deep closet statistics powered by our structured relational data.

### Future Explorations (The Retail Ecosystem)
- [ ] **Retail Directory:** Mapping specific items to physical storefronts and digital e-commerce platforms.
- [ ] **Purchase Tracking:** Granular financial logging for price paid, acquisition date, and specific seasonal collections. -> Also budgeting for future purchases
- [ ] **Market Intelligence:** Infrastructure for tracking active sales, new collection drops, and automated price alerts on wishlisted items.

---


## ✅ Shipped / Completed
* **Curated Profile Pages with Letterboxd Showcases:** Overhauled the settings form to serve as a custom curator profile displaying display names (with fallback to username `@`), avatars, and inline bio editing. Designed side-by-side showcasing cards for Item Showcase (top 4 owned closet items) and Favorite Brands (top 4 typographic brand cards with ranking labels). Includes autocomplete searches and UUID formatting validation.
* **Clustered Activity Feed:** Implemented a single-player chronological feed grouping user additions and wishlists by calendar date, displaying exact execution times, item metadata, categories, and purchase price details.
* **Personal Closet Profile Filters & Favoriting:** Added multi-select category filters, client-side sorting (recently added, category top-to-bottom), and interactive favoriting features (with heart button icons, optimistic UI updates, and rose-colored Favorites filtering).
* **Supabase Integration:** Configured backend database, authentication client, and linked the local CLI for Infrastructure as Code (IaC) database management.
* **Authentication Flow:** Implemented rudimentary email/password sign-up and login logic
    - Needs improved/complete login flow.
        - Expand new user signup process
    - Needs proper security, needs to integrate with email confirmation or other Auth providers

