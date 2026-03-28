# BallR App — Replit Specifications & Bug Fixes

**Date:** 2026-03-25 (copied to Replit repo: 2026-03-26)  
**Project:** BallR (Pickup Football App)  
**Status:** Active Development  
**Repo location:** `ballr-specs.md` (project root)

> This spec was originally drafted in the GitHub repo `openclaw-memory`. It now lives here in the BallR Replit project as the canonical copy. Update this file when new features are spec'd or implemented.

---

## 1. Discover Screen — Filter Update

### Change:
Remove the word "both-sided" (beidseitig) from the filter options.

### Current:
- Filter shows "both-sided" as an option

### Expected:
- Filter removes "both-sided"
- Keep other filters intact

### Location:
- `/src/pages/Discover.tsx` (or equivalent)
- Search for: `"both-sided"` or similar filter UI

---

## 2. Admin Profile Feature (NEW)

### Feature:
Create an Admin Profile that can manage/edit field images.

### Functionality:
- Admin can upload new field images
- Admin can edit existing field images
- Admin can delete field images (optional)

### Details:
- Access level: Only admin users can modify fields
- Field images storage: Supabase Storage (same bucket as current images)
- UI: Admin panel or settings area

### Implementation Notes:
- Check if admin role exists in Supabase auth
- If not, create admin role + permissions table
- Add image upload component for fields
- Field edit modal with image preview

---

## 3. Bug Fix: My Games → Completed → Game Not Found

### Problem:
When clicking on a completed game in "My Games" section, it shows "Game Not Found" instead of displaying the past game details.

### Expected Behavior:
- Click completed game
- Past game view loads with full details
- Show game date, teams, score, players, etc.

### Likely Cause:
- Query parameter not passed correctly
- Game ID mismatch between list and detail view
- API endpoint not returning data

### Fix Priority:
**HIGH** — This is a critical bug affecting user experience

### Debug Steps:
1. Check URL when clicking game (should contain game ID)
2. Verify game ID matches in `games` table
3. Check API response from `GET /games/{gameId}`
4. Console log to verify data is fetched

### Location:
- Component: `/src/pages/MyGames.tsx` or `/src/components/GameList.tsx`
- Detail view: `/src/pages/GameDetail.tsx` or equivalent
- API: `/api/games/[id].ts` or equivalent

---

## 4. Game View — AI-Based Team Assignment Display

### Feature:
When AI has already calculated which players play together, show this information and allow user to view the AI recommendation.

### Functionality:

#### Part A: Show AI Status
- Display: "Teams calculated by AI" (or similar indicator)
- Show in game view when AI has run

#### Part B: AI Button/Link
- Add button: "View AI Assignment" or "View AI Teams"
- When clicked, shows AI's recommended team setup

#### Part C: AI View Screen
- Shows how AI thinks teams should be arranged
- Display:
  - Team A (AI recommended)
  - Team B (AI recommended)
  - Reasoning (optional): Why AI split this way (rating balance, etc.)

### Details:
- Trigger: Only show button if `ai_assignment_calculated == true`
- Display after AI Elo/team balancing algorithm runs
- UI: Modal or new detail view

### Implementation:
- Check `games` table for `ai_assignment_calculated` flag
- Fetch from `games.ai_assignment_data` or similar
- Display in formatted cards/rows

---

## 5. Baller of the Month System (Rename + Calculation Display)

### Change:
Rename "Player of the Month" → **"Baller of the Month"**

### Feature:
Show how "Baller of the Month" is calculated (publicly visible formula).

### Current Status:
- Feature seems incomplete or not implemented
- No medals/ranking visible on player profile

### Calculation Formula (Show to Users):
**Baller of the Month = f(Win Rate, Elo Rating, Community Rating)**

Details:
- **Win Rate:** Percentage of games won this month
- **Elo Rating:** Current Elo (or monthly Elo gain)
- **Community Rating:** Quality & Reliability score (NOT public per se, but used in calculation)
  - This is a hidden score, but users should know it affects ranking
  - Don't show individual scores, only that it's factored in

### Medal Display:
- **Gold:** 1st place "Baller of the Month"
- **Silver:** 2nd place
- **Bronze:** 3rd place

