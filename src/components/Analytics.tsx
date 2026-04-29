import { useEffect, useLayoutEffect, useMemo, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import {
  Printer,
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Eye,
  Calendar as CalendarIcon,
  BarChart3,
  RefreshCw,
} from "lucide-react";

type YearValue = number | "all";

type BreakdownItem = {
  label: string;
  key: string;
  pageViews: number;
  uniqueVisitors: number;
};

type AnalyticsData = {
  meta: {
    requestedYear: number | "all";
    isAllTime: boolean;
    currentYear: number;
    dailyRange: number;
    availableYears: number[];
    hasVisitorIp: boolean;
    breakdownMode: "monthly" | "yearly";
  };
  pageViews: { last7Days: number; last30Days: number; allTime: number };
  uniqueVisitors: { last7Days: number; last30Days: number; allTime: number };
  yearly: {
    year: number | "all";
    label: string;
    pageViews: number;
    uniqueVisitors: number;
    previousYear: number | null;
    previousYearPageViews: number;
    previousYearUniqueVisitors: number;
  };
  breakdown: BreakdownItem[];
  pageRankings: Array<{ page: string; views: number }>;
  dailyViews: Array<{ date: string; views: number }>;
};

type AnalyticsProps = { headers: HeadersInit };

const RANGE_OPTIONS = [
  { value: 7, label: "7d" },
  { value: 14, label: "14d" },
  { value: 30, label: "30d" },
  { value: 90, label: "90d" },
];

function formatNumber(n: number) {
  return n.toLocaleString();
}

function pctChange(current: number, previous: number): number | null {
  if (!previous) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

function TrendBadge({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
        <Minus size={12} /> No data
      </span>
    );
  }
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  const tone = up
    ? "text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200"
    : "text-rose-700 bg-rose-50 ring-1 ring-rose-200";
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${tone}`}
    >
      <Icon size={12} />
      {up ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
}

/** Animated number that tweens to its target with GSAP. */
function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const lastValue = useRef<number>(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obj = { v: lastValue.current };
    gsap.to(obj, {
      v: value,
      duration: 0.8,
      ease: "power2.out",
      onUpdate: () => {
        if (el) el.textContent = formatNumber(Math.round(obj.v));
      },
      onComplete: () => {
        lastValue.current = value;
      },
    });
  }, [value]);

  return <span ref={ref}>{formatNumber(value)}</span>;
}

export default function Analytics({ headers }: AnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState<YearValue>(() => new Date().getFullYear());
  const [dailyRange, setDailyRange] = useState<number>(7);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const yearParam = year === "all" ? "all" : String(year);
      const res = await fetch(
        `/api/analytics/stats?year=${yearParam}&dailyRange=${dailyRange}`,
        { headers }
      );
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized. Please log in again.");
        throw new Error("Failed to fetch analytics");
      }
      const analyticsData = (await res.json()) as AnalyticsData;
      setData(analyticsData);
    } catch (e: any) {
      setError(e?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [headers, year, dailyRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Daily series — exactly `dailyRange` slots, missing days filled with 0
  const dailySeries = useMemo(() => {
    if (!data) return [] as { date: string; label: string; short: string; views: number }[];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const out: { date: string; label: string; short: string; views: number }[] = [];
    for (let i = dailyRange - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split("T")[0];
      const found = data.dailyViews.find((v) => {
        const di =
          typeof v.date === "string"
            ? v.date.split("T")[0]
            : new Date(v.date).toISOString().split("T")[0];
        return di === iso;
      });
      out.push({
        date: iso,
        label: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        short: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        views: found?.views || 0,
      });
    }
    return out;
  }, [data, dailyRange]);

  const breakdownData = useMemo<BreakdownItem[]>(() => {
    if (!data) return [];
    return data.breakdown ?? [];
  }, [data]);

  const isAllTime = data?.meta.isAllTime ?? false;
  const isYearView = !isAllTime && data?.meta.breakdownMode === "monthly";

  const quarterlyData = useMemo(() => {
    if (!isYearView || breakdownData.length !== 12) return [];
    const groups = [
      ["Jan", "Feb", "Mar"],
      ["Apr", "May", "Jun"],
      ["Jul", "Aug", "Sep"],
      ["Oct", "Nov", "Dec"],
    ];
    return groups.map((labels, i) => {
      const slice = breakdownData.filter((m) => labels.includes(m.label));
      const pageViews = slice.reduce((s, m) => s + m.pageViews, 0);
      const uniqueVisitors = slice.reduce((s, m) => s + m.uniqueVisitors, 0);
      return { label: `Q${i + 1}`, pageViews, uniqueVisitors };
    });
  }, [breakdownData, isYearView]);

  const handlePrint = () => window.print();

  const handleExportCSV = () => {
    if (!data) return;
    const rows: string[] = [];
    rows.push("Unending Praise - Analytics Report");
    rows.push(`Generated: ${new Date().toLocaleString()}`);
    rows.push(`Reporting period: ${data.yearly.label}`);
    rows.push(`Daily range: last ${data.meta.dailyRange} days`);
    rows.push("");
    rows.push("VISITOR STATISTICS");
    rows.push("Period,Unique Visitors,Page Views");
    rows.push(`Last 7 Days,${data.uniqueVisitors.last7Days},${data.pageViews.last7Days}`);
    rows.push(`Last 30 Days,${data.uniqueVisitors.last30Days},${data.pageViews.last30Days}`);
    rows.push(`All Time,${data.uniqueVisitors.allTime},${data.pageViews.allTime}`);
    rows.push("");
    rows.push(`PERIOD: ${data.yearly.label}`);
    rows.push("Metric,Value");
    rows.push(`Page Views,${data.yearly.pageViews}`);
    rows.push(`Unique Visitors,${data.yearly.uniqueVisitors}`);
    if (!isAllTime) {
      rows.push(
        `Previous Year (${data.yearly.previousYear}) Page Views,${data.yearly.previousYearPageViews}`
      );
      rows.push(
        `Previous Year (${data.yearly.previousYear}) Unique Visitors,${data.yearly.previousYearUniqueVisitors}`
      );
    }
    rows.push("");
    rows.push(isYearView ? "MONTHLY BREAKDOWN" : "YEARLY BREAKDOWN");
    rows.push(`${isYearView ? "Month" : "Year"},Unique Visitors,Page Views`);
    breakdownData.forEach((b) => rows.push(`${b.label},${b.uniqueVisitors},${b.pageViews}`));
    rows.push("");
    if (quarterlyData.length) {
      rows.push("QUARTERLY BREAKDOWN");
      rows.push("Quarter,Unique Visitors,Page Views");
      quarterlyData.forEach((q) => rows.push(`${q.label},${q.uniqueVisitors},${q.pageViews}`));
      rows.push("");
    }
    rows.push(`DAILY VIEWS (Last ${data.meta.dailyRange} Days)`);
    rows.push("Date,Views");
    dailySeries.forEach((d) => rows.push(`${d.label},${d.views}`));
    rows.push("");
    rows.push(`MOST VISITED PAGES (${data.yearly.label})`);
    rows.push("Rank,Page Path,Views");
    data.pageRankings.forEach((p, i) => rows.push(`${i + 1},"${p.page}",${p.views}`));

    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `analytics-${data.yearly.label.replace(/\s+/g, "")}-${new Date()
      .toISOString()
      .split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const headerControls = (
    <div className="flex flex-wrap items-center gap-2 no-print">
      <div className="inline-flex items-center gap-2 bg-white/80 border border-[#54037C]/15 rounded-xl px-3 py-2 shadow-sm">
        <CalendarIcon size={16} className="text-[#54037C]" />
        <label className="text-xs font-semibold text-gray-600">Period</label>
        <select
          value={year === "all" ? "all" : String(year)}
          onChange={(e) => {
            const v = e.target.value;
            setYear(v === "all" ? "all" : parseInt(v, 10));
          }}
          className="bg-transparent text-sm font-semibold text-[#54037C] focus:outline-none cursor-pointer"
        >
          <option value="all">All Time</option>
          {(data?.meta.availableYears ?? [year === "all" ? new Date().getFullYear() : year]).map(
            (y) => (
              <option key={y} value={y}>
                {y}
              </option>
            )
          )}
        </select>
      </div>

      <div className="inline-flex items-center gap-1 bg-white/80 border border-[#54037C]/15 rounded-xl p-1 shadow-sm">
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setDailyRange(opt.value)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
              dailyRange === opt.value
                ? "bg-[#54037C] text-white shadow"
                : "text-gray-600 hover:text-[#54037C]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <button
        onClick={fetchAnalytics}
        disabled={loading}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/80 border border-[#54037C]/15 text-gray-700 text-sm font-semibold shadow-sm hover:bg-white transition disabled:opacity-50"
      >
        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        Refresh
      </button>

      <button
        onClick={handlePrint}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#54037C] hover:bg-[#54037C]/90 text-white text-sm font-semibold shadow-md transition"
      >
        <Printer size={14} /> Print
      </button>
      <button
        onClick={handleExportCSV}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md transition"
      >
        <Download size={14} /> CSV
      </button>
    </div>
  );

  if (loading && !data) {
    return (
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-[#54037C]">Analytics</h1>
          {headerControls}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white/70 rounded-2xl shadow border border-[#54037C]/10 p-6 animate-pulse h-32"
            />
          ))}
        </div>
        <div className="bg-white/70 rounded-2xl shadow border border-[#54037C]/10 p-6 animate-pulse h-72" />
      </section>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const pageViewsTrend = isAllTime
    ? null
    : pctChange(data.yearly.pageViews, data.yearly.previousYearPageViews);
  const uniqueTrend = isAllTime
    ? null
    : pctChange(data.yearly.uniqueVisitors, data.yearly.previousYearUniqueVisitors);

  const periodLabel = data.yearly.label;

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-content, .print-content * { visibility: visible; }
          .print-content { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .print-header { display: block !important; page-break-after: avoid; }
          .print-section { page-break-inside: avoid; }
        }
        .print-header { display: none; }
      `}</style>

      <section className="space-y-6" ref={printRef}>
        {/* Title bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#54037C] flex items-center gap-2">
              <BarChart3 size={26} />
              Analytics
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Insight into visitors, pages, and trends
              <span className="ml-2 inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                {periodLabel}
              </span>
            </p>
          </div>
          {headerControls}
        </div>

        <div className="print-content">
          {/* Print header */}
          <div className="print-header bg-white p-6 border-b-4 border-[#54037C] mb-6">
            <h1 className="text-3xl font-bold text-[#54037C] mb-2">Analytics Report</h1>
            <p className="text-gray-600 text-lg">Unending Praise - Site Analytics</p>
            <p className="text-sm text-gray-500 mt-1">
              Period: {periodLabel} • Daily range: last {data.meta.dailyRange} days
            </p>
            <p className="text-sm text-gray-500">Generated: {new Date().toLocaleString()}</p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print-section">
            <KpiCard
              title={`${periodLabel} Page Views`}
              value={data.yearly.pageViews}
              subtitle={
                isAllTime
                  ? `Across ${data.meta.availableYears.length} year${
                      data.meta.availableYears.length === 1 ? "" : "s"
                    }`
                  : `vs ${data.yearly.previousYear}: ${formatNumber(
                      data.yearly.previousYearPageViews
                    )}`
              }
              icon={<Eye size={18} />}
              accent="from-[#54037C] to-[#8A4EBF]"
              trend={pageViewsTrend}
            />
            <KpiCard
              title={`${periodLabel} Unique Visitors`}
              value={data.yearly.uniqueVisitors}
              subtitle={
                isAllTime
                  ? "All-time unique IPs"
                  : `vs ${data.yearly.previousYear}: ${formatNumber(
                      data.yearly.previousYearUniqueVisitors
                    )}`
              }
              icon={<Users size={18} />}
              accent="from-amber-500 to-amber-300"
              trend={uniqueTrend}
            />
            <KpiCard
              title="Last 30 Days"
              value={data.uniqueVisitors.last30Days}
              subtitle={`${formatNumber(data.pageViews.last30Days)} page views`}
              icon={<CalendarIcon size={18} />}
              accent="from-emerald-500 to-emerald-300"
            />
            <KpiCard
              title="All-Time"
              value={data.uniqueVisitors.allTime}
              subtitle={`${formatNumber(data.pageViews.allTime)} page views`}
              icon={<TrendingUp size={18} />}
              accent="from-sky-500 to-sky-300"
            />
          </div>

          {/* Daily views line chart — full-width inside card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-[#54037C]/10 mt-4 print-section">
            <div className="flex flex-wrap items-center justify-between gap-2 px-5 sm:px-6 pt-5 sm:pt-6 pb-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#54037C]">Daily Page Views</h2>
                <p className="text-xs text-gray-500">
                  Last {dailyRange} days &middot;{" "}
                  <span className="font-semibold text-[#54037C]">
                    {formatNumber(dailySeries.reduce((s, d) => s + d.views, 0))}
                  </span>{" "}
                  views
                </p>
              </div>
            </div>
            <DailyLineChart series={dailySeries} />
          </div>

          {/* Breakdown bars + Quarterly cards (only for year view) */}
          <div
            className={`grid grid-cols-1 ${
              isYearView ? "lg:grid-cols-3" : "lg:grid-cols-1"
            } gap-4 mt-4`}
          >
            <div
              className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-[#54037C]/10 ${
                isYearView ? "lg:col-span-2" : ""
              } print-section`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 px-5 sm:px-6 pt-5 sm:pt-6 pb-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#54037C]">
                    {isYearView ? `Monthly Breakdown — ${periodLabel}` : "Yearly Breakdown"}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {isYearView
                      ? "Page views and unique visitors per month"
                      : "Page views and unique visitors per year"}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-gray-600">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#54037C]" /> Page views
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> Unique visitors
                  </span>
                </div>
              </div>
              <BreakdownBarChart data={breakdownData} />
            </div>

            {isYearView && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-5 sm:p-6 border border-[#54037C]/10 print-section">
                <h2 className="text-lg sm:text-xl font-bold text-[#54037C] mb-4">
                  Quarterly Summary
                </h2>
                <div className="space-y-3">
                  {quarterlyData.map((q) => {
                    const pvShare = data.yearly.pageViews
                      ? (q.pageViews / data.yearly.pageViews) * 100
                      : 0;
                    return (
                      <div
                        key={q.label}
                        className="rounded-xl border border-gray-200 p-3 hover:bg-gray-50 transition"
                      >
                        <div className="flex justify-between items-baseline">
                          <span className="font-bold text-[#54037C]">{q.label}</span>
                          <span className="text-xs text-gray-500">
                            {formatNumber(q.uniqueVisitors)} unique
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline mt-1">
                          <span className="text-sm font-semibold text-gray-800">
                            {formatNumber(q.pageViews)} page views
                          </span>
                          <span className="text-[11px] text-gray-500">{pvShare.toFixed(1)}%</span>
                        </div>
                        <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pvShare}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-[#54037C] to-[#8A4EBF]"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Page rankings */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-5 sm:p-6 border border-[#54037C]/10 mt-4 print-section">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-[#54037C]">Most Visited Pages</h2>
              <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {periodLabel}
              </span>
            </div>
            <PageRankings rankings={data.pageRankings} period={periodLabel} />
          </div>

          {/* Detail table (also used for print) */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-5 sm:p-6 border border-[#54037C]/10 mt-4 print-section">
            <h2 className="text-lg sm:text-xl font-bold text-[#54037C] mb-4">
              {isYearView ? `${periodLabel} Month-by-Month Detail` : "Year-by-Year Detail"}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2 font-semibold">{isYearView ? "Month" : "Year"}</th>
                    <th className="py-2 font-semibold text-right">Unique Visitors</th>
                    <th className="py-2 font-semibold text-right">Page Views</th>
                    <th className="py-2 font-semibold text-right">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdownData.map((m) => {
                    const share = data.yearly.pageViews
                      ? (m.pageViews / data.yearly.pageViews) * 100
                      : 0;
                    return (
                      <tr key={m.key || m.label} className="border-b last:border-0">
                        <td className="py-2 font-semibold text-gray-800">{m.label}</td>
                        <td className="py-2 text-right text-gray-700">
                          {formatNumber(m.uniqueVisitors)}
                        </td>
                        <td className="py-2 text-right text-gray-700">
                          {formatNumber(m.pageViews)}
                        </td>
                        <td className="py-2 text-right text-gray-500">{share.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                  {breakdownData.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-gray-500">
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ============================================================
   Reusable building blocks
   ============================================================ */

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  accent,
  trend,
}: {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ReactNode;
  accent: string;
  trend?: number | null;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-2xl bg-white shadow-lg border border-[#54037C]/10 p-5"
    >
      <div
        className={`absolute -right-8 -top-8 w-28 h-28 rounded-full bg-gradient-to-br ${accent} opacity-15`}
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide truncate">
            {title}
          </h3>
          <div
            className={`w-8 h-8 rounded-xl bg-gradient-to-br ${accent} text-white flex items-center justify-center shadow-sm shrink-0`}
          >
            {icon}
          </div>
        </div>
        <p className="text-3xl font-extrabold text-gray-900 mt-3 leading-none">
          <AnimatedNumber value={value} />
        </p>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {trend !== undefined && <TrendBadge value={trend ?? null} />}
          {subtitle && <span className="text-[11px] text-gray-500">{subtitle}</span>}
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   Daily Line Chart — full width with interactive tooltip
   ============================================================ */

function DailyLineChart({
  series,
}: {
  series: { date: string; label: string; short: string; views: number }[];
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const linePathRef = useRef<SVGPathElement>(null);
  const areaPathRef = useRef<SVGPathElement>(null);
  const [width, setWidth] = useState(800);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // Track container width
  useLayoutEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(280, entry.contentRect.width);
        setWidth(w);
      }
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const height = 260;
  const padL = 44;
  const padR = 16;
  const padT = 18;
  const padB = 32;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const max = Math.max(...series.map((d) => d.views), 1);
  const niceMax = Math.ceil(max * 1.15) || 1;

  const points = useMemo(
    () =>
      series.map((d, i) => {
        const x =
          padL + (series.length === 1 ? innerW / 2 : (i / (series.length - 1)) * innerW);
        const y = padT + innerH - (d.views / niceMax) * innerH;
        return { ...d, x, y };
      }),
    [series, innerW, innerH, niceMax]
  );

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${(padT + innerH).toFixed(
        2
      )} L ${points[0].x.toFixed(2)} ${(padT + innerH).toFixed(2)} Z`
    : "";

  const yTicks = 4;
  const tickValues = Array.from({ length: yTicks + 1 }, (_, i) =>
    Math.round((niceMax / yTicks) * i)
  );

  // Animate path / dots when data changes
  const seriesKey = useMemo(() => series.map((d) => `${d.date}:${d.views}`).join("|"), [series]);
  useEffect(() => {
    if (linePathRef.current) {
      try {
        const len = linePathRef.current.getTotalLength();
        gsap.fromTo(
          linePathRef.current,
          { strokeDasharray: len, strokeDashoffset: len, opacity: 1 },
          {
            strokeDashoffset: 0,
            duration: 0.9,
            ease: "power2.out",
            onComplete: () => {
              if (linePathRef.current) {
                linePathRef.current.style.strokeDasharray = "none";
              }
            },
          }
        );
      } catch (_) {
        // getTotalLength might fail in rare cases; ignore
      }
    }
    if (areaPathRef.current) {
      gsap.fromTo(
        areaPathRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: "power2.out", delay: 0.2 }
      );
    }
  }, [seriesKey]);

  const xToIndex = (px: number) => {
    if (series.length === 0) return null;
    if (series.length === 1) return 0;
    const rel = (px - padL) / innerW;
    const idx = Math.round(rel * (series.length - 1));
    return Math.min(Math.max(idx, 0), series.length - 1);
  };

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scale = width / rect.width;
    const px = (e.clientX - rect.left) * scale;
    const idx = xToIndex(px);
    if (idx !== null) setHoverIdx(idx);
  };

  const hover = hoverIdx !== null ? points[hoverIdx] : null;

  // Position the floating tooltip over the wrapper so it stays inside the card
  const wrapWidth = wrapRef.current?.clientWidth || width;
  const tooltipScale = wrapWidth / width;
  const tooltipLeft = hover ? hover.x * tooltipScale : 0;
  const tooltipTop = hover ? hover.y * tooltipScale : 0;

  return (
    <div ref={wrapRef} className="relative w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        className="block touch-none"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIdx(null)}
        role="img"
        aria-label="Daily views chart"
      >
        <defs>
          <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#54037C" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#54037C" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid */}
        {tickValues.map((t, i) => {
          const y = padT + innerH - (t / niceMax) * innerH;
          return (
            <g key={i}>
              <line
                x1={padL}
                x2={padL + innerW}
                y1={y}
                y2={y}
                stroke="#E5E7EB"
                strokeDasharray="3 3"
              />
              <text
                x={padL - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-gray-400"
                fontSize="11"
              >
                {formatNumber(t)}
              </text>
            </g>
          );
        })}

        {/* Area + line */}
        {points.length > 0 && (
          <>
            <path ref={areaPathRef} d={areaPath} fill="url(#lineFill)" />
            <path
              ref={linePathRef}
              d={linePath}
              fill="none"
              stroke="#54037C"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Hover indicator line */}
            {hover && (
              <g>
                <line
                  x1={hover.x}
                  x2={hover.x}
                  y1={padT}
                  y2={padT + innerH}
                  stroke="#54037C"
                  strokeOpacity="0.35"
                  strokeDasharray="3 3"
                />
                <circle cx={hover.x} cy={hover.y} r={6} fill="white" stroke="#54037C" strokeWidth="2" />
              </g>
            )}
          </>
        )}

        {/* X-axis labels — sparse to avoid overlap */}
        {points.map((p, i) => {
          const step = Math.max(1, Math.ceil(points.length / 7));
          if (i % step !== 0 && i !== points.length - 1) return null;
          return (
            <text
              key={i}
              x={p.x}
              y={height - 10}
              textAnchor="middle"
              className="fill-gray-500"
              fontSize="11"
            >
              {p.short}
            </text>
          );
        })}
      </svg>

      {/* Floating tooltip */}
      {hover && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full"
          style={{ left: tooltipLeft, top: tooltipTop - 12 }}
        >
          <div className="bg-[#54037C] text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
            <div className="text-[10px] opacity-80 font-normal">{hover.label}</div>
            <div className="text-sm font-bold">{formatNumber(hover.views)} views</div>
          </div>
          <div
            className="w-2 h-2 bg-[#54037C] rotate-45 mx-auto -mt-1"
            style={{ marginTop: -4 }}
          />
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Breakdown Bar Chart — full width with interactive tooltip
   ============================================================ */

function BreakdownBarChart({ data }: { data: BreakdownItem[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const barsLayerRef = useRef<SVGGElement>(null);
  const [width, setWidth] = useState(800);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(Math.max(320, entry.contentRect.width));
      }
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const height = 260;
  const padL = 44;
  const padR = 16;
  const padT = 18;
  const padB = 36;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const max = Math.max(
    ...data.map((d) => Math.max(d.pageViews, d.uniqueVisitors)),
    1
  );
  const nice = Math.ceil(max * 1.15) || 1;
  const groupCount = Math.max(data.length, 1);
  const groupW = innerW / groupCount;
  const barW = Math.max(6, groupW * 0.32);

  // Animate bars when data changes
  const dataKey = useMemo(
    () => data.map((d) => `${d.label}:${d.pageViews}:${d.uniqueVisitors}`).join("|"),
    [data]
  );
  useEffect(() => {
    if (!barsLayerRef.current) return;
    const bars = barsLayerRef.current.querySelectorAll("rect.bar");
    bars.forEach((rect) => {
      const target = parseFloat((rect as SVGRectElement).getAttribute("data-h") || "0");
      const baseY = parseFloat((rect as SVGRectElement).getAttribute("data-base") || "0");
      gsap.fromTo(
        rect,
        { attr: { y: baseY, height: 0 } },
        {
          attr: { y: baseY - target, height: target },
          duration: 0.7,
          ease: "power2.out",
        }
      );
    });
  }, [dataKey]);

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const scale = width / rect.width;
    const px = (e.clientX - rect.left) * scale - padL;
    const idx = Math.floor(px / groupW);
    if (idx >= 0 && idx < data.length) setHoverIdx(idx);
    else setHoverIdx(null);
  };

  const hover = hoverIdx !== null ? data[hoverIdx] : null;
  const hoverGroupX = hoverIdx !== null ? padL + hoverIdx * groupW + groupW / 2 : 0;
  const wrapWidth = wrapRef.current?.clientWidth || width;
  const tooltipScale = wrapWidth / width;

  return (
    <div ref={wrapRef} className="relative w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        className="block"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIdx(null)}
        role="img"
        aria-label="Breakdown chart"
      >
        {/* Grid */}
        {Array.from({ length: 5 }, (_, i) => i).map((i) => {
          const t = Math.round((nice / 4) * i);
          const y = padT + innerH - (t / nice) * innerH;
          return (
            <g key={i}>
              <line
                x1={padL}
                x2={padL + innerW}
                y1={y}
                y2={y}
                stroke="#E5E7EB"
                strokeDasharray="3 3"
              />
              <text
                x={padL - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-gray-400"
                fontSize="11"
              >
                {formatNumber(t)}
              </text>
            </g>
          );
        })}

        {/* Hover background highlight */}
        {hoverIdx !== null && (
          <rect
            x={padL + hoverIdx * groupW}
            y={padT}
            width={groupW}
            height={innerH}
            fill="#54037C"
            fillOpacity="0.05"
            rx="4"
          />
        )}

        <g ref={barsLayerRef}>
          {data.map((m, i) => {
            const groupX = padL + i * groupW + (groupW - barW * 2 - 4) / 2;
            const baseY = padT + innerH;
            const pvH = (m.pageViews / nice) * innerH;
            const uvH = (m.uniqueVisitors / nice) * innerH;
            return (
              <g key={`${m.label}-${m.key}-${i}`}>
                <rect
                  className="bar"
                  data-h={pvH}
                  data-base={baseY}
                  x={groupX}
                  y={baseY - pvH}
                  width={barW}
                  height={pvH}
                  rx="3"
                  fill="#54037C"
                />
                <rect
                  className="bar"
                  data-h={uvH}
                  data-base={baseY}
                  x={groupX + barW + 4}
                  y={baseY - uvH}
                  width={barW}
                  height={uvH}
                  rx="3"
                  fill="#F59E0B"
                />
                <text
                  x={padL + i * groupW + groupW / 2}
                  y={height - 12}
                  textAnchor="middle"
                  className="fill-gray-600"
                  fontSize="11"
                >
                  {m.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Floating tooltip */}
      {hover && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full"
          style={{ left: hoverGroupX * tooltipScale, top: 30 }}
        >
          <div className="bg-[#54037C] text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
            <div className="text-[10px] opacity-80 font-normal">{hover.label}</div>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-white" />
                {formatNumber(hover.pageViews)}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-amber-300" />
                {formatNumber(hover.uniqueVisitors)}
              </span>
            </div>
          </div>
          <div
            className="w-2 h-2 bg-[#54037C] rotate-45 mx-auto"
            style={{ marginTop: -4 }}
          />
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Page Rankings — animates progress bars when period changes
   ============================================================ */

function PageRankings({
  rankings,
  period,
}: {
  rankings: { page: string; views: number }[];
  period: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const topViews = rankings[0]?.views || 1;

  useEffect(() => {
    if (!containerRef.current) return;
    const bars = containerRef.current.querySelectorAll<HTMLElement>("[data-rank-bar]");
    gsap.fromTo(
      bars,
      { width: 0 },
      {
        width: (_i, el) => `${(el as HTMLElement).dataset.target || "0"}%`,
        duration: 0.7,
        ease: "power2.out",
        stagger: 0.04,
      }
    );
  }, [rankings, period]);

  if (rankings.length === 0) {
    return <div className="text-sm text-gray-500 text-center py-8">No page views in {period}</div>;
  }

  return (
    <div ref={containerRef} className="space-y-2">
      {rankings.map((p, i) => {
        const pct = (p.views / topViews) * 100;
        const niceLabel =
          p.page === "/"
            ? "Home"
            : p.page
                .split("/")
                .filter(Boolean)
                .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                .join(" › ") || "Home";
        return (
          <div
            key={p.page}
            className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition"
          >
            <div className="w-8 h-8 shrink-0 flex items-center justify-center bg-[#54037C] text-white rounded-full font-bold text-sm">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline gap-2">
                <div className="font-semibold text-gray-800 truncate">{niceLabel}</div>
                <div className="text-sm font-bold text-[#54037C] whitespace-nowrap">
                  {formatNumber(p.views)} views
                </div>
              </div>
              <div className="text-[11px] text-gray-500 font-mono truncate">{p.page}</div>
              <div className="mt-1.5 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  data-rank-bar
                  data-target={pct.toFixed(2)}
                  className="h-full bg-gradient-to-r from-[#54037C] to-[#8A4EBF]"
                  style={{ width: 0 }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
