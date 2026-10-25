import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from 'recharts';
import {
  MessageSquare, Zap, Users, ChevronLeft, TrendingUp, AlertTriangle,
  CheckCircle, ArrowRight, Lightbulb, Star, Target, BarChart3
} from 'lucide-react';

interface Analysis {
  overallScore: number;
  grades: { structure: number; clarity: number; content: number; design: number; engagement: number };
  summary: string;
  strengths: string[];
  errors: { type: string; description: string; slide: string }[];
  modifications: { priority: string; suggestion: string; reason: string }[];
  slideBreakdown: { slideNumber: number; title: string; score: number; feedback: string }[];
  keyTopics: string[];
  flashCards: { question: string; answer: string; slide: string }[];
}

function ScoreRing({ score, size = 140 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#6366f1' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <svg width={size} height={size} className="score-ring drop-shadow-lg">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1e293b" strokeWidth="10" />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text x={size / 2} y={size / 2 + 6} textAnchor="middle" fill="white" fontSize="22" fontWeight="bold" transform={`rotate(90, ${size / 2}, ${size / 2})`}>
        {score}%
      </text>
    </svg>
  );
}

export default function DashboardPage() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<Analysis | null>(location.state?.analysis || null);
  const [filename, setFilename] = useState<string>(location.state?.filename || '');
  const [loading, setLoading] = useState(!analysis);
  const [activeTab, setActiveTab] = useState<'overview' | 'slides' | 'errors' | 'improvements'>('overview');

  useEffect(() => {
    if (!analysis && sessionId) {
      axios.get(`/api/session/${sessionId}`).then(({ data }) => {
        setAnalysis(data.analysis);
        setFilename(data.filename);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  if (loading || !analysis) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading analysis…</p>
        </div>
      </div>
    );
  }

  const gradeData = Object.entries(analysis.grades).map(([key, val]) => ({
    subject: key.charAt(0).toUpperCase() + key.slice(1),
    score: val,
  }));

  const barData = analysis.slideBreakdown.slice(0, 10).map((s) => ({
    name: `S${s.slideNumber}`,
    score: s.score,
  }));

  const priorityColor = { high: 'text-red-400 bg-red-500/10 border-red-500/30', medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', low: 'text-green-400 bg-green-500/10 border-green-500/30' };

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Header */}
      <header className="border-b border-slate-800/60 px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate('/upload')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
          <ChevronLeft className="w-4 h-4" />
          New Upload
        </button>
        <div className="flex-1 text-center">
          <span className="text-white font-semibold text-sm">{filename}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/chat/${sessionId}`, { state: { filename, analysis } })}
            className="flex items-center gap-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 px-4 py-2 rounded-xl text-sm transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            Chatbot
          </button>
          <button
            onClick={() => navigate(`/flash/${sessionId}`, { state: { filename, analysis } })}
            className="flex items-center gap-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-300 px-4 py-2 rounded-xl text-sm transition-all"
          >
            <Zap className="w-4 h-4" />
            Flash
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Score overview */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Main score */}
          <div className="glass rounded-3xl p-8 flex flex-col items-center justify-center text-center col-span-1">
            <p className="text-slate-400 text-sm mb-4">Overall Score</p>
            <ScoreRing score={analysis.overallScore} size={160} />
            <p className="text-slate-300 mt-4 text-sm font-medium">
              {analysis.overallScore >= 80 ? '🌟 Excellent!' : analysis.overallScore >= 60 ? '👍 Good' : analysis.overallScore >= 40 ? '⚠️ Needs Work' : '🔴 Poor'}
            </p>
          </div>

          {/* Grade cards */}
          {Object.entries(analysis.grades).map(([key, val]) => (
            <div key={key} className="glass rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400 text-sm capitalize">{key}</span>
                <span className="text-white font-bold">{val}%</span>
              </div>
              <div className="bg-slate-700/50 rounded-full h-2">
                <div
                  className={`h-full rounded-full transition-all ${val >= 80 ? 'bg-green-500' : val >= 60 ? 'bg-indigo-500' : val >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${val}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Summary & quick stats */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="glass rounded-2xl p-6 lg:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <h3 className="text-white font-semibold">AI Summary</h3>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{analysis.summary}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {analysis.keyTopics.map((t, i) => (
                <span key={i} className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-300 text-xs">{t}</span>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-yellow-400" />
              <h3 className="text-white font-semibold">Strengths</h3>
            </div>
            <ul className="space-y-2">
              {analysis.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-800/60 p-1 rounded-2xl mb-6 w-fit">
          {(['overview', 'slides', 'errors', 'improvements'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Radar chart */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-400" />
                Performance Radar
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={gradeData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Bar chart - slide scores */}
            {barData.length > 0 && (
              <div className="glass rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                  Slide Scores
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <ReBarChart data={barData} barSize={20}>
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                    />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                      {barData.map((entry, i) => (
                        <Cell key={i} fill={entry.score >= 80 ? '#10b981' : entry.score >= 60 ? '#6366f1' : entry.score >= 40 ? '#f59e0b' : '#ef4444'} />
                      ))}
                    </Bar>
                  </ReBarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {activeTab === 'slides' && (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {analysis.slideBreakdown.map((slide) => (
              <div key={slide.slideNumber} className="glass rounded-2xl p-5 slide-card transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-400 text-xs">Slide {slide.slideNumber}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${slide.score >= 80 ? 'bg-green-500/20 text-green-400' : slide.score >= 60 ? 'bg-indigo-500/20 text-indigo-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {slide.score}%
                  </span>
                </div>
                <h4 className="text-white font-medium text-sm mb-2">{slide.title}</h4>
                <p className="text-slate-400 text-xs leading-relaxed">{slide.feedback}</p>
                <div className="mt-3 bg-slate-700/50 rounded-full h-1.5">
                  <div
                    className={`h-full rounded-full ${slide.score >= 80 ? 'bg-green-500' : slide.score >= 60 ? 'bg-indigo-500' : 'bg-yellow-500'}`}
                    style={{ width: `${slide.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'errors' && (
          <div className="space-y-4">
            {analysis.errors.length === 0 ? (
              <div className="glass rounded-2xl p-10 text-center">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <p className="text-white font-semibold text-lg">No major errors found!</p>
                <p className="text-slate-400 text-sm">Your presentation looks clean.</p>
              </div>
            ) : analysis.errors.map((err, i) => (
              <div key={i} className="glass rounded-2xl p-5 border-l-4 border-red-500/60">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-red-300 font-semibold text-sm">{err.type}</span>
                      <span className="text-slate-500 text-xs">· {err.slide}</span>
                    </div>
                    <p className="text-slate-300 text-sm">{err.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'improvements' && (
          <div className="space-y-4">
            {analysis.modifications.map((mod, i) => (
              <div key={i} className={`glass rounded-2xl p-5 border ${priorityColor[mod.priority as keyof typeof priorityColor] || 'text-slate-400 bg-slate-500/10 border-slate-500/30'}`}>
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 mt-0.5 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full border ${priorityColor[mod.priority as keyof typeof priorityColor]}`}>
                        {mod.priority}
                      </span>
                    </div>
                    <p className="text-white font-medium text-sm mb-1">{mod.suggestion}</p>
                    <p className="text-slate-400 text-xs">{mod.reason}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action bar */}
        <div className="mt-10 glass rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white font-semibold">Ready to dive deeper?</p>
            <p className="text-slate-400 text-sm">Chat with AI about your presentation or review flash cards</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={async () => {
                const { data } = await axios.post('/api/rooms', { sessionId });
                navigate(`/room/${data.roomId}`, { state: { filename, analysis } });
              }}
              className="flex items-center gap-2 border border-slate-700 hover:border-indigo-500/50 text-slate-300 hover:text-white px-5 py-2.5 rounded-xl text-sm transition-all"
            >
              <Users className="w-4 h-4" />
              Create Room
            </button>
            <button
              onClick={() => navigate(`/chat/${sessionId}`, { state: { filename, analysis } })}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              Ask AI
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
