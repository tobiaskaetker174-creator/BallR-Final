# BallR — Claude Code Handoff Document

> This document gives everything Claude Code needs to continue development on BallR without any prior context.

---

## What is BallR?

BallR is a **mobile-first pickup football/soccer discovery app** for expats living in Bangkok and Bali. Players find casual games nearby, join them, rate teammates, earn ELO, and climb community leaderboards. It is built with **Expo React Native** and targets iOS, Android, and web.

---

## Project Structure (pnpm monorepo)

```
/
├── artifacts/
│   ├── mobile/              ← Expo React Native app (THE main product)
│   ├── api-server/          ← Express 5 API server (scaffold only, see below)
│   └── mockup-sandbox/      ← Vite preview server for UI component prototyping
├── lib/
│   ├── db/                  ← Drizzle ORM + PostgreSQL (schema exists, no models yet)
│   ├── api-spec/            ← OpenAPI 3.1 spec + Orval codegen config
│   ├── api-client-react/    ← Generated React Query hooks (from OpenAPI)
│   └── api-zod/             ← Generated Zod schemas (from OpenAPI)
├── scripts/                 ← Utility scripts
├── ballr-specs.md           ← Canonical feature spec (read this!)
└── replit.md                ← Architecture notes (always keep updated)
```

---

## Running the Project

```bash
# Mobile app (Expo)
pnpm --filter @workspace/mobile run dev

# API server
pnpm --filter @workspace/api-server run dev

# Database schema push (dev only)
pnpm --filter @workspace/db run push
```

The mobile app runs on Expo. On web it serves at the Replit preview URL. On device, use Expo Go.

---

## The Mobile App (`artifacts/mobile`)

### Entry point
`artifacts/mobile/app/(tabs)/_layout.tsx` — bottom tab navigation (Discover, My Games, Rankings, Profile).

### All screens

| Screen | File | Notes |
|--------|------|-------|
| Discover | `app/(tabs)/index.tsx` | Featured pitch hero, filter bar (city/skill/date/ELO), compact game list, For You + Friends sections at bottom |
| My Games | `app/(tabs)/my-games.tsx` | Auth-gated; upcoming + completed games, rating prompts |
| Rankings | `app/(tabs)/leaderboard.tsx` | Baller of Month podium, ELO ranking, Community Champion |
| Profile | `app/(tabs)/profile.tsx` | ELO chart, baller score, social links, reviews |
| Game Detail | `app/game/[id].tsx` | Full game info, AI teams, carpool, payment, chat |
| Create Game | `app/create-game.tsx` | Full organizer form |
| Chat | `app/chat/[id].tsx` | Simulated real-time chat |
| Rate Teammates | `app/rate/[id].tsx` | Post-game star ratings |
| Organizer Panel | `app/organizer/[id].tsx` | Mark complete, winner, no-shows |
| Notifications | `app/notifications.tsx` | Notification center + settings gear |
| Notification Settings | `app/notification-settings.tsx` | 7 push notification toggles |
| Auth | `app/auth.tsx` | Login/signup (guest browsing supported) |
| Player Profile | `app/player/[id].tsx` | Public profile, reviews, report |
| Analytics | `app/analytics.tsx` | Rivals, best teammates, BOTM |
| Report Player | `app/report/[id].tsx` | Anonymous report |
| Reviews | `app/reviews.tsx` | Review moderation |
| Admin | `app/admin.tsx` | Venue images + player reports dashboard |
| Carpool | `app/carpool/[id].tsx` | Ride coordination + chat (only for joined games) |
| Wallet | `app/wallet.tsx` | Credits/payment hub |
| Venue | `app/venue/[id].tsx` | Venue profile |
| Match Stats | `app/match-stats/[id].tsx` | Post-game MVP voting + statistics |

---

## Mock Data — THE Most Important Thing

**The mobile app has NO real backend connection. Everything is mock data.**

All data lives in:
```
artifacts/mobile/constants/mock.ts
```

### What's in mock.ts

- `PLAYERS` — 11 mock players (array). **PLAYERS[0] is the current logged-in user** (Maya Chen, ELO 820).
- `GAMES` — upcoming games (array of Game objects)
- `COMPLETED_GAMES` — finished games
- `ALL_GAMES` — GAMES + COMPLETED_GAMES combined
- `VENUES_LIST` — venue objects
- `CHAT_MESSAGES` — per-game chat messages
- `NOTIFICATIONS` — 4 notifications (2 unread)
- `ELO_HISTORY` — Maya's ELO history for the chart
- `PENDING_RATINGS` — games where the user owes a rating
- `PROFILE_REVIEWS` — reviews on Maya's profile
- `MY_GAME_IDS` — `["g1", "g3", "g7"]` (array) — games Maya is in (use `.includes()`)
- `MY_GAMES_IDS` — `Set(["g1","g3","g7","gc1"])` — same but as a Set (use `.has()`)
- `FOLLOWED_PLAYER_IDS` — IDs of players Maya follows
- `CARPOOL_MESSAGES` — mock carpool chat messages

### ⚠️ You do NOT need to generate or seed fake users

All fake users already exist in `mock.ts`. To add more players, simply append to the `PLAYERS` array in that file. To add more games, append to `GAMES`. No database seeding is required — the app reads everything from these in-memory arrays.

### Auth context
`artifacts/mobile/context/AuthContext.tsx`
- App starts logged-out (guest mode)
- `login()` resolves to PLAYERS[0] (Maya)
- `signup()` creates a new in-memory player
- `useAuth()` gives `{ user, isLoggedIn, login, signup, logout, updateProfile }`

