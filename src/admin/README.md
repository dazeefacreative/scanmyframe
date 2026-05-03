# Admin UI kit

A redesigned admin console for ScanMyFrame, replacing the dark-only `Admin.jsx` with a brand-led layout.

## What changed vs the existing Admin.jsx
- **Dark-only → bright shell with a forest-green left rail.** The brand presence is now consistent with the public site instead of feeling like a generic dark-mode admin tool.
- **Top tabs → vertical sidebar** with Iconify-style glyphs (Lucide-shaped). Active item gets a gold-tinted background and 1px gold border.
- **Page header with KPI strip** on every tab. The first KPI uses the brand-green/gold "hero" treatment so the most important metric (Total / Active subscribers / Sent) reads first.
- **Login screen is now a brand-led split** — half forest green with the logo + headline, half cream form panel. No more anonymous black box.
- **Tables** use clear `--border` 1px borders instead of 2% alpha zebra; pinned posts get a 3px gold left-accent.
- **Status pills** use the design-system status tokens (active green, draft amber, error red).
- **Plan badges** are outlined in plan colour: Basic = sage, Pro = gold, Business = forest green.
- **Notification preview** renders inside a `--sf-primary-deep` card to mirror the actual dashboard notification bell.
- **Iconography** uses Lucide-shaped inline SVG everywhere; emoji (📌) replaced with a proper pin glyph.

## Files
- `Shell.jsx` — sidebar + page header (`AdminShell`, `AdminHeader`)
- `LoginScreen.jsx` — split-panel sign-in
- `PostsTab.jsx` — KPIs (total / published / drafts / pinned), filter pills, posts table with pinned-row gold accent
- `UsersTab.jsx` — KPIs (total / active / Pro / Business), avatar + email, plan badge, QR-usage progress bar
- `NewsletterTab.jsx` — KPIs (total / 30d / week / open rate), subscriber table + 8-week growth sparkline + top-source card
- `NotificationsTab.jsx` — audience picker (count next to each), type chips, message + description fields, live preview on green, recent broadcasts list

Open `index.html` and use the sidebar to switch between Posts / Users / Newsletter / Push. Click "Sign out" in the sidebar to see the login screen.
