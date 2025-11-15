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
  BarChart3,
  Eye,
  EyeOff,
} from "lucide-react";
import SEOHead from "../components/SEOHead";
import { toolsData } from "../data/toolsData";

type ViewCountMap = Record<string, number>;

type FlatCalculator = {
  name: string;
  path: string;
  category: string;
};

const VIEW_COUNT_KEY = "ch_calc_view_counts";

function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length || from === to) return list;
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { config, setConfig } = useSiteConfig();

  // Flatten all calculators from toolsData so we can show stats for each
  const allCalculators: FlatCalculator[] = React.useMemo(
    () =>
      toolsData.flatMap((cat) =>
        cat.tools.map((t) => ({
          name: t.name,
          path: t.path,
          category: cat.name,
        }))
      ),
    []
  );

  const [viewCounts, setViewCounts] = React.useState<ViewCountMap>({});

  // Load view counts once (per browser) – CalculatorGuard should be writing here
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(VIEW_COUNT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        setViewCounts(parsed as ViewCountMap);
      }
    } catch {
      // ignore
    }
  }, []);

  const totalCalculators = allCalculators.length;
  const disabledSet = new Set(config.disabledCalculators);
  const disabledCount = disabledSet.size;
  const activeCount = totalCalculators - disabledCount;

  // Sort calculators by views (high → low)
  const sortedByViews: FlatCalculator[] = React.useMemo(() => {
    return [...allCalculators].sort(
      (a, b) =>
        (viewCounts[b.path] ?? 0) - (viewCounts[a.path] ?? 0)
    );
  }, [allCalculators, viewCounts]);

  React.useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate("/admin/login", { replace: true });
    }
  }, [navigate]);

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
      const disabled = new Set(prev.disabledCalculators);
      if (disabled.has(path)) {
        disabled.delete(path);
      } else {
        disabled.add(path);
      }
      return { ...prev, disabledCalculators: Array.from(disabled) };
    });
  };

  return (
    <>
      <SEOHead
        title="Admin Dashboard – CalculatorHub"
        description="Internal admin dashboard for managing CalculatorHub sidebar, footer content, and calculator visibility."
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
                Manage sidebar quick access, popular calculators, footer
                content, and calculator visibility.
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

        {/* Small KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="glow-card bg-slate-950/90 border border-slate-800/80 rounded-2xl p-4">
            <p className="text-xs text-slate-400 mb-1">Total calculators</p>
            <p className="text-2xl font-semibold text-white">{totalCalculators}</p>
          </div>
          <div className="glow-card bg-slate-950/90 border border-emerald-500/40 rounded-2xl p-4">
            <p className="text-xs text-slate-400 mb-1">Active calculators</p>
            <p className="text-2xl font-semibold text-emerald-300">
              {activeCount}
            </p>
          </div>
          <div className="glow-card bg-slate-950/90 border border-rose-500/40 rounded-2xl p-4">
            <p className="text-xs text-slate-400 mb-1">Disabled calculators</p>
            <p className="text-2xl font-semibold text-rose-300">
              {disabledCount}
            </p>
          </div>
        </div>

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

        {/* Calculator usage + ON/OFF control */}
        <section className="mt-10 glow-card bg-slate-950/90 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-cyan-300 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Calculator usage & status
            </h2>
            <p className="text-[11px] text-slate-500">
              Data is per-browser (from localStorage). Use the eye icon to
              temporarily disable any calculator.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400">
                  <th className="text-left py-2 pr-2">Calculator</th>
                  <th className="text-left py-2 px-2 hidden md:table-cell">
                    Category
                  </th>
                  <th className="text-right py-2 px-2">Views</th>
                  <th className="text-center py-2 pl-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedByViews.map((calc) => {
                  const views = viewCounts[calc.path] ?? 0;
                  const disabled = disabledSet.has(calc.path);
                  return (
                    <tr
                      key={calc.path}
                      className="border-b border-slate-800/70 last:border-b-0"
                    >
                      <td className="py-2 pr-2">
                        <Link
                          to={calc.path}
                          className="text-slate-100 hover:text-cyan-300"
                        >
                          {calc.name}
                        </Link>
                        <div className="text-[10px] text-slate-500">
                          {calc.path}
                        </div>
                      </td>
                      <td className="py-2 px-2 hidden md:table-cell text-slate-400">
                        {calc.category}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-200">
                        {views}
                      </td>
                      <td className="py-2 pl-2">
                        <button
                          type="button"
                          onClick={() => toggleCalculator(calc.path)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] ${
                            disabled
                              ? "bg-rose-500/15 border border-rose-500/60 text-rose-200"
                              : "bg-emerald-500/15 border border-emerald-500/60 text-emerald-200"
                          }`}
                        >
                          {disabled ? (
                            <>
                              <EyeOff className="w-3 h-3" />
                              Off
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3" />
                              On
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

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
