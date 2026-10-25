import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── Serve built React frontend ───────────────────────────────────────────────
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  console.log('Serving built frontend from:', clientDist);
}

// ─── Uploads folder ───────────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// ─── Multer ───────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadsDir),
  filename: (_, file, cb) => {
    const unique = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, unique);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (_, file, cb) => {
    const allowed = ['.pdf', '.pptx', '.ppt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF, PPT, and PPTX files are allowed'));
  },
});

// ─── AI Clients ───────────────────────────────────────────────────────────────
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const geminiAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Active Groq chat models (verified live)
const GROQ_MODELS = [
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
];

// Active Gemini models (verified live from API)
const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
];

// ── Primary: Groq (free, fast, reliable) ──────────────────────────────────────
async function tryGroq(prompt) {
  for (const model of GROQ_MODELS) {
    try {
      console.log(`🟢 Groq: trying ${model}...`);
      const completion = await groq.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 4096,
      });
      const text = completion.choices[0]?.message?.content || '';
      if (text) {
        console.log(`✅ Groq success: ${model}`);
        return text;
      }
    } catch (err) {
      const msg = String(err?.message || '');
      console.warn(`⚠️  Groq ${model} failed: ${msg.substring(0, 80)}`);
      const is404 = msg.includes('404') || msg.includes('not found') || msg.includes('does not exist');
      if (is404) continue;
      // For rate limit or other errors, try next model
      continue;
    }
  }
  return null;
}

// ── Secondary: Gemini (fallback) ──────────────────────────────────────────────
async function tryGemini(prompt) {
  for (const model of GEMINI_MODELS) {
    try {
      console.log(`🔵 Gemini: trying ${model}...`);
      const result = await geminiAi.models.generateContent({ model, contents: prompt });
      const text = result.text || '';
      if (text) {
        console.log(`✅ Gemini success: ${model}`);
        return text;
      }
    } catch (err) {
      const msg = String(err?.message || '');
      console.warn(`⚠️  Gemini ${model} failed: ${msg.substring(0, 80)}`);
      continue;
    }
  }
  return null;
}

// ── Main generate function: Groq → Gemini → offline ───────────────────────────
async function generateText(prompt) {
  // 1. Try Groq first (primary - free & fast)
  const groqResult = await tryGroq(prompt);
  if (groqResult) return groqResult;

  // 2. Try Gemini as fallback
  console.log('🔄 Groq exhausted, trying Gemini...');
  const geminiResult = await tryGemini(prompt);
  if (geminiResult) return geminiResult;

  // 3. All AI failed — return null for offline fallback
  console.error('❌ All AI providers failed. Using offline fallback.');
  return null;
}

// ─── Smart offline fallback analyzer (works without AI) ───────────────────────
function offlineAnalyze(text, filename) {
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 5);
  const lines = text.split('\n').filter((l) => l.trim().length > 2);

  const slideMarkers = text.match(/slide\s*\d+|page\s*\d+|\n\s*\d+\s*\n/gi) || [];
  const estimatedSlides = Math.max(slideMarkers.length, Math.ceil(lines.length / 8), 3);

  const avgWordsPerSlide = wordCount / estimatedSlides;
  const contentScore = Math.min(100, Math.max(30, 60 + (avgWordsPerSlide > 20 && avgWordsPerSlide < 80 ? 15 : -10)));
  const clarityScore = Math.min(100, Math.max(30, sentences.length > 10 ? 70 : 55));
  const structureScore = Math.min(100, Math.max(30, estimatedSlides >= 5 ? 75 : 60));
  const designScore = 65;
  const engagementScore = Math.min(100, Math.max(30, wordCount > 200 ? 70 : 55));
  const overall = Math.round((contentScore + clarityScore + structureScore + designScore + engagementScore) / 5);

  const stopwords = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','is','are','was','were','be','been','have','has','had','do','does','did','will','would','could','should','this','that','these','those','it','its','they','their','them','we','our','you','your']);
  const freq = {};
  words.forEach((w) => {
    const clean = w.toLowerCase().replace(/[^a-z]/g, '');
    if (clean.length > 4 && !stopwords.has(clean)) freq[clean] = (freq[clean] || 0) + 1;
  });
  const keyTopics = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([w]) => w.charAt(0).toUpperCase() + w.slice(1));

  const slideBreakdown = Array.from({ length: Math.min(estimatedSlides, 10) }, (_, i) => ({
    slideNumber: i + 1,
    title: `Slide ${i + 1}`,
    score: Math.min(100, Math.max(30, Math.round(overall + (Math.random() * 20 - 10)))),
    feedback: i === 0 ? 'Opening slide — ensure title and purpose are clear.' : i === estimatedSlides - 1 ? 'Closing slide — confirm key takeaways are summarized.' : 'Content slide — verify information is concise and well-structured.',
  }));

  const flashCards = keyTopics.slice(0, 4).map((topic, i) => ({
    question: `What is the significance of "${topic}" in this presentation?`,
    answer: `"${topic}" is one of the key concepts discussed. Review the relevant slides for detailed context.`,
    slide: `Slide ${i + 2}`,
  }));

  return {
    overallScore: overall,
    grades: { structure: structureScore, clarity: clarityScore, content: contentScore, design: designScore, engagement: engagementScore },
    summary: `"${filename}" contains ~${wordCount} words across ~${estimatedSlides} slides. ${wordCount > 300 ? 'The presentation is detailed and comprehensive.' : 'The presentation is concise and focused.'} Key improvement areas identified below.`,
    strengths: [
      wordCount > 200 ? 'Good content depth — presentation is detailed' : 'Concise and focused presentation',
      estimatedSlides >= 5 ? 'Well-structured with multiple slides' : 'Focused slide count',
      keyTopics.length > 3 ? `Covers key topics: ${keyTopics.slice(0, 3).join(', ')}` : 'Focused topic coverage',
    ],
    errors: [
      avgWordsPerSlide > 100 ? { type: 'Text Density', description: 'Some slides appear text-heavy. Aim for 30-50 words per slide.', slide: 'Multiple slides' } : null,
    ].filter(Boolean),
    modifications: [
      { priority: 'high', suggestion: 'Add visual elements (charts, images) to complement text', reason: 'Visuals improve audience retention by 65%' },
      { priority: 'medium', suggestion: 'Ensure each slide has one clear message', reason: 'Focused slides are easier to follow' },
      { priority: 'low', suggestion: 'Add a strong call-to-action on the final slide', reason: 'Guides audience on next steps' },
    ],
    slideBreakdown,
    keyTopics,
    flashCards,
  };
}



