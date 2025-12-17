import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ZoomIn, ZoomOut } from "lucide-react";

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

interface Document {
  id: string;
  title: string;
  document_url: string;
  document_type?: string;
  created_at?: string;
}

export default function DocumentViewer() {
  const { token, id } = useParams<{ token: string; id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!token || !id) {
      setError("Invalid link");
      setLoading(false);
      return;
    }

    // Check authentication
    const authKey = `meetings_auth_${token}`;
    const isAuth = sessionStorage.getItem(authKey) === "true";
    if (!isAuth) {
      navigate(`/meetings/${token}`);
      return;
    }

    loadDocument();
  }, [token, id, navigate]);

  // Note: For accurate PDF page counting, you would integrate PDF.js
  // For now, we use a default value that can be set per document

  const loadDocument = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/meetings/public/${token}`);
      if (!res.ok) {
        throw new Error("Failed to load documents");
      }
      const data = await res.json();
      const found = data.documents?.find((d: Document) => d.id === id);
      if (!found) {
        throw new Error("Document not found");
      }
      setDocument(found);
      
      // For PDFs, try to get actual page count using PDF.js
      if (found.document_url.toLowerCase().endsWith(".pdf") || found.document_type?.toLowerCase() === "pdf") {
        await loadPDFPageCount(found.document_url);
      } else {
        setTotalPages(1); // Images are single page
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load document");
    } finally {
      setLoading(false);
    }
  };

  const loadPDFPageCount = async (pdfUrl: string) => {
    try {
      // Load PDF.js from CDN
      if (!window.pdfjsLib) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.async = true;
        
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => {
            console.warn('PDF.js failed to load, using fallback');
            resolve(); // Don't reject, just continue with fallback
          };
          document.head.appendChild(script);
        });
      }

      // @ts-ignore - PDF.js is loaded dynamically
      const pdfjsLib = window.pdfjsLib;
      if (!pdfjsLib) {
        // If PDF.js still didn't load, use fallback
        setTotalPages(1);
        return;
      }

      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      // Try to load the PDF to get page count
      // Use a timeout to avoid hanging if the PDF can't be loaded
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout loading PDF')), 10000)
      );

      const loadingTask = pdfjsLib.getDocument({
        url: pdfUrl,
        httpHeaders: {},
        withCredentials: false,
      });
      
      const pdf = await Promise.race([loadingTask.promise, timeoutPromise]) as any;
      setTotalPages(pdf.numPages);
    } catch (e: any) {
      console.warn('Failed to load PDF page count:', e);
      // Fallback: try to estimate or use a reasonable default
      // For now, set to 1 and let user navigate - they'll see if there are more pages
      setTotalPages(1);
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-[#54037C] text-xl">Loading document...</div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-red-600 text-xl">{error || "Document not found"}</div>
      </div>
    );
  }

  const isPDF = document.document_url.toLowerCase().endsWith(".pdf") || document.document_type?.toLowerCase() === "pdf";

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Top Navigation Bar - Matching Navbar Color */}
      <div className="sticky top-0 z-50 bg-[#54037C]/70 backdrop-blur-sm border-b border-[#54037C]/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back Button and Zoom Out */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/meetings/${token}`)}
                className="flex items-center gap-2 text-white hover:text-purple-200 transition"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom Out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
            </div>

            {/* Center: Page Navigation */}
            <div className="flex items-center gap-4">
              <button
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                className="px-4 py-2 text-white hover:bg-white/20 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ←
              </button>
              <span className="text-white font-semibold min-w-[120px] text-center">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className="px-4 py-2 text-white hover:bg-white/20 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                →
              </button>
            </div>

            {/* Right: Zoom In */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                title="Zoom In"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Document Viewer */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div
            className="overflow-auto flex items-center justify-center p-8"
            style={{
              maxHeight: "calc(100vh - 200px)",
            }}
          >
            {isPDF ? (
              <div className="w-full" style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}>
                <embed
                  src={`${document.document_url}#page=${currentPage}&zoom=${zoom}`}
                  type="application/pdf"
                  className="w-full border-0"
                  style={{ height: "80vh", minHeight: "600px" }}
                  title={document.title}
                  onError={() => {
                    setError("Failed to load PDF. The document may not be accessible or your browser may not support PDF embedding.");
                  }}
                />
                <div className="text-center mt-4 text-sm text-gray-600">
                  <p>If the PDF doesn't load, 
                    <a href={document.document_url} target="_blank" rel="noopener noreferrer" className="text-[#54037C] underline ml-1">
                      click here to open it in a new tab
                    </a>
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center" style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center" }}>
                <img
                  src={document.document_url}
                  alt={document.title}
                  className="max-w-full h-auto"
                  style={{ maxHeight: "80vh" }}
                  onError={(e) => {
                    setError("Failed to load document image");
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
