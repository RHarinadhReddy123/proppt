# ProPPT — AI-Powered Presentation Platform 🚀

A full-stack web app that analyzes your PPT/PDF presentations using **Google Gemini AI**, shows you an efficiency dashboard, lets you chat with an AI about your slides, and collaborate with friends in real-time rooms.

---

## 🏗️ Project Structure

```
ProPPT/
├── server/           # Node.js + Express + Socket.io backend
│   ├── index.js      # Main server (API + WebSockets)
│   ├── .env          # ← PUT YOUR GEMINI API KEY HERE
│   └── uploads/      # Uploaded files (auto-created)
├── client/           # React + Tailwind CSS frontend
│   └── src/pages/    # All page components
├── start-server.bat  # Start backend
└── start-client.bat  # Start frontend
```

---

## ⚡ Quick Start

### Step 1: Add Your Gemini API Key

Open `server/.env` and replace the placeholder:
```env
GEMINI_API_KEY=your_actual_key_here
PORT=5000
```

Get a free key at: https://aistudio.google.com/app/apikey

### Step 2: Start the Backend
Double-click `start-server.bat` or run:
```powershell
cd server
node index.js
```

### Step 3: Start the Frontend
Double-click `start-client.bat` or run:
```powershell
cd client
npm run dev
```

### Step 4: Open the App
Visit **http://localhost:5173** in your browser.

---

## 🎯 Features

| Feature | Description |
|---|---|
| 📤 **Upload** | Drag & drop PDF, PPT, or PPTX (up to 50MB) |
| 🎯 **Mode Selection** | Choose Chatbot mode or Flash Presentation |
| 📊 **AI Dashboard** | Efficiency score, radar chart, slide breakdown |
| 🤖 **PPT Chatbot** | Ask questions about your presentation |
| ⚡ **Flash Cards** | Flip-card study mode |
| 🏠 **Collaborative Rooms** | Share a room ID, view slides together + live chat |

---

## 📄 Pages

| Route | Page |
|---|---|
| `/` | Landing page |
| `/upload` | Upload & mode selection |
| `/dashboard/:sessionId` | Analysis dashboard |
| `/chat/:sessionId` | AI chatbot |
| `/flash/:sessionId` | Flash presentation viewer |
| `/room/:roomId` | Collaborative room |
| `/join` | Join a room by ID |

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS v4, Recharts, Socket.io-client, React Dropzone, Framer Motion
- **Backend**: Node.js, Express, Socket.io, Multer, officeparser, pdf-parse
- **AI**: Google Gemini 1.5 Flash
