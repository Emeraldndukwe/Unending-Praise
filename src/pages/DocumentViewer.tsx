import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ZoomIn, ZoomOut, Download, FileText, File, Image } from "lucide-react";

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
  downloadable?: boolean;
  created_at?: string;
}

export default function DocumentViewer() {
  const { token, id } = useParams<{ token: string; id: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!id) {
      setError("Invalid link");
      setLoading(false);
      return;
    }

    // If token is in URL (meetings route), use it
    // Otherwise (trainings route), fetch token from API
    if (token) {
      const authKey = `meetings_auth_${token}`;
      const authData = sessionStorage.getItem(authKey);
      // Check if auth data exists (could be "true" for old format or JSON for new format)
      let isAuth = authData === "true";
      if (!isAuth && authData) {
        try {
          const parsed = JSON.parse(authData);
          isAuth = parsed.authenticated === true;
        } catch (e) {
          // If parsing fails, treat as not authenticated
          isAuth = false;
        }
      }
      if (!isAuth) {
        navigate(`/meetings/${token}`);
        return;
      }
      loadDocument(token);
    } else {
      // Trainings route: try to reuse stored token first for faster navigation
      try {
        const storedToken = sessionStorage.getItem("trainings_token");
        if (storedToken) {
          const authKey = `meetings_auth_${storedToken}`;
          const authData = sessionStorage.getItem(authKey);
          let isAuth = authData === "true";
          if (!isAuth && authData) {
            try {
              const parsed = JSON.parse(authData);
              isAuth = parsed.authenticated === true;
            } catch (e) {
              isAuth = false;
            }
          }
          if (!isAuth) {
            navigate("/trainings");
            return;
          }
          loadDocument(storedToken);
          return;
        }
      } catch {
        // Fall through to API token fetch
      }

      // Fallback: fetch token from API for trainings route
      fetch('/api/trainings/token')
        .then(res => res.json())
        .then(data => {
          if (data.token) {
            const authKey = `meetings_auth_${data.token}`;
            const authData = sessionStorage.getItem(authKey);
            // Check if auth data exists (could be "true" for old format or JSON for new format)
            let isAuth = authData === "true";
            if (!isAuth && authData) {
              try {
                const parsed = JSON.parse(authData);
                isAuth = parsed.authenticated === true;
              } catch (e) {
                // If parsing fails, treat as not authenticated
                isAuth = false;
              }
            }
            if (!isAuth) {
              navigate('/trainings');
              return;
            }
            loadDocument(data.token);
          } else {
            navigate('/trainings');
          }
        })
        .catch(() => navigate('/trainings'));
    }
  }, [token, id, navigate]);

  // Note: For accurate PDF page counting, you would integrate PDF.js
  // For now, we use a default value that can be set per document

  const loadDocument = async (tokenValue: string) => {
    if (!tokenValue) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trainings/public/${tokenValue}`);
      if (!res.ok) {
        throw new Error("Failed to load documents");
      }
      const data = await res.json();
      const found = data.documents?.find((d: Document) => d.id === id);
      if (!found) {
        throw new Error("Document not found");
      }
      setDoc(found);
      
      // For PDFs, try to get actual page count using PDF.js (non-blocking)
      if (found.document_url.toLowerCase().endsWith(".pdf") || found.document_type?.toLowerCase() === "pdf") {
        // Load the PDF document for rendering
        await loadPDFDocument(found.document_url);
      } else {
        setTotalPages(1); // Images are single page
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load document");
    } finally {
      setLoading(false);
    }
  };

  const loadPDFDocument = async (pdfUrl: string) => {
    setPdfLoading(true);
    try {
      // Load PDF.js from CDN
      if (!window.pdfjsLib) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.async = true;
        
        await new Promise<void>((resolve) => {
          const existingScript = document.querySelector('script[src*="pdf.js"]');
          if (existingScript) {
            resolve();
            return;
          }
          script.onload = () => resolve();
          script.onerror = () => {
            console.warn('PDF.js failed to load');
            resolve();
          };
          document.head.appendChild(script);
        });
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      const pdfjsLib = window.pdfjsLib;
      if (!pdfjsLib) {
        throw new Error('PDF.js not available');
      }

      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      // Fix Cloudinary URL if needed
      let proxyUrl = pdfUrl;
      if (pdfUrl.includes('/image/upload/') && pdfUrl.endsWith('.pdf')) {
        proxyUrl = pdfUrl.replace('/image/upload/', '/raw/upload/');
      }
      
      // Use proxy endpoint to avoid 401 errors
      const proxyEndpoint = `/api/proxy/pdf?url=${encodeURIComponent(proxyUrl)}`;
      
      const loadingTask = pdfjsLib.getDocument({
        url: proxyEndpoint,
        httpHeaders: {},
        withCredentials: false,
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        cMapPacked: true,
      });
      
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      if (pdf && pdf.numPages) {
        setTotalPages(pdf.numPages);
      }
    } catch (e: any) {
      console.error('Failed to load PDF:', e);
      setError('Failed to load PDF: ' + (e?.message || 'Unknown error'));
    } finally {
      setPdfLoading(false);
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

  // Get file extension from URL or document type
  const getFileExtension = (): string => {
    if (doc?.document_type) {
      const type = doc.document_type.toLowerCase();
      if (type === 'pdf') return '.pdf';
      if (type === 'doc' || type === 'docx') return '.docx';
      if (type === 'xls' || type === 'xlsx') return '.xlsx';
      if (type === 'txt') return '.txt';
    }
    if (doc?.document_url) {
      const url = doc.document_url.toLowerCase();
      if (url.endsWith('.pdf')) return '.pdf';
      if (url.endsWith('.docx')) return '.docx';
      if (url.endsWith('.doc')) return '.doc';
      if (url.endsWith('.xlsx')) return '.xlsx';
      if (url.endsWith('.xls')) return '.xls';
      if (url.endsWith('.txt')) return '.txt';
      if (url.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
        const match = url.match(/\.(jpg|jpeg|png|gif|webp)$/);
        return match ? `.${match[1]}` : '.jpg';
      }
    }
    return '.pdf'; // Default fallback
  };

  // Generate proper filename for download
  const getDownloadFilename = (): string => {
    if (!doc) return 'document';
    const title = doc.title || 'document';
    // Clean title: remove special characters that might cause issues in filenames
    const cleanTitle = title.replace(/[^a-z0-9\s-]/gi, '').trim().replace(/\s+/g, '_');
    const extension = getFileExtension();
    return `${cleanTitle}${extension}`;
  };

  // Get appropriate icon for file type
  const getFileIcon = () => {
    const extension = getFileExtension().toLowerCase();
    if (extension === '.pdf') {
      return <FileText className="w-5 h-5" />;
    } else if (['.doc', '.docx'].includes(extension)) {
      return <FileText className="w-5 h-5" />;
    } else if (['.xls', '.xlsx'].includes(extension)) {
      return <File className="w-5 h-5" />;
    } else if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extension)) {
      return <Image className="w-5 h-5" />;
    }
    return <File className="w-5 h-5" />;
  };

  // Handle download with proper filename
  const handleDownload = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (!doc?.document_url) return;
    
    try {
      // Use proxy endpoint for PDFs (to handle CORS/Cloudinary issues)
      // For other files, try direct download first
      const isPDF = getFileExtension().toLowerCase() === '.pdf';
      let downloadUrl = doc.document_url;
      
      if (isPDF) {
        // Fix Cloudinary URL if needed
        let proxyUrl = doc.document_url;
        if (proxyUrl.includes('/image/upload/') && proxyUrl.endsWith('.pdf')) {
          proxyUrl = proxyUrl.replace('/image/upload/', '/raw/upload/');
        }
        downloadUrl = `/api/proxy/pdf?url=${encodeURIComponent(proxyUrl)}`;
      }
      
      // Fetch the file as a blob
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Failed to fetch file');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element for download
      const link = document.createElement('a');
      link.href = url;
      link.download = getDownloadFilename();
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: use direct link with download attribute (browser will handle it)
      const link = document.createElement('a');
      link.href = doc.document_url;
      link.download = getDownloadFilename();
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Render PDF page when currentPage or pdfDoc changes
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    
    const docUrl = doc?.document_url || '';
    const isPDFFile = docUrl.toLowerCase().endsWith(".pdf") || doc?.document_type?.toLowerCase() === "pdf";
    if (!isPDFFile) return;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        const viewport = page.getViewport({ scale: zoom / 100 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
      } catch (e: any) {
        console.error('Failed to render PDF page:', e);
        setError('Failed to render PDF page: ' + (e?.message || 'Unknown error'));
      }
    };

    renderPage();
  }, [pdfDoc, currentPage, zoom, doc]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <img 
            src="/logo.png" 
            alt="Unending praise" 
            className="h-20 md:h-24 mx-auto mb-4 animate-pulse" 
          />
          <div className="text-[#54037C] text-xl">Loading document...</div>
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-red-600 text-xl">{error || "Document not found"}</div>
      </div>
    );
  }

  const isPDF = doc.document_url.toLowerCase().endsWith(".pdf") || doc.document_type?.toLowerCase() === "pdf";
  const lowerUrl = doc.document_url.toLowerCase();
  const docType = doc.document_type?.toLowerCase();
  const isOfficeDoc =
    !!docType && (docType === "doc" || docType === "docx" || docType === "xls" || docType === "xlsx") ||
    lowerUrl.endsWith(".doc") ||
    lowerUrl.endsWith(".docx") ||
    lowerUrl.endsWith(".xls") ||
    lowerUrl.endsWith(".xlsx");

  // Get Office Online Viewer URL for Word/Excel files
  const getOfficeViewerUrl = (): string => {
    if (!doc?.document_url) return '';
    
    let fileUrl = doc.document_url;
    
    // Fix Cloudinary URLs if needed - convert image uploads to raw uploads for documents
    if (fileUrl.includes('/image/upload/')) {
      fileUrl = fileUrl.replace('/image/upload/', '/raw/upload/');
    }
    
    // Ensure we have a full URL (not relative)
    if (fileUrl.startsWith('//')) {
      fileUrl = `https:${fileUrl}`;
    } else if (fileUrl.startsWith('/')) {
      fileUrl = `${window.location.origin}${fileUrl}`;
    }
    
    // Use Google Docs Viewer as primary - it's more flexible with URLs
    // It can handle Cloudinary URLs and other publicly accessible URLs
    const encodedUrl = encodeURIComponent(fileUrl);
    return `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Top Navigation Bar - Matching Navbar Color */}
      <div className="sticky top-0 z-50 bg-[#54037C]/70 backdrop-blur-sm border-b border-[#54037C]/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back Button and Zoom Out */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  // Navigate back to trainings - auth should already be in sessionStorage
                  navigate('/trainings', { replace: true });
                }}
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

            {/* Right: Download and Zoom In */}
            <div className="flex items-center gap-4">
              {doc.document_url && (
                <a
                  href={doc.document_url}
                  onClick={handleDownload}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition flex items-center gap-2 cursor-pointer"
                  title={`Download ${getDownloadFilename()}`}
                >
                  {getFileIcon()}
                  <Download className="w-4 h-4" />
                  <span className="text-sm">Download</span>
                </a>
              )}
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
            className="flex items-center justify-center p-4 md:p-8"
            style={{
              height: "calc(100vh - 140px)",
            }}
          >
            {isPDF ? (
              <div className="w-full flex flex-col items-center">
                {pdfLoading ? (
                  <div className="text-center py-16 text-gray-500">Loading PDF...</div>
                ) : pdfDoc ? (
                  <div
                    className="flex justify-center"
                    style={{
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: "top center",
                    }}
                  >
                    <canvas
                      ref={canvasRef}
                      className="border border-gray-300 shadow-lg"
                      style={{ maxWidth: "100%", maxHeight: "100%" }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <p className="text-gray-600 mb-4">PDF failed to load</p>
                    <a 
                      href={doc.document_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[#54037C] underline"
                    >
                      Click here to open in a new tab
                    </a>
                  </div>
                )}
              </div>
            ) : isOfficeDoc ? (
              // Use Microsoft Office Online Viewer or Google Docs Viewer to display Word/Excel files
              <div className="w-full h-full flex flex-col">
                <iframe
                  src={getOfficeViewerUrl()}
                  className="w-full h-full border-0"
                  title={doc.title || "Office Document Viewer"}
                  style={{ minHeight: "600px" }}
                  onError={() => {
                    console.error("Document viewer failed to load");
                  }}
                />
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg mx-4">
                  <p className="text-sm text-blue-800 mb-2">
                    <strong>Note:</strong> If the document doesn't load above, the file may need to be publicly accessible. You can download or open it directly.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <a
                      href={doc.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#54037C] underline hover:text-[#8A4EBF] text-sm font-medium"
                    >
                      Open in new tab
                    </a>
                    <span className="text-blue-600">•</span>
                    <a
                      href={doc.document_url}
                      onClick={handleDownload}
                      className="text-[#54037C] underline hover:text-[#8A4EBF] text-sm font-medium cursor-pointer"
                    >
                      Download file
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="text-center"
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center" }}
              >
                <img
                  src={doc.document_url}
                  alt={doc.title}
                  className="max-w-full h-auto"
                  style={{ maxHeight: "100%" }}
                  onError={() => {
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
