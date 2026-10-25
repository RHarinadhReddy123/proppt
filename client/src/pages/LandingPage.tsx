import { useNavigate } from 'react-router-dom';
import { Presentation, Zap, MessageSquare, Users, ArrowRight, Brain, BarChart3, Star } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: 'AI-Powered Analysis',
      desc: 'Gemini AI analyzes your presentation for structure, clarity, errors, and engagement — giving you a comprehensive score.',
      color: 'from-indigo-500 to-purple-600',
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Smart Dashboard',
      desc: 'Visual efficiency scores, slide-by-slide breakdowns, and actionable improvement suggestions in one place.',
      color: 'from-cyan-500 to-blue-600',
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: 'PPT Chatbot',
      desc: 'Ask questions about your presentation. Your AI assistant knows every slide and answers instantly.',
      color: 'from-purple-500 to-pink-600',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Flash Cards',
      desc: 'Transform your slides into interactive flash cards for quick revision and study.',
      color: 'from-yellow-500 to-orange-600',
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Collaborative Rooms',
      desc: 'Create a room, share the ID with friends, and review your presentation together in real-time.',
      color: 'from-green-500 to-emerald-600',
    },
    {
      icon: <Presentation className="w-6 h-6" />,
      title: 'Multi-Format Support',
      desc: 'Upload PDF, PPT, or PPTX files. We handle the rest — including extraction and slide detection.',
      color: 'from-rose-500 to-red-600',
    },
  ];

  const stats = [
    { value: '95%', label: 'Accuracy' },
    { value: '2s', label: 'Analysis Time' },
    { value: 'AI', label: 'Powered by Gemini' },
    { value: '∞', label: 'Presentations' },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 right-10 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-40 left-1/3 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Presentation className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">ProPPT</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/join')}
            className="text-slate-400 hover:text-white transition-colors text-sm"
          >
            Join Room
          </button>
          <button
            onClick={() => navigate('/upload')}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition-all"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 text-center pt-24 pb-16 px-4">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-4 py-1.5 mb-6 text-sm text-indigo-300">
          <Star className="w-3.5 h-3.5 fill-indigo-400 text-indigo-400" />
          Powered by Google Gemini AI
        </div>
        <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
          <span className="gradient-text">Perfect Your</span>
          <br />
          <span className="text-white">Presentations</span>
          <br />
          <span className="text-slate-400 text-3xl md:text-5xl font-bold">with AI Intelligence</span>
        </h1>
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
          Upload your PPT or PDF, get an instant AI analysis, identify errors,
          discover improvements, and collaborate with teammates — all in one platform.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => navigate('/upload')}
            className="group flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50"
          >
            Analyze My Presentation
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => navigate('/join')}
            className="flex items-center gap-2 border border-slate-700 hover:border-indigo-500/50 text-slate-300 hover:text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all"
          >
            <Users className="w-5 h-5" />
            Join a Room
          </button>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="glass rounded-2xl p-6 text-center">
              <div className="text-3xl font-black gradient-text mb-1">{s.value}</div>
              <div className="text-slate-400 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 pb-24">
        <h2 className="text-3xl font-bold text-center mb-3 text-white">Everything You Need</h2>
        <p className="text-slate-400 text-center mb-12">One platform to analyze, improve, and present</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="glass rounded-2xl p-6 hover:border-indigo-500/40 transition-all cursor-default"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white mb-4`}>
                {f.icon}
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 text-center pb-20 px-4">
        <div className="glass max-w-2xl mx-auto rounded-3xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to level up your presentations?</h2>
          <p className="text-slate-400 mb-8">Upload your first presentation and get instant AI feedback — free.</p>
          <button
            onClick={() => navigate('/upload')}
            className="group flex items-center gap-2 mx-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-10 py-4 rounded-2xl font-semibold text-lg transition-all shadow-lg shadow-indigo-500/30"
          >
            Start Analyzing
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>
    </div>
  );
}
