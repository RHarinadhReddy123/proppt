import { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, BarChart3, MessageSquare, Zap, RotateCcw, Check } from 'lucide-react';

interface FlashCard {
  question: string;
  answer: string;
  slide: string;
}

interface SlideBreakdown {
  slideNumber: number;
  title: string;
  score: number;
  feedback: string;
}

export default function FlashPage() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const filename = location.state?.filename || 'Presentation';
  const analysis = location.state?.analysis;

  const [mode, setMode] = useState<'slides' | 'cards'>('slides');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentCard, setCurrentCard] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [answered, setAnswered] = useState<Set<number>>(new Set());

  const slides: SlideBreakdown[] = analysis?.slideBreakdown || [];
  const cards: FlashCard[] = analysis?.flashCards || [];

  const goNextSlide = () => {
    setCurrentSlide((p) => Math.min(p + 1, slides.length - 1));
  };
  const goPrevSlide = () => {
    setCurrentSlide((p) => Math.max(p - 1, 0));
  };

  const goNextCard = () => {
    setFlipped(false);
    setTimeout(() => setCurrentCard((p) => Math.min(p + 1, cards.length - 1)), 150);
  };
  const goPrevCard = () => {
    setFlipped(false);
    setTimeout(() => setCurrentCard((p) => Math.max(p - 1, 0)), 150);
  };

  const markAnswered = () => {
    setAnswered((prev) => new Set([...prev, currentCard]));
    if (currentCard < cards.length - 1) goNextCard();
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800/60 px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate(`/dashboard/${sessionId}`, { state: { filename, analysis } })} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
          <ChevronLeft className="w-4 h-4" />
          Dashboard
        </button>
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          <span className="text-white font-semibold">{filename}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/dashboard/${sessionId}`, { state: { filename, analysis } })} className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all" title="Dashboard">
            <BarChart3 className="w-4 h-4" />
          </button>
          <button onClick={() => navigate(`/chat/${sessionId}`, { state: { filename, analysis } })} className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all" title="Chatbot">
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mode toggle */}
      <div className="flex justify-center pt-8 pb-4">
        <div className="flex gap-1 bg-slate-800/60 p-1 rounded-2xl">
          <button
            onClick={() => setMode('slides')}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${mode === 'slides' ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <Zap className="w-4 h-4" />
            Slide Viewer
          </button>
          <button
            onClick={() => setMode('cards')}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${mode === 'cards' ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <RotateCcw className="w-4 h-4" />
            Flash Cards
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* ──── Slide Viewer ──── */}
        {mode === 'slides' && (
          <div className="w-full max-w-3xl">
            {slides.length === 0 ? (
              <div className="glass rounded-3xl p-16 text-center">
                <Zap className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <h2 className="text-white font-bold text-xl mb-2">No slide breakdown available</h2>
                <p className="text-slate-400 text-sm">The AI couldn't detect individual slides. Try the chatbot instead.</p>
              </div>
            ) : (
              <>
                {/* Progress bar */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-400 text-sm">Slide {currentSlide + 1} of {slides.length}</span>
                  <div className="flex gap-1">
                    {slides.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentSlide(i)}
                        className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? 'bg-yellow-400 w-6' : 'bg-slate-700 hover:bg-slate-500'}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Slide card */}
                <div className="glass rounded-3xl p-10 mb-6 min-h-[300px] flex flex-col justify-between border border-yellow-500/20">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-400 text-xs font-mono">
                        SLIDE {slides[currentSlide].slideNumber}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        slides[currentSlide].score >= 80 ? 'bg-green-500/20 text-green-400' :
                        slides[currentSlide].score >= 60 ? 'bg-indigo-500/20 text-indigo-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        Score: {slides[currentSlide].score}%
                      </span>
                    </div>

                    <h2 className="text-white font-bold text-2xl mb-4">
                      {slides[currentSlide].title || `Slide ${slides[currentSlide].slideNumber}`}
                    </h2>

                    <p className="text-slate-300 text-base leading-relaxed">
                      {slides[currentSlide].feedback}
                    </p>
                  </div>

                  <div className="mt-6 bg-slate-700/50 rounded-full h-2">
                    <div
                      className={`h-full rounded-full transition-all ${
                        slides[currentSlide].score >= 80 ? 'bg-green-500' :
                        slides[currentSlide].score >= 60 ? 'bg-indigo-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${slides[currentSlide].score}%` }}
                    />
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={goPrevSlide}
                    disabled={currentSlide === 0}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 rounded-2xl transition-all text-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <span className="text-slate-500 text-sm">{currentSlide + 1}/{slides.length}</span>
                  <button
                    onClick={goNextSlide}
                    disabled={currentSlide === slides.length - 1}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 rounded-2xl transition-all text-sm"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ──── Flash Cards ──── */}
        {mode === 'cards' && (
          <div className="w-full max-w-2xl">
            {cards.length === 0 ? (
              <div className="glass rounded-3xl p-16 text-center">
                <RotateCcw className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <h2 className="text-white font-bold text-xl mb-2">No flash cards generated</h2>
                <p className="text-slate-400 text-sm">Not enough content was detected. Try the chatbot for Q&A.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-400 text-sm">
                    Card {currentCard + 1} of {cards.length}
                  </span>
                  <span className="text-green-400 text-sm">
                    {answered.size}/{cards.length} answered
                  </span>
                </div>

                {/* Progress */}
                <div className="bg-slate-800 rounded-full h-1.5 mb-6 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full transition-all"
                    style={{ width: `${((currentCard + 1) / cards.length) * 100}%` }}
                  />
                </div>

                {/* Flip card */}
                <div
                  className="cursor-pointer mb-6"
                  style={{ perspective: '1000px' }}
                  onClick={() => setFlipped((f) => !f)}
                >
                  <div
                    className="relative w-full transition-transform duration-500"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      minHeight: '280px',
                    }}
                  >
                    {/* Front */}
                    <div
                      className="absolute inset-0 glass rounded-3xl p-10 flex flex-col items-center justify-center text-center border border-yellow-500/20"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <span className="text-yellow-400 text-xs mb-4 font-mono tracking-wider">QUESTION · {cards[currentCard].slide}</span>
                      <p className="text-white text-xl font-semibold leading-relaxed">{cards[currentCard].question}</p>
                      <p className="text-slate-500 text-xs mt-6">Click to reveal answer</p>
                    </div>

                    {/* Back */}
                    <div
                      className="absolute inset-0 glass rounded-3xl p-10 flex flex-col items-center justify-center text-center border border-green-500/20 bg-green-950/20"
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                      <span className="text-green-400 text-xs mb-4 font-mono tracking-wider">ANSWER</span>
                      <p className="text-white text-lg leading-relaxed">{cards[currentCard].answer}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={goPrevCard}
                    disabled={currentCard === 0}
                    className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 rounded-2xl transition-all text-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Prev
                  </button>

                  <button
                    onClick={markAnswered}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-medium transition-all ${
                      answered.has(currentCard)
                        ? 'bg-green-500/20 border border-green-500/40 text-green-400'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    {answered.has(currentCard) ? 'Answered ✓' : 'Got it!'}
                  </button>

                  <button
                    onClick={goNextCard}
                    disabled={currentCard === cards.length - 1}
                    className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 rounded-2xl transition-all text-sm"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {answered.size === cards.length && (
                  <div className="mt-6 glass rounded-2xl p-6 text-center border border-green-500/30">
                    <p className="text-green-400 font-bold text-lg">🎉 All cards completed!</p>
                    <p className="text-slate-400 text-sm mt-1">Great job reviewing your presentation!</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
