# 🚀 SocialAI - AI-Powered Social Media Management Platform

**एक Prompt से सब कुछ Auto-Generate!** ✨

> एक ही prompt लिखो और AI automatically create करेगा: Caption, Hashtags, Image, Video Script, और भी बहुत कुछ!

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Content Generator** | एक prompt से caption, hashtags, image, video script सब auto-generate |
| 🎨 **AI Image Generation** | DALL-E 3 से stunning images बनाएं |
| 🎬 **Video Script Generator** | Reels/Shorts/TikTok के लिए AI video script |
| #️⃣ **Smart Hashtags** | Trending + niche hashtags auto-generate |
| 📱 **Multi-Platform** | Instagram, Facebook, Twitter/X, LinkedIn, YouTube, TikTok |
| 📅 **Post Scheduler** | Future date/time पर post schedule करें |
| 🌐 **Multi-Language** | Hindi, Hinglish, English support |
| 🎭 **Multiple Tones** | Casual, Professional, Funny, Inspirational, Dramatic |
| 📊 **Dashboard** | Analytics और post management |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite + TailwindCSS |
| **Backend** | PHP + MySQL |
| **Database** | MySQL (with AES-256-GCM encryption) |
| **AI** | Google Gemini + OpenAI GPT-4 + DALL-E 3 |
| **Icons** | Lucide React |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ (for frontend dev server)
- **PHP 8.0+** with PDO MySQL extension
- **MySQL 5.7+** / MariaDB
- **XAMPP / WAMP / Laragon** (or any PHP web server)
- **Gemini API Key** or **OpenAI API Key** (for AI features)

### Setup

```bash
# 1. Place project in your web server root (e.g., htdocs for XAMPP)
#    Example: c:/xampp/htdocs/socialmedia-manager

# 2. Import the database schema
#    Open phpMyAdmin → Import database/schema.sql
#    Or run: mysql -u root < database/schema.sql

# 3. Configure database credentials (if needed)
#    Edit api/config/database.php or set environment variables:
#    DB_HOST, DB_NAME, DB_USER, DB_PASS

# 4. Setup Frontend
cd client
npm install

# 5. Run Frontend Dev Server
npm run dev
```

### Open in Browser
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost/socialmedia-manager/api/
- **Health Check**: http://localhost/socialmedia-manager/api/health.php
- **Demo Login**: admin@socialai.com / admin123 / OTP: 123456

---

## 📖 Usage - Kaise Use Karein

### 1. AI Content Generate Karein
```
1. Sidebar mein "AI Generate" pe click karein
2. Apna idea/prompt likhein (Hindi ya English)
3. Language, Tone, aur Platforms select karein
4. "Generate Everything" button dabayein
5. Kuch seconds mein caption, hashtags, image, aur video script ready!
```

### 2. Example Prompts
| Prompt | Output |
|--------|--------|
| "New summer collection launch 50% off" | Caption + Hashtags + Fashion Image + Reel Script |
| "Monday motivation for entrepreneurs" | Inspirational caption + Quote image + Shorts idea |
| "Best pizza in Delhi food review" | Food caption + Food image + TikTok script |

### 3. Demo Mode (Bina API Key Ke)
Agar OpenAI API key nahi hai, toh bhi platform **demo mode** mein kaam karega - mock content generate hoga.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/generate-all` | 🚀 **Main endpoint** - One prompt generates everything |
| `POST` | `/api/ai/generate-text` | Generate caption + hashtags only |
| `POST` | `/api/ai/generate-image` | Generate image only |
| `POST` | `/api/ai/generate-video` | Generate video script only |
| `GET` | `/api/posts` | Get all posts |
| `POST` | `/api/posts/:id/publish` | Publish a post |
| `GET` | `/api/health` | Health check |

---

## 📁 Project Structure

```
socialmedia-manager/
├── api/
│   ├── ai.php             # AI generation endpoints (Gemini + OpenAI)
│   ├── auth.php           # Authentication (Login/OTP/Logout)
│   ├── brand.php          # Brand/business settings CRUD
│   ├── health.php         # Health check endpoint
│   ├── posts.php          # Post CRUD + analytics + publish
│   ├── social.php         # Social accounts CRUD (AES-256 encrypted tokens)
│   ├── config/
│   │   └── database.php   # PDO MySQL connection + config
│   └── lib/
│       ├── encryption.php # AES-256-GCM encrypt/decrypt helpers
│       └── response.php   # CORS + JSON response helpers
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CustomDateTimePicker.jsx
│   │   │   ├── CustomDropdown.jsx
│   │   │   ├── PostPreview.jsx
│   │   │   └── SocialIcons.jsx
│   │   ├── pages/
│   │   │   ├── BrandSettings.jsx
│   │   │   ├── ContentGenerator.jsx  # Main AI generator UI
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── MediaLibrary.jsx
│   │   │   ├── PostManager.jsx
│   │   │   └── SocialAccounts.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── database/
│   └── schema.sql         # MySQL schema + demo data
└── README.md
```

---

## 🔧 Configuration

### API Keys (Set in Brand Settings UI or via headers)

| Key | Header | Purpose |
|-----|--------|---------|
| Gemini API Key | `X-Gemini-Key` | Text generation (Gemini 1.5 Flash) |
| OpenAI API Key | `X-OpenAI-Key` | Image generation (DALL-E 3) |

### Database (`api/config/database.php`)

```env
DB_HOST=localhost
DB_NAME=socialai
DB_USER=root
DB_PASS=
```

Environment variables ke through bhi configure kar sakte hain.

---

## 🎯 Future Enhancements

- [ ] Direct posting to Instagram/Facebook/Twitter APIs
- [ ] AI Video generation (RunwayML/Pika integration)
- [ ] Analytics dashboard with engagement tracking
- [ ] Team collaboration features
- [ ] Content calendar view
- [ ] Auto best-time-to-post suggestions
- [ ] Competitor analysis
- [ ] Multi-user authentication

---

**Made with ❤️ | Powered by AI**
