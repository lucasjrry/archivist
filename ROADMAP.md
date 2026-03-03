# Archivist: Product Roadmap


## 🛠️ Implementation Backlog
*(Features ordered by current priority. Move items between lists as focus shifts.)*

### 🟢 Current Focus (Core MVP)
- [ ] **The Closet Profile:** The central authenticated hub for viewing logged pieces.
- [ ] **Dynamic Layouts:** Seamless switching between visual grid and data-focused list views.
- [ ] **Item Ingestion:** Data entry for core metadata (Name, Strict Category, Brand, Color, Image URL).

### Up Next (Identity & Habit Building)
- [ ] **Personal Timeline (Single-Player Feed):** A dedicated profile tab showing a chronological history of a user's style evolution (items added, tags created), powered by a scalable `activity_logs` ledger.
- [ ] **The "Top 4" Showcase:** A pinned profile section for highlighting favorite brands or individual pieces.
- [ ] **Wishlist Database:** An isolated area for tracking wanted items separate from owned items.
- [ ] **Hybrid Tagging:** A combobox interface allowing users to dynamically search existing tags or create new ones during item entry.
- [ ] **The Spec Sheet:** A secure database store for exact user measurements and brand-specific sizing preferences.

### In the Backlog (Social & Data Scaling)
- [ ] **Moodboard System:** A visual pinning interface for outfit inspiration and external aesthetic references.
- [ ] **Global Database Migration:** Transitioning plain-text brands and categories into a normalized, globally shared registry.
- [ ] **Social Graph:** Implementation of friend requests, followings, and privacy controls (public vs. private closets).
- [ ] **Multiplayer Feed:** A real-time activity stream showcasing friends' recent additions and wishlist updates.
- [ ] **Advanced Analytics:** Machine learning recommendation models and deep closet statistics powered by our structured relational data.

### Future Explorations (The Retail Ecosystem)
- [ ] **Retail Directory:** Mapping specific items to physical storefronts and digital e-commerce platforms.
- [ ] **Purchase Tracking:** Granular financial logging for price paid, acquisition date, and specific seasonal collections.
- [ ] **Market Intelligence:** Infrastructure for tracking active sales, new collection drops, and automated price alerts on wishlisted items.

---


## ✅ Shipped / Completed
* **Supabase Integration:** Configured backend database, authentication client, and linked the local CLI for Infrastructure as Code (IaC) database management.
* **Authentication Flow:** Implemented secure email/password sign-up and login logic
    - Needs proper security, needs to work with email confirmation or other Auth providers

