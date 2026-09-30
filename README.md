# Online Hobby & Skills Tracker with Community Sharing on Cloud

A cloud-native web application designed to help individuals, students, and teams maintain deliberate practice habits, set quantifiable skill goals, automatically track streaks, and share milestones with a peer community.

---

## 1. Overview

Most people abandon new hobbies and self-guided learning due to lack of structured progress visibility and peer accountability. **Online Hobby & Skills Tracker with Community Sharing on Cloud** solves this problem by combining:
1. **Deliberate Practice Logging**: Tracking time, specific activity, and reflections.
2. **Deterministic Streak & Goal Calculation**: Automated computation of consecutive daily streaks, progress percentages, and milestone achievement.
3. **Cloud Object Storage for Proof**: Storing achievement certificates and progress images securely in cloud storage.
4. **Community Motivation Loop**: A shared public feed where learners post updates, give peer encouragement, like, and comment.
5. **Real-Time Cloud Analytics**: Multi-dimensional dashboards visualizing weekly trends, skill distributions, and earned badges.

---

## 2. Problem Statement

1. **High Dropout Rates**: Without quantifiable feedback, learners cannot measure whether their skills are compounding over time.
2. **Data Fragmentation**: Practice logs written in physical journals or local spreadsheets cannot be synchronized across mobile and desktop devices.
3. **Absence of Social Accountability**: Solitary practice lack the encouragement that community sharing fosters.
4. **Unreliable Habit Metrics**: Simple counters often falsely increment multiple times in a single day or fail to reset when a calendar day is missed.

---

## 3. Objectives

- Deliver a high-availability, responsive single-page application (SPA) backed by cloud services.
- Implement strict multi-tenant authorization where private user logs cannot be tampered with or read by unauthorized third parties.
- Provide automatic milestone detection and mathematically sound streak calculations.
- Implement cloud object storage with strict file size (<5MB) and MIME-type validation.
- Demonstrate core Cloud Computing concepts suitable for academic evaluation and real-world deployment.

---

## 4. Key Features

- **Authentication & Identity**: User registration, login, session persistence, and profile management with unique usernames.
- **Skill & Hobby Management**: Full CRUD support for skills (Music, Coding, Photography, Art, Fitness, Cooking, etc.) with proficiency levels (Beginner, Intermediate, Advanced) and status tracking.
- **Goal Setting & Automatic Milestones**: Measurable targets (e.g. "Practice 30 hours") with progress formulas capped at 100% and intermediate achievement checkpoints.
- **Practice Session Logging**: Time duration, activity descriptions, and notes with automated metric triggers.
- **Deterministic Streak Engine**: Counts consecutive calendar days; single count per calendar day; resets on missed days; tracks longest historical streak.
- **Cloud Object Storage**: Profile picture and post image uploads with client-side preview and server-side validation.
- **Community Feed**: Paginated social feed, category filtering, keyword search, and sorting (Recent / Most Liked).
- **Social Engagement**: Duplicate-like prevention, threaded comments, and strict ownership authorization (users can only delete their own content).
- **Cloud Analytics Dashboard**: 5 charts (Weekly Practice Trend, Hours by Skill, Monthly Progress, Category Distribution, Goal Completion) and verified achievement badges.

---

## 5. Cloud Computing Concepts Demonstrated

