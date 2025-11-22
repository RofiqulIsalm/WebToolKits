// src/pages/AdminLogin.tsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Shield, Eye, EyeOff, Cpu, AlertTriangle, Unlock } from "lucide-react";
import { loginAdmin, isAdminAuthenticated } from "../utils/adminAuth";
import SEOHead from "../components/SEOHead";

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [isLocked, setIsLocked] = useState(true);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  // Game State
  const [gameLevel, setGameLevel] = useState(0); // 0 to 3
  const [rotation, setRotation] = useState(0);
  const [targetZone, setTargetZone] = useState(0);
  const [gameMessage, setGameMessage] = useState("INITIALIZING SECURITY PROTOCOL...");
  const [shake, setShake] = useState(false);

  const requestRef = useRef<number>();
  const speedRef = useRef(2);
  const bypassTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isBypassingRef = useRef(false);

  useEffect(() => {
    if (isAdminAuthenticated()) {
      navigate("/adminparky/dashboard", { replace: true });
    }
  }, [navigate]);

  // Game Loop
  useEffect(() => {
    if (!isLocked) return;

    const animate = () => {
      setRotation((prev) => (prev + speedRef.current) % 360);
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [isLocked, gameLevel]);

  // Set new target on level up
  useEffect(() => {
    if (isLocked) {
      setTargetZone(Math.random() * 200 + 80); // Random zone between 80 and 280 deg
      speedRef.current = 2 + gameLevel * 1.5; // Increase speed
      if (gameLevel === 0) setGameMessage("LEVEL 1: ALIGN QUANTUM CORE");
      if (gameLevel === 1) setGameMessage("LEVEL 2: SYNCHRONIZE FREQUENCIES");
      if (gameLevel === 2) setGameMessage("LEVEL 3: DECRYPTING FIREWALL...");
    }
  }, [gameLevel, isLocked]);

  // Secret Bypass: Long Press Handler
  const handlePressStart = () => {
    isBypassingRef.current = false;
    bypassTimerRef.current = setTimeout(() => {
      isBypassingRef.current = true;
      setGameMessage("⚠️ MANUAL OVERRIDE ACCEPTED ⚠️");
      setTimeout(() => setIsLocked(false), 600);
    }, 1500); // 1.5s hold to bypass
  };

  const handlePressEnd = () => {
    if (bypassTimerRef.current) {
      clearTimeout(bypassTimerRef.current);
      bypassTimerRef.current = null;
    }
  };

  const handleGameClick = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent click if bypass triggered
    if (isBypassingRef.current) return;

    // Check if rotation is within target zone (+/- 25 deg)
    const diff = Math.abs(rotation - targetZone);
    const isHit = diff < 25;

    if (isHit) {
      if (gameLevel >= 2) {
        setGameMessage("ACCESS GRANTED. WELCOME ADMIN.");
        setTimeout(() => setIsLocked(false), 800);
      } else {
        setGameLevel((prev) => prev + 1);
      }
    } else {
      // Fail
      setShake(true);
      setGameMessage("ALIGNMENT FAILED. RETRYING...");
      setGameLevel(0);
      speedRef.current = 2;
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const ok = loginAdmin(password);
    if (ok) {
      navigate("/adminparky/dashboard", { replace: true });
    } else {
      setError("Invalid credentials. Security alert triggered.");
    }
  };

  return (
    <>
      <SEOHead
        title="Security Gateway – CalculatorHub"
        description="Restricted Access."
        canonical="https://calculatorhub.site/adminparky/login"
      />

      <div className="min-h-[80vh] flex items-center justify-center p-4 overflow-hidden">
        {isLocked ? (
          // === GAME UI ===
          <div className={`relative w-full max-w-md aspect-square flex flex-col items-center justify-center scale-90 sm:scale-100 transition-transform ${shake ? "animate-shake" : ""}`}>
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800/50 via-slate-950/80 to-slate-950 rounded-full border border-slate-800/50 backdrop-blur-sm" />

            {/* Rotating Ring */}
            <div
              className="absolute w-56 h-56 sm:w-64 sm:h-64 rounded-full border-4 border-transparent border-t-cyan-500 border-r-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-transform duration-75 ease-linear"
              style={{ transform: `rotate(${rotation}deg)` }}
            />

            {/* Inner Rotating Ring (Reverse) */}
            <div
              className="absolute w-40 h-40 sm:w-48 sm:h-48 rounded-full border-2 border-transparent border-b-emerald-500 border-l-emerald-500/30 opacity-70 transition-transform duration-75 ease-linear"
              style={{ transform: `rotate(-${rotation * 60.5}deg)` }}
            />

            {/* Target Zone Indicator */}
            <div
              className="absolute w-64 h-64 sm:w-72 sm:h-72 rounded-full pointer-events-none"
              style={{ transform: `rotate(${targetZone}deg)` }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-4 h-8 bg-rose-500/50 blur-sm rounded-full" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-1 h-4 bg-rose-400 rounded-full" />
            </div>

            {/* Central Core Button */}
            <button
              onClick={handleGameClick}
              onMouseDown={handlePressStart}
              onMouseUp={handlePressEnd}
              onMouseLeave={handlePressEnd}
              onTouchStart={handlePressStart}
              onTouchEnd={handlePressEnd}
              className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-900 border-2 border-slate-700 flex flex-col items-center justify-center gap-1 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] active:scale-95 transition-all group select-none"
            >
              <Cpu className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 group-hover:text-cyan-300 transition-colors" />
              <span className="text-[8px] sm:text-[10px] font-mono text-slate-500 group-hover:text-cyan-200">ENGAGE</span>
            </button>

            {/* Status Text */}
            <div className="absolute bottom-8 sm:bottom-10 text-center w-full px-4">
              <p className="text-cyan-400 font-mono text-xs tracking-widest animate-pulse truncate">{gameMessage}</p>
              <div className="flex gap-1 justify-center mt-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${i < gameLevel ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" : "bg-slate-800"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          // === LOGIN FORM ===
          <div className="glow-card bg-slate-950/90 border border-slate-800/80 rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl shadow-black/60 animate-in fade-in zoom-in duration-500 mx-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/15 border border-emerald-400/60 flex items-center justify-center">
                <Unlock className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white">
                  Admin Access
                </h1>
                <p className="text-xs text-emerald-400/80 font-mono">
                  SECURITY CLEARANCE VERIFIED
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-rose-500/70 bg-rose-500/10 px-3 py-2 text-sm text-rose-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-200 mb-2"
                >
                  Security Key
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-50 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono tracking-wider"
                    placeholder="Enter admin password"
                    autoComplete="current-password"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPw ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 via-cyan-500 to-sky-500 text-white font-medium shadow-lg shadow-emerald-900/60 hover:brightness-110 transition-all"
              >
                Authenticate
              </button>
            </form>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 2;
        }
      `}</style>
    </>
  );
};

export default AdminLogin;
