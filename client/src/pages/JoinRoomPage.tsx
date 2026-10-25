import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Users, ArrowRight, Hash } from 'lucide-react';

export default function JoinRoomPage() {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');

  const handleJoin = () => {
    const trimmed = roomId.trim().toUpperCase();
    if (!trimmed) {
      setError('Please enter a room ID');
      return;
    }
    if (trimmed.length < 4) {
      setError('Room ID must be at least 4 characters');
      return;
    }
    navigate(`/room/${trimmed}`);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col">
      <nav className="flex items-center px-6 py-4 border-b border-slate-800/60">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Home
        </button>
      </nav>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white text-center mb-2">Join a Room</h1>
          <p className="text-slate-400 text-center mb-8 text-sm">
            Enter a room ID shared by your friend to view and discuss their presentation together.
          </p>

          <div className="glass rounded-3xl p-8">
            <label className="block text-slate-300 text-sm font-medium mb-3">Room ID</label>
            <div className="relative mb-6">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={roomId}
                onChange={(e) => { setRoomId(e.target.value.toUpperCase()); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                placeholder="e.g. A3B7X2"
                maxLength={10}
                className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500/60 rounded-xl pl-10 pr-4 py-3.5 text-white placeholder-slate-500 outline-none text-center font-mono text-xl tracking-widest transition-all"
              />
            </div>
            {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

            <button
              onClick={handleJoin}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-4 rounded-2xl font-semibold transition-all"
            >
              Join Room
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <p className="text-slate-600 text-xs text-center mt-6">
            Don't have a room ID?{' '}
            <button onClick={() => navigate('/upload')} className="text-indigo-400 hover:text-indigo-300 underline">
              Upload a presentation to create one
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