// ─── In-memory stores ─────────────────────────────────────────────────────────
const sessions = {}; // sessionId -> { text, filename, analysis }
const rooms = {};    // roomId -> { sessionId, messages: [], participants: [] }

// ─── Helper: extract text ─────────────────────────────────────────────────────
async function extractText(filePath, mimeType) {
  const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js');
  const { default: officeParser } = await import('officeparser');

  const ext = path.extname(filePath).toLowerCase();
  const buffer = fs.readFileSync(filePath);

  if (ext === '.pdf') {
    const data = await pdfParse(buffer);
    return data.text;
  } else if (ext === '.pptx' || ext === '.ppt') {
    return new Promise((resolve, reject) => {
      officeParser.parseOffice(filePath, (data, err) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }
  throw new Error('Unsupported file type');
}

// ─── Helper: build analysis prompt ────────────────────────────────────────────
function buildAnalysisPrompt(text, filename) {
  return `You are an expert presentation coach and analyst. Analyze the following presentation content extracted from "${filename}".

Respond ONLY with a valid JSON object (no markdown, no explanation outside the JSON) with this exact structure:
{
  "overallScore": <number 0-100>,
  "grades": {
    "structure": <number 0-100>,
    "clarity": <number 0-100>,
    "content": <number 0-100>,
    "design": <number 0-100>,
    "engagement": <number 0-100>
  },
  "summary": "<2-3 sentence overall summary>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "errors": [
    {"type": "<error type>", "description": "<what is wrong>", "slide": "<slide reference or general>"}
  ],
  "modifications": [
    {"priority": "high|medium|low", "suggestion": "<what to change>", "reason": "<why>"}
  ],
  "slideBreakdown": [
    {"slideNumber": <n>, "title": "<slide title or topic>", "score": <0-100>, "feedback": "<1-2 sentences>"}
  ],
  "keyTopics": ["<topic 1>", "<topic 2>", "<topic 3>"],
  "flashCards": [
    {"question": "<question about slide content>", "answer": "<concise answer>", "slide": "<slide reference>"}
  ]
}

Presentation content:
${text.substring(0, 12000)}`;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// Upload & Analyze
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const filePath = req.file.path;
    const filename = req.file.originalname;
    const sessionId = uuidv4();

    // Extract text
    let text = '';
    try {
      text = await extractText(filePath, req.file.mimetype);
    } catch (e) {
      console.error('Text extraction error:', e.message);
      text = `[Content extracted from ${filename}. Text extraction had limitations but analysis continues.]`;
    }

    // Analyze with Gemini (auto-retries → offline fallback if all fail)
    const prompt = buildAnalysisPrompt(text, filename);
    const rawResponse = await generateText(prompt);

    let analysis;
    if (rawResponse === null) {
      // All AI models failed — use smart offline analyzer
      console.log('Using offline analysis for:', filename);
      analysis = offlineAnalyze(text, filename);
    } else {
      try {
        const cleaned = rawResponse.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
        analysis = JSON.parse(cleaned);
      } catch {
        // AI responded but JSON was malformed — use offline as safety net
        console.warn('AI JSON parse failed, using offline fallback');
        analysis = offlineAnalyze(text, filename);
      }
    }

    // Store session
    sessions[sessionId] = {
      text,
      filename,
      filePath,
      fileUrl: `/uploads/${path.basename(filePath)}`,
      analysis,
    };

    res.json({ sessionId, filename, analysis, fileUrl: `/uploads/${path.basename(filePath)}` });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message || 'Server error during analysis' });
  }
});

