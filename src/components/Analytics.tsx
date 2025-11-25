import { useEffect, useState, useRef } from "react";
import { Printer, Download } from "lucide-react";

type AnalyticsData = {
  visitors: {
    last7Days: number;
    last30Days: number;
    allTime: number;
  };
  pageRankings: Array<{
    page: string;
    views: number;
  }>;
  dailyViews: Array<{
    date: string;
    views: number;
  }>;
};

type AnalyticsProps = {
  headers: HeadersInit;
};

export default function Analytics({ headers }: AnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/analytics/stats", { headers });
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const analyticsData = await res.json();
      setData(analyticsData);
    } catch (e: any) {
      setError(e?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-[#54037C]/10 text-center">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
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

  // Prepare chart data for last 7 days
  type ChartDataItem = {
    date: string;
    label: string;
    views: number;
  };
  const chartData: ChartDataItem[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0); // Normalize to start of day
    const dateStr = date.toISOString().split("T")[0];
    // Find matching day data - handle both string and Date formats
    const dayData = data.dailyViews.find((d) => {
      const dDate = typeof d.date === 'string' ? d.date.split('T')[0] : new Date(d.date).toISOString().split('T')[0];
      return dDate === dateStr;
    });
    chartData.push({
      date: dateStr,
      label: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      views: dayData?.views || 0,
    });
  }

  const maxViews = Math.max(...chartData.map((d) => d.views), 1);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!data) return;
    
    const csvRows = [];
    
    // Header
    csvRows.push("Unending Praise - Analytics Report");
    csvRows.push(`Generated: ${new Date().toLocaleString()}`);
    csvRows.push("");
    
    // Visitor Stats
    csvRows.push("VISITOR STATISTICS");
    csvRows.push("Period,Page Views");
    csvRows.push(`Last 7 Days,${data.visitors.last7Days}`);
    csvRows.push(`Last 30 Days,${data.visitors.last30Days}`);
    csvRows.push(`All Time,${data.visitors.allTime}`);
    csvRows.push("");
    
    // Daily Views
    csvRows.push("DAILY VIEWS (Last 7 Days)");
    csvRows.push("Date,Views");
    chartData.forEach(item => {
      csvRows.push(`${item.label},${item.views}`);
    });
    csvRows.push("");
    
    // Page Rankings
    csvRows.push("MOST VISITED PAGES");
    csvRows.push("Rank,Page Path,Views");
    data.pageRankings.forEach((page, index) => {
      csvRows.push(`${index + 1},"${page.page}",${page.views}`);
    });
    
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `analytics-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content,
          .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          .print-header {
            display: block !important;
            page-break-after: avoid;
          }
          .print-section {
            page-break-inside: avoid;
          }
        }
        .print-header {
          display: none;
        }
      `}</style>
      
      <section className="space-y-6" ref={printRef}>
        {/* Action Buttons */}
        <div className="flex gap-3 no-print">
          <button
            className="px-4 py-2 bg-[#54037C] hover:bg-[#54037C]/90 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md"
            onClick={handlePrint}
          >
            <Printer size={16} />
            Print Report
          </button>
          <button
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md"
            onClick={handleExportCSV}
          >
            <Download size={16} />
            Export CSV
          </button>
          <button
            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-sm font-semibold"
            onClick={fetchAnalytics}
          >
            Refresh
          </button>
        </div>

        <div className="print-content">
          {/* Report Header for Print - only visible when printing */}
          <div className="print-header bg-white p-6 border-b-4 border-[#54037C] mb-6">
            <h1 className="text-3xl font-bold text-[#54037C] mb-2">Analytics Report</h1>
            <p className="text-gray-600 text-lg">Unending Praise - Site Analytics</p>
            <p className="text-sm text-gray-500 mt-1">Generated: {new Date().toLocaleString()}</p>
          </div>

          {/* Visitor Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print-section">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-[#54037C]/10">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Last 7 Days</h3>
              <p className="text-3xl font-bold text-[#54037C]">{data.visitors.last7Days.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Page Views</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-[#54037C]/10">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Last 30 Days</h3>
              <p className="text-3xl font-bold text-[#54037C]">{data.visitors.last30Days.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Page Views</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-[#54037C]/10">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">All Time</h3>
              <p className="text-3xl font-bold text-[#54037C]">{data.visitors.allTime.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Page Views</p>
            </div>
          </div>

      {/* Chart */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-[#54037C]/10 print-section">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#54037C]">Page Views - Last 7 Days</h2>
        </div>
        <div className="mt-6 overflow-x-auto">
          <div className="flex items-end justify-between gap-2 h-64 min-w-[560px] px-2">
            {chartData.map((item, index) => {
              const dateParts = item.label.split(',');
              const dayLabel = dateParts[0] || '';
              const dateLabel = dateParts[1]?.trim() || '';
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                  <div className="relative w-full h-56 flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-[#54037C] to-[#8A4EBF] rounded-t-lg transition-all hover:opacity-80 cursor-pointer"
                      style={{
                        height: `${(item.views / maxViews) * 100}%`,
                        minHeight: item.views > 0 ? "4px" : "0",
                      }}
                      title={`${item.label}: ${item.views} views`}
                    />
                  </div>
                  <div className="text-[10px] text-gray-600 text-center whitespace-nowrap" title={item.label}>
                    <div>{dayLabel}</div>
                    {dateLabel && <div className="text-[9px]">{dateLabel}</div>}
                  </div>
                  <div className="text-xs font-semibold text-[#54037C]">{item.views}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Page Rankings */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-[#54037C]/10 print-section">
        <h2 className="text-xl font-bold text-[#54037C] mb-4">Most Visited Pages</h2>
        {data.pageRankings.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-8">No page views yet</div>
        ) : (
          <div className="space-y-3">
            {data.pageRankings.map((page, index) => (
              <div
                key={page.page}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 flex items-center justify-center bg-[#54037C] text-white rounded-full font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">
                      {page.page === "/" 
                        ? "Home" 
                        : page.page.split("/")
                            .filter(Boolean)
                            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                            .join(" > ") || "Home"}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">{page.page}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-[#54037C]">{page.views.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">views</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
        </div>
      </section>
    </>
  );
}

