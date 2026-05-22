import { useEffect, useRef } from "react";
import {
  MessageSquareQuote,
  Map,
  Mail,
  Music,
  ClipboardList,
  MessageCircle,
  Tags,
  Calendar,
  ArrowRight,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import type { AdminTab } from "./adminNav";
import { staggerReveal } from "./adminMotion";

type DashboardStats = {
  pendingTestimonies: number;
  approvedTestimonies: number;
  crusades: number;
  messages: number;
  songs: number;
  pendingSubmissions: number;
  crusadeTypes: number;
};

type AdminDashboardProps = {
  stats: DashboardStats;
  userName?: string;
  onNavigate: (tab: AdminTab) => void;
  onRefresh: () => void;
  visibleTabs: AdminTab[];
  loading?: boolean;
};

type StatCard = {
  label: string;
  value: number;
  tab: AdminTab;
  icon: LucideIcon;
  accent?: boolean;
  suffix?: string;
};

function StatCard({
  card,
  onNavigate,
}: {
  card: StatCard;
  onNavigate: (tab: AdminTab) => void;
}) {
  const Icon = card.icon;
  return (
    <button
      type="button"
      onClick={() => onNavigate(card.tab)}
      data-admin-reveal
      className={`group text-left rounded-2xl p-5 transition-shadow duration-200 hover:shadow-lg ${
        card.accent
          ? "bg-gradient-to-br from-[#54037C] via-[#7a1eb3] to-[#8A4EBF] text-white shadow-md"
          : "bg-white border border-[#54037C]/8 shadow-sm hover:border-[#54037C]/20"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            card.accent ? "bg-white/15" : "bg-[#54037C]/8 text-[#54037C]"
          }`}
        >
          <Icon size={18} strokeWidth={1.75} />
        </div>
        <ArrowRight
          size={16}
          className={`mt-1 opacity-0 transition group-hover:opacity-100 ${
            card.accent ? "text-white/70" : "text-[#54037C]/50"
          }`}
        />
      </div>
      <p className={`mt-4 text-sm font-medium ${card.accent ? "text-white/80" : "text-gray-500"}`}>
        {card.label}
      </p>
      <p className={`mt-1 text-3xl font-bold tracking-tight ${card.accent ? "text-white" : "text-gray-900"}`}>
        {card.value.toLocaleString()}
        {card.suffix && (
          <span className={`ml-1 text-base font-medium ${card.accent ? "text-white/70" : "text-gray-400"}`}>
            {card.suffix}
          </span>
        )}
      </p>
    </button>
  );
}

export default function AdminDashboard({
  stats,
  userName,
  onNavigate,
  onRefresh,
  visibleTabs,
  loading,
}: AdminDashboardProps) {
  const quickActions = (
    [
      {
        label: "Review testimonies",
        tab: "testimonies",
        description: `${stats.pendingTestimonies} pending approval`,
      },
      {
        label: "Check messages",
        tab: "messages",
        description: `${stats.messages} total messages`,
      },
      {
        label: "Form submissions",
        tab: "form-submissions",
        description: `${stats.pendingSubmissions} awaiting review`,
      },
      {
        label: "View analytics",
        tab: "analytics",
        description: "Traffic and engagement",
      },
    ] satisfies Array<{ label: string; tab: AdminTab; description: string }>
  ).filter((action) => visibleTabs.includes(action.tab));

  const statCards = (
    [
      {
        label: "Pending Testimonies",
        value: stats.pendingTestimonies,
        tab: "testimonies",
        icon: MessageSquareQuote,
        accent: true,
      },
      {
        label: "Approved Testimonies",
        value: stats.approvedTestimonies,
        tab: "testimonies",
        icon: MessageSquareQuote,
      },
      {
        label: "Crusades",
        value: stats.crusades,
        tab: "crusades",
        icon: Map,
      },
      {
        label: "Messages",
        value: stats.messages,
        tab: "messages",
        icon: Mail,
      },
      {
        label: "Songs",
        value: stats.songs,
        tab: "songs",
        icon: Music,
      },
      {
        label: "Pending Submissions",
        value: stats.pendingSubmissions,
        tab: "form-submissions",
        icon: ClipboardList,
      },
    ] satisfies StatCard[]
  ).filter((card) => visibleTabs.includes(card.tab));

  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    staggerReveal(rootRef.current);
  }, [statCards.length, quickActions.length]);

  return (
    <div ref={rootRef} className="space-y-6">
      <div
        data-admin-reveal
        className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <p className="text-sm font-medium text-[#8A4EBF]">Welcome back</p>
          <h2 className="text-2xl md:text-3xl font-bold text-[#54037C] mt-1">
            {userName ? `Hello, ${userName.split(" ")[0]}` : "Admin Dashboard"}
          </h2>
          <p className="text-sm text-gray-500 mt-2 max-w-xl">
            Your overview of content, submissions, and activity across Unending Praise.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-white border border-[#54037C]/15 px-4 py-2.5 text-sm font-semibold text-[#54037C] shadow-sm hover:bg-[#54037C]/5 transition disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh data
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <StatCard key={card.label} card={card} onNavigate={onNavigate} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div
          data-admin-reveal
          className="xl:col-span-2 rounded-2xl bg-white border border-[#54037C]/8 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-[#54037C]">Quick Actions</h3>
              <p className="text-sm text-gray-500 mt-0.5">Jump to the tasks that need attention</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => onNavigate(action.tab)}
                data-admin-reveal
                className="group flex items-center justify-between rounded-xl border border-gray-100 bg-[#FAF9F6] px-4 py-4 text-left hover:border-[#54037C]/20 hover:bg-[#54037C]/5 transition-colors duration-200"
              >
                <div>
                  <p className="font-semibold text-gray-800 group-hover:text-[#54037C]">
                    {action.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                </div>
                <ArrowRight
                  size={16}
                  className="text-gray-300 group-hover:text-[#54037C] transition shrink-0"
                />
              </button>
            ))}
          </div>
        </div>

        <div
          data-admin-reveal
          className="rounded-2xl bg-gradient-to-br from-[#54037C] to-[#8A4EBF] p-6 text-white shadow-md"
        >
          <h3 className="text-lg font-bold">Content Summary</h3>
          <p className="text-sm text-white/75 mt-1 mb-5">At a glance across your admin areas</p>
          <div className="space-y-3">
            {visibleTabs.includes("comments") && (
              <SummaryRow icon={MessageCircle} label="Comments" onClick={() => onNavigate("comments")} />
            )}
            {visibleTabs.includes("crusade-types") && (
              <SummaryRow
                icon={Tags}
                label={`${stats.crusadeTypes} crusade types`}
                onClick={() => onNavigate("crusade-types")}
              />
            )}
            {visibleTabs.includes("events") && (
              <SummaryRow icon={Calendar} label="Manage events" onClick={() => onNavigate("events")} />
            )}
            {visibleTabs.includes("trainings") && (
              <SummaryRow
                icon={MessageSquareQuote}
                label="Trainings & resources"
                onClick={() => onNavigate("trainings")}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl bg-white/10 px-4 py-3 text-sm font-medium hover:bg-white/15 transition"
    >
      <span className="flex items-center gap-2">
        <Icon size={16} />
        {label}
      </span>
      <ArrowRight size={14} className="text-white/60" />
    </button>
  );
}
