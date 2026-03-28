# BallR — Claude Code Context

## What this is
BallR is a mobile football/soccer pickup game discovery app for expats in Bangkok/Bali.
Built with **Expo React Native** inside a **pnpm monorepo** on Replit.

**Replit project:** `https://replit.com/@tobiaskaetker17/workspace`
**GitHub repo:** `https://github.com/tobiaskaetker174-creator/ballR-Replit`

---

## Design System — "Iron & Moss"

| Token | Value |
|-------|-------|
| Base (background) | `#141312` |
| Surface | `#201F1E` |
| Overlay | `#363433` |
| Primary green | `#2D5A27` |
| Accent green | `#A1D494` |
| Muted | `#8C8782` |
| Red | `#E05252` |
| Blue | `#5B8FE8` |
| Amber | `#E8A93A` |
| Purple | `#9B6FD4` |
| Teal | `#4ABFB0` |

**Font:** Inter only — `Inter_400Regular`, `Inter_500Medium`, `Inter_600SemiBold`, `Inter_700Bold`

**Rules:**
- Never use `as any` casts — TypeScript must be clean
- Percentage left positions: type as `` `${number}%` `` not `string`
- All new screens follow the dark charcoal + moss green palette

---

## App entry point: `artifacts/mobile`

### Screens

| Screen | File | Notes |
|--------|------|-------|
| Discover | `app/(tabs)/index.tsx` | Game listings, filters, FAB for create game |
| My Games | `app/(tabs)/my-games.tsx` | Auth-gated, upcoming + completed + rating prompts |
| Leaderboard | `app/(tabs)/leaderboard.tsx` | Podium + ELO list, city auto-selects from user's basedIn |
| Profile | `app/(tabs)/profile.tsx` | ELO tier, BALLR SCORE, history chart, edit modal |
| Game Detail | `app/game/[id].tsx` | AI teams modal, payment modal, chat button, in-game ELO bar |
| Create Game | `app/create-game.tsx` | Full organizer form |
| Chat | `app/chat/[id].tsx` | Simulated real-time chat per game |
| Rate Teammates | `app/rate/[id].tsx` | Star ratings (skill + sportsmanship) |
| Organizer Panel | `app/organizer/[id].tsx` | Mark complete, select winner, mark no-shows |
| Notifications | `app/notifications.tsx` | Unread badge count, mark-all-read |
| Auth | `app/auth.tsx` | Login/signup modal; guest browsing allowed |
| Player Profile | `app/player/[id].tsx` | Public stats, ELO, review form, report button |
| Analytics | `app/analytics.tsx` | Rivals, best teammates, BOTM breakdown, toughest opponent |

### Key constants
- **`constants/mock.ts`** — all mock data: `PLAYERS` (11), `GAMES`, `COMPLETED_GAMES`, `ALL_GAMES`, `CHAT_MESSAGES`, `NOTIFICATIONS`, `ELO_HISTORY`, `PENDING_RATINGS`, `PROFILE_REVIEWS`, `MY_GAMES_IDS`, `VENUES_LIST`
- Current user: `PLAYERS[0]` (Maya, ELO 820, `eloCalibrated: true`)
- `MY_GAMES_IDS = new Set(["g1", "g3"])`
- `ELO_PRIVACY_PERCENTILE = 0.30`, `CALIBRATION_GAMES = 5`

### Auth context (`context/AuthContext.tsx`)
```ts
const { user, isLoggedIn, login, signup, logout, updateProfile } = useAuth();
// user is null when logged out
// login(email, password) resolves to PLAYERS[0]
// signup(name, email, password) creates a new player
// updateProfile(Partial<Player>) updates the logged-in user in state
```

### Navigation
```ts
// Navigate to a player profile:
router.push({ pathname: "/player/[id]", params: { id: player.id } });
// Navigate to game detail:
router.push({ pathname: "/game/[id]", params: { id: game.id } });
```

---

## Monorepo structure

```
/
├── artifacts/
│   ├── mobile/          ← Expo React Native app (main focus)
│   ├── api-server/      ← Express 5 API (mostly unused, mock data only)
│   └── mockup-sandbox/  ← Vite component preview server
├── lib/
│   ├── api-spec/        ← OpenAPI spec
│   ├── api-client-react/← Generated React Query hooks
│   ├── api-zod/         ← Generated Zod schemas
│   └── db/              ← Drizzle ORM + PostgreSQL
└── scripts/             ← Utility scripts
```

## Running the app
```bash
# Install dependencies
pnpm install

# Start the Expo dev server
pnpm --filter @workspace/mobile run dev

# Typecheck everything
pnpm run typecheck
```

---

## Important rules

1. **No `as any`** — always use proper TypeScript types
2. **Mock data only** — the app uses `constants/mock.ts`, no real API calls
3. **Always use Inter font** — load via `useFonts` hook in the layout
4. **Stick to the Iron & Moss palette** — no random colors
5. **`updateProfile()`** from AuthContext is the correct way to persist profile edits
6. **Percentage styles** — use `` `${number}%` as `${number}%` `` not `as any`

---

## ELO system
- Range: 0–2000, Avg = 1200
- Tiers: Rookie (0–799), Amateur (800–999), Semi-Pro (1000–1199), Pro (1200–1499), Elite (1500+)
- Users below `CALIBRATION_GAMES` games show a calibration progress bar instead of ELO
- ELO is hidden from other players below `ELO_PRIVACY_PERCENTILE` (30th percentile)