---

## The API Server (`artifacts/api-server`)

**The API server is currently a scaffold. It has only one real endpoint:**

```
GET /api/health   →  { status: "ok" }
```

The mobile app does **not** call the API at all — it uses mock data exclusively.

The API server is intended to be the real backend when the app moves to production. The database (PostgreSQL + Drizzle) is connected but has no table models defined yet.

### API server file structure
```
artifacts/api-server/
├── src/
│   ├── index.ts         ← reads PORT, starts Express
│   ├── app.ts           ← mounts CORS, JSON parsing, routes at /api
│   └── routes/
│       ├── index.ts     ← mounts sub-routers
│       └── health.ts    ← GET /health
```

### Adding a new API route
1. Create `src/routes/mything.ts` with an Express Router
2. Mount it in `src/routes/index.ts`
3. Add the route to `lib/api-spec/openapi.yaml`
4. Run `pnpm --filter @workspace/api-spec run codegen` to regenerate hooks/schemas

---

## Design System — "Iron & Moss"

All colors live in `artifacts/mobile/constants/colors.ts`.

| Token | Hex | Usage |
|-------|-----|-------|
| `Colors.base` | `#141312` | Screen background |
| `Colors.surface` | `#201F1E` | Cards, panels |
| `Colors.overlay` | `#363433` | Modals, chips |
| `Colors.separator` | ~`#2A2927` | Borders, dividers |
| `Colors.primary` | `#2D5A27` | Moss green (buttons, accents) |
| `Colors.accent` | `#A1D494` | Light moss (text on primary, highlights) |
| `Colors.muted` | `#8C8782` | Secondary text, icons |
| `Colors.text` | `#E6E2DF` | Primary text |
| `Colors.red` | `#E05252` | Errors, full badge |
| `Colors.amber` | `#E8A93A` | "For You" section, warnings |
| `Colors.teal` | `#4ABFB0` | "Friends Playing" section |
| `Colors.blue` | `#5B8FE8` | Info states |
| `Colors.purple` | `#9B6FD4` | Achievement badges |

### Fonts
Only Inter family:
- `Inter_400Regular`
- `Inter_500Medium`
- `Inter_600SemiBold`
- `Inter_700Bold`

---

## Shared Components

| Component | File | Notes |
|-----------|------|-------|
| `GameCard` | `components/GameCard.tsx` | Full game card with skill badge, fill bar, join button |
| `BallrLogo` | `components/BallrLogo.tsx` | Top header logo |
| `GameMapView` | `components/GameMapView.tsx` | Map view of games |

---

## Key Patterns & Gotchas

1. **`useFocusEffect` is NOT exported from expo-router.** Use `useNavigation().addListener("focus", cb)` in a `useEffect` instead.

2. **MY_GAME_IDS vs MY_GAMES_IDS** — two separate exports:
   - `MY_GAME_IDS` = `["g1","g3","g7"]` (array) → use `.includes()`
   - `MY_GAMES_IDS` = `Set(["g1","g3","g7","gc1"])` (Set) → use `.has()`

3. **The carpool screen** (`app/carpool/[id].tsx`) shows a collapsible chat section only when `MY_GAMES_IDS.has(id)` is true.

4. **Port binding** — the mobile app reads `process.env.PORT` for the Expo dev server. Never hardcode a port.

5. **Tab bar** — `_layout.tsx` uses `ClassicTabLayout` for web/Android (active pill indicator), `NativeTabLayout` for iOS (system native tabs).

6. **Safe area** — always use `useSafeAreaInsets()` for top/bottom padding. Bottom padding should add `~72-80px` for the tab bar height.

---

## What's Been Built (Feature Completion)

All core features are complete:
- ✅ Discover screen (featured pitch, filters, For You, Friends Playing, map view)
- ✅ Game detail (info, AI teams, carpool, payment, chat, player profiles)
- ✅ My Games (upcoming + completed + rating prompts)
- ✅ Rankings (Baller of Month, ELO, Community Champion)
- ✅ Profile (ELO chart, baller score, reviews, analytics)
- ✅ Create game (full organizer form)
- ✅ Notifications + notification settings
- ✅ Carpool chat (gated by game membership)
- ✅ Match stats + MVP voting
- ✅ Achievement badges + wallet hub
- ✅ Admin panel (venue images + player reports)
- ✅ Design polish: accent bar section headers, tab bar pill indicator, hero gradients, card borders, filter pill improvements

## What's NOT Built / Still To Do

- ❌ Real backend integration (all data is still mock)
- ❌ Real authentication (no JWT/session)
- ❌ Real-time chat (currently simulated)
- ❌ Push notifications (UI exists, no service)
- ❌ Payment processing (UI exists, no Stripe integration)
- ❌ Image uploads (admin panel UI exists, no storage)
- ❌ Map with real game pins (GameMapView is basic)
- ❌ Discover screen reorder: "All Games" list is currently above For You/Friends sections (Task #12 merged this ordering — games list first, then For You + Friends at bottom)

---

## Useful Commands

```bash
# Install dependencies
pnpm install

# Run mobile app
pnpm --filter @workspace/mobile run dev

# Run API server
pnpm --filter @workspace/api-server run dev

# Push DB schema changes
pnpm --filter @workspace/db run push

# Re-generate API client + Zod schemas from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Typecheck entire monorepo
pnpm run typecheck
```

---

## Canonical Spec File

Read `ballr-specs.md` at the project root. It contains the original feature requirements and bug fixes. When implementing features, reference and update this file.

---

*Last updated: March 2026 — design polish complete, all core features shipped, backend integration pending.*
