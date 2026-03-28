# BallR - Complete Product Requirements Document

**Version:** 1.0  
**Created:** March 23, 2026  
**Document Type:** Product Requirements (What to Build, Not How)  
**Target Audience:** AI Builders, Product Teams, Developers

\---

## 📋 Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Target Users](#3-target-users)
4. [Core Values \& Principles](#4-core-values--principles)
5. [Feature Requirements](#5-feature-requirements)
6. [Business Logic Rules](#6-business-logic-rules)
7. [User Experience Requirements](#7-user-experience-requirements)
8. [Data Model Requirements](#8-data-model-requirements)
9. [Success Metrics](#9-success-metrics)
10. [Edge Cases \& Constraints](#10-edge-cases--constraints)
11. [Future Enhancements](#11-future-enhancements)

\---

## 1\. Executive Summary

### What is BallR?

BallR is a **mobile-first web application** for organizing pickup football games in Southeast Asia (primary focus: Bangkok, Thailand). It solves three critical problems in the pickup football community:

1. **Unbalanced Teams** - Games are often ruined by mismatched skill levels
2. **No-Shows** - Players don't show up, wasting money and disrupting games
3. **Psychological Safety** - Beginners fear being the worst player and avoid joining

### Core Innovation: Dignity Protection

Unlike traditional sports apps that rank all players publicly, BallR implements **Dignity Protection**: players in the bottom 30% of skill level never see their exact rating. They see "Casual ⚽" instead. This removes shame and encourages participation.

### How It Works

1. **Players create accounts** and get an Elo rating (starts at 1000)
2. **Organizers create games** (set venue, time, price, player limit)
3. **Players join games** by paying upfront (commitment mechanism)
4. **Teams are auto-balanced** 2 hours before kickoff based on Elo ratings
5. **After games**, players rate each other (anonymous peer ratings)
6. **Elo ratings update** based on game results (win/loss/draw)
7. **Monthly leaderboard** shows top performers (Player of the Month)

### Target Metrics (6 Months)

* **1,000 Monthly Active Users** (MAU)
* **90%+ Game Attendance Rate** (low no-shows)
* **500 Games Organized**
* **4.5+ Star Rating** (app store reviews)
* **Break-even** (revenue covers costs)

\---

## 2\. Problem Statement

### Current State (Without BallR)

**Problem 1: Unbalanced Teams Ruin Games**

* Pickup games often have 1-2 very strong players dominating
* Weak players feel useless, don't enjoy the game
* Games become predictable and boring
* No systematic way to balance skill levels

**Problem 2: No-Shows Waste Time \& Money**

* Players commit to games but don't show up
* Organizers lose money on field bookings
* Games canceled last-minute
* No accountability system exists

**Problem 3: Beginners Fear Judgment**

* New players avoid joining because they fear being worst
* Public skill ratings create shame and anxiety
* No psychological safety for learning
* Community becomes exclusive, not inclusive

### Impact

* **60% of pickup games** have unbalanced teams (based on community surveys)
* **30% no-show rate** on average (organizers report)
* **40% of beginners** quit after 1-2 bad experiences (too competitive)

### Root Causes

* Manual organization (WhatsApp groups, spreadsheets)
* No skill-based matchmaking
* No payment commitment (easy to flake)
* No reputation system
* Publicly visible rankings hurt beginners

\---

## 3\. Target Users

### Primary Persona: "Alex the Expat"

**Demographics:**

* Age: 28-35
* Gender: Male (80%), Female (20%)
* Location: Bangkok, Thailand
* Occupation: Tech worker, teacher, digital nomad
* Income: $30k-60k USD/year

**Behaviors:**

* Plays football 1-2x per week
* Intermediate skill level (played recreationally in home country)
* Seeks social connection in new city
* Values fair, competitive games
* Willing to pay for quality experiences

**Pain Points:**

* Hard to find pickup games in new city
* Games often unbalanced (too easy or too hard)
* Unreliable players (no-shows)
* Wants to improve but lacks structured feedback

**Goals:**

* Play competitive, balanced games
* Meet like-minded people
* Track progress (skill improvement)
* Reliable, hassle-free organization

### Secondary Persona: "Som the Local"

**Demographics:**

* Age: 22-30
* Gender: Male
* Location: Bangkok, Thailand
* Occupation: Office worker, student
* Income: ฿20k-40k/month

**Behaviors:**

* Plays football 2-3x per week (serious hobby)
* Advanced skill level
* Knows local venues well
* Social, enjoys community aspect

**Pain Points:**

* Hard to find players at same skill level
* Many casual players don't take it seriously
* Wants competitive games, not just social kickabouts

**Goals:**

* Consistent, high-quality games
* Build reputation in community
* Compete in rankings

### Tertiary Persona: "Maya the Beginner"

**Demographics:**

* Age: 25-32
* Gender: Female (but also beginner males)
* New to football or returning after long break

**Behaviors:**

* Plays 1x per month or less
* Low confidence in skills
* Fears judgment from better players

**Pain Points:**

* **Anxiety about being worst player**
* Public rankings feel shameful
* Hard to find beginner-friendly games

**Goals:**

* Learn football in low-pressure environment
* Gradual skill improvement
* **Not feel embarrassed about skill level** ← BallR's unique value prop

\---

## 4\. Core Values \& Principles

### 1\. Dignity Above All

**Principle:** Never shame beginners for lack of skill.

**Implementation:**

* Bottom 30% never see exact rating (see "Casual ⚽" instead)
* No public "worst player" lists
* Focus on improvement, not comparison
* Anonymous peer ratings (no targeted harassment)

**Why It Matters:**

* Beginners are future regulars - losing them hurts growth
* Psychological safety increases retention
* Inclusive communities grow faster than exclusive ones

### 2\. Fairness Through Data

**Principle:** Use objective metrics (Elo ratings) to create balanced games.

**Why It Matters:**

* Human bias in manual team selection
* Data-driven balancing is fairer
* Transparent system builds trust

### 3\. Commitment Through Payment

**Principle:** Pay upfront to join games (no free rides).

**Why It Matters:**

* Financial commitment reduces no-shows
* Covers field costs (organizers don't lose money)
* Shows respect for others' time

### 4\. Community Over Competition

**Principle:** Foster friendly, social atmosphere while maintaining competitive integrity.

**Why It Matters:**

* Pickup football is social, not professional
* Toxic competitiveness kills communities
* Balance fun and seriousness

\---

## 5\. Feature Requirements

### Feature 1: User Authentication \& Profiles

**User Story:**

> As a new user, I want to create an account with my basic info so I can join games and track my progress.

**Requirements:**

**Must Have:**

1. Sign up with email + password (minimum 8 characters)
2. Email verification (send confirmation link)
3. Google OAuth sign-in (optional, for convenience)
4. Profile fields:

   * Name (required)
   * Email (required, unique)
   * Nationality (optional dropdown, 200+ countries)
   * Preferred Position (optional multi-select: GK, DEF, MID, FWD)
   * Bio (optional, max 500 characters)
   * Avatar photo (optional, upload image, max 2MB)
5. Auto-create player profile on signup:

   * Initial Elo rating: 1000
   * Elo calibrated: FALSE (first 10 games)
   * Games played: 0
   * Reliability score: 100%

**Should Have:**
6. Password reset via email
7. Phone number (optional, for SMS notifications)
8. Preferred city selection (Bangkok/Bali)

**Acceptance Criteria:**

* User can sign up in <60 seconds
* Email verification link expires in 24 hours
* Profile photo compressed to <500KB automatically
* Duplicate emails rejected with clear error message
* Google OAuth completes in one click (no manual form)

**Why This Matters:**

* Low friction signup = higher conversion
* Email verification = reduce spam accounts
* Initial Elo of 1000 = neutral starting point (neither top nor bottom)

\---

### Feature 2: Browse \& Search Games

**User Story:**

> As a player, I want to see all upcoming games in my city so I can find one that fits my schedule and skill level.

**Requirements:**

**Must Have:**

1. Game listing page (homepage) shows all upcoming games
2. Each game displays:

   * Venue name
   * Date \& time (formatted: "Today 18:00", "Tomorrow 17:00", "Fri, Mar 22 18:00")
   * Current players / Max players (e.g., "8/12 players")
   * Price per player (in local currency: THB or USD)
   * Skill level range (e.g., "⚡ 900-1100 Elo")
   * Game status badge ("FULL" if max reached)
3. Default sorting: nearest game first (chronological)
4. Only show games with:

   * Game time > NOW() (future games only)
   * Status: "upcoming" or "full"
5. Click game card → navigate to game detail page

**Should Have:**
6. Filters:

* City (Bangkok / Bali)
* Date range (Today / This Week / This Month / Custom)
* Price range (slider: min-max)
* Skill level (Beginner / Intermediate / Advanced / Mixed)
7. Search bar (search by venue name)
8. Empty state message: "No games available. Check back later!"

**Nice to Have:**
9. Map view (show games on map with pins)
10. Save favorite venues
11. "Notify me when new games posted" toggle

**Acceptance Criteria:**

* Load games in <2 seconds
* Filter updates apply instantly (no page reload)
* Mobile-friendly (swipe to see more games)
* Show max 20 games per page (pagination for more)
* Filters persist in URL (shareable links)

**Why This Matters:**

* Primary discovery mechanism - must be fast \& intuitive
* Filters help users find perfect game (time, price, skill)
* Map view helps users choose games near them

\---

### Feature 3: Game Details \& Join Flow

**User Story:**

> As a player, I want to see full details of a game and join it by paying, so I can secure my spot.

**Requirements:**

**Must Have:**

1. Game detail page shows:

   * **Venue Information:**

     * Name (e.g., "Benjakitti Park Field 1")
     * Address (full street address)
     * Map embed (interactive, shows venue location)
     * Surface type (Grass / Turf / Indoor)
     * Amenities (Changing rooms, Showers, Parking, Lights)
   * **Game Information:**

     * Date \& time (formatted for local timezone)
     * Duration (default: 90 minutes)
     * Max players (e.g., 12)
     * Current players count (live update)
     * Price per player (in local currency)
     * Registration cutoff (e.g., "2 hours before game")
     * Game status (Upcoming / Full / Completed / Canceled)
   * **Skill Level:**

     * Min-Max Elo of joined players (e.g., "⚡ 950-1150")
     * Average Elo (e.g., "Avg: 1025")
   * **Organizer:**

     * Name
     * Elo rating
     * Reliability score
     * Bio/description (if provided)
   * **Players List:**

     * Avatar (or placeholder)
     * Name
     * Elo rating
     * Team assignment (Blue 🔵 / Red 🔴 / None)
     * Show only if teams already balanced
   * **Weather Forecast** (optional):

     * Temperature, conditions (sunny/rainy)
     * Fetched from weather API (OpenWeatherMap or similar)
2. **"Join Game" Button:**

   * **Enabled when:**

     * User is logged in
     * Game not full (current\_players < max\_players)
     * Before registration cutoff
     * User has not already joined
   * **Disabled when:**

     * User not logged in → Show "Log in to join"
     * Game full → Show "Game Full"
     * Past cutoff → Show "Registration Closed"
     * Already joined → Show "Already Joined"
3. **Payment Flow (when clicking "Join Game"):**

   * Redirect to Stripe Checkout (hosted payment page)
   * Line item: "BallR Game - \[Venue] - \[Date]"
   * Amount: Price per player (in cents)
   * Success URL: `/games/:id?success=true`
   * Cancel URL: `/games/:id?canceled=true`
4. **After Payment Success:**

   * Create booking record (status: "paid")
   * Increment current\_players count
   * Send confirmation email to user
   * Show success message: "You're in! Check your email for details."
5. **Leave Game (Before Cutoff):**

   * "Leave Game" button visible if user joined
   * Click → Confirm dialog: "Are you sure? You'll get a refund."
   * Refund issued (full amount minus Stripe fee \~3%)
   * Decrement current\_players count
   * Remove booking record (or mark as "refunded")

**Should Have:**
6. Share button (copy link or share to social media)
7. Add to calendar (Google Calendar / iCal)
8. Game chat (real-time, visible only to joined players)

**Nice to Have:**
9. Directions to venue (Google Maps link)
10. Venue photos (gallery, uploaded by organizer)
11. Similar games recommendation (based on skill level)

**Acceptance Criteria:**

* Game detail page loads in <2 seconds
* Map displays correctly on mobile \& desktop
* Payment flow completes in <30 seconds
* Refund processed within 5-7 business days
* Leave game only allowed until cutoff (enforced by backend)
* User can't join same game twice (unique constraint)

**Why This Matters:**

* Primary conversion point - must be trustworthy
* Payment commitment reduces no-shows (core value)
* Full transparency builds trust (no hidden fees)

\---

### Feature 4: Dignity Protection System

**User Story:**

> As a beginner player, I don't want to see my exact skill rating if I'm in the bottom 30%, because it makes me feel bad and discouraged.

**Core Concept:**

BallR calculates the **30th percentile Elo** for each city. Players at or below this threshold never see their exact rating. Instead, they see **"Casual ⚽"**.

**Why This Exists:**

Research shows public rankings harm beginner retention:

* Fear of being "worst" prevents joining
* Shame around low ratings causes dropout
* Comparison to top players feels hopeless

Dignity Protection removes this barrier while maintaining data-driven matchmaking (backend still uses Elo for team balancing).

**Requirements:**

**Must Have:**

1. **Calculate City 30th Percentile:**

   * Query all players in city
   * Sort by Elo ascending
   * Take player at 30% position
   * Store as `city.elo\_30th\_percentile`
   * Recalculate weekly (cron job)
2. **Profile Display Logic:**

   * **IF** player's Elo ≤ 30th percentile:

     * Display: "Casual ⚽" (instead of exact number)
     * Hide Elo history chart
     * Show only positive metrics:

       * Games played
       * Win rate (only if >50%)
       * Preferred position
     * Hide: exact wins/losses/draws, reliability score details
   * **ELSE** (player in top 70%):

     * Display: exact Elo number (e.g., "1125")
     * Show full stats:

       * Games played, wins, losses, draws
       * Win rate %
       * Reliability score (%)
       * No-shows count
       * Elo trend (last 10 games)
     * Show Elo history chart (line graph)
3. **Calibration Period (First 10 Games):**

   * New players marked as `elo\_calibrated = FALSE`
   * After 10 games played: set `elo\_calibrated = TRUE`
   * During calibration: Show "Casual ⚽" regardless of Elo
   * Reason: Ratings volatile in first games, not meaningful yet
4. **Leaderboard Exclusion:**

   * Bottom 30% players NOT shown in public leaderboards
   * They can still view their profile (private)
   * Reason: Avoid "hall of shame" effect

**Should Have:**
5. Tooltip on "Casual ⚽":

* "Your rating is hidden to protect privacy. Play more games to see it!"
6. Progress indicator:

   * "Play 3 more games to unlock rating" (during calibration)

**Nice to Have:**
7. Opt-out option:

* "Show my exact rating anyway" (for brave beginners)
8. Encouragement messages:

   * "You're improving! Keep playing!" (if Elo increasing)

**Acceptance Criteria:**

* Bottom 30% NEVER see exact Elo number (hard constraint)
* Calculation happens weekly (not real-time, for performance)
* Calibration period is exactly 10 games (not 9, not 11)
* Elo still used for team balancing (backend logic unaffected)
* Profile page loads in <2 seconds (even with chart rendering)

**Edge Cases:**

**Case 1:** Player moves from bottom 30% to top 70%

* **Behavior:** After weekly recalculation, exact Elo becomes visible
* **Message:** "Congrats! You've improved enough to see your rating: 950"

**Case 2:** Player in top city (Bangkok, high skill) creates account

* **Behavior:** If Bangkok's 30th percentile is 1050, new player (1000 Elo) is protected
* **Reason:** Even "average" players protected in competitive cities

**Case 3:** City has <10 players

* **Behavior:** Set 30th percentile to default 900 (avoid division by zero)
* **Reason:** Not enough data for meaningful percentile

**Why This Matters:**

* **Unique value proposition** - no other app does this
* Increases beginner retention by 40% (estimated from similar UX research)
* Maintains fairness (Elo still used for balancing)
* Creates inclusive community culture

\---

### Feature 5: Automated Team Balancing

**User Story:**

> As a game organizer, I want teams to be automatically balanced based on skill levels so games are competitive and fun.

**Core Concept:**

2 hours before game start (registration cutoff), the system automatically assigns players to Team Blue or Team Red using an Elo-based algorithm. Goal: minimize Elo difference between teams.

**Requirements:**

**Must Have:**

1. **Trigger Condition:**

   * Cron job runs every 5 minutes
   * Checks for games where:

     * `game\_time - 2 hours < NOW()` (cutoff passed)
     * `teams\_balanced = FALSE` (not balanced yet)
     * `current\_players >= 4` (minimum viable game)
2. **Balancing Algorithm:**

   * **Step 1:** Fetch all paid bookings for game
   * **Step 2:** Get Elo rating for each player
   * **Step 3:** Sort players by Elo descending (highest first)
   * **Step 4:** Apply snake draft:

     * Player 1 (highest Elo) → Team Blue
     * Player 2 → Team Red
     * Player 3 → Team Red
     * Player 4 → Team Blue
     * Player 5 → Team Blue
     * Player 6 → Team Red
     * (Pattern: Blue gets 1st, 4th, 5th, 8th... Red gets 2nd, 3rd, 6th, 7th...)
   * **Step 5:** Calculate average Elo for each team
   * **Step 6:** If difference > 50 Elo points:

     * Try swapping pairs of players
     * Find swap that minimizes difference
     * Max 5 swap attempts
   * **Step 7:** Assign final teams (set `team\_assignment` in bookings)
   * **Step 8:** Mark game as `teams\_balanced = TRUE`
3. **Notification After Balancing:**

   * Send push notification to all players:

     * Title: "Teams Are Ready!"
     * Body: "You're on Team \[Blue/Red]. Avg Elo: \[X]. Let's win! 💪"
   * Send email with team roster:

     * List of teammates (names, positions, Elos)
     * Opponent team stats (avg Elo only)
4. **Display Teams on Game Detail Page:**

   * After balancing, show two sections:

     * **Team Blue 🔵** (list of players with Elos)
     * **Team Red 🔴** (list of players with Elos)
   * Show team average Elos
   * Show predicted win probability (based on Elo difference)

**Should Have:**
5. **Manual Override (Organizer Only):**

* Organizer can manually re-assign players
* Drag-and-drop UI (move player from Blue to Red)
* System warns if Elo difference becomes >100 points
* Reason: Handle special cases (friends want to play together)
6. **Alternate Algorithm (Captain's Pick):**

   * Option: "Let captains pick teams" (instead of auto-balance)
   * Highest Elo player on each team becomes captain
   * Captains alternate picking players (snake draft)
   * Reason: More social, fun for regulars

**Nice to Have:**
7. Position-aware balancing:

* Ensure each team has at least 1 goalkeeper
* Balance defenders, midfielders, forwards
8. Chemistry system:

   * Players who frequently play together get small Elo boost
9. Handicap mode:

   * Stronger team plays with -1 player (e.g., 6v5 if huge Elo gap)

**Acceptance Criteria:**

* Balancing completes in <10 seconds
* Elo difference between teams ≤ 50 points (ideal: ≤ 30)
* No player assigned to both teams (unique constraint)
* All paid players get assigned (no one left out)
* Notification sent within 1 minute of balancing
* Manual override only allowed by organizer (verified by user\_id)

**Edge Cases:**

**Case 1:** Odd number of players (e.g., 11 players)

* **Behavior:** One team gets extra player (6v5)
* **Compensation:** Weaker team gets extra player
* **Display:** "Team Blue (6 players) vs Team Red (5 players)"

**Case 2:** Player leaves game after balancing

* **Behavior:** Don't re-balance automatically
* **Reason:** Causes chaos if teams change last-minute
* **Organizer Action:** Can manually re-balance if needed

**Case 3:** All players have same Elo (e.g., 1000)

* **Behavior:** Random assignment (snake draft still works)
* **Result:** Teams have identical avg Elo

**Case 4:** Game has only 2 players

* **Behavior:** Don't balance (minimum 4 players required)
* **Display:** "Waiting for more players..."

**Why This Matters:**

* **Core value proposition** - balanced games are fun games
* Removes organizer burden (no manual team selection)
* Data-driven = perceived as fairer than human bias
* Reduces complaints about "unfair teams"

\---

### Feature 6: Elo Rating System

**User Story:**

> As a player, I want my skill level tracked objectively so I can see my improvement over time and play against similarly skilled opponents.

**What is Elo?**

Elo is a rating system (originally for chess) that calculates skill based on game results. Winning against stronger opponents gives more points. Losing to weaker opponents loses more points.

**Requirements:**

**Must Have:**

1. **Initial Rating:**

   * New players start at 1000 Elo
   * This is the "average" baseline
   * Range: 500 (absolute beginner) to 2500 (semi-pro)
2. **Calibration Period:**

   * First 10 games: player is "calibrating"
   * Flag: `elo\_calibrated = FALSE`
   * After 10 games: set to TRUE
   * During calibration: Elo changes are normal, but rating treated as "provisional"
3. **Rating Update Trigger:**

   * Happens when organizer marks game as "Completed"
   * Organizer selects winning team (Blue / Red / Draw)
   * System calculates Elo change for each player
4. **Elo Change Formula:**

   * **K-factor:** 32 (standard for amateur sports)
   * **Expected Score:**

     * Player's win probability based on Elo difference
     * If player's Elo = 1100, opponent avg = 1000:

       * Expected Score = 0.64 (64% win chance)
   * **Actual Score:**

     * Win: 1.0
     * Draw: 0.5
     * Loss: 0.0
   * **Rating Change:**

     * Change = K-factor × (Actual - Expected)
     * If player expected 64% win but won: +11 points (small gain)
     * If player expected 64% win but lost: -20 points (big loss)
5. **Team-Based Calculation:**

   * Each player's opponent is the average Elo of opposing team
   * Example:

     * Team Blue avg: 1050
     * Team Red avg: 950
     * Player on Blue (Elo 1100) beats Red:

       * Expected: 70% win chance (strong vs weak)
       * Actual: Win (1.0)
       * Change: +9 Elo (small gain for beating weaker team)
     * Player on Red (Elo 900) loses to Blue:

       * Expected: 30% win chance (weak vs strong)
       * Actual: Loss (0.0)
       * Change: -9 Elo (small loss for losing to stronger team)
6. **Bounds:**

   * Minimum: 500 (floor, can't go lower)
   * Maximum: 2500 (ceiling, can't go higher)
   * Display: Integer only (no decimals)
7. **History Tracking:**

   * Log every Elo change in `elo\_history` table
   * Store:

     * Player ID
     * Game ID
     * Elo before
     * Elo after
     * Change amount
     * Reason (win / loss / draw / no\_show)
   * Display as line chart in profile (last 20 games)

**Should Have:**
8. **No-Show Penalty:**

* If player marked as no-show: -50 Elo (fixed penalty)
* No opponent calculation (just flat deduction)
* Reason: Discourage no-shows harshly
9. **Decay System (Inactive Players):**

   * If player hasn't played in 3 months: Elo decreases by 10/month
   * Reason: Skills rust, ratings should reflect current ability
   * Max decay: 100 points total

**Nice to Have:**
10. **Elo Tiers (Named Ranks):**
- 500-700: Novice ⚽
- 700-900: Beginner 🌱
- 900-1100: Intermediate ⚡
- 1100-1300: Advanced 🔥
- 1300-1500: Expert 💎
- 1500+: Elite 👑

11. **Prediction Accuracy:**

    * Track how often predictions are correct
    * Display: "System predicted Blue to win (65% chance). Blue won! ✅"
    * Build trust in algorithm

**Acceptance Criteria:**

* Elo updates within 1 minute of game completion
* History chart displays accurately (no missing data points)
* Rating changes are transparent (show calculation in profile)
* No negative Elos (enforce 500 floor)
* No Elo change if game canceled before completion

**Edge Cases:**

**Case 1:** All players on one team have same Elo (e.g., 1000)

* **Behavior:** Calculate expected score normally
* **Result:** Each player gets same Elo change

**Case 2:** Huge Elo gap (e.g., 1500 vs 800)

* **Behavior:**

  * 1500 player beating 800: +1 Elo (expected to win)
  * 1500 player losing to 800: -31 Elo (huge upset)
  * 800 player beating 1500: +31 Elo (huge upset bonus)
* **Reason:** Upsets rewarded heavily

**Case 3:** Draw game

* **Behavior:**

  * Stronger team loses Elo (expected to win)
  * Weaker team gains Elo (held their own)
* **Example:**

  * Team Blue (1100 avg) draws with Team Red (900 avg):

    * Blue: -6 Elo (expected to win)
    * Red: +6 Elo (overperformed)

**Why This Matters:**

* **Objective skill measurement** (no human bias)
* **Motivates improvement** (visible progress)
* **Enables fair matchmaking** (team balancing relies on this)
* **Gamification** (players want to increase rating)

\---

### Feature 7: Player of the Month (POTM)

**User Story:**

> As a competitive player, I want to see monthly rankings so I can compete for recognition and prove I'm one of the best.

**Core Concept:**

Each month, BallR calculates a POTM Score for every eligible player. Top 10 players per city appear on the leaderboard. Formula rewards:

* Games played (participation)
* Wins (performance)
* Peer ratings (sportsmanship \& skill)
* Attendance rate (reliability)

**Requirements:**

**Must Have:**

1. **POTM Score Calculation:**

   * **Formula:**

```
     POTM Score = (Games Played × 5) +
                  (Wins × 10) +
                  (Avg Skill Rating × 20) +
                  (Avg Sportsmanship × 15) +
                  (Attendance Rate × 0.5)
     ```

   * **Example:**

     * Games: 12 → 60 points
     * Wins: 8 → 80 points
     * Avg Skill Rating: 4.2/5 → 84 points
     * Avg Sportsmanship: 4.5/5 → 67.5 points
     * Attendance: 95% → 47.5 points
     * **Total: 339 points**
2. **Eligibility Requirements:**

   * Minimum 4 games played in month
   * `elo\_calibrated = TRUE` (no new players)
   * Not banned
   * Not in bottom 30% (Dignity Protection applies)
3. **Leaderboard Display:**

   * Shows top 10 players per city
   * Each entry shows:

     * Rank (1-10)
     * Player name
     * Avatar
     * Elo rating
     * POTM Score
     * Games played this month
     * Win rate %
   * Sorted by POTM Score descending
4. **Monthly Reset:**

   * POTM scores reset on 1st of each month (00:00 UTC)
   * Previous month's winners archived (historical record)
   * Cron job runs at month start to calculate final rankings
5. **Winner Announcement:**

   * Top 3 players get push notification:

     * "🏆 Congrats! You're #1 POTM for Bangkok (March 2026)!"
   * Winner displayed on homepage (badge)

**Should Have:**
6. **Prizes (Optional, Future):**

* \#1: Free game voucher (worth 100 THB)
* Top 3: "POTM Winner" badge on profile
* Top 10: Name on Hall of Fame page
7. **Historical Leaderboards:**

   * View past months (e.g., "February 2026 POTM")
   * Track how player's rank changes over time

**Nice to Have:**
8. **Crew Rankings:**

* Top crews (teams of friends) ranked by combined POTM scores
9. **Multi-City Champions:**

   * Player who wins POTM in multiple cities gets special badge

**Acceptance Criteria:**

* Leaderboard updates daily at 00:00 UTC
* Scores recalculated after every game completion
* Only eligible players shown (bottom 30% excluded)
* Ties broken by Elo rating (higher Elo wins)
* Mobile-friendly table (swipe to see full stats)

**Edge Cases:**

**Case 1:** Player plays in multiple cities

* **Behavior:** Separate POTM score for each city
* **Reason:** Different player pools, not comparable

**Case 2:** Player becomes ineligible mid-month (banned)

* **Behavior:** Removed from leaderboard immediately
* **POTM score:** Set to 0

**Case 3:** Less than 10 eligible players in city

* **Behavior:** Show all eligible players (e.g., only 7)
* **Display:** "Top 7 Players (March 2026)"

**Why This Matters:**

* **Gamification** - gives competitive players a goal
* **Community building** - creates local heroes
* **Retention** - players return to defend title
* **Fair competition** - bottom 30% protected from comparison

\---

### Feature 8: Post-Game Peer Ratings

**User Story:**

> As a player, I want to rate my teammates after a game so good players get recognized and I can give feedback.

**Core Concept:**

After game completion, each player can rate their **teammates only** (not opponents) on two dimensions:

1. **Skill** (1-5 stars) - How good were they at football?
2. **Sportsmanship** (1-5 stars) - Were they respectful, encouraging, fair?

Ratings are **anonymous** to prevent retaliation and encourage honesty.

**Requirements:**

**Must Have:**

1. **Rating Trigger:**

   * After organizer marks game as "Completed"
   * Rating UI unlocks for all players who attended
   * Available for 7 days (then closes)
2. **Rating UI (Modal/Page):**

   * Title: "Rate Your Teammates"
   * Shows list of teammates (same team only)
   * For each teammate:

     * Avatar + Name
     * Two 5-star rating inputs:

       * ⚽ Skill (1-5 stars)
       * 🤝 Sportsmanship (1-5 stars)
     * Optional comment box (max 200 characters)
   * Submit button (saves all ratings at once)
3. **Anonymous Submission:**

   * Ratings stored with `rater\_id` (backend only)
   * Display on player profile:

     * "Avg Skill Rating: 4.2/5 (based on 15 games)"
     * "Avg Sportsmanship: 4.5/5 (based on 15 games)"
   * **Never show:** Who gave which rating
   * **Never show:** Individual comments publicly
4. **Rating Constraints:**

   * Can only rate teammates (not opponents)
   * Can't rate yourself
   * Can only rate once per player per game
   * Can't edit ratings after submission
5. **Display in Profile:**

   * Show average skill rating (e.g., "4.2/5 ⭐")
   * Show average sportsmanship (e.g., "4.5/5 🤝")
   * Show total ratings received (e.g., "Based on 18 games")
   * Display as stars + number

**Should Have:**
6. **Rating Reminders:**

* Push notification 1 day after game:

  * "Rate your teammates from yesterday's game!"
* Email reminder after 3 days (if not rated)
7. **Incentive:**

   * Players who rate all teammates get +2 POTM points (small bonus)
   * Reason: Encourages participation

**Nice to Have:**
8. **Detailed Breakdown:**

* Show distribution: "80% gave you 5 stars, 20% gave 4 stars"
9. **Comments Visible to Self:**

   * Player can see comments about themselves (but not who wrote them)
10. **Flag Toxic Comments:**

    * Auto-detect offensive language (profanity filter)
    * Flag for admin review

**Acceptance Criteria:**

* Rating UI appears within 1 hour of game completion
* Can't rate opponents (enforced by UI + backend)
* Ratings are truly anonymous (no way to trace back)
* Average updates immediately after submission
* Empty state: "No ratings yet. Play more games!"

**Edge Cases:**

**Case 1:** Player rates teammate very low (1 star skill + 1 star sportsmanship)

* **Behavior:** Rating still counts (no minimum threshold)
* **Reason:** Honest feedback matters
* **Safeguard:** If player gets many low ratings, admin reviews for toxicity

**Case 2:** Player forgets to rate (7 days pass)

* **Behavior:** Rating window closes, can't rate anymore
* **Reason:** Prevent retroactive bias (fading memory)

**Case 3:** Game had only 2 players (1v1)

* **Behavior:** No teammates to rate (skip rating)
* **Display:** "No teammates to rate (solo game)"

**Why This Matters:**

* **Reputation system** - good sportsmanship rewarded
* **Community self-policing** - toxic players get low ratings
* **POTM input** - peer ratings affect leaderboard
* **Anonymous = honest** - no fear of retaliation

\---

### Feature 9: Reliability Score \& No-Show Tracking

**User Story:**

> As an organizer, I want to see which players are reliable so I can avoid inviting chronic no-shows.

**Core Concept:**

Every player has a **Reliability Score** (0-100%) calculated as:

```
Reliability Score = (Games Attended / Games Booked) × 100
```

**Requirements:**

**Must Have:**

1. **Tracking:**

   * When player joins game: increment `games\_booked`
   * When game completes:

     * Organizer marks who attended
     * Attended players: increment `games\_attended`
     * No-shows: increment `no\_show\_count`
   * Recalculate score: `(games\_attended / games\_booked) × 100`
2. **Display in Profile:**

   * Show reliability score with color coding:

     * 🟢 90-100%: "Excellent" (green)
     * 🟡 70-89%: "Good" (yellow)
     * 🔴 <70%: "Unreliable" (red)
   * Show no-show count: "2 no-shows (total)"
3. **No-Show Penalties:**

   * **Elo Penalty:** -50 points (immediate)
   * **Reliability Drop:** Decreases score
   * **No Refund:** Payment forfeited
   * **Email Notification:**

     * "You were marked as no-show for \[Game]. -50 Elo. Please attend games you book."
4. **Appeal Process:**

   * Player can appeal no-show within 24 hours
   * Click "Appeal" button in email/notification
   * Write explanation (max 200 chars)
   * Organizer reviews appeal
   * If approved: restore Elo, mark as attended
   * If rejected: penalty stands

**Should Have:**
5. **3-Strike System:**

* 3 no-shows in 30 days → 7-day suspension (can't join games)
* 5 no-shows total → Account review (possible ban)
* Email warning after 2nd no-show: "One more and you'll be suspended"
6. **Organizer Filter:**

   * When creating game: option to "Only allow players with >80% reliability"
   * Reason: Protect organizers from chronic flakers

**Nice to Have:**
7. **Redemption Path:**

* After suspension: must play 5 games with 100% attendance to restore account
8. **No-Show Leaderboard (Shame List):**

   * Show players with worst reliability (bottom 10)
   * Public accountability

**Acceptance Criteria:**

* Reliability score updates within 1 minute of game completion
* Color coding visible on all player cards
* Appeal window is exactly 24 hours (enforced by timestamp)
* Suspended players can't click "Join Game" (button disabled)

**Edge Cases:**

**Case 1:** Player attends game but arrives late (30+ min)

* **Behavior:** Organizer marks as "attended" (not no-show)
* **Reason:** Late ≠ absent (but organizer can rate low sportsmanship)

**Case 2:** Game canceled by organizer

* **Behavior:** Don't count against reliability (not player's fault)
* **Refund:** Full refund issued

**Case 3:** Player leaves before cutoff (refund)

* **Behavior:** Don't count as no-show (they canceled properly)
* **Reliability:** No change (booking removed from history)

**Why This Matters:**

* **Core problem:** No-shows ruin games
* **Trust signal:** High reliability = trustworthy player
* **Organizer protection:** Can filter out unreliable players
* **Accountability:** Public score creates social pressure

\---

### Feature 10: Game Chat (Real-Time)

**User Story:**

> As a player, I want to chat with other players before/during the game so I can coordinate and socialize.

**Core Concept:**

Each game has a real-time chat room. Only players who joined the game can see/send messages.

**Requirements:**

**Must Have:**

1. **Access Control:**

   * Chat visible only to players who paid and joined
   * Unlocks immediately after booking
   * Stays open until 24 hours after game completion
2. **Chat UI:**

   * Displayed on game detail page (below game info)
   * Scrollable message list (latest at bottom)
   * Text input box (max 500 characters per message)
   * Send button
   * Auto-scroll to latest message when new message arrives
3. **Message Display:**

   * Each message shows:

     * Avatar (or placeholder)
     * Player name
     * Message text
     * Timestamp (e.g., "2 min ago", "Yesterday 15:30")
   * Own messages aligned right (different color)
   * Others' messages aligned left
4. **Real-Time Updates:**

   * Use WebSocket or Supabase Realtime
   * Messages appear instantly (no refresh needed)
   * Typing indicator (optional): "John is typing..."
5. **System Messages:**

   * Auto-generated messages for events:

     * "Sarah joined the game" (when player books)
     * "Teams are ready! Check your assignment above." (after balancing)
     * "Game completed. See you next time!" (after completion)

**Should Have:**
6. **Moderation:**

* Profanity filter (auto-censor bad words: f\*\*\*, s\*\*\*)
* Flag button (report offensive messages)
* Admin can delete messages
7. **Rich Features:**

   * Emoji support (😀⚽🔥)
   * Link previews (if someone shares URL)
   * Image sharing (upload photo, max 2MB)

**Nice to Have:**
8. **Voice Messages:**

* Record short audio clips (max 30 seconds)
9. **Polls:**

   * Create quick polls: "Who wants to grab food after?"
10. **Reactions:**

    * React to messages with emoji (👍❤️😂)

**Acceptance Criteria:**

* Messages appear in <1 second (real-time)
* Chat loads last 50 messages on open
* Older messages load when scrolling up (infinite scroll)
* Works on mobile (touch-friendly input)
* Notifications when new message (optional toggle)

**Edge Cases:**

**Case 1:** Player leaves game (refund)

* **Behavior:** Lose access to chat immediately
* **Reason:** Not in game anymore, shouldn't see chat

**Case 2:** Game canceled

* **Behavior:** Chat stays open for 24 hours (players can discuss)
* **System Message:** "Game canceled by organizer. Refunds issued."

**Case 3:** Player sends 100 messages in 1 minute (spam)

* **Behavior:** Rate limit: max 10 messages per minute
* **Display:** "Slow down! Wait 30 seconds before sending again."

**Why This Matters:**

* **Community building** - players get to know each other
* **Coordination** - confirm attendance, discuss meetup details
* **Social aspect** - football is about people, not just sport

\---

## 6\. Business Logic Rules

### Rule 1: Payment \& Refunds

**Payment Requirements:**

* All games require upfront payment (no free games)
* Payment processed via Stripe Checkout (hosted page)
* User redirected to Stripe → enters card details → payment succeeds → booking created

**Refund Policy:**

1. **Before Cutoff:**

   * Full refund (minus Stripe fee \~3%)
   * Processed within 5-7 business days
   * Booking removed, `current\_players` decremented
2. **After Cutoff:**

   * No refund (payment forfeited)
   * If player doesn't show: marked as no-show, -50 Elo
3. **Game Canceled by Organizer:**

   * Full refund to all players
   * No Stripe fee deducted (organizer eats the cost)

**Currency:**

* Bangkok games: Thai Baht (THB)
* Bali games: US Dollars (USD)
* Display with correct symbol (฿ or $)

\---

### Rule 2: Game Lifecycle

**States:**

1. **Upcoming** (default)

   * Game time in future
   * Players can join
   * Teams not balanced yet
2. **Full**

   * `current\_players >= max\_players`
   * Can't join (button disabled)
   * Waitlist available (optional feature)
3. **In Progress**

   * Game time passed
   * Registration closed
   * Teams balanced
4. **Completed**

   * Organizer marked as complete
   * Winning team selected
   * Elo updated, peer ratings unlocked
5. **Canceled**

   * Organizer canceled game
   * All refunds issued
   * Can't be uncanceled

**Transitions:**

* Upcoming → Full (when max players reached)
* Upcoming → In Progress (when game\_time < NOW())
* In Progress → Completed (organizer clicks "Mark Complete")
* Any → Canceled (organizer clicks "Cancel Game")

\---

### Rule 3: City Percentile Recalculation

**Frequency:** Weekly (every Sunday at 00:00 UTC)

**Process:**

1. For each city:

   * Query all players where `preferred\_city\_id = city.id`
   * Sort by Elo ascending
   * Take player at 30% position:

     * If 100 players: 30th player
     * If 50 players: 15th player
   * Store as `city.elo\_30th\_percentile`
2. If city has <10 players:

   * Set percentile to 900 (default)
   * Reason: Not enough data

**Impact:**

* Players who cross threshold see Elo appear/disappear
* Notification: "Your rating is now visible!" (if crossed up)

\---

### Rule 4: Elo Calibration

**Definition:** First 10 games are "calibration period"

**Behavior:**

* New player starts with `elo\_calibrated = FALSE`
* Elo updates normally (win/loss calculation)
* After 10th game: set `elo\_calibrated = TRUE`

**Display Implications:**

* During calibration: Show "Casual ⚽" (regardless of Elo)
* After calibration: Show exact Elo (if in top 70%)

**Why 10 Games?**

* Too few (e.g., 3): Not enough data, ratings volatile
* Too many (e.g., 20): Players wait too long to see rating
* 10 is sweet spot (proven in chess Elo systems)

\---

### Rule 5: Team Assignment Finality

**When Teams Are Balanced:**

* 2 hours before game (registration cutoff)
* Automated by cron job

**After Balancing:**

* Players can't switch teams (locked)
* Organizer can manually override (but warned)
* If player leaves after balancing: team imbalance allowed (no re-balance)

**Reason:**

* Re-balancing last-minute creates chaos
* Players plan based on team assignment (who they'll play with)

\---

## 7\. User Experience Requirements

### Mobile-First Design

**Primary Device:** Smartphone (80% of users)

**Requirements:**

1. All pages responsive (320px to 1920px width)
2. Touch targets ≥44x44px (Apple HIG standard)
3. Bottom navigation bar (4 tabs: Home, Calendar, My Games, Profile)
4. Pull-to-refresh on lists
5. Swipe gestures (e.g., swipe game card to share)

\---

### Dark Theme (Default)

**Why:** Most users browse in evening (after work). Dark theme reduces eye strain.

**Colors:**

* Background: Dark slate (#0F172A)
* Cards: Slightly lighter slate (#1E293B)
* Text: Off-white (#F1F5F9)
* Primary CTA: Bright green (#10B981)
* Error: Red (#EF4444)

**Light Theme:** Optional (toggle in settings, future feature)

\---

### Performance Targets

**Page Load:**

* Homepage: <2 seconds
* Game detail: <2 seconds
* Profile: <3 seconds (includes chart rendering)

**Interaction:**

* Button click → response: <100ms
* Form submit → feedback: <500ms
* Payment redirect: <1 second

**Real-Time:**

* Chat message delivery: <1 second
* Team balance notification: <1 minute

\---

### Accessibility

**Requirements:**

1. All buttons/links keyboard accessible (tab navigation)
2. ARIA labels on interactive elements
3. Color contrast ≥ 4.5:1 (WCAG AA)
4. Screen reader friendly (semantic HTML)
5. Focus indicators visible (blue outline)

\---

### Error Handling

**Friendly Error Messages:**

* ❌ Bad: "Error 500: Internal server error"
* ✅ Good: "Oops! Something went wrong. Please try again."

**Network Errors:**

* Show retry button
* Offline indicator: "No internet connection. Some features unavailable."

**Form Validation:**

* Real-time validation (as user types)
* Clear error messages under each field
* Disable submit until all fields valid

\---

## 8\. Data Model Requirements

### Players Table

**Must Store:**

* User ID (foreign key to auth system)
* Email (unique, indexed)
* Name
* Avatar URL
* Nationality (optional)
* Bio (optional)
* Preferred position (array: GK, DEF, MID, FWD)
* Elo rating (integer, default 1000)
* Elo calibrated (boolean, default FALSE)
* Games played, won, lost, drawn (integers)
* Reliability score (float, 0-100)
* No-show count (integer)
* Preferred city ID (foreign key)
* Is banned (boolean)
* Created at, Updated at (timestamps)

**Relationships:**

* One player → many bookings
* One player → many peer ratings (as rater and rated)
* One player → one city (preferred)

\---

### Games Table

**Must Store:**

* Organizer ID (foreign key to players)
* Venue ID (foreign key to venues)
* City ID (foreign key to cities)
* Game time (timestamp, indexed)
* Duration (integer, minutes)
* Max players (integer, default 12)
* Current players (integer, default 0)
* Price per player (integer, cents)
* Description (text, optional)
* Skill level (enum: beginner/intermediate/advanced/mixed)
* Registration cutoff (timestamp)
* Teams balanced (boolean)
* Teams balanced at (timestamp)
* Game status (enum: upcoming/full/in\_progress/completed/canceled)
* Completed at, Canceled at (timestamps)
* Winning team (enum: blue/red/draw, nullable)
* Weather forecast (JSON, optional)

**Relationships:**

* One game → many bookings
* One game → one venue
* One game → one city
* One game → one organizer (player)

\---

### Bookings Table

**Must Store:**

* Game ID (foreign key)
* Player ID (foreign key)
* Payment status (enum: pending/paid/refunded/failed)
* Payment intent ID (Stripe reference)
* Team assignment (enum: blue/red/none)
* Attended (boolean, nullable)
* Marked no-show (boolean)
* Elo before, Elo after (integers, nullable)
* Left at (timestamp, if player left)
* Created at (timestamp)

**Unique Constraint:** (game\_id, player\_id) - can't book same game twice

\---

### Peer Ratings Table

**Must Store:**

* Game ID (foreign key)
* Rater ID (foreign key to players)
* Rated ID (foreign key to players)
* Skill rating (integer, 1-5)
* Sportsmanship rating (integer, 1-5)
* Comment (text, optional, max 200 chars)
* Is anonymous (boolean, always TRUE)
* Created at (timestamp)

**Unique Constraint:** (game\_id, rater\_id, rated\_id) - can't rate same player twice in same game

**Check Constraint:** rater\_id ≠ rated\_id (can't rate yourself)

\---

### Elo History Table

**Must Store:**

* Player ID (foreign key)
* Game ID (foreign key)
* City ID (foreign key)
* Elo before (integer)
* Elo after (integer)
* Change amount (integer, can be negative)
* Change reason (enum: win/loss/draw/no\_show/calibration)
* Created at (timestamp)

**Purpose:** Historical tracking for Elo chart

\---

## 9\. Success Metrics

### Primary KPIs (6 Months)

1. **Monthly Active Users (MAU):**

   * Target: 1,000
   * Definition: Users who join ≥1 game per month
2. **Game Attendance Rate:**

   * Target: 90%+
   * Definition: (Attended games / Booked games) × 100
3. **Average Reliability Score:**

   * Target: 85%
   * Definition: Average of all players' reliability scores
4. **Games Organized:**

   * Target: 500 total
   * Definition: Games with status = completed
5. **Revenue:**

   * Target: Break-even
   * Definition: Total fees collected ≥ total costs (hosting + Stripe fees)

### Secondary Metrics

6. **Average Elo Difference (Team Balance):**

   * Target: ≤40 points
   * Definition: Avg difference between Team Blue and Team Red Elo
7. **Peer Rating Participation:**

   * Target: 70%+
   * Definition: % of players who rate teammates after games
8. **User Retention (30-day):**

   * Target: 60%+
   * Definition: % of users who return within 30 days of first game
9. **Net Promoter Score (NPS):**

   * Target: 50+
   * Definition: Survey question: "How likely are you to recommend BallR?"
10. **Bottom 30% Retention:**

    * Target: 50%+ (higher than avg sports app)
    * Definition: % of bottom 30% players who play ≥2 games

\---

## 10\. Edge Cases \& Constraints

### Technical Constraints

1. **Database:**

   * Max 10,000 concurrent users (Supabase free tier limit)
   * Upgrade to paid tier if exceeded
2. **Payment:**

   * Stripe supports 135+ currencies
   * Use THB for Bangkok, USD for Bali
   * Minimum payment: 50 THB (\~$1.50 USD)
3. **Real-Time:**

   * Supabase Realtime supports 500 concurrent connections
   * Implement throttling if exceeded

### Legal Constraints

4. **Data Privacy:**

   * GDPR compliance (EU users)
   * PDPA compliance (Thailand users)
   * Privacy policy: explain data usage
   * Terms of service: liability waivers
5. **Payment Processing:**

   * PCI-DSS compliance (handled by Stripe)
   * No card data stored in database

### Business Constraints

6. **Minimum Viable Game:**

   * Require ≥4 players to balance teams
   * Games with <4 players: don't auto-balance (organizer decides)
7. **Maximum Players:**

   * Default: 12 (6v6)
   * Organizer can set 8-24 (4v4 to 12v12)
   * Reason: Most pickup games are 5v5 to 7v7
8. **Cutoff Time:**

   * Default: 2 hours before game
   * Organizer can set 1-24 hours
   * Reason: Gives time for team balancing + player prep

\---

## 11\. Future Enhancements (Post-MVP)

### Phase 2 Features (3-6 Months)

1. **Friends System:**

   * Add/remove friends
   * See friends' upcoming games
   * Invite friends to games
2. **Crews (Teams):**

   * Create crews (named groups)
   * Crew vs Crew games (special mode)
   * Crew rankings
3. **Advanced Search:**

   * Filter by organizer reputation
   * Filter by venue rating
   * "Games my friends joined"
4. **Notifications:**

   * SMS notifications (via Twilio)
   * WhatsApp notifications (opt-in)
   * Email digests (weekly summary)

### Phase 3 Features (6-12 Months)

5. **PWA Offline Mode:**

   * Cache game data for offline viewing
   * Queue actions (e.g., join game) when offline
   * Sync when back online
6. **Multi-Language:**

   * Thai language support
   * Auto-detect user locale
   * Translate UI (not user-generated content)
7. **Gamification:**

   * Achievements (e.g., "Played 50 games")
   * Badges (e.g., "Hat-trick scorer")
   * Streak tracking (e.g., "10 games in a row")
8. **Venue Partnerships:**

   * Venues offer discounts to BallR users
   * Revenue share model (10% of booking fee)

### Phase 4 Features (12+ Months)

9. **Video Highlights:**

   * Upload game highlights (30-second clips)
   * Auto-generate "Play of the Game"
10. **Live Scoring:**

    * Track score during game (real-time)
    * Stats tracking (goals, assists, saves)
11. **Matchmaking AI:**

    * Suggest games based on skill level
    * "Smart recommendations" (ML-based)
12. **Esports Integration:**

    * Tournaments (knockout brackets)
    * Prize pools (crowdfunded)
    * Live streaming (Twitch/YouTube)

\---

## Conclusion

**BallR is a pickup football app that solves three core problems:**

1. ✅ Unbalanced teams (via Elo-based auto-balancing)
2. ✅ No-shows (via payment commitment + reliability tracking)
3. ✅ Beginner anxiety (via Dignity Protection system)

**Unique Value Proposition:**

* **Only app** that hides ratings from bottom 30% (inclusive, not exclusive)
* Data-driven team balancing (fairer than human selection)
* Social accountability (peer ratings + reliability scores)

**Target Market:**

* Southeast Asia (Bangkok primary, Bali secondary)
* Expats + locals who speak English
* Casual to competitive players (Elo 800-1500)

**Success = 1,000 MAU in 6 months + 90% attendance rate + 4.5 stars**

**Tech Stack (Recommended, Not Required):**

* Frontend: React/Vue/Svelte (mobile-first)
* Backend: Supabase/Firebase (BaaS)
* Payments: Stripe
* Deployment: Vercel/Netlify
* Database: PostgreSQL

**This Document Defines WHAT to Build, Not HOW**

An AI or developer should read this and know:

* What features to implement
* Why each feature matters
* What success looks like
* What edge cases to handle
* What constraints to respect

**Build BallR. Make pickup football better. 🚀⚽**

\---

**Document Version:** 1.0  
**Created:** March 23, 2026  
**Maintained By:** Product Team  
**Status:** Ready for Development

