import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Send, Bot, User, ChevronLeft, BarChart3, Zap, Loader2, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id: string;
}

const SUGGESTED_QUESTIONS = [
  'What are the main topics covered?',
  'What are the key takeaways?',
  'Which slide needs the most improvement?',
  'Summarize slide 2',
  'What data or statistics are mentioned?',
  'How can I improve the introduction?',
];

export default function ChatbotPage() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const filename = location.state?.filename || 'Presentation';
  const analysis = location.state?.analysis;

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      id: 'init',
      content: `👋 Hi! I've analyzed **${filename}** for you. I'm ready to answer any questions about your presentation. You can ask me about specific slides, topics, improvements, or anything else!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: 'user', id: Date.now().toString(), content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const { data } = await axios.post('/api/chat', {
        sessionId,
        message: text,
        history,
      });

      const aiMsg: Message = {
        role: 'assistant',
        id: `ai-${Date.now()}`,
        content: data.reply,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', id: `err-${Date.now()}`, content: 'Sorry, I had trouble processing that. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatMessage = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800/60 px-6 py-4 flex items-center justify-between glass sticky top-0 z-10">
        <button onClick={() => navigate(`/dashboard/${sessionId}`, { state: { filename, analysis } })} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
          <ChevronLeft className="w-4 h-4" />
          Dashboard
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">PPT Assistant</p>
            <p className="text-green-400 text-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
              Ready · {filename}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/dashboard/${sessionId}`, { state: { filename, analysis } })} className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all" title="Dashboard">
            <BarChart3 className="w-4 h-4" />
          </button>
          <button onClick={() => navigate(`/flash/${sessionId}`, { state: { filename, analysis } })} className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all" title="Flash cards">
            <Zap className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl w-full mx-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 mb-6 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div
              className={`max-w-[75%] px-5 py-3.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'chat-bubble-user text-white rounded-br-sm'
                  : 'chat-bubble-ai text-slate-200 rounded-bl-sm'
              }`}
              dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
            />
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4 text-slate-300" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="chat-bubble-ai px-5 py-3.5 rounded-2xl rounded-bl-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
              <span className="text-slate-400 text-sm">Thinking…</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-4 max-w-4xl w-full mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <p className="text-slate-400 text-xs">Suggested questions</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500/40 text-slate-300 hover:text-white px-3 py-2 rounded-xl transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-slate-800/60 px-4 py-4 glass">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            placeholder="Ask anything about your presentation…"
            className="flex-1 bg-slate-800/80 border border-slate-700 focus:border-indigo-500/60 rounded-2xl px-5 py-3 text-white placeholder-slate-500 outline-none text-sm transition-all"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-40 text-white rounded-2xl flex items-center justify-center transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