### Implementation Checklist:
- [ ] Rename everywhere: "POTM" → "Baller of the Month"
- [ ] Create calculation display (show formula on leaderboard)
- [ ] Create `baller_of_month` table (player_id, rank, month, year, score)
- [ ] Add medals (gold/silver/bronze)
- [ ] Display on player cards & leaderboard
- [ ] Calculation runs monthly (automated)

### Algorithm Specifics:
```
Baller of the Month Score = 
  (Win_Rate * 0.4) + 
  (Elo_Gain * 0.3) + 
  (Community_Rating_Normalized * 0.3)

Where:
- Win_Rate = games_won / games_played (0-1)
- Elo_Gain = elo_this_month - elo_previous_month
- Community_Rating = hidden internal score (0-100)
  - Quality: Skill level
  - Reliability: Shows up for games, follows rules
```

### UI Text (Display to Users):
"Baller of the Month is calculated by:
- Win Rate (40%)
- Elo Rating Improvement (30%)
- Community Quality & Reliability (30%)

[View Details]"

### ELO Rating Display Enhancement:
Also add filter to ELO rating view:
- **"This Month"** (current dropdown option)
- **"All Time"** (new option)

Users should be able to toggle between:
- This month's Elo rankings
- All-time Elo rankings

---

## 6. Bug Fix: Join Match — Players Display Inconsistency

### Problem:
When clicking "Join Match", sometimes players are displayed and sometimes not. Inconsistent behavior.

### Expected Behavior:
Players should ALWAYS be displayed when "Join Match" is clicked.

### Likely Cause:
- Data loading race condition
- API call not completing before rendering
- Missing null/loading state handling

### Fix Priority:
**HIGH** — Affects core user flow

### Debug:
1. Check if API call is completing before UI renders
2. Add loading state (spinner) while fetching players
3. Verify player data is returned from API
4. Console log network requests

---

## 7. Feature: Clickable Player Profiles (Global)

### Feature:
Make all player profile displays clickable/interactive.

### Scope:
Everywhere a player profile is shown (any screen, any component), users should be able to click on it to view that player's full profile.

### Details:
- Player name → clickable
- Player card → clickable
- Player avatar → clickable
- Player stats → clickable
- Player in team list → clickable

### Navigation:
- Click player → Navigate to `/player/[player_id]`
- Show full player profile with:
  - Stats (wins, Elo, games played)
  - Medal (if Baller of the Month)
  - Game history
  - Community rating (hidden details)

### Implementation:
- Convert all player displays to `<Link>` or `<button>` with onClick
- Wrap player components with navigation context
- Ensure consistent UI feedback (hover state, cursor pointer)

---

## 8. Player Profile Enhancement

### Feature Updates to Player Profile Page:

#### A. Player Image Upload
- Add button/component to upload profile picture
- Allow user to change/update their image anytime
- Store in Supabase Storage

#### B. Display: Baller Score
- Show prominently on profile
- This is the main public metric

#### C. Display: Reliability
- Show on profile
- Users can see their reliability score

#### D. Hide: Quality Score & Fairness Score
- Do NOT display these on the profile
- These are internal metrics only
- Users should not see "Quality: X" or "Fairness: X"
- Users only see: Baller Score (the composite)

### Additional Features (From Feature Docs):
- [ ] Favorite Team: Player can set/select favorite team
- [ ] Favorite Player: Player can select favorite player (plays like whom)
- [ ] Implement all features from existing Feature Documentation

**Note:** Check Feature Docs for complete list of player profile features that should be implemented.

---

## 9. Dignity Protection — Hide from UI

### Change:
Remove all UI references to "Dignity Protection Active"

### Current Status:
- Likely showing "Dignity Protection: Active" somewhere
- Or toggle/checkbox for Dignity Protection
- This should NOT be visible to users

### Expected Behavior:
- Dignity Protection is ALWAYS active (default)
- Users don't see this setting
- It's a backend rule, not a user choice

### Implementation:
- Remove "Dignity Protection" toggle/label from app
- Remove from settings, profile, or any UI
- Keep the feature working in backend (active by default)
- Don't mention it to users