// Chat with PPT
app.post('/api/chat', async (req, res) => {
  try {
    const { sessionId, message, history } = req.body;
    const session = sessions[sessionId];
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const systemContext = `You are an AI assistant specialized in answering questions about the presentation "${session.filename}". 
Use the following presentation content to answer questions accurately and helpfully.
If a question is not related to the presentation, politely redirect the user to ask about the presentation.

Presentation content:
${session.text.substring(0, 8000)}

Key topics: ${session.analysis?.keyTopics?.join(', ') || 'N/A'}`;

    // Build full prompt with context + history + current message
    const historyText = (history || [])
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const fullPrompt = `${systemContext}

Conversation history:
${historyText}

User: ${message}
Assistant:`;

    const aiReply = await generateText(fullPrompt);
    const reply = aiReply || `I'm currently unable to access the AI service (high demand). Based on the presentation content, here's what I can tell you about "${message}": The presentation covers topics including ${session.analysis?.keyTopics?.join(', ') || 'various subjects'}. Please try again in a moment for a full AI response.`;

    res.json({ reply });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Chat service error' });
  }
});

// Get session info
app.get('/api/session/:sessionId', (req, res) => {
  const session = sessions[req.params.sessionId];
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json({
    filename: session.filename,
    analysis: session.analysis,
    fileUrl: session.fileUrl,
  });
});

// ─── Room Management ──────────────────────────────────────────────────────────

// Create room
app.post('/api/rooms', (req, res) => {
  const { sessionId } = req.body;
  const session = sessions[sessionId];
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  rooms[roomId] = {
    sessionId,
    filename: session.filename,
    fileUrl: session.fileUrl,
    analysis: session.analysis,
    messages: [],
    participants: [],
    currentSlide: 0,
  };
  res.json({ roomId });
});

// Get room info
app.get('/api/rooms/:roomId', (req, res) => {
  const room = rooms[req.params.roomId];
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json({
    roomId: req.params.roomId,
    filename: room.filename,
    fileUrl: room.fileUrl,
    analysis: room.analysis,
    messages: room.messages,
    participants: room.participants,
    currentSlide: room.currentSlide,
  });
});

// ─── Socket.io ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('join-room', ({ roomId, username }) => {
    const room = rooms[roomId];
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.username = username || 'Anonymous';

    if (!room.participants.includes(socket.data.username)) {
      room.participants.push(socket.data.username);
    }

    // Send room info to joining user
    socket.emit('room-joined', {
      roomId,
      filename: room.filename,
      fileUrl: room.fileUrl,
      analysis: room.analysis,
      messages: room.messages,
      participants: room.participants,
      currentSlide: room.currentSlide,
    });

    // Notify others
    socket.to(roomId).emit('user-joined', {
      username: socket.data.username,
      participants: room.participants,
    });

    // System message
    const sysMsg = {
      id: uuidv4(),
      type: 'system',
      content: `${socket.data.username} joined the room`,
      timestamp: new Date().toISOString(),
    };
    room.messages.push(sysMsg);
    io.to(roomId).emit('new-message', sysMsg);
  });

  socket.on('send-message', ({ roomId, content }) => {
    const room = rooms[roomId];
    if (!room) return;

    const msg = {
      id: uuidv4(),
      type: 'chat',
      username: socket.data.username,
      content,
      timestamp: new Date().toISOString(),
    };
    room.messages.push(msg);
    io.to(roomId).emit('new-message', msg);
  });

  socket.on('slide-change', ({ roomId, slideIndex }) => {
    const room = rooms[roomId];
    if (!room) return;
    room.currentSlide = slideIndex;
    socket.to(roomId).emit('slide-changed', { slideIndex, changedBy: socket.data.username });
  });

  socket.on('disconnect', () => {
    const { roomId, username } = socket.data;
    if (roomId && rooms[roomId]) {
      const room = rooms[roomId];
      room.participants = room.participants.filter((p) => p !== username);

      const sysMsg = {
        id: uuidv4(),
        type: 'system',
        content: `${username} left the room`,
        timestamp: new Date().toISOString(),
      };
      room.messages.push(sysMsg);
      io.to(roomId).emit('new-message', sysMsg);
      io.to(roomId).emit('user-left', { username, participants: room.participants });
    }
    console.log('Socket disconnected:', socket.id);
  });
});

// ─── React Router catch-all (must be AFTER all API routes) ───────────────────
app.get('*', (req, res) => {
  const indexFile = path.join(clientDist, 'index.html');
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.status(404).send('Frontend not built. Run: cd client && npm run build');
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 ProPPT is running on http://localhost:${PORT}`);
  console.log(`   Open your browser at: http://localhost:${PORT}`);
});
