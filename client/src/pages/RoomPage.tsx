import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import {
  Send, ChevronLeft, ChevronRight, Users, Copy, Check,
  Zap, Crown
} from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'chat' | 'system';
  username?: string;
  content: string;
  timestamp: string;
}

interface SlideBreakdown {
  slideNumber: number;
  title: string;
  score: number;
  feedback: string;
}

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const [username] = useState(() => `User_${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<SlideBreakdown[]>([]);
  const [filename, setFilename] = useState('');
  const [copied, setCopied] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = io('http://localhost:5000');
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-room', { roomId, username });
    });

    socket.on('room-joined', (data) => {
      setFilename(data.filename);
      setSlides(data.analysis?.slideBreakdown || []);
      setMessages(data.messages || []);
      setParticipants(data.participants || []);
      setCurrentSlide(data.currentSlide || 0);
    });

    socket.on('new-message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('user-joined', ({ participants: p }: { username: string; participants: string[] }) => {
      setParticipants(p);
    });

    socket.on('user-left', ({ participants: p }: { username: string; participants: string[] }) => {
      setParticipants(p);
    });

    socket.on('slide-changed', ({ slideIndex }: { slideIndex: number; changedBy: string }) => {
      setCurrentSlide(slideIndex);
    });

    socket.on('error', ({ message }: { message: string }) => {
      setError(message);
    });

    socket.on('disconnect', () => setConnected(false));

    return () => { socket.disconnect(); };
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !socketRef.current) return;
    socketRef.current.emit('send-message', { roomId, content: input.trim() });
    setInput('');
  };

  const changeSlide = (index: number) => {
    setCurrentSlide(index);
    socketRef.current?.emit('slide-change', { roomId, slideIndex: index });
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="glass rounded-3xl p-10 text-center max-w-sm">
          <p className="text-red-400 font-bold text-lg mb-2">Room not found</p>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <button onClick={() => navigate('/join')} className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm">
            Join Another Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800/60 px-6 py-4 flex items-center justify-between glass">
        <button onClick={() => navigate('/upload')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
          <ChevronLeft className="w-4 h-4" />
          Exit Room
        </button>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-white font-semibold text-sm">{filename || 'Room'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl">
            <span className="text-slate-400 text-xs">Room:</span>
            <span className="text-white font-mono font-bold text-sm">{roomId}</span>
            <button onClick={copyRoomId} className="text-slate-500 hover:text-indigo-400 transition-colors ml-1">
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Users className="w-3.5 h-3.5" />
            {participants.length}
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* ── Slide panel ── */}
        <div className="flex-1 flex flex-col p-6 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              Slide Viewer · Synced
            </span>
            <span className="text-slate-500 text-xs">
              {currentSlide + 1}/{slides.length || '—'}
            </span>
          </div>

          {/* Slide */}
          {slides.length > 0 ? (
            <>
              <div className="glass rounded-3xl p-10 flex-1 flex flex-col justify-between border border-indigo-500/20 mb-4">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-400 text-xs font-mono">
                      SLIDE {slides[currentSlide]?.slideNumber}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      (slides[currentSlide]?.score || 0) >= 80 ? 'bg-green-500/20 text-green-400' :
                      (slides[currentSlide]?.score || 0) >= 60 ? 'bg-indigo-500/20 text-indigo-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {slides[currentSlide]?.score}%
                    </span>
                  </div>
                  <h2 className="text-white text-2xl font-bold mb-4">
                    {slides[currentSlide]?.title || `Slide ${slides[currentSlide]?.slideNumber}`}
                  </h2>
                  <p className="text-slate-300 leading-relaxed">{slides[currentSlide]?.feedback}</p>
                </div>
              </div>

              {/* Slide nav */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => changeSlide(Math.max(0, currentSlide - 1))}
                  disabled={currentSlide === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 rounded-xl text-sm transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </button>
                <div className="flex gap-1">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => changeSlide(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? 'bg-indigo-400 w-5' : 'bg-slate-700 hover:bg-slate-500'}`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => changeSlide(Math.min(slides.length - 1, currentSlide + 1))}
                  disabled={currentSlide === slides.length - 1}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 rounded-xl text-sm transition-all"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="glass rounded-3xl flex-1 flex items-center justify-center text-center">
              <div>
                <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-400">Waiting for presentation data…</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Chat panel ── */}
        <div className="w-80 border-l border-slate-800/60 flex flex-col">
          {/* Participants */}
          <div className="p-4 border-b border-slate-800/60">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-indigo-400" />
              <span className="text-slate-300 text-sm font-medium">Participants ({participants.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {participants.map((p, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full">
                  {i === 0 && <Crown className="w-3 h-3 text-yellow-400" />}
                  <span className="text-slate-300 text-xs">{p}</span>
                  {p === username && <span className="text-indigo-400 text-xs">(you)</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.type === 'system' ? (
                  <p className="text-center text-slate-600 text-xs py-1">{msg.content}</p>
                ) : (
                  <div className={`${msg.username === username ? 'items-end' : 'items-start'} flex flex-col`}>
                    <span className="text-slate-500 text-xs mb-1">{msg.username}</span>
                    <div className={`max-w-[90%] px-3.5 py-2.5 rounded-2xl text-sm ${
                      msg.username === username
                        ? 'chat-bubble-user text-white rounded-br-sm'
                        : 'chat-bubble-ai text-slate-200 rounded-bl-sm'
                    }`}>
                      {msg.content}
                    </div>
                    <span className="text-slate-700 text-xs mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-800/60">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Message…"
                className="flex-1 bg-slate-800 border border-slate-700 focus:border-indigo-500/60 rounded-xl px-3 py-2 text-white placeholder-slate-500 outline-none text-sm transition-all"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 disabled:opacity-40 text-white rounded-xl flex items-center justify-center shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