| Concept | Implementation in this Project |
| :--- | :--- |
| **SaaS (Software as a Service)** | The completed web application hosted online, accessible by end-users directly via web browser without local installation. |
| **PaaS (Platform as a Service)** | Built on Firebase / Cloud Run infrastructure providing automated provisioning, runtime execution, and zero OS maintenance. |
| **Cloud Database (NoSQL)** | Google Cloud Firestore / document-store structure storing user profiles, skills, goals, practice sessions, posts, and comments. |
| **Cloud Object Storage** | Google Cloud Storage / Firebase Storage bucket storing binary media assets (profile pictures, milestone images) referenced by URI. |
| **Managed Authentication** | Secure token-based authentication and role-based user isolation (`request.auth.uid == userId`). |
| **Client-Server Architecture** | Decoupled React frontend communicating via stateless REST APIs and Bearer tokens to the cloud backend. |
| **Stateless REST APIs** | Backend endpoints (`/api/*`) requiring no sticky sessions, enabling horizontal autoscaling behind a load balancer. |
| **Event-Driven Architecture** | Automatic triggering of goal progress, milestone unlocks, and streak increments upon creation of a new practice session document. |
| **Elasticity & Scalability** | Serverless compute scaling down to zero when idle and rapidly expanding during traffic spikes. |
| **CDN (Content Delivery Network)** | Static asset caching and edge distribution for sub-second global response times. |
| **Secrets Management** | API credentials and cloud keys decoupled via `.env` environment variables and never checked into source control. |

---

## 6. System Architecture

```
[ Web / Mobile Clients ]
           │
           ▼ (HTTPS / TLS 1.3)
   [ CDN Edge Caching ]
           │
           ▼
 [ Frontend SPA (React + Vite) ]
           │
           ▼ (REST API Calls with Bearer Token)
   [ Cloud Backend / API Layer (Express / Node.js) ]
     ├── Authentication Service (Token Verification)
     ├── Business Logic (Streak Engine, Goal Calculations)
     └── Media Validation (MIME type & Size Checks)
           │
   ┌───────┴────────────────────────┬────────────────────────┐
   ▼                                ▼                        ▼
[ Cloud Firestore DB ]    [ Cloud Object Storage ]    [ Analytics Engine ]
 (Structured Documents:    (Binary Media:              (Aggregated Metrics &
  Users, Skills, Posts)     Profile & Post Images)      Audit Reporting)
```

---

## 7. Cloud Database Design (Firestore)

### Text ER Diagram & Collection Model

```
USERS (Collection: /users/{uid})
  ├── user_id (PK, string)
  ├── name (string)
  ├── username (string, unique)
  ├── email (string, unique)
  ├── profile_picture (string, URL)
  ├── bio (string)
  ├── interests (array of strings)
  └── created_at (timestamp)
        │
        ├── SKILLS (Subcollection: /users/{uid}/skills/{skillId})
        │     ├── skill_id (PK, string)
        │     ├── user_id (FK, string)
        │     ├── skill_name (string)
        │     ├── category (string)
        │     ├── current_level (BEGINNER | INTERMEDIATE | ADVANCED)
        │     ├── target_level (BEGINNER | INTERMEDIATE | ADVANCED)
        │     ├── start_date (date)
        │     └── status (ACTIVE | PAUSED | COMPLETED)
        │
        ├── GOALS (Subcollection: /users/{uid}/goals/{goalId})
        │     ├── goal_id (PK, string)
        │     ├── skill_id (FK, string)
        │     ├── title (string)
        │     ├── target_value (number)
        │     ├── current_value (number)
        │     ├── unit (string: 'hours' | 'sessions')
        │     └── status (IN_PROGRESS | COMPLETED)
        │
        ├── MILESTONES (Subcollection: /users/{uid}/milestones/{milestoneId})
        │     ├── milestone_id (PK, string)
        │     ├── goal_id (FK, string)
        │     ├── title (string)
        │     ├── target_value (number)
        │     ├── achieved (boolean)
        │     └── achieved_at (timestamp)
        │
        └── PRACTICE_SESSIONS (Subcollection: /users/{uid}/practiceSessions/{sessionId})
              ├── session_id (PK, string)
              ├── skill_id (FK, string)
              ├── duration_minutes (number)
              ├── activity (string)
              ├── notes (string)
              └── practiced_at (date string: YYYY-MM-DD)

POSTS (Root Collection: /posts/{postId})
  ├── post_id (PK, string)
  ├── user_id (FK, string)
  ├── author_name (string)
  ├── author_username (string)
  ├── content (string)
  ├── media_url (string, optional)
  ├── milestone (string, optional)
  ├── likes_count (number)
  ├── comments_count (number)
  ├── created_at (timestamp)
  │
  ├── LIKES (Subcollection: /posts/{postId}/likes/{uid})
  │     └── liked_at (timestamp)
  │
  └── COMMENTS (Subcollection: /posts/{postId}/comments/{commentId})
        ├── comment_id (PK, string)
        ├── user_id (FK, string)
        ├── author_name (string)
        ├── text (string)
        └── created_at (timestamp)
```

