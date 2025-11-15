// src/pages/AdminDashboard.tsx
import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSiteConfig, NavLink, FooterLink } from "../config/siteConfig";
import { isAdminAuthenticated, logoutAdmin } from "../utils/adminAuth";
import { Shield, Settings, Trash2, Plus, LogOut, Edit3 } from "lucide-react";
import SEOHead from "../components/SEOHead";

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { config, setConfig } = useSiteConfig();

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

  return (
    <>
      <SEOHead
        title="Admin Dashboard – CalculatorHub"
        description="Internal admin dashboard for managing CalculatorHub sidebar and footer configuration."
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
                Manage sidebar quick access, popular calculators, and footer
                content.
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
                Add
              </button>
            </div>

            <p className="text-[11px] text-slate-500 mb-2">
              These links show in the right sidebar under “Quick Access”.
            </p>

            <div className="space-y-3">
              {config.quickAccess.map((item, idx) => (
                <div
                  key={`${item.slug}-${idx}`}
                  className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/70 rounded-lg px-3 py-2"
                >
                  <span className="text-xs text-slate-500 w-5">{idx + 1}.</span>
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
                Add
              </button>
            </div>

            <p className="text-[11px] text-slate-500 mb-2">
              These links show in the sidebar “Popular Calculators” section.
            </p>

            <div className="space-y-3">
              {config.popularSidebar.map((item, idx) => (
                <div
                  key={`${item.slug}-${idx}`}
                  className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/70 rounded-lg px-3 py-2"
                >
                  <span className="text-xs text-slate-500 w-5">{idx + 1}.</span>
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
                  Add
                </button>
              </div>
              <div className="space-y-3 text-sm">
                {config.footerPopular.map((item, idx) => (
                  <div
                    key={`${item.slug}-${idx}`}
                    className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/70 rounded-lg px-3 py-2"
                  >
                    <span className="text-xs text-slate-500 w-5">
                      {idx + 1}.
                    </span>
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
                  Add
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                These links show as small pills under the footer description.
              </p>

              <div className="space-y-3 text-sm">
                {config.socialLinks.map((item, idx) => (
                  <div
                    key={`${item.label}-${idx}`}
                    className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/70 rounded-lg px-3 py-2"
                  >
                    <span className="text-xs text-slate-500 w-5">
                      {idx + 1}.
                    </span>
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
