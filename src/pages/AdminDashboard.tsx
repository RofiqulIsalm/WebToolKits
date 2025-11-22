// src/pages/AdminDashboard.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { useSiteConfig, NavLink } from "../config/siteConfig";
import { isAdminAuthenticated, logoutAdmin } from "../utils/adminAuth";
import ImageUpload from "../components/ImageUpload";
import SEOHead from "../components/SEOHead";
import { toolsData } from "../data/toolsData";
import {
  Shield,
  LayoutDashboard,
  Calculator,
  LayoutTemplate,
  Image as ImageIcon,
  LogOut,
  Search,
  Activity,
  TrendingUp,
  AlertTriangle,
  Check,
  Copy,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Menu,
  X
} from "lucide-react";

// ===== CONFIG & TYPES =====
const VIEW_STORAGE_KEY = "ch_page_views_v2";

// Supabase Client for Media Tab
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Helper: Move item in array
function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length || from === to) return list;
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

// Flatten tools
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

type Tab = "overview" | "calculators" | "layout" | "media";

// ===== MAIN COMPONENT =====
const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { config, setConfig } = useSiteConfig();

  // State
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default closed on mobile
  const [analyticsRows, setAnalyticsRows] = useState<AnalyticsRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Auth Check
  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate("/adminparky/login", { replace: true });
    }
  }, [navigate]);

  // Load Analytics
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(VIEW_STORAGE_KEY);
      const data: Record<string, number[]> = raw ? JSON.parse(raw) : {};
      const now = Date.now();
      const sevenAgo = now - 7 * 24 * 60 * 60 * 1000;
      const fourteenAgo = now - 14 * 24 * 60 * 60 * 1000;
      const thirtyAgo = now - 30 * 24 * 60 * 60 * 1000;

      const rows: AnalyticsRow[] = ALL_TOOLS.map((tool) => {
        const times = Array.isArray(data[tool.path]) ? (data[tool.path] as number[]) : [];
        let total = times.length;
        let last7 = 0;
        let last30 = 0;
        let prev7 = 0;

        for (const ts of times) {
          if (ts >= thirtyAgo) {
            last30++;
            if (ts >= sevenAgo) last7++;
            else if (ts >= fourteenAgo) prev7++;
          }
        }

        let trendPercent = 0;
        if (prev7 === 0 && last7 > 0) trendPercent = 100;
        else if (prev7 > 0) trendPercent = Math.round(((last7 - prev7) / prev7) * 100);

        let baseStatus: AnalyticsRow["status"];
        if (total === 0) baseStatus = "New";
        else if (last30 <= 5) baseStatus = "Dead";
        else if (last7 === 0) baseStatus = "Low";
        else if (last7 / Math.max(last30, 1) >= 0.6 || trendPercent >= 25) baseStatus = "Rising";
        else baseStatus = "Active";

        const disabled = config.disabledCalculators?.includes(tool.path);
        return {
          path: tool.path,
          name: tool.name,
          category: tool.category,
          total,
          last7,
          last30,
          prev7,
          trendPercent,
          status: disabled ? "Disabled" : baseStatus,
        };
      });

      rows.sort((a, b) => b.total - a.total);
      setAnalyticsRows(rows);
    } catch (err) {
      console.error("Failed to read analytics", err);
    }
  }, [config.disabledCalculators]);

  // Filtered Rows for Calculator Tab
  const filteredTools = useMemo(() => {
    return analyticsRows.filter(row =>
      row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [analyticsRows, searchTerm]);

  // Actions
  const handleLogout = () => {
    logoutAdmin();
    navigate("/adminparky/login", { replace: true });
  };

  const toggleCalculator = (path: string) => {
    setConfig((prev) => {
      const current = prev.disabledCalculators ?? [];
      const set = new Set(current);
      if (set.has(path)) set.delete(path);
      else set.add(path);
      return { ...prev, disabledCalculators: Array.from(set) };
    });
  };

  const handleNavClick = (tab: Tab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false); // Close sidebar on mobile selection
  };

  // Stats
  const totalViews = analyticsRows.reduce((sum, r) => sum + r.total, 0);
  const risingCount = analyticsRows.filter((r) => r.status === "Rising").length;
  const deadCount = analyticsRows.filter((r) => r.status === "Dead" || r.status === "Disabled").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex font-sans">
      <SEOHead title="Admin Dashboard" description="Manage CalculatorHub" />

      {/* MOBILE BACKDROP */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:relative lg:translate-x-0 lg:w-64 shadow-2xl lg:shadow-none`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Shield size={18} />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">AdminHub</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <NavButton
              active={activeTab === "overview"}
              onClick={() => handleNavClick("overview")}
              icon={<LayoutDashboard size={18} />}
              label="Overview"
            />
            <NavButton
              active={activeTab === "calculators"}
              onClick={() => handleNavClick("calculators")}
              icon={<Calculator size={18} />}
              label="Calculators"
            />
            <NavButton
              active={activeTab === "layout"}
              onClick={() => handleNavClick("layout")}
              icon={<LayoutTemplate size={18} />}
              label="Site Layout"
            />
            <NavButton
              active={activeTab === "media"}
              onClick={() => handleNavClick("media")}
              icon={<ImageIcon size={18} />}
              label="Media Library"
            />
          </nav>

          {/* User */}
          <div className="p-4 border-t border-slate-800">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all"
            >
              <LogOut size={18} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 min-w-0 overflow-auto bg-slate-950 relative">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-slate-400 hover:text-white active:scale-95 transition-transform"
          >
            <Menu size={24} />
          </button>
          <span className="font-bold text-white">AdminHub</span>
          <div className="w-8" /> {/* Spacer */}
        </div>

        <div className="p-4 md:p-6 lg:p-10 max-w-7xl mx-auto pb-20">
          {/* Header */}
          <header className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 capitalize">{activeTab}</h1>
            <p className="text-sm md:text-base text-slate-400">Manage your application settings and view performance.</p>
          </header>

          {/* TABS CONTENT */}

          {/* === OVERVIEW TAB === */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Views" value={totalViews} icon={<Activity className="text-blue-400" />} color="blue" />
                <StatCard label="Total Tools" value={ALL_TOOLS.length} icon={<Calculator className="text-purple-400" />} color="purple" />
                <StatCard label="Rising Stars" value={risingCount} icon={<TrendingUp className="text-emerald-400" />} color="emerald" />
                <StatCard label="Inactive/Dead" value={deadCount} icon={<AlertTriangle className="text-amber-400" />} color="amber" />
              </div>

              {/* Top Performers Table */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-4 md:p-6 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="font-semibold text-white">Top Performing Calculators</h3>
                  <button onClick={() => setActiveTab("calculators")} className="text-xs text-blue-400 hover:text-blue-300">View All</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left min-w-[600px]">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-900/50">
                      <tr>
                        <th className="px-6 py-3">Tool Name</th>
                        <th className="px-6 py-3 text-right">Views (Total)</th>
                        <th className="px-6 py-3 text-right">Last 30d</th>
                        <th className="px-6 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsRows.slice(0, 5).map((row) => (
                        <tr key={row.path} className="border-b border-slate-800 hover:bg-slate-800/30">
                          <td className="px-6 py-4 font-medium text-white">{row.name}</td>
                          <td className="px-6 py-4 text-right font-mono text-slate-300">{row.total}</td>
                          <td className="px-6 py-4 text-right font-mono text-emerald-400">{row.last30}</td>
                          <td className="px-6 py-4 text-center"><StatusBadge status={row.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* === CALCULATORS TAB === */}
          {activeTab === "calculators" && (
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="text"
                    placeholder="Search calculators..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="text-sm text-slate-400">
                  Showing {filteredTools.length} tools
                </div>
              </div>

              {/* Tools List */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left min-w-[800px]">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-900/50">
                      <tr>
                        <th className="px-6 py-3">Tool Name</th>
                        <th className="px-6 py-3">Category</th>
                        <th className="px-6 py-3 text-right">Views (30d)</th>
                        <th className="px-6 py-3 text-center">Status</th>
                        <th className="px-6 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTools.map((row) => {
                        const isDisabled = config.disabledCalculators?.includes(row.path);
                        return (
                          <tr key={row.path} className={`border-b border-slate-800 hover:bg-slate-800/30 ${isDisabled ? 'opacity-60' : ''}`}>
                            <td className="px-6 py-4 font-medium text-white">
                              {row.name}
                              <div className="text-xs text-slate-500 font-mono mt-0.5">{row.path}</div>
                            </td>
                            <td className="px-6 py-4 text-slate-400">{row.category}</td>
                            <td className="px-6 py-4 text-right font-mono text-slate-300">{row.last30}</td>
                            <td className="px-6 py-4 text-center"><StatusBadge status={row.status} /></td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => toggleCalculator(row.path)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isDisabled
                                  ? "bg-slate-800 text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-400"
                                  : "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                                  }`}
                              >
                                {isDisabled ? "Enable" : "Disable"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* === LAYOUT TAB === */}
          {activeTab === "layout" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              <LayoutEditor
                title="Sidebar: Quick Access"
                description="Links shown at the top of the sidebar."
                items={config.quickAccess}
                onUpdate={(items) => setConfig(prev => ({ ...prev, quickAccess: items }))}
              />
              <LayoutEditor
                title="Sidebar: Popular"
                description="Links shown in the 'Popular' sidebar section."
                items={config.popularSidebar}
                onUpdate={(items) => setConfig(prev => ({ ...prev, popularSidebar: items }))}
              />
              <LayoutEditor
                title="Footer: Popular"
                description="Links shown in the footer columns."
                items={config.footerPopular}
                onUpdate={(items) => setConfig(prev => ({ ...prev, footerPopular: items }))}
              />

              {/* Footer Description */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 md:p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Footer Description</h3>
                <p className="text-sm text-slate-400 mb-4">The text block shown in the footer.</p>
                <textarea
                  className="w-full h-32 bg-slate-950 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  value={config.footerDescription}
                  onChange={(e) => setConfig(prev => ({ ...prev, footerDescription: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* === MEDIA TAB === */}
          {activeTab === "media" && (
            <MediaManager />
          )}

        </div>
      </main>
    </div>
  );
};

// ===== SUB COMPONENTS =====

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${active
      ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
      }`}
  >
    {icon}
    <span className="font-medium">{label}</span>
  </button>
);

const StatCard: React.FC<{ label: string; value: number; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => (
  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 hover:border-slate-700 transition-colors">
    <div className={`h-12 w-12 rounded-xl bg-${color}-500/10 flex items-center justify-center`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  </div>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let styles = "bg-slate-800 text-slate-400";
  if (status === "Rising") styles = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
  if (status === "Dead") styles = "bg-rose-500/10 text-rose-400 border border-rose-500/20";
  if (status === "Disabled") styles = "bg-slate-700 text-slate-300";
  if (status === "Active") styles = "bg-blue-500/10 text-blue-400 border border-blue-500/20";

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles}`}>
      {status}
    </span>
  );
};

const LayoutEditor: React.FC<{ title: string; description: string; items: NavLink[]; onUpdate: (items: NavLink[]) => void }> = ({ title, description, items, onUpdate }) => {
  const handleChange = (idx: number, field: keyof NavLink, value: string) => {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: value };
    onUpdate(next);
  };

  const handleMove = (idx: number, dir: -1 | 1) => {
    onUpdate(moveItem(items, idx, idx + dir));
  };

  const handleDelete = (idx: number) => {
    onUpdate(items.filter((_, i) => i !== idx));
  };

  const handleAdd = () => {
    onUpdate([...items, { name: "New Link", slug: "/" }]);
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 md:p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
        <button onClick={handleAdd} className="p-2 bg-blue-600/10 text-blue-400 rounded-lg hover:bg-blue-600/20 transition-colors">
          <Plus size={18} />
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-950 border border-slate-800 p-3 rounded-xl group">
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex gap-1">
                <button onClick={() => handleMove(idx, -1)} disabled={idx === 0} className="text-slate-600 hover:text-blue-400 disabled:opacity-30"><ArrowUp size={14} /></button>
                <button onClick={() => handleMove(idx, 1)} disabled={idx === items.length - 1} className="text-slate-600 hover:text-blue-400 disabled:opacity-30"><ArrowDown size={14} /></button>
              </div>
              {/* Mobile delete button (visible only on small screens) */}
              <button onClick={() => handleDelete(idx)} className="sm:hidden text-slate-600 hover:text-rose-400">
                <Trash2 size={16} />
              </button>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              <input
                value={item.name}
                onChange={(e) => handleChange(idx, "name", e.target.value)}
                className="bg-transparent border-b border-slate-800 focus:border-blue-500 text-sm text-white px-2 py-1 focus:outline-none w-full"
                placeholder="Label"
              />
              <input
                value={item.slug}
                onChange={(e) => handleChange(idx, "slug", e.target.value)}
                className="bg-transparent border-b border-slate-800 focus:border-blue-500 text-xs font-mono text-slate-400 px-2 py-1 focus:outline-none w-full"
                placeholder="/path"
              />
            </div>

            {/* Desktop delete button */}
            <button onClick={() => handleDelete(idx)} className="hidden sm:block text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const MediaManager: React.FC = () => {
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [savedUrl, setSavedUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => { loadSavedUrl(); }, []);

  const loadSavedUrl = async () => {
    try {
      const { data, error } = await supabase.from('website_settings').select('value').eq('key', 'compound_interest_guide_image').maybeSingle();
      if (data && !error) {
        setSavedUrl(data.value);
        setUploadedImageUrl(data.value);
      }
    } catch (err) { console.error(err); }
  };

  const handleImageUploaded = async (url: string) => {
    setUploadedImageUrl(url);
    if (url) {
      await supabase.from('website_settings').upsert({ key: 'compound_interest_guide_image', value: url, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      setSavedUrl(url);
    } else {
      await supabase.from('website_settings').delete().eq('key', 'compound_interest_guide_image');
      setSavedUrl('');
    }
  };

  const copyToClipboard = () => {
    if (savedUrl) {
      navigator.clipboard.writeText(savedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 md:p-8">
      <h2 className="text-xl font-bold text-white mb-2">Compound Interest Guide Image</h2>
      <p className="text-slate-400 mb-8">Upload the image displayed in the 'How to Use' section of the Compound Interest Calculator.</p>

      <div className="max-w-2xl">
        <ImageUpload onImageUploaded={handleImageUploaded} currentImageUrl={uploadedImageUrl} />

        {savedUrl && (
          <div className="mt-6 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 truncate font-mono text-xs text-slate-400 w-full">{savedUrl}</div>
            <button onClick={copyToClipboard} className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-600/10 text-blue-400 rounded-lg hover:bg-blue-600/20 transition-colors text-sm font-medium">
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied" : "Copy URL"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
