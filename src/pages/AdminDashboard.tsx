// src/pages/AdminDashboard.tsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  LogOut,
  Star,
  Zap,
  ListChecks,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Edit3,
} from "lucide-react";

import SEOHead from "../components/SEOHead";
import { toolsData } from "../data/toolsData";
import { isAdminAuthenticated, logoutAdmin } from "../utils/adminAuth";
import { useSiteConfig } from "../config/siteConfig";


type SimpleTool = {
  name: string;
  path: string;
};


const { config, setConfig } = useSiteConfig();

const defaultQuickAccess: SimpleTool[] = [
  { name: "Currency Converter", path: "/currency-converter" },
  { name: "Loan EMI Calculator", path: "/loan-emi-calculator" },
  { name: "Tax Calculator", path: "/tax-calculator" },
  { name: "Age Calculator", path: "/age-calculator" },
];

const defaultPopular: SimpleTool[] = [
  { name: "Percentage Calculator", path: "/percentage-calculator" },
  { name: "Compound Interest Calculator", path: "/compound-interest-calculator" },
  { name: "SIP Calculator", path: "/sip-calculator" },
  { name: "BMI Calculator", path: "/bmi-calculator" },
];

const LS_KEY_QUICK = "ch_admin_quick_access";
const LS_KEY_POPULAR = "ch_admin_popular_list";

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Simple auth check
  React.useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate("/admin/login", { replace: true });
    }
  }, [navigate]);

  const allTools = useMemo(
    () => toolsData.flatMap((cat) => cat.tools),
    []
  );

  const [quickAccess, setQuickAccess] = useState<SimpleTool[]>(() => {
    if (typeof window === "undefined") return defaultQuickAccess;
    try {
      const raw = localStorage.getItem(LS_KEY_QUICK);
      return raw ? JSON.parse(raw) : defaultQuickAccess;
    } catch {
      return defaultQuickAccess;
    }
  });

  const [popular, setPopular] = useState<SimpleTool[]>(() => {
    if (typeof window === "undefined") return defaultPopular;
    try {
      const raw = localStorage.getItem(LS_KEY_POPULAR);
      return raw ? JSON.parse(raw) : defaultPopular;
    } catch {
      return defaultPopular;
    }
  });

  const [newQuickPath, setNewQuickPath] = useState("");
  const [newPopularPath, setNewPopularPath] = useState("");
  const [editMode, setEditMode] = useState(false);

  const persistQuick = (list: SimpleTool[]) => {
    setQuickAccess(list);
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_KEY_QUICK, JSON.stringify(list));
    }
  };

  const persistPopular = (list: SimpleTool[]) => {
    setPopular(list);
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_KEY_POPULAR, JSON.stringify(list));
    }
  };

  const moveItem = (
    list: SimpleTool[],
    index: number,
    direction: "up" | "down"
  ) => {
    const newList = [...list];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newList.length) return newList;
    const temp = newList[index];
    newList[index] = newList[targetIndex];
    newList[targetIndex] = temp;
    return newList;
  };

  const resolveToolByPath = (path: string): SimpleTool | null => {
    const t = allTools.find((tool) => tool.path === path.trim());
    if (!t) return null;
    return { name: t.name, path: t.path };
  };

  const handleLogout = () => {
    logoutAdmin();
    navigate("/admin/login", { replace: true });
  };

  const totalCalculators = allTools.length;
  const totalCategories = toolsData.length;

  return (
    <>
      <SEOHead
        title="Admin Dashboard – CalculatorHub"
        description="Internal admin dashboard for CalculatorHub: analytics, favorites and quick access configuration."
        canonical="https://calculatorhub.site/admin/dashboard"
        breadcrumbs={[{ name: "Admin Dashboard", url: "/admin/dashboard" }]}
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-sky-500/20 border border-sky-400/60 flex items-center justify-center shadow-lg shadow-sky-900/70">
              <BarChart3 className="w-6 h-6 text-sky-200" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-white">
                Admin Dashboard
              </h1>
              <p className="text-xs md:text-sm text-slate-400">
                View internal metrics and manage Quick Access & Popular calculators.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditMode((v) => !v)}
              className="px-3 py-1.5 rounded-lg text-xs bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800 flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {editMode ? "Done editing" : "Edit lists"}
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg text-xs bg-rose-600 text-white hover:bg-rose-500 flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="glow-card rounded-2xl bg-slate-950/90 border border-sky-500/40 p-4">
            <p className="text-xs uppercase tracking-wide text-sky-300">
              Total calculators
            </p>
            <p className="text-3xl font-bold text-white mt-2">{totalCalculators}</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Pulled directly from toolsData configuration.
            </p>
          </div>
          <div className="glow-card rounded-2xl bg-slate-950/90 border border-emerald-500/40 p-4">
            <p className="text-xs uppercase tracking-wide text-emerald-300">
              Categories
            </p>
            <p className="text-3xl font-bold text-white mt-2">
              {totalCategories}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Currency, unit converters, math, date/time, misc, etc.
            </p>
          </div>
          <div className="glow-card rounded-2xl bg-slate-950/90 border border-fuchsia-500/40 p-4">
            <p className="text-xs uppercase tracking-wide text-fuchsia-300">
              Analytics status
            </p>
            <p className="text-sm text-slate-200 mt-1">
              To track “most liked / most used”, connect Google Analytics / backend
              events and surface them here.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Access manager */}
          <section className="glow-card rounded-2xl bg-slate-950/90 border border-amber-500/40 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-300" />
                <h2 className="text-lg font-semibold text-white">
                  Quick Access Calculators
                </h2>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              These appear in the sidebar “Quick Access” section for users.
            </p>

            <ul className="space-y-2 mb-4">
              {quickAccess.map((item, idx) => (
                <li
                  key={item.path}
                  className="flex items-center justify-between bg-slate-900/80 border border-slate-700/80 rounded-lg px-3 py-2 text-sm"
                >
                  <div>
                    <p className="text-slate-50">{item.name}</p>
                    <p className="text-[11px] text-slate-500">{item.path}</p>
                  </div>
                  {editMode && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          persistQuick(moveItem(quickAccess, idx, "up"))
                        }
                        className="p-1 rounded-md hover:bg-slate-800"
                      >
                        <ArrowUp className="w-3.5 h-3.5 text-slate-200" />
                      </button>
                      <button
                        onClick={() =>
                          persistQuick(moveItem(quickAccess, idx, "down"))
                        }
                        className="p-1 rounded-md hover:bg-slate-800"
                      >
                        <ArrowDown className="w-3.5 h-3.5 text-slate-200" />
                      </button>
                      <button
                        onClick={() =>
                          persistQuick(
                            quickAccess.filter((_, i) => i !== idx)
                          )
                        }
                        className="p-1 rounded-md hover:bg-rose-900/60"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>

            {editMode && (
              <form
                className="flex flex-col sm:flex-row gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newQuickPath.trim()) return;
                  const resolved = resolveToolByPath(newQuickPath);
                  if (!resolved) {
                    alert("No tool found for that path. Check App.tsx routes.");
                    return;
                  }
                  persistQuick([...quickAccess, resolved]);
                  setNewQuickPath("");
                }}
              >
                <input
                  type="text"
                  value={newQuickPath}
                  onChange={(e) => setNewQuickPath(e.target.value)}
                  placeholder="e.g. /currency-converter"
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-50 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-lg bg-amber-500 text-slate-900 text-sm font-medium flex items-center justify-center gap-1 hover:bg-amber-400"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </form>
            )}
          </section>

          {/* Popular calculators manager */}
          <section className="glow-card rounded-2xl bg-slate-950/90 border border-emerald-500/40 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-emerald-300" />
                <h2 className="text-lg font-semibold text-white">
                  Popular Calculators
                </h2>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              These show in the sidebar “Popular Calculators” and can reflect your
              top-performing tools.
            </p>

            <ul className="space-y-2 mb-4">
              {popular.map((item, idx) => (
                <li
                  key={item.path}
                  className="flex items-center justify-between bg-slate-900/80 border border-slate-700/80 rounded-lg px-3 py-2 text-sm"
                >
                  <div>
                    <p className="text-slate-50">{item.name}</p>
                    <p className="text-[11px] text-slate-500">{item.path}</p>
                  </div>
                  {editMode && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          persistPopular(moveItem(popular, idx, "up"))
                        }
                        className="p-1 rounded-md hover:bg-slate-800"
                      >
                        <ArrowUp className="w-3.5 h-3.5 text-slate-200" />
                      </button>
                      <button
                        onClick={() =>
                          persistPopular(moveItem(popular, idx, "down"))
                        }
                        className="p-1 rounded-md hover:bg-slate-800"
                      >
                        <ArrowDown className="w-3.5 h-3.5 text-slate-200" />
                      </button>
                      <button
                        onClick={() =>
                          persistPopular(popular.filter((_, i) => i !== idx))
                        }
                        className="p-1 rounded-md hover:bg-rose-900/60"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>

            {editMode && (
              <form
                className="flex flex-col sm:flex-row gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newPopularPath.trim()) return;
                  const resolved = resolveToolByPath(newPopularPath);
                  if (!resolved) {
                    alert("No tool found for that path. Check App.tsx routes.");
                    return;
                  }
                  persistPopular([...popular, resolved]);
                  setNewPopularPath("");
                }}
              >
                <input
                  type="text"
                  value={newPopularPath}
                  onChange={(e) => setNewPopularPath(e.target.value)}
                  placeholder="e.g. /percentage-calculator"
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-50 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-lg bg-emerald-500 text-slate-900 text-sm font-medium flex items-center justify-center gap-1 hover:bg-emerald-400"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </form>
            )}
          </section>
        </div>

        {/* Placeholder “most liked / needs update” note */}
        <div className="mt-8 glow-card rounded-2xl bg-slate-950/90 border border-slate-800/80 p-4 flex items-start gap-3 text-xs text-slate-300">
          <ListChecks className="w-4 h-4 text-sky-300 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-100 mb-1">
              Next step: real usage analytics
            </p>
            <p>
              To truly see which calculators get the most impressions, likes and
              bounce rate, connect Google Analytics / Plausible / a custom
              backend. Then expose that data via an API and render it here.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