### Reasoning:
- Dignity Protection should be invisible infrastructure
- Users shouldn't think they can turn it off
- It's a non-negotiable rule, not an option

---

## 10. Carpooling Feature — Make Accessible in Match Views

### Feature:
Carpooling option should be accessible/visible on individual match detail views.

### Scope:
When viewing a specific match (game detail page), users should see and be able to access carpooling options.

### Implementation:
- Add carpooling button/section on match detail page
- Allow users to:
  - Offer a ride (host carpooling)
  - Join a ride (request carpooling)
  - See who's in the carpool
  - Chat/coordinate pickup location & time

### Location:
- Component: `/src/pages/MatchDetail.tsx` or `/src/pages/GameDetail.tsx`
- Add "Carpooling" section (button or card)
- Link to carpooling modal/page

### UI Placement:
Suggest: Below team assignments or in match info section

---

## 11. ELO Range Display — Player Position Visual

### Feature:
Show ELO ranking range with player's current position visually marked.

### Details:
- Display ELO range (e.g., 1000-3000 total range)
- Show where the current player stands on that range
- Visual indicator (marker, line, highlight) showing exact position

### Example:
```
ELO Range:
1000 ----●------ 3000
         ↑ You are here (1500)
```

### Implementation:
- Create ELO range visualization component
- Calculate min/max ELO of all players
- Plot current player's ELO on the range
- Show as horizontal bar with marker (dot, line, etc.)

