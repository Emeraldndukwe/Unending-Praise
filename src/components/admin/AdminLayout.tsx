import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  Globe,
  Bell,
  RefreshCw,
} from "lucide-react";
import AdminSearch, { type AdminSearchResult } from "./AdminSearch";
import {
  type AdminTab,
  getNavItem,
  getVisibleTabs,
  NAV_ITEMS,
} from "./adminNav";

type AdminLayoutProps = {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  role: string;
  currentUser: { name: string; email: string; role: string } | null;
  onLogout: () => void;
  onRefresh: () => void;
  loading?: boolean;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  searchResults: AdminSearchResult[];
  onSearchSelect: (result: AdminSearchResult) => void;
  children: React.ReactNode;
};

export default function AdminLayout({
  activeTab,
  onTabChange,
  role,
  currentUser,
  onLogout,
  onRefresh,
  loading,
  searchQuery,
  onSearchQueryChange,
  searchResults,
  onSearchSelect,
  children,
}: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const visibleTabs = getVisibleTabs(role);
  const navItems = NAV_ITEMS.filter((item) => visibleTabs.includes(item.id));
  const activeItem = getNavItem(activeTab);

  const initials = (currentUser?.name || currentUser?.email || "A")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#F4F2F7] flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r border-[#54037C]/8 transition-all duration-300 ${
          collapsed ? "w-[76px]" : "w-[260px]"
        }`}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 h-16 border-b border-[#54037C]/8 shrink-0 ${collapsed ? "justify-center" : ""}`}>
          <img src="/logo.png" alt="Unending Praise" className="h-9 w-9 object-contain shrink-0" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-bold text-[#54037C] text-sm leading-tight truncate">Unending Praise</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Admin</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 admin-sidebar-scroll">
          {!collapsed && (
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Menu
            </p>
          )}
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onTabChange(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      active
                        ? "bg-[#54037C] text-white shadow-md shadow-[#54037C]/20"
                        : "text-gray-600 hover:bg-[#54037C]/8 hover:text-[#54037C]"
                    } ${collapsed ? "justify-center" : ""}`}
                  >
                    {active && !collapsed && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
                    )}
                    <Icon size={18} strokeWidth={active ? 2 : 1.75} className="shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom actions */}
        <div className="shrink-0 border-t border-[#54037C]/8 p-3 space-y-1">
          {!collapsed && currentUser && (
            <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-xl bg-[#FAF9F6]">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#54037C] to-[#8A4EBF] text-white text-xs font-bold">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {currentUser.name || "Admin"}
                </p>
                <p className="text-[11px] text-gray-400 truncate">{currentUser.email}</p>
              </div>
            </div>
          )}

          <Link
            to="/"
            title={collapsed ? "Back to website" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-[#54037C]/8 hover:text-[#54037C] transition ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <Globe size={18} strokeWidth={1.75} />
            {!collapsed && <span>Back to website</span>}
          </Link>

          <button
            type="button"
            onClick={onLogout}
            title={collapsed ? "Log out" : undefined}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut size={18} strokeWidth={1.75} />
            {!collapsed && <span>Log out</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-[#54037C]/15 shadow-md text-gray-500 hover:text-[#54037C] transition z-50"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>

      {/* Main content */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          collapsed ? "ml-[76px]" : "ml-[260px]"
        }`}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-[#F4F2F7]/90 backdrop-blur-md border-b border-[#54037C]/8 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-[#54037C] truncate">{activeItem.label}</h2>
            <p className="text-xs text-gray-500 truncate hidden sm:block">{activeItem.description}</p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <AdminSearch
              query={searchQuery}
              onQueryChange={onSearchQueryChange}
              results={searchResults}
              onSelect={onSearchSelect}
            />

            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-[#54037C]/10 text-gray-500 hover:text-[#54037C] hover:border-[#54037C]/20 transition disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>

            <button
              type="button"
              className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-[#54037C]/10 text-gray-500 hover:text-[#54037C] transition"
              title="Notifications"
            >
              <Bell size={16} />
            </button>

            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[#54037C]/10">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#54037C] to-[#8A4EBF] text-white text-xs font-bold">
                {initials}
              </div>
              <div className="hidden lg:block min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate max-w-[120px]">
                  {currentUser?.name || "Admin"}
                </p>
                <p className="text-[10px] text-gray-400 capitalize">{role || "admin"}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
