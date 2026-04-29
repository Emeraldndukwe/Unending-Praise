import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
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

type AnalyticsData = {
  meta: {
    requestedYear: number;
    currentYear: number;
    dailyRange: number;
    availableYears: number[];
    hasVisitorIp: boolean;
  };
  pageViews: { last7Days: number; last30Days: number; allTime: number };
  uniqueVisitors: { last7Days: number; last30Days: number; allTime: number };
  yearly: {
    year: number;
    pageViews: number;
    uniqueVisitors: number;
    previousYear: number;
    previousYearPageViews: number;
    previousYearUniqueVisitors: number;
  };
  monthly: Array<{ month: string; pageViews: number; uniqueVisitors: number }>;
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

export default function Analytics({ headers }: AnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState<number>(() => new Date().getFullYear());
  const [dailyRange, setDailyRange] = useState<number>(7);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/api/analytics/stats?year=${year}&dailyRange=${dailyRange}`,
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

  // Daily views series, normalized to exactly `dailyRange` slots (fills missing days with 0)
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
        const di = typeof v.date === "string"
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

  const monthlyData = useMemo(() => {
    if (!data) return [] as { label: string; pageViews: number; uniqueVisitors: number }[];
    const yr = data.yearly?.year ?? new Date().getFullYear();
    const out: { label: string; pageViews: number; uniqueVisitors: number }[] = [];
    for (let m = 0; m < 12; m++) {
      const d = new Date(yr, m, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const match = data.monthly.find((mm) => {
        const base = typeof mm.month === "string" ? new Date(mm.month) : new Date(String(mm.month));
        return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}` === key;
      });
      out.push({
        label: d.toLocaleString("en-US", { month: "short" }),
        pageViews: match?.pageViews ?? 0,
        uniqueVisitors: match?.uniqueVisitors ?? 0,
      });
    }
    return out;
  }, [data]);

  const quarterlyData = useMemo(() => {
    if (!monthlyData.length) return [] as { label: string; pageViews: number; uniqueVisitors: number }[];
    const groups = [
      ["Jan", "Feb", "Mar"],
      ["Apr", "May", "Jun"],
      ["Jul", "Aug", "Sep"],
      ["Oct", "Nov", "Dec"],
    ];
    return groups.map((labels, i) => {
      const slice = monthlyData.filter((m) => labels.includes(m.label));
      const pageViews = slice.reduce((s, m) => s + m.pageViews, 0);
      const uniqueVisitors = slice.reduce((s, m) => s + m.uniqueVisitors, 0);
      return { label: `Q${i + 1}`, pageViews, uniqueVisitors };
    });
  }, [monthlyData]);

  const handlePrint = () => window.print();

  const handleExportCSV = () => {
    if (!data) return;
    const rows: string[] = [];
    rows.push("Unending Praise - Analytics Report");
    rows.push(`Generated: ${new Date().toLocaleString()}`);
    rows.push(`Reporting year: ${data.yearly.year}`);
    rows.push(`Daily range: last ${data.meta.dailyRange} days`);
    rows.push("");
    rows.push("VISITOR STATISTICS");
    rows.push("Period,Unique Visitors,Page Views");
    rows.push(`Last 7 Days,${data.uniqueVisitors.last7Days},${data.pageViews.last7Days}`);
    rows.push(`Last 30 Days,${data.uniqueVisitors.last30Days},${data.pageViews.last30Days}`);
    rows.push(`All Time,${data.uniqueVisitors.allTime},${data.pageViews.allTime}`);
    rows.push("");
    rows.push(`YEAR ${data.yearly.year}`);
    rows.push("Metric,Value");
    rows.push(`Page Views,${data.yearly.pageViews}`);
    rows.push(`Unique Visitors,${data.yearly.uniqueVisitors}`);
    rows.push(`Previous Year (${data.yearly.previousYear}) Page Views,${data.yearly.previousYearPageViews}`);
    rows.push(`Previous Year (${data.yearly.previousYear}) Unique Visitors,${data.yearly.previousYearUniqueVisitors}`);
    rows.push("");
    rows.push("MONTHLY BREAKDOWN");
    rows.push("Month,Unique Visitors,Page Views");
    monthlyData.forEach((m) => rows.push(`${m.label},${m.uniqueVisitors},${m.pageViews}`));
    rows.push("");
    rows.push("QUARTERLY BREAKDOWN");
    rows.push("Quarter,Unique Visitors,Page Views");
    quarterlyData.forEach((q) => rows.push(`${q.label},${q.uniqueVisitors},${q.pageViews}`));
    rows.push("");
    rows.push(`DAILY VIEWS (Last ${data.meta.dailyRange} Days)`);
    rows.push("Date,Views");
    dailySeries.forEach((d) => rows.push(`${d.label},${d.views}`));
    rows.push("");
    rows.push("MOST VISITED PAGES");
    rows.push("Rank,Page Path,Views");
    data.pageRankings.forEach((p, i) => rows.push(`${i + 1},"${p.page}",${p.views}`));

    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `analytics-report-${data.yearly.year}-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const headerControls = (
    <div className="flex flex-wrap items-center gap-2 no-print">
      <div className="inline-flex items-center gap-2 bg-white/80 border border-[#54037C]/15 rounded-xl px-3 py-2 shadow-sm">
        <CalendarIcon size={16} className="text-[#54037C]" />
        <label className="text-xs font-semibold text-gray-600">Year</label>
        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          className="bg-transparent text-sm font-semibold text-[#54037C] focus:outline-none cursor-pointer"
        >
          {(data?.meta.availableYears ?? [year]).map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
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

  const pageViewsTrend = pctChange(data.yearly.pageViews, data.yearly.previousYearPageViews);
  const uniqueTrend = pctChange(data.yearly.uniqueVisitors, data.yearly.previousYearUniqueVisitors);

  // Daily chart geometry
  const chartW = 720;
  const chartH = 220;
  const padL = 36;
  const padR = 12;
  const padT = 16;
  const padB = 28;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;
  const dailyMax = Math.max(...dailySeries.map((d) => d.views), 1);
  const niceMax = Math.ceil(dailyMax * 1.15) || 1;
  const points = dailySeries.map((d, i) => {
    const x = padL + (dailySeries.length === 1 ? innerW / 2 : (i / (dailySeries.length - 1)) * innerW);
    const y = padT + innerH - (d.views / niceMax) * innerH;
    return { ...d, x, y };
  });
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${(padT + innerH).toFixed(2)} L ${points[0].x.toFixed(2)} ${(padT + innerH).toFixed(2)} Z`
    : "";
  const yTicks = 4;
  const tickValues = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((niceMax / yTicks) * i));

  // Monthly chart geometry
  const mChartW = 720;
  const mChartH = 240;
  const mPadL = 36;
  const mPadR = 12;
  const mPadT = 16;
  const mPadB = 32;
  const mInnerW = mChartW - mPadL - mPadR;
  const mInnerH = mChartH - mPadT - mPadB;
  const mMax = Math.max(...monthlyData.map((m) => Math.max(m.pageViews, m.uniqueVisitors)), 1);
  const mNice = Math.ceil(mMax * 1.15) || 1;
  const groupW = mInnerW / 12;
  const barW = Math.max(6, groupW * 0.32);

  // Page ranking percentage bars
  const topViews = data.pageRankings[0]?.views || 1;

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
              {data.meta.requestedYear !== data.meta.currentYear && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                  Viewing {data.meta.requestedYear}
                </span>
              )}
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
              Year: {data.yearly.year} • Daily range: last {data.meta.dailyRange} days
            </p>
            <p className="text-sm text-gray-500">Generated: {new Date().toLocaleString()}</p>
          </div>

          {/* KPI Cards (4 across) */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print-section"
          >
            <KpiCard
              title={`${data.yearly.year} Page Views`}
              value={data.yearly.pageViews}
              subtitle={`vs ${data.yearly.previousYear}: ${formatNumber(data.yearly.previousYearPageViews)}`}
              icon={<Eye size={18} />}
              accent="from-[#54037C] to-[#8A4EBF]"
              trend={pageViewsTrend}
            />
            <KpiCard
              title={`${data.yearly.year} Unique Visitors`}
              value={data.yearly.uniqueVisitors}
              subtitle={`vs ${data.yearly.previousYear}: ${formatNumber(data.yearly.previousYearUniqueVisitors)}`}
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
          </motion.div>

          {/* Daily views line chart */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-5 sm:p-6 border border-[#54037C]/10 mt-4 print-section"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
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

            <div className="overflow-x-auto">
              <svg
                viewBox={`0 0 ${chartW} ${chartH}`}
                className="w-full min-w-[560px] h-[220px]"
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
                        x={padL - 6}
                        y={y + 4}
                        textAnchor="end"
                        className="fill-gray-400"
                        fontSize="10"
                      >
                        {formatNumber(t)}
                      </text>
                    </g>
                  );
                })}

                {/* Area + line */}
                {points.length > 0 && (
                  <>
                    <path d={areaPath} fill="url(#lineFill)" />
                    <path
                      d={linePath}
                      fill="none"
                      stroke="#54037C"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {points.map((p, i) => (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r={3.5} fill="#54037C" />
                        <title>{`${p.label}: ${formatNumber(p.views)} views`}</title>
                      </g>
                    ))}
                  </>
                )}

                {/* X-axis labels (sparse to avoid clutter) */}
                {points.map((p, i) => {
                  const step = Math.ceil(points.length / 7);
                  if (i % step !== 0 && i !== points.length - 1) return null;
                  return (
                    <text
                      key={i}
                      x={p.x}
                      y={chartH - 8}
                      textAnchor="middle"
                      className="fill-gray-500"
                      fontSize="10"
                    >
                      {p.short}
                    </text>
                  );
                })}
              </svg>
            </div>
          </motion.div>

          {/* Monthly grouped bars + Quarterly cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-5 sm:p-6 border border-[#54037C]/10 lg:col-span-2 print-section"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#54037C]">
                    Monthly Breakdown — {data.yearly.year}
                  </h2>
                  <p className="text-xs text-gray-500">Page views and unique visitors per month</p>
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

              <div className="overflow-x-auto">
                <svg
                  viewBox={`0 0 ${mChartW} ${mChartH}`}
                  className="w-full min-w-[640px] h-[240px]"
                  role="img"
                  aria-label="Monthly breakdown chart"
                >
                  {/* Grid */}
                  {Array.from({ length: 5 }, (_, i) => i).map((i) => {
                    const t = Math.round((mNice / 4) * i);
                    const y = mPadT + mInnerH - (t / mNice) * mInnerH;
                    return (
                      <g key={i}>
                        <line
                          x1={mPadL}
                          x2={mPadL + mInnerW}
                          y1={y}
                          y2={y}
                          stroke="#E5E7EB"
                          strokeDasharray="3 3"
                        />
                        <text
                          x={mPadL - 6}
                          y={y + 4}
                          textAnchor="end"
                          className="fill-gray-400"
                          fontSize="10"
                        >
                          {formatNumber(t)}
                        </text>
                      </g>
                    );
                  })}

                  {monthlyData.map((m, i) => {
                    const groupX = mPadL + i * groupW + (groupW - barW * 2 - 4) / 2;
                    const pvH = (m.pageViews / mNice) * mInnerH;
                    const uvH = (m.uniqueVisitors / mNice) * mInnerH;
                    const baseY = mPadT + mInnerH;
                    return (
                      <g key={m.label}>
                        <rect
                          x={groupX}
                          y={baseY - pvH}
                          width={barW}
                          height={pvH}
                          rx="3"
                          fill="#54037C"
                        >
                          <title>{`${m.label} — ${formatNumber(m.pageViews)} page views`}</title>
                        </rect>
                        <rect
                          x={groupX + barW + 4}
                          y={baseY - uvH}
                          width={barW}
                          height={uvH}
                          rx="3"
                          fill="#F59E0B"
                        >
                          <title>{`${m.label} — ${formatNumber(m.uniqueVisitors)} unique visitors`}</title>
                        </rect>
                        <text
                          x={mPadL + i * groupW + groupW / 2}
                          y={mChartH - 10}
                          textAnchor="middle"
                          className="fill-gray-600"
                          fontSize="10"
                        >
                          {m.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-5 sm:p-6 border border-[#54037C]/10 print-section"
            >
              <h2 className="text-lg sm:text-xl font-bold text-[#54037C] mb-4">
                Quarterly Summary
              </h2>
              <div className="space-y-3">
                {quarterlyData.map((q) => {
                  const pvShare = data.yearly.pageViews
                    ? (q.pageViews / data.yearly.pageViews) * 100
                    : 0;
                  return (
                    <div key={q.label} className="rounded-xl border border-gray-200 p-3 hover:bg-gray-50 transition">
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
            </motion.div>
          </div>

          {/* Page rankings */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-5 sm:p-6 border border-[#54037C]/10 mt-4 print-section"
          >
            <h2 className="text-lg sm:text-xl font-bold text-[#54037C] mb-4">Most Visited Pages</h2>
            {data.pageRankings.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-8">No page views yet</div>
            ) : (
              <div className="space-y-2">
                {data.pageRankings.map((p, i) => {
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
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.03 }}
                            className="h-full bg-gradient-to-r from-[#54037C] to-[#8A4EBF]"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Monthly table (kept for print) */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-5 sm:p-6 border border-[#54037C]/10 mt-4 print-section"
          >
            <h2 className="text-lg sm:text-xl font-bold text-[#54037C] mb-4">
              {data.yearly.year} Month-by-Month Detail
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2 font-semibold">Month</th>
                    <th className="py-2 font-semibold text-right">Unique Visitors</th>
                    <th className="py-2 font-semibold text-right">Page Views</th>
                    <th className="py-2 font-semibold text-right">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((m) => {
                    const share = data.yearly.pageViews
                      ? (m.pageViews / data.yearly.pageViews) * 100
                      : 0;
                    return (
                      <tr key={m.label} className="border-b last:border-0">
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
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}

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
    <div className="relative overflow-hidden rounded-2xl bg-white shadow-lg border border-[#54037C]/10 p-5">
      <div
        className={`absolute -right-8 -top-8 w-28 h-28 rounded-full bg-gradient-to-br ${accent} opacity-15`}
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{title}</h3>
          <div
            className={`w-8 h-8 rounded-xl bg-gradient-to-br ${accent} text-white flex items-center justify-center shadow-sm`}
          >
            {icon}
          </div>
        </div>
        <p className="text-3xl font-extrabold text-gray-900 mt-3 leading-none">
          {formatNumber(value)}
        </p>
        <div className="mt-2 flex items-center gap-2">
          {trend !== undefined && <TrendBadge value={trend ?? null} />}
          {subtitle && <span className="text-[11px] text-gray-500">{subtitle}</span>}
        </div>
      </div>
    </div>
  );
}
