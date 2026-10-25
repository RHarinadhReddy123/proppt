import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { Upload, FileText, Loader2, MessageSquare, Zap, ChevronLeft, CheckCircle } from 'lucide-react';

type Mode = 'chatbot' | 'flash';

export default function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<Mode | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1=upload, 2=mode, 3=analyzing
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) {
      setFile(accepted[0]);
      setError('');
      setStep(2);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
    },
    multiple: false,
    onDropRejected: () => setError('Please upload a PDF, PPT, or PPTX file (max 50MB)'),
  });

  const handleAnalyze = async () => {
    if (!file || !mode) return;
    setStep(3);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const interval = setInterval(() => {
        setProgress((p) => Math.min(p + Math.random() * 15, 85));
      }, 400);

      const { data } = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      clearInterval(interval);
      setProgress(100);

      setTimeout(() => {
        if (mode === 'chatbot') {
          navigate(`/chat/${data.sessionId}`, { state: { filename: data.filename, analysis: data.analysis } });
        } else {
          navigate(`/flash/${data.sessionId}`, { state: { filename: data.filename, analysis: data.analysis } });
        }
      }, 600);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
      setStep(2);
    }
  };

  const modeOptions = [
    {
      id: 'chatbot' as Mode,
      icon: <MessageSquare className="w-8 h-8" />,
      title: 'Chatbot Mode',
      desc: 'Get an AI analysis dashboard + ask questions about your presentation interactively.',
      gradient: 'from-indigo-500 to-purple-600',
      features: ['📊 Full analysis dashboard', '🤖 AI Q&A chatbot', '📋 Error & improvement report'],
    },
    {
      id: 'flash' as Mode,
      icon: <Zap className="w-8 h-8" />,
      title: 'Flash Presentation',
      desc: 'Slide-by-slide viewer with AI bullet points extracted — perfect for quick review.',
      gradient: 'from-yellow-500 to-orange-600',
      features: ['⚡ Slide viewer', '🃏 AI flash cards', '📖 Key points extracted'],
    },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col">
      {/* Nav */}
      <nav className="flex items-center px-6 py-4 border-b border-slate-800/60">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <div className="mx-auto flex items-center gap-2">
          <span className="text-lg font-bold gradient-text">ProPPT</span>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Step indicators */}
          <div className="flex items-center justify-center gap-3 mb-10">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step >= s
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                </div>
                {s < 3 && (
                  <div className={`w-16 h-0.5 ${step > s ? 'bg-indigo-500' : 'bg-slate-800'} transition-all`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Upload */}
          {step === 1 && (
            <div>
              <h1 className="text-3xl font-bold text-white text-center mb-2">Upload Your Presentation</h1>
              <p className="text-slate-400 text-center mb-8">Supports PDF, PPT, and PPTX formats</p>

              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all ${
                  isDragActive
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : 'border-slate-700 hover:border-indigo-500/60 hover:bg-slate-800/40'
                }`}
              >
                <input {...getInputProps()} />
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-6 animate-float">
                  <Upload className="w-10 h-10 text-indigo-400" />
                </div>
                <p className="text-white text-xl font-semibold mb-2">
                  {isDragActive ? 'Drop it here!' : 'Drag & drop your file here'}
                </p>
                <p className="text-slate-400 mb-6">or click to browse</p>
                <div className="flex justify-center gap-3">
                  {['PDF', 'PPTX', 'PPT'].map((ext) => (
                    <span key={ext} className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-slate-400 text-xs">
                      .{ext}
                    </span>
                  ))}
                </div>
              </div>
              {error && <p className="text-red-400 text-center mt-4 text-sm">{error}</p>}
            </div>
          )}

          {/* Step 2: Mode selection */}
          {step === 2 && file && (
            <div>
              <div className="flex items-center justify-center gap-3 mb-2">
                <FileText className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-medium">{file.name}</span>
                <button onClick={() => { setStep(1); setFile(null); setMode(null); }} className="text-slate-500 hover:text-slate-300 text-xs underline">Change</button>
              </div>
              <h2 className="text-3xl font-bold text-white text-center mb-2">How do you want to present?</h2>
              <p className="text-slate-400 text-center mb-8">Choose your preferred experience mode</p>

              <div className="grid md:grid-cols-2 gap-5 mb-8">
                {modeOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setMode(opt.id)}
                    className={`text-left p-6 rounded-3xl border-2 transition-all ${
                      mode === opt.id
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-slate-700 hover:border-slate-600 bg-slate-800/40'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${opt.gradient} flex items-center justify-center text-white mb-4`}>
                      {opt.icon}
                    </div>
                    <h3 className="text-white font-bold text-xl mb-2">{opt.title}</h3>
                    <p className="text-slate-400 text-sm mb-4">{opt.desc}</p>
                    <ul className="space-y-1">
                      {opt.features.map((f, i) => (
                        <li key={i} className="text-slate-300 text-xs">{f}</li>
                      ))}
                    </ul>
                    {mode === opt.id && (
                      <div className="mt-4 flex items-center gap-1.5 text-indigo-400 text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Selected
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {error && <p className="text-red-400 text-center mb-4 text-sm">{error}</p>}

              <button
                onClick={handleAnalyze}
                disabled={!mode}
                className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30"
              >
                Analyze with AI →
              </button>
            </div>
          )}

          {/* Step 3: Analyzing */}
          {step === 3 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border-2 border-indigo-500/40 flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Analyzing Your Presentation</h2>
              <p className="text-slate-400 mb-8">Gemini AI is reviewing your slides…</p>

              {/* Progress bar */}
              <div className="bg-slate-800 rounded-full h-3 max-w-sm mx-auto mb-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-slate-500 text-sm">{Math.round(progress)}%</p>

              <div className="mt-8 space-y-2 max-w-xs mx-auto">
                {['Extracting content…', 'Identifying slide structure…', 'Scoring clarity & engagement…', 'Generating recommendations…'].map((msg, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 text-sm transition-all ${
                      progress > i * 25 ? 'text-indigo-300' : 'text-slate-600'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${progress > i * 25 ? 'bg-indigo-500' : 'bg-slate-700'}`} />
                    {msg}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