---

## 8. Streak & Progress Calculation Engine

### Streak Logic
- A practice day is credited **once per calendar date** (YYYY-MM-DD).
- Multiple practice sessions logged on the same calendar day **do not** increase the streak multiple times.
- If the last recorded practice was **today** or **yesterday**, the streak remains active.
- If more than 1 day is missed, the active streak resets to 1 upon the next practice session.
- The system concurrently evaluates and records `longestStreak = Math.max(longestStreak, currentStreak)`.

### Progress Formula
$$\text{Progress \%} = \min\left(100, \left(\frac{\text{Current Value}}{\text{Target Value}}\right) \times 100\right)$$
- If the calculated progress reaches 100%, the goal is automatically marked `COMPLETED`.
- Milestones matching or falling below `Current Value` are automatically updated to `achieved: true` with an achievement timestamp.

---

## 9. REST API Specification

### Authentication
- `POST /api/register`: Creates user account; validates username and email uniqueness; returns `{ user, token }`.
- `POST /api/login`: Verifies user credentials; returns `{ user, token }`.
- `POST /api/logout`: Terminates session; returns `{ message: "Logged out successfully" }`.

### User Profile
- `GET /api/profile`: Retrieves authenticated user profile.
- `PUT /api/profile`: Updates name, bio, interests, and profile picture.
- `GET /api/users/:uid`: Retrieves public user profile.

### Skills & Hobbies
- `POST /api/skills`: Creates a skill definition.
- `GET /api/skills`: Retrieves authenticated user's skills.
- `GET /api/skills/:id`: Retrieves single skill details.
- `PUT /api/skills/:id`: Updates skill parameters (ownership verified).
- `DELETE /api/skills/:id`: Deletes skill and cascades to its goals/sessions.

### Practice Logging
- `POST /api/practice`: Logs a practice session; updates goal progress, unlocks milestones, and recalculates streak.
- `GET /api/practice`: Retrieves user's chronological practice history.
- `GET /api/skills/:id/practice`: Retrieves history filtered by specific skill.

### Goals & Milestones
- `POST /api/goals`: Defines target hours and creates milestone checkpoints.
- `GET /api/goals`: Retrieves active and completed goals with milestones.
- `PUT /api/goals/:id`: Modifies goal parameters.
- `DELETE /api/goals/:id`: Removes goal and related milestones.

### Community & Social
- `POST /api/posts`: Publishes a post with optional milestone tag and image URL.
- `GET /api/feed`: Retrieves paginated community feed with category filter, search, and sorting.
- `DELETE /api/posts/:id`: Deletes post (author-only authorization).
- `POST /api/posts/:id/like`: Toggles like; prevents duplicate likes.
- `POST /api/posts/:id/comments`: Adds comment to post.
- `GET /api/posts/:id/comments`: Retrieves comments for post.
- `DELETE /api/posts/:id/comments/:commentId`: Deletes comment (author-only).

### Cloud Object Storage
- `POST /api/files/upload`: Validates image format (JPEG/PNG/WEBP) and size (max 5MB); stores file and returns cloud URL.

### Cloud Analytics
- `GET /api/analytics/dashboard`: Computes aggregated metrics (Total hours, Weekly trend, Badges, Category distribution).

---

## 10. Security & Authorization

1. **User Data Isolation**:
   All private documents (`/users/{uid}/*`) require `request.auth.uid == userId`. Users cannot query, edit, or delete another user's practice logs or skills.
