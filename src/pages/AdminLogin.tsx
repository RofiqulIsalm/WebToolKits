// src/pages/AdminLogin.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Shield, Eye, EyeOff } from "lucide-react";
import { loginAdmin, isAdminAuthenticated } from "../utils/adminAuth";
import SEOHead from "../components/SEOHead";

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  React.useEffect(() => {
    if (isAdminAuthenticated()) {
      navigate("/adminparky/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const ok = loginAdmin(password);
    if (ok) {
      navigate("/adminlparky/dashboard", { replace: true });
    } else {
      setError("Invalid admin credentials.");
    }
  };

  return (
    <>
      <SEOHead
        title="Admin Login – CalculatorHub"
        description="Secure admin login for CalculatorHub internal tools and analytics."
        canonical="https://calculatorhub.site/adminparky/login"
        breadcrumbs={[{ name: "Admin Login", url: "/adminparky/login" }]}
      />

      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="glow-card bg-slate-950/90 border border-slate-800/80 rounded-2xl p-8 w-full max-w-md shadow-2xl shadow-black/60">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/15 border border-emerald-400/60 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">
                Admin Access
              </h1>
              <p className="text-xs text-slate-400">
                Restricted area. Unauthorized access is prohibited.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-rose-500/70 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-200 mb-2"
              >
                Admin Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-50 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                  required
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
              <p className="text-[11px] text-slate-500 mt-1">
                Access is monitored. Make sure you’re on the correct domain
                before logging in.
              </p>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 via-cyan-500 to-sky-500 text-white font-medium shadow-lg shadow-emerald-900/60 hover:brightness-110 transition-all"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AdminLogin;
