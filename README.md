# Firmtalks

A firmware analysis and discussion platform with secure authentication, real-time interactions, and malware detection. Built for developers and security researchers to collaborate on firmware insights.

---

## Features

### 1. Secure Authentication
- **OAuth 2.0 & JWT** via **Clerk** for streamlined user sign-up/sign-in.
- **Cloudflare Captcha** integration to prevent DDoS and bot attacks.
- Session management with token revocation and role-based access control.

### 2. User Profile Management
- Update **username**, **email**, and **profile picture** via validated forms.
- Client-side validation (React) and server-side checks (Express.js) with MongoDB updates.

### 3. Firmware Analysis
- **Binwalk** (Python script) extracts firmware binaries via Flask API endpoints.
- Hybrid malware detection: **AI model** (TensorFlow/PyTorch) + **VirusTotal API** scans.
- Results stored in MongoDB with user-specific history.

### 4. Real-Time Discussions
- **Socket.io** enables instant CRUD operations on discussions/replies.
- Server-side pagination (Express.js) and sorting by **recency** or **likes**.
- Markdown support (ReactMarkdown library) for rich text formatting.

### 5. User Statistics
- Track **likes received**, **discussions created**, **malware scans**, and **replies**.
- Reputation system based on activity quality (MongoDB aggregations).

### 6. CRUD Operations
- Users create/update/delete discussions and replies in real time.
- Authorization middleware (Express.js) ensures ownership checks.

### 7. Real-Time Notifications
- Instant alerts via **Socket.io** for replies, likes, or mentions.
- **Clerk webhooks** trigger email/SMS notifications for critical updates.

### 8. Code Quality & Architecture
- **ESLint** (React/Node.js) and **PEP-8** (Python) enforced.
- Modular design: MVC pattern, repository layer, and factory methods.

### 9. Security Measures
- XSS prevention: Input sanitization (DOMPurify) and Markdown whitelisting.
- CSRF tokens in Axios requests and CORS policies for API endpoints (Flask/Express).

### 10. Bookmarks
- Save discussions to MongoDB with user-specific references.
- Fetch/delete bookmarks via authenticated API endpoints.

---

## Technologies Used
- **Frontend**: React, Socket.io Client, Axios, ReactMarkdown  
- **Backend**: Node.js, Express.js, MongoDB, Socket.io  
- **Auth**: Clerk, Cloudflare Captcha  
- **Firmware Analysis**: Python, Flask, Binwalk, VirusTotal API  
- **Tools**: ESLint, PEP-8, JWT, Docker (optional)


```plaintext
FIRMTALKS/
│-- node_modules/
│-- public/
│   ├── firmtalks.svg
│-- server/
│   ├── models/
│   │   ├── discussionModel.js
│   │   ├── likeModel.js
│   │   ├── replyModel.js
│   │   ├── userModel.js
│   ├── routes/
│   │   ├── discussionRoutes.js
│   ├── socket/
│   │   ├── handler.js
│   ├── .env
│   ├── db.js
│   ├── index.js
│-- src/
│   ├── assets/
│   │   ├── firmtalks.svg
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── dashboard-charts.jsx
│   │   │   ├── dashboard-stats.jsx
│   │   ├── discussions/
│   │   │   ├── discussion-form.jsx
│   │   ├── layout/
│   │   │   ├── navbar.jsx
│   │   │   ├── theme-toggle.jsx
│   │   ├── ui/
│   │   │   ├── button.jsx
│   ├── lib/
│   │   ├── theme.js
│   │   ├── utils.js
│   ├── pages/
│   │   ├── discussionsPage.jsx
│   │   ├── malwareScannerPage.jsx
│   │   ├── platformStatisticsPage.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── main.jsx
│-- .env
│-- .gitignore
│-- eslint.config.js
│-- index.html
│-- package-lock.json
│-- package.json
│-- postcss.config.js
│-- README.md
│-- tailwind.config.js
│-- vite.config.js
```