2. **Social Content Protection**:
   Community posts can be read by authenticated users, but update and deletion require `resource.data.user_id == request.auth.uid`.
3. **Duplicate Like Prevention**:
   Likes are indexed as `/posts/{postId}/likes/{userId}`. Because the document ID is the user's UID, race conditions and duplicate likes are impossible.
4. **Cloud Storage Validation**:
   Uploads are restricted to authenticated users with MIME-type matching `image/*` and file size under 5MB. Executable files (`.exe`, `.sh`, `.js`) are strictly rejected.

---

## 11. Local Setup & Execution Guide

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(No cloud keys are required for local development; the application includes local simulation with persistent storage).*

### Step 3: Run the Full-Stack Application
```bash
npm run dev
```
The application will be running at `http://localhost:3000`.

### Step 4: Run Automated Tests
```bash
npm test
```
Executes the comprehensive test suite covering registration, authentication, streak math, goal progress calculation, duplicate like prevention, and data isolation.

### Step 5: Build for Production
```bash
npm run build
```

---

## 12. Cloud Deployment to Firebase

### Step 1: Install Firebase CLI & Authenticate
```bash
npm install -g firebase-tools
firebase login
```

### Step 2: Initialize Firebase in Project Directory
```bash
firebase init
```
Select:
- `Hosting`: Configure files for Firebase Hosting
- `Firestore`: Configure rules and indexes
- `Storage`: Configure Cloud Storage security rules

When prompted for the public directory, specify:
```
dist
```
Configure as a single-page app: `Yes`.

### Step 3: Build & Deploy
```bash
npm run build
firebase deploy
```
Firebase will deploy the static build, deploy `firestore.rules`, and deploy `storage.rules`, returning your live production URL:
`https://<your-project-id>.web.app`

---

## 13. Scaling Strategy: 10 to 100,000 Users

- **10 to 1,000 Users**:
  Single-region Firestore with automatic sharding. Static files served via CDN.
- **100,000 Users**:
  - Stateless compute instances autoscaled horizontally behind a Cloud Load Balancer.
  - Read-heavy community feeds cached via Redis / Memcached.
  - Multi-region Firestore replication with read replicas.
  - Cloud Functions processing notification queues asynchronously via Cloud Pub/Sub.
- **Fan-out on Read vs. Fan-out on Write**:
  - *Fan-out on Read* (Used in this MVP): When the user loads the feed, a query fetches recent posts from followed skills/users. Low write cost, optimal for systems with moderate followers.
  - *Fan-out on Write* (Enterprise scale): When a creator posts, a background worker pushes a pointer into each follower's pre-computed feed inbox. Extremely fast feed reads at the expense of higher write operations.

---

## 14. Viva & Interview Preparation (Top 10 Q&A)

### Q1: Explain your project.
**Answer**: I developed the *Online Hobby & Skills Tracker with Community Sharing on Cloud*. It is a full-stack cloud application where users track deliberate practice across hobbies, set measurable goals, maintain consecutive practice streaks, upload achievement proof to cloud object storage, and share milestones with a community feed where peers can like and comment. The project demonstrates cloud databases (Firestore), cloud object storage (Firebase Storage), managed authentication, stateless REST APIs, and automated progress analytics.

### Q2: Why did you use cloud computing for this project?
**Answer**: Cloud computing provides centralized data persistence, cross-device accessibility, and elastic scalability. Instead of saving data locally on a single machine, storing user records in a managed cloud database and files in object storage ensures learners can record practice on mobile or desktop without data loss. It also allows seamless community collaboration.

### Q3: What is the difference between a cloud database and cloud object storage in your architecture?
**Answer**: The cloud database (Firestore) is optimized for structured, queryable document records such as user profiles, skills, goals, practice timestamps, likes, and comments. Cloud object storage is designed for unstructured binary files like profile pictures and achievement certificates. Storing large images inside a database degrades performance and incurs excessive query costs; instead, we store the file in object storage and keep only its URI reference in the database.

