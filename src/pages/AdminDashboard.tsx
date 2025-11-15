// src/pages/AdminDashboard.tsx
import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSiteConfig, NavLink, FooterLink } from "../config/siteConfig";
import { isAdminAuthenticated, logoutAdmin } from "../utils/adminAuth";
import {
  Shield,
  Settings,
  Trash2,
  Plus,
  LogOut,
  Edit3,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Activity,
  Power,
} from "lucide-react";
import SEOHead from "../components/SEOHead";
import { toolsData } from "../data/toolsData";

const VIEW_STORAGE_KEY = "ch_page_views_v2";

// ===== Helpers =====
function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length || from === to) return list;
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

// Flatten all calculators from toolsData
const ALL_TOOLS = toolsData.flatMap((cat) =>
  cat.tools.map((tool) => ({
    path: tool.path,
    name: tool.name,
    category: cat.name ?? cat.slug,
  }))
);

type AnalyticsRow = {
  path: string;
  name: string;
  category: string;
  total: number;
  last7: number;
  last30: number;
  prev7: number;
  trendPercent: number;
  status: "Active" | "Rising" | "Low" | "Dead" | "New" | "Disabled";
};

type StatusFilter = "ALL" | "Rising" | "Dead" | "Low" | "Disabled";

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { config, setConfig } = useSiteConfig();

  const [analyticsRows, setAnalyticsRows] = React.useState<AnalyticsRow[]>([]);
  const [statusFilter, setStatusFilter] =
    React.useState<StatusFilter>("ALL");

  // Redirect if not logged in
  React.useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate("/admin/login", { replace: true });
    }
  }, [navigate]);

  // Load analytics from localStorage
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = localStorage.getItem(VIEW_STORAGE_KEY);
      const data: Record<string, number[]> = raw ? JSON.parse(raw) : {};

      const now = Date.now();
      const sevenAgo = now - 7 * 24 * 60 * 60 * 1000;
      const fourteenAgo = now - 14 * 24 * 60 * 60 * 1000;
      const thirtyAgo = now - 30 * 24 * 60 * 60 * 1000;

      const rows: AnalyticsRow[] = ALL_TOOLS.map((tool) => {
        const times = Array.isArray(data[tool.path])
          ? (data[tool.path] as number[])
          : [];

        let total = times.length;
        let last7 = 0;
        let last30 = 0;
        let prev7 = 0;

        for (const ts of times) {
          if (ts >= thirtyAgo) {
            last30++;
            if (ts >= sevenAgo) {
              last7++;
            } else if (ts >= fourteenAgo) {
              prev7++;
            }
          }
        }

        // Trend = current 7 days vs previous 7
        let trendPercent = 0;
        if (prev7 === 0 && last7 > 0) {
          trendPercent = 100;
        } else if (prev7 > 0) {
          trendPercent = Math.round(((last7 - prev7) / prev7) * 100);
        }

        // Base status from activity
        let baseStatus: AnalyticsRow["status"];
        if (total === 0) {
          baseStatus = "New";
        } else if (last30 <= 5) {
          baseStatus = "Dead";
        } else if (last7 === 0) {
          baseStatus = "Low";
        } else if (last7 / Math.max(last30, 1) >= 0.6 || trendPercent >= 25) {
          baseStatus = "Rising";
        } else {
          baseStatus = "Active";
        }

        const disabled = config.disabledCalculators?.includes(tool.path);
        const status = disabled ? "Disabled" : baseStatus;

        return {
          path: tool.path,
          name: tool.name,
          category: tool.category,
          total,
          last7,
          last30,
          prev7,
          trendPercent,
          status,
        };
      });

      rows.sort((a, b) => b.total - a.total);
      setAnalyticsRows(rows);
    } catch (err) {
      console.error("Failed to read page view analytics", err);
    }
  }, [config.disabledCalculators]);

  // Map for quick lookup in control section
  const analyticsMap = React.useMemo(() => {
    const map = new Map<string, AnalyticsRow>();
    analyticsRows.forEach((r) => map.set(r.path, r));
    return map;
  }, [analyticsRows]);

  const filteredRows = React.useMemo(() => {
    if (statusFilter === "ALL") return analyticsRows;
    return analyticsRows.filter((r) => r.status === statusFilter);
  }, [analyticsRows, statusFilter]);

  const handleLogout = () => {
    logoutAdmin();
    navigate("/admin/login", { replace: true });
  };

  // Helpers for editing arrays
  const updateQuickAccess = (next: NavLink[]) => {
    setConfig((prev) => ({ ...prev, quickAccess: next }));
  };

  const updatePopularSidebar = (next: NavLink[]) => {
    setConfig((prev) => ({ ...prev, popularSidebar: next }));
  };

  const updateFooterPopular = (next: NavLink[]) => {
    setConfig((prev) => ({ ...prev, footerPopular: next }));
  };

  const updateSocialLinks = (next: FooterLink[]) => {
    setConfig((prev) => ({ ...prev, socialLinks: next }));
  };

  const handleFooterDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    setConfig((prev) => ({ ...prev, footerDescription: value }));
  };

  const toggleCalculator = (path: string) => {
    setConfig((prev) => {
      const current = prev.disabledCalculators ?? [];
      const set = new Set(current);
      if (set.has(path)) {
        set.delete(path);
      } else {
        set.add(path);
      }
      return { ...prev, disabledCalculators: Array.from(set) };
    });
  };

  // Small stats
  const totalCalculators = ALL_TOOLS.length;
  const totalViews = analyticsRows.reduce((sum, r) => sum + r.total, 0);
  const disabledCount = config.disabledCalculators.length;
  const deadCount = analyticsRows.filter((r) => r.status === "Dead").length;
  const risingCount = analyticsRows.filter(
    (r) => r.status === "Rising"
  ).length;

  return (
    <>
      <SEOHead
        title="Admin Dashboard – CalculatorHub"
        description="Internal admin dashboard for managing CalculatorHub layout, footer, live calculator analytics and power control."
        canonical="https://calculatorhub.site/admin/dashboard"
        breadcrumbs={[
          { name: "Admin", url: "/admin/login" },
          { name: "Dashboard", url: "/admin/dashboard" },
        ]}
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/15 border border-emerald-400/60 flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
                Admin Dashboard
                <span className="text-xs font-normal text-emerald-300 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/40">
                  Secure
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Control which calculators are visible, see what users love, and
                fine-tune your layout without touching code.
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm hover:bg-rose-600/80 hover:border-rose-400/70 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="glow-card bg-slate-950/90 border border-slate-800/80 rounded-2xl px-4 py-3">
            <p className="text-[11px] text-slate-400">Total calculators</p>
            <p className="text-2xl font-semibold text-white mt-1">
              {totalCalculators}
            </p>
          </div>
          <div className="glow-card bg-slate-950/90 border border-slate-800/80 rounded-2xl px-4 py-3">
            <p className="text-[11px] text-slate-400">Total recorded views</p>
            <p className="text-2xl font-semibold text-white mt-1">
              {totalViews}
            </p>
          </div>
          <div className="glow-card bg-slate-950/90 border border-slate-800/80 rounded-2xl px-4 py-3">
            <p className="text-[11px] text-slate-400">Rising calculators</p>
            <p className="text-2xl font-semibold text-emerald-300 mt-1">
              {risingCount}
            </p>
          </div>
          <div className="glow-card bg-slate-950/90 border border-slate-800/80 rounded-2xl px-4 py-3">
            <p className="text-[11px] text-slate-400">
              Disabled / Dead calculators
            </p>
            <p className="text-2xl font-semibold text-amber-300 mt-1">
              {disabledCount + deadCount}
            </p>
          </div>
        </div>

        {/* Analytics Section */}
        <section className="glow-card bg-slate-950/95 border border-slate-800/90 rounded-2xl p-5 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-cyan-500/10 border border-cyan-400/50 flex items-center justify-center">
                <Activity className="w-4 h-4 text-cyan-300" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-cyan-300 flex items-center gap-2">
                  Live Analytics
                </h2>
                <p className="text-[11px] text-slate-500">
                  See which calculators are hot, cold, or sleeping. Data is
                  based on local page views (last 30 days window).
                </p>
              </div>
            </div>

            {/* Status filter pills */}
            <div className="flex flex-wrap gap-2 text-[11px]">
              {([
                "ALL",
                "Rising",
                "Dead",
                "Low",
                "Disabled",
              ] as StatusFilter[]).map((s) => {
                const active = statusFilter === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    className={
                      "px-3 py-1 rounded-full border transition-colors " +
                      (active
                        ? "border-cyan-400 bg-cyan-500/10 text-cyan-200"
                        : "border-slate-700 bg-slate-900/80 text-slate-300 hover:border-cyan-400/60 hover:text-cyan-200")
                    }
                  >
                    {s === "ALL" ? "All" : s}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="overflow-x-auto mt-3 text-sm">
            <table className="min-w-full border-separate border-spacing-y-1">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="text-left px-2 py-1">Rank</th>
                  <th className="text-left px-2 py-1">Calculator</th>
                  <th className="text-right px-2 py-1">Total</th>
                  <th className="text-right px-2 py-1">Last 7d</th>
                  <th className="text-right px-2 py-1">Last 30d</th>
                  <th className="text-right px-2 py-1">Trend</th>
                  <th className="text-center px-2 py-1">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center text-slate-500 text-xs py-4"
                    >
                      No analytics for this filter yet. Visit some calculators
                      to generate view data.
                    </td>
                  </tr>
                )}

                {filteredRows.slice(0, 50).map((row, idx) => {
                  const trend = row.trendPercent;
                  const trendLabel =
                    trend > 0
                      ? `+${trend}%`
                      : trend < 0
                      ? `${trend}%`
                      : "0%";

                  let trendClass = "text-slate-300";
                  if (trend > 0) trendClass = "text-emerald-300";
                  if (trend < 0) trendClass = "text-rose-300";

                  let statusClass =
                    "bg-slate-800/80 text-slate-200 border-slate-600/60";
                  if (row.status === "Rising")
                    statusClass =
                      "bg-emerald-500/10 text-emerald-200 border-emerald-400/60";
                  else if (row.status === "Dead")
                    statusClass =
                      "bg-rose-500/10 text-rose-200 border-rose-400/60";
                  else if (row.status === "Low")
                    statusClass =
                      "bg-amber-500/10 text-amber-200 border-amber-400/60";
                  else if (row.status === "Disabled")
                    statusClass =
                      "bg-slate-700/80 text-slate-200 border-slate-500/80";
                  else if (row.status === "New")
                    statusClass =
                      "bg-sky-500/10 text-sky-200 border-sky-400/60";

                  return (
                    <tr
                      key={row.path}
                      className="align-middle bg-slate-900/80 border border-slate-800/80 rounded-xl"
                    >
                      <td className="px-2 py-1 text-xs text-slate-400">
                        #{idx + 1}
                      </td>
                      <td className="px-2 py-2">
                        <Link
                          to={row.path}
                          className="text-slate-100 hover:text-cyan-300 text-sm"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {row.name}
                        </Link>
                        <div className="text-[10px] text-slate-500">
                          {row.category}
                        </div>
                      </td>
                      <td className="px-2 py-1 text-right text-slate-100">
                        {row.total}
                      </td>
                      <td className="px-2 py-1 text-right text-slate-100">
                        {row.last7}
                      </td>
                      <td className="px-2 py-1 text-right text-slate-100">
                        {row.last30}
                      </td>
                      <td className={`px-2 py-1 text-right ${trendClass}`}>
                        {trendLabel}
                      </td>
                      <td className="px-2 py-1 text-center">
                        <span
                          className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] border ${statusClass}`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Calculator Power Control */}
        <section className="glow-card bg-slate-950/95 border border-slate-800/90 rounded-2xl p-5 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-400/50 flex items-center justify-center">
                <Power className="w-4 h-4 text-emerald-300" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-emerald-300 flex items-center gap-2">
                  Calculator Power Control
                </h2>
                <p className="text-[11px] text-slate-500">
                  Turn any calculator ON/OFF instantly. Disabled calculators
                  return a friendly maintenance page instead of breaking.
                </p>
              </div>
            </div>
            <div className="text-[11px] text-slate-400">
              Tip: Use this if a calculator is buggy, wrong, or under update.
            </div>
          </div>

          <div className="max-h-[320px] overflow-y-auto pr-1 text-sm">
            <table className="min-w-full border-separate border-spacing-y-1">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="text-left px-2 py-1">Calculator</th>
                  <th className="text-right px-2 py-1">Last 30d</th>
                  <th className="text-center px-2 py-1">Status</th>
                  <th className="text-center px-2 py-1">Power</th>
                </tr>
              </thead>
              <tbody>
                {ALL_TOOLS.map((tool) => {
                  const row = analyticsMap.get(tool.path);
                  const isDisabled = config.disabledCalculators.includes(
                    tool.path
                  );
                  const last30 = row?.last30 ?? 0;
                  const badge =
                    row?.status === "Rising"
                      ? "Rising"
                      : row?.status === "Dead"
                      ? "Dead"
                      : row?.status === "Low"
                      ? "Low"
                      : row?.status === "New"
                      ? "New"
                      : "Active";

                  let badgeClass =
                    "bg-slate-800/80 text-slate-200 border-slate-600/60";
                  if (badge === "Rising")
                    badgeClass =
                      "bg-emerald-500/10 text-emerald-200 border-emerald-400/60";
                  else if (badge === "Dead")
                    badgeClass =
                      "bg-rose-500/10 text-rose-200 border-rose-400/60";
                  else if (badge === "Low")
                    badgeClass =
                      "bg-amber-500/10 text-amber-200 border-amber-400/60";
                  else if (badge === "New")
                    badgeClass =
                      "bg-sky-500/10 text-sky-200 border-sky-400/60";

                  return (
                    <tr
                      key={tool.path}
                      className={
                        "align-middle bg-slate-900/80 border border-slate-800/80 rounded-xl " +
                        (isDisabled ? "opacity-60" : "")
                      }
                    >
                      <td className="px-2 py-2">
                        <div className="flex flex-col">
                          <span className="text-slate-100 text-sm">
                            {tool.name}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {tool.category} • {tool.path}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-1 text-right text-slate-100">
                        {last30}
                      </td>
                      <td className="px-2 py-1 text-center">
                        <span
                          className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] border ${badgeClass}`}
                        >
                          {badge}
                        </span>
                      </td>
                      <td className="px-2 py-1 text-center">
                        <button
                          type="button"
                          onClick={() => toggleCalculator(tool.path)}
                          className={
                            "inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-medium border transition-all " +
                            (isDisabled
                              ? "bg-slate-800 border-slate-600 text-slate-300 hover:border-emerald-400 hover:text-emerald-200"
                              : "bg-emerald-500/15 border-emerald-400/70 text-emerald-100 hover:bg-emerald-500/25")
                          }
                        >
                          {isDisabled ? "Turn ON" : "Turn OFF"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ==== Existing Layout Settings (Quick Access / Popular / Footer / Social) ==== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Access */}
          <section className="glow-card bg-slate-950/90 border border-slate-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-amber-300 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Sidebar – Quick Access
              </h2>
              <button
                type="button"
                className="text-xs flex items-center gap-1 text-slate-300 hover:text-amber-300"
                onClick={() =>
                  updateQuickAccess([
                    ...config.quickAccess,
                    { name: "New Tool", slug: "/" },
                  ])
                }
              >
                <Plus className="w-3 h-3" />
                Add link
              </button>
            </div>

            <p className="text-[11px] text-slate-500 mb-3 flex items-center gap-1">
              <GripVertical className="w-3 h-3 text-slate-500" />
              These links show in the right sidebar under “Quick Access”.
            </p>

            <div className="space-y-3">
              {config.quickAccess.map((item, idx) => (
                <div
                  key={`${item.slug}-${idx}`}
                  className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/70 rounded-lg px-3 py-2"
                >
                  <div className="flex flex-col items-center justify-center gap-1 w-7 text-slate-500 text-[10px]">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuickAccess(
                          moveItem(config.quickAccess, idx, idx - 1)
                        )
                      }
                      className="hover:text-amber-300 disabled:opacity-30"
                      disabled={idx === 0}
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <span>{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() =>
                        updateQuickAccess(
                          moveItem(config.quickAccess, idx, idx + 1)
                        )
                      }
                      className="hover:text-amber-300 disabled:opacity-30"
                      disabled={idx === config.quickAccess.length - 1}
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex-1 space-y-1">
                    <input
                      className="w-full bg-transparent border-b border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                      value={item.name}
                      onChange={(e) => {
                        const value = e.target.value;
                        const next = [...config.quickAccess];
                        next[idx] = { ...next[idx], name: value };
                        updateQuickAccess(next);
                      }}
                      placeholder="Label (e.g. Currency Converter)"
                    />
                    <input
                      className="w-full bg-transparent border-b border-slate-800 text-[11px] text-slate-400 focus:outline-none focus:border-amber-400"
                      value={item.slug}
                      onChange={(e) => {
                        const value = e.target.value;
                        const next = [...config.quickAccess];
                        next[idx] = { ...next[idx], slug: value };
                        updateQuickAccess(next);
                      }}
                      placeholder="/currency-converter"
                    />
                  </div>

                  <button
                    type="button"
                    className="text-slate-500 hover:text-rose-400"
                    onClick={() => {
                      const next = config.quickAccess.filter(
                        (_, i) => i !== idx
                      );
                      updateQuickAccess(next);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Sidebar Popular */}
          <section className="glow-card bg-slate-950/90 border border-slate-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-emerald-300 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Sidebar – Popular Calculators
              </h2>
              <button
                type="button"
                className="text-xs flex items-center gap-1 text-slate-300 hover:text-emerald-300"
                onClick={() =>
                  updatePopularSidebar([
                    ...config.popularSidebar,
                    { name: "New Popular", slug: "/" },
                  ])
                }
              >
                <Plus className="w-3 h-3" />
                Add link
              </button>
            </div>

            <p className="text-[11px] text-slate-500 mb-3 flex items-center gap-1">
              <GripVertical className="w-3 h-3 text-slate-500" />
              These links show in the sidebar “Popular Calculators” section.
            </p>

            <div className="space-y-3">
              {config.popularSidebar.map((item, idx) => (
                <div
                  key={`${item.slug}-${idx}`}
                  className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/70 rounded-lg px-3 py-2"
                >
                  <div className="flex flex-col items-center justify-center gap-1 w-7 text-slate-500 text-[10px]">
                    <button
                      type="button"
                      onClick={() =>
                        updatePopularSidebar(
                          moveItem(config.popularSidebar, idx, idx - 1)
                        )
                      }
                      className="hover:text-emerald-300 disabled:opacity-30"
                      disabled={idx === 0}
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <span>{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() =>
                        updatePopularSidebar(
                          moveItem(config.popularSidebar, idx, idx + 1)
                        )
                      }
                      className="hover:text-emerald-300 disabled:opacity-30"
                      disabled={idx === config.popularSidebar.length - 1}
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex-1 space-y-1">
                    <input
                      className="w-full bg-transparent border-b border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-emerald-400"
                      value={item.name}
                      onChange={(e) => {
                        const value = e.target.value;
                        const next = [...config.popularSidebar];
                        next[idx] = { ...next[idx], name: value };
                        updatePopularSidebar(next);
                      }}
                      placeholder="Label (e.g. Percentage Calculator)"
                    />
                    <input
                      className="w-full bg-transparent border-b border-slate-800 text-[11px] text-slate-400 focus:outline-none focus:border-emerald-400"
                      value={item.slug}
                      onChange={(e) => {
                        const value = e.target.value;
                        const next = [...config.popularSidebar];
                        next[idx] = { ...next[idx], slug: value };
                        updatePopularSidebar(next);
                      }}
                      placeholder="/percentage-calculator"
                    />
                  </div>

                  <button
                    type="button"
                    className="text-slate-500 hover:text-rose-400"
                    onClick={() => {
                      const next = config.popularSidebar.filter(
                        (_, i) => i !== idx
                      );
                      updatePopularSidebar(next);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Footer description */}
          <section className="glow-card bg-slate-950/90 border border-slate-800/80 rounded-2xl p-5">
            <h2 className="text-lg font-semibold text-sky-300 flex items-center gap-2 mb-3">
              <Edit3 className="w-4 h-4" />
              Footer – Description
            </h2>
            <p className="text-[11px] text-slate-500 mb-2">
              This text appears in the first column of your footer under
              “CalculatorHub”.
            </p>
            <textarea
              className="w-full h-32 bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={config.footerDescription}
              onChange={handleFooterDescriptionChange}
              placeholder="Short description about CalculatorHub..."
            />
          </section>

          {/* Footer Popular + Social */}
          <section className="space-y-4">
            {/* Footer Popular */}
            <div className="glow-card bg-slate-950/90 border border-slate-800/80 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-indigo-300 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Footer – Popular Calculators
                </h2>
                <button
                  type="button"
                  className="text-xs flex items-center gap-1 text-slate-300 hover:text-indigo-300"
                  onClick={() =>
                    updateFooterPopular([
                      ...config.footerPopular,
                      { name: "New Footer Calc", slug: "/" },
                    ])
                  }
                >
                  <Plus className="w-3 h-3" />
                  Add link
                </button>
              </div>

              <p className="text-[11px] text-slate-500 mb-2 flex items-center gap-1">
                <GripVertical className="w-3 h-3 text-slate-500" />
                These links appear as “Popular Calculators” in the footer.
              </p>

              <div className="space-y-3 text-sm">
                {config.footerPopular.map((item, idx) => (
                  <div
                    key={`${item.slug}-${idx}`}
                    className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/70 rounded-lg px-3 py-2"
                  >
                    <div className="flex flex-col items-center justify-center gap-1 w-7 text-slate-500 text-[10px]">
                      <button
                        type="button"
                        onClick={() =>
                          updateFooterPopular(
                            moveItem(config.footerPopular, idx, idx - 1)
                          )
                        }
                        className="hover:text-indigo-300 disabled:opacity-30"
                        disabled={idx === 0}
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <span>{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateFooterPopular(
                            moveItem(config.footerPopular, idx, idx + 1)
                          )
                        }
                        className="hover:text-indigo-300 disabled:opacity-30"
                        disabled={idx === config.footerPopular.length - 1}
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex-1 space-y-1">
                      <input
                        className="w-full bg-transparent border-b border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-indigo-400"
                        value={item.name}
                        onChange={(e) => {
                          const value = e.target.value;
                          const next = [...config.footerPopular];
                          next[idx] = { ...next[idx], name: value };
                          updateFooterPopular(next);
                        }}
                        placeholder="Label (e.g. Currency Converter – Live Rates)"
                      />
                      <input
                        className="w-full bg-transparent border-b border-slate-800 text-[11px] text-slate-400 focus:outline-none focus:border-indigo-400"
                        value={item.slug}
                        onChange={(e) => {
                          const value = e.target.value;
                          const next = [...config.footerPopular];
                          next[idx] = { ...next[idx], slug: value };
                          updateFooterPopular(next);
                        }}
                        placeholder="/currency-converter"
                      />
                    </div>

                    <button
                      type="button"
                      className="text-slate-500 hover:text-rose-400"
                      onClick={() => {
                        const next = config.footerPopular.filter(
                          (_, i) => i !== idx
                        );
                        updateFooterPopular(next);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Links */}
            <div className="glow-card bg-slate-950/90 border border-slate-800/80 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-fuchsia-300 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Footer – Social Links
                </h2>
                <button
                  type="button"
                  className="text-xs flex items-center gap-1 text-slate-300 hover:text-fuchsia-300"
                  onClick={() =>
                    updateSocialLinks([
                      ...config.socialLinks,
                      { label: "New Social", url: "https://example.com" },
                    ])
                  }
                >
                  <Plus className="w-3 h-3" />
                  Add link
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mb-2 flex items-center gap-1">
                <GripVertical className="w-3 h-3 text-slate-500" />
                These links show as small pills under the footer description.
              </p>

              <div className="space-y-3 text-sm">
                {config.socialLinks.map((item, idx) => (
                  <div
                    key={`${item.label}-${idx}`}
                    className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/70 rounded-lg px-3 py-2"
                  >
                    <div className="flex flex-col items-center justify-center gap-1 w-7 text-slate-500 text-[10px]">
                      <button
                        type="button"
                        onClick={() =>
                          updateSocialLinks(
                            moveItem(config.socialLinks, idx, idx - 1)
                          )
                        }
                        className="hover:text-fuchsia-300 disabled:opacity-30"
                        disabled={idx === 0}
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <span>{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateSocialLinks(
                            moveItem(config.socialLinks, idx, idx + 1)
                          )
                        }
                        className="hover:text-fuchsia-300 disabled:opacity-30"
                        disabled={idx === config.socialLinks.length - 1}
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex-1 space-y-1">
                      <input
                        className="w-full bg-transparent border-b border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-fuchsia-400"
                        value={item.label}
                        onChange={(e) => {
                          const value = e.target.value;
                          const next = [...config.socialLinks];
                          next[idx] = { ...next[idx], label: value };
                          updateSocialLinks(next);
                        }}
                        placeholder="Platform name (e.g. Twitter / X)"
                      />
                      <input
                        className="w-full bg-transparent border-b border-slate-800 text-[11px] text-slate-400 focus:outline-none focus:border-fuchsia-400"
                        value={item.url}
                        onChange={(e) => {
                          const value = e.target.value;
                          const next = [...config.socialLinks];
                          next[idx] = { ...next[idx], url: value };
                          updateSocialLinks(next);
                        }}
                        placeholder="https://..."
                      />
                    </div>

                    <button
                      type="button"
                      className="text-slate-500 hover:text-rose-400"
                      onClick={() => {
                        const next = config.socialLinks.filter(
                          (_, i) => i !== idx
                        );
                        updateSocialLinks(next);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Small preview link */}
        <div className="mt-6 text-xs text-slate-500">
          <span>Preview changes: </span>
          <Link
            to="/"
            className="text-sky-400 hover:text-sky-300 underline underline-offset-2"
          >
            Go to homepage
          </Link>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