### Location:
- Player profile page
- Leaderboard (optional, to show player's position)

### Data:
- Min ELO: Lowest active player
- Max ELO: Highest active player
- Player's current ELO: Marked on scale

---

## 12. Rivals System — Add to Player Profiles

### Feature A: Mark Rivals
- On any other player's profile, user can click "Mark as Rival"
- This creates a 1-way rivalry (Player A marks Player B as rival)
- Only Player A sees this rivalry (private to them)

### Feature B: Personal Analytics Dashboard
- **Private dashboard** (only user sees own data)
- Name: "My Analytics" or "Dashboard"
- Shows:
  1. **Best Teammates:** Players I win most with (compatibility analysis)
  2. **My Rivals:** All players I've marked as rivals
  3. **Win Rate vs Rivals:** For each rival, show:
     - Head-to-head win rate
     - Times played against each other
     - Trends (improving/declining)

### Data to Display:
```
Best Teammates:
- Player A: 75% win rate together
- Player B: 72% win rate together
- Player C: 68% win rate together

My Rivals:
- Rival X: 40% win rate (you win 40% vs them)
- Rival Y: 35% win rate
- Rival Z: 50% win rate
```

### Implementation:
- Create `rivalry` table (user_id, rival_id, created_at)
- Create analytics view component
- Calculate win rates (query games table)
- Show personal stats only (private page)

### Privacy:
- Other users cannot see YOUR rivals
- Other users cannot see YOUR personal analytics
- It's private to each user

---

## 13. Profile Reviews/Comments System (Moderated)

### Feature:
Other players can leave reviews/comments on your profile. You moderate which ones appear publicly.

### Workflow:

#### Step 1: Someone leaves a review
- Other player writes comment/review on your profile
- Comment goes to "Pending Reviews" (not public yet)
- You get notified: "[Player name] left you a review"

#### Step 2: You view the review
- You click notification or go to profile settings
- You see the review content
- You see who wrote it
- You see timestamp

#### Step 3: You decide
- Accept: Review appears on your public profile
- Reject: Review is deleted / hidden
- (Optional) Block: Block user from leaving more reviews

#### Step 4: Public display
- Accepted reviews show on your profile
- Display review text + author name
- Show date of review
- Hide rejected/pending reviews

### Data:
- Create `profile_reviews` table:
  ```
  id (PK)
  author_id (FK)
  profile_owner_id (FK)
  review_text (string)
  status (pending/accepted/rejected)
  created_at
  response_from_owner (optional)
  ```

### UI Components:
- **Review submission form** (on other player's profile)
- **Notification** (when you get a review)
- **Review management page** (your pending/accepted reviews)
- **Review display** (on public profile)

### Moderation Rules:
- Owner must approve before public
- Owner can delete anytime
- Owner can respond to reviews (optional)

---

## 14. Player Reporting System (Complaint/Moderation)

### Feature:
Users can report players for bad behavior / rule violations.

### Workflow:

#### Step 1: Report a player
- Click "Report" on player profile (or during game)
- Select reason for report:
  - Disrespectful behavior
  - Rule violation
  - Inappropriate language
  - No-show / ghosting
  - Other

#### Step 2: Describe the issue
- Optional text field for details
- Submit report
- Confirmation: "Report sent"

#### Step 3: Admin review (backend)
- Admin sees all reports
- Can investigate (view player history, games, reviews)
- Take action:
  - Warning
  - Suspension (temporary)
  - Ban (permanent)

#### Step 4: Reported player notification
- Gets notified they've been reported (after admin review)
- May receive warning/suspension notice

### Data:
- Create `player_reports` table:
  ```
  id (PK)
  reporter_id (FK)
  reported_player_id (FK)
  reason (enum: disrespect, rule_violation, language, no_show, other)
  description (text)
  status (pending/reviewed/resolved)
  admin_notes (private)
  created_at
  resolved_at
  action_taken (warning/suspension/ban)
  ```

### Privacy:
- Reports are anonymous to other players (players don't see who reported them)
- Only admin sees reporter identity
- Player receives outcome, not who reported

### Anti-Abuse:
- Limit reports per user per day (e.g., max 3)
- Reports without evidence can be dismissed
- Serial false reporters can be warned/banned

---

## 15. Gamification Features (Streaks & More)

### Feature:
Add gamification elements to increase engagement (from existing Feature Docs).

### Streaks:
- **Winning Streak:** Count consecutive wins
- **Participation Streak:** Days in a row with games
- **Display:** Show on profile (e.g., "3-game win streak!")
- **Reset:** Streak resets on loss or missed day
- **Milestone badges:** 5-game, 10-game, 20-game streaks

### Other Gamification (from Feature Docs):
- **Achievements/Badges:** First game, 100 games, etc.
- **Leaderboards:** Monthly & all-time
- **Challenges:** "Win 5 games this week"
- **Rewards:** Visual badges, profile highlights

### Implementation:
- Track streaks in `player_stats` table
- Calculate on each game completion
- Display on profile & dashboard
- Notify on streak milestones

---

## 16. Rating Improvement Display (Monthly)

### Feature:
Show month-over-month improvement in Elo/Baller Rating.

### Display:
On profile or dashboard, show:
- "Your Baller Rating: 1650 ↑ +150 this month"
- "Your Elo Rating: 1800 ↑ +200 this month"
- Trend visualization (chart or arrow)
- Compare to previous month

### Data:
- Store monthly snapshots of ratings
- Calculate: current_month - previous_month
- Show positive/negative change with color (green up, red down)

### Locations:
- Player profile
- Personal dashboard
- Leaderboard (optional)

---

## 17. Social Links on Profile (Instagram & WhatsApp)

### Feature:
Players can add Instagram & WhatsApp contact info to their profile.

### Profile Fields:
- Instagram handle (optional)
- WhatsApp number (optional)

### Display:
- Show on public profile (if user fills in)
- Icons/links for easy access
- "Contact me on Instagram" or similar

### Privacy:
- Completely optional
- User chooses what to show
- No default sharing

### Implementation:
- Add `instagram_handle` & `whatsapp_number` fields to `players` table
- Add input fields in profile edit page
- Display as clickable links on public profile

---

## Summary of Changes

| Feature | Priority | Status | Notes |
|---------|----------|--------|-------|
| Remove "both-sided" filter | Medium | ✅ Done | Removed from discover filters |
| Admin profile for field images | Medium | ✅ Done | `app/admin.tsx` — admin panel built |
| Fix: Past games bug | HIGH | ✅ Done | `MY_GAME_IDS` / `ALL_GAMES` fixed |
| Fix: Join Match players | HIGH | ✅ Done | PaymentModal + join flow complete |
| AI team assignment view | Medium | ✅ Done | Modal in `game/[id].tsx` when `aiAssignmentCalculated=true` |
| Baller of the Month (rename + formula) | Medium | ✅ Done | Leaderboard BOTM mode with formula card |
| Clickable player profiles (global) | Medium | ✅ Done | All player rows → `/player/[id]` |
| Player profile enhancements | Medium | ✅ Done | ELO visual, reliability, medals, streaks, bio edit |
| Dignity Protection hidden | Medium | ✅ Done | Removed from `auth.tsx` UI |
| Favorite team/player fields | Medium | ✅ Done | On player profiles |
| Carpooling in match views | Medium | ✅ Done | Carpool card in `game/[id].tsx` → `/carpool/[id]` |
| ELO range display | Medium | ✅ Done | `EloRangeVisual` component in profile |
| Rivals system + analytics | Medium | ✅ Done | Analytics screen + rivals/best-teammates data |
| Profile reviews (moderated) | Medium | ✅ Done | `ProfileReview` type, pending/accepted moderation |
| Player reporting system | Medium | ✅ Done | `report/[id].tsx` with reason selection |
| Gamification (streaks, etc) | Medium | ✅ Done | Win streak on profile, medals (gold/silver/bronze) |
| Rating improvement display | Medium | ✅ Done | ELO gain this month shown on leaderboard + profile |
| Social links (Instagram/WhatsApp) | Medium | ✅ Done | `instagram` + `whatsapp` fields on Player, shown on profile |
| **Community Champion Award** | Medium | ✅ Done | 3rd leaderboard mode — fairness/reliability ranking |
| **Goal of the Month** | Low | ✅ Done | Coming Soon teaser card at bottom of leaderboard |
| **Venue community chat links** | Medium | ✅ Done | WhatsApp/Telegram button in `game/[id].tsx` |
| **Referral system** | Medium | ✅ Done | `referral.tsx` with code share, ledger, credits |
| **Post-game peer rating** | High | ✅ Done | `rate/[id].tsx` with star ratings + comments |
| **Game chat** | High | ✅ Done | `chat/[id].tsx` real-time style messaging |
| **Notifications** | High | ✅ Done | `notifications.tsx` with type-specific icons |
| **Organizer panel** | High | ✅ Done | `organizer/[id].tsx` — winner, no-shows, cancel |
| **Create Game flow** | High | ✅ Done | `create-game.tsx` — full form with venue/skill/price/cutoff |

---

## Files to Modify/Create

### Existing Files (Likely):
- `src/pages/Discover.tsx` — Remove filter word
- `src/pages/MyGames.tsx` — Fix game detail link
- `src/pages/GameDetail.tsx` — Load past game data
- `src/components/PlayerCard.tsx` — Add medal display

### New Files (Needed):
- `src/pages/AdminPanel.tsx` — Admin field image management
- `src/components/MedalDisplay.tsx` — Medal component
- `scripts/calculatePOTM.ts` — Monthly medal calculation
- `src/pages/AIAssignmentView.tsx` — AI team recommendation view

---

## Supabase Tables (Check/Create)

### Existing:
- `games` — Add flag: `ai_assignment_calculated` (boolean)
- `players` — Already exists

### New:
- `player_medals` — Schema:
  ```sql
  id (PK)
  player_id (FK)
  medal_type (gold/silver/bronze)
  month (integer 1-12)
  year (integer)
  created_at (timestamp)
  ```

- `admin_users` — Schema (if not exists):
  ```sql
  user_id (FK)
  is_admin (boolean)
  created_at (timestamp)
  ```

---

## Questions for Clarification

1. **Admin creation:** How should admins be created? Manual SQL insert or UI form?
2. **POTM timing:** When to calculate? End of month? Manually triggered?
3. **AI algorithm:** Is the team assignment already calculated, just not displayed? Or needs implementation?
4. **Medal display:** Should medals show on every view, or only specific places (profile, leaderboard)?

---

## Next Steps

1. **Start with HIGH priority:** Fix "Past Games" bug
2. **Then MEDIUM:** Filter update, AI view, medals
3. **Final:** Admin panel setup

**Estimated Total Time:** 2-4 hours depending on AI algorithm state

---

**Created by:** Tobias (via Replit spec request)  
**For:** Replit AI Vibe Coder  
**Date:** 2026-03-25 05:35 UTC