### Q4: How does your streak calculation system work?
**Answer**: The streak engine calculates consecutive calendar dates (YYYY-MM-DD). When a user logs practice, it evaluates whether they practiced today or yesterday. If so, it counts back consecutive days to compute the current streak. Multiple practice sessions on the same date count only once towards the streak, and missing a calendar day resets the active streak to 1 upon the next log.

### Q5: How do you prevent duplicate likes in your social database?
**Answer**: In Firestore, likes are stored in a dedicated subcollection under the post: `/posts/{postId}/likes/{userId}`. Because the document key is the unique `userId`, a user cannot like a post multiple times. A second like request from the same user toggles the like to an 'unlike' action and decrements the like count atomically.

### Q6: How do you enforce data isolation between different users?
**Answer**: Through backend authorization checks and Firestore security rules. Every private collection path contains the user's UID (`/users/{uid}/...`). Rules mandate `request.auth.uid == userId`. Even if an authenticated user attempts to make an API request with another user's ID, the server rejects the request with HTTP 403 Forbidden.

### Q7: What happens if an image upload succeeds but the database write fails?
**Answer**: In a cloud architecture, this is handled through cleanup or compensating transactions. In our frontend service, the file upload returns the object storage URL first; if the subsequent post creation API fails, a catch block triggers a delete request on the orphaned storage object to prevent storage leaks.

### Q8: What is the difference between SaaS, PaaS, and IaaS in this project?
**Answer**: 
- **IaaS (Infrastructure as a Service)**: Raw virtual machines or compute disks (e.g. AWS EC2, GCP Compute Engine).
- **PaaS (Platform as a Service)**: The runtime platform used here (Firebase Hosting, Cloud Firestore, Cloud Functions) which manages OS patching, scaling, and networking automatically.
- **SaaS (Software as a Service)**: The finished application itself, consumed as software directly by end users over the internet.

### Q9: How does the goal progress calculation work?
**Answer**: When a practice session is logged, the backend aggregates all practice minutes for that skill. It calculates progress using: `(Current Value / Target Value) * 100`, capping the displayed result at 100%. If progress reaches 100%, the goal status transitions to `COMPLETED` and any intermediate milestones that were surpassed are marked `achieved: true`.

### Q10: How would you scale this application to 100,000 active users?
**Answer**: I would keep the API layer completely stateless behind an application load balancer with horizontal autoscaling. I would deploy a Redis cache cluster for hot community feed items and frequently read user profiles to reduce database read costs. Media would be served globally via a CDN. Long-running tasks like batch weekly progress recaps would run asynchronously via Cloud Functions triggered by scheduled Pub/Sub events.

---

## 15. Resume & LinkedIn Highlights

### Resume Bullet Points
- **Architected and built a cloud-backed skill tracker & community platform** using React, TypeScript, and Firebase/Express, featuring real-time streak computation, goal tracking, and social interactions.
- **Designed multi-tenant NoSQL data architecture & security rules** in Cloud Firestore, enforcing user data isolation, atomic duplicate-like prevention, and RBAC authorization across private collections.
- **Engineered a cloud object storage pipeline** with client-side image optimization, MIME-type validation, and strict file-size limits (<5MB) for user media and milestone proof.
- **Formulated deterministic habit analytics and automated progress calculation**, processing consecutive calendar day streaks, milestone threshold detection, and multi-chart visualizations.

### 2-Line Project Summary
*Online Hobby & Skills Tracker on Cloud is a full-stack cloud application featuring automated streak tracking, quantifiable skill goals, secure cloud object storage for achievement proof, and an interactive community feed.*

---

## 16. Author & Academic Information
- **Course**: Cloud Computing Laboratory
- **Repository Name**: `Cloud-Hobby-Skills-Tracker`
- **Topics**: `cloud-computing`, `skill-tracker`, `community-platform`, `react`, `typescript`, `cloud-storage`, `cloud-database`, `rest-api`
