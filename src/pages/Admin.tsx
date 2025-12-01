import { useCallback, useEffect, useMemo, useState } from "react";
import { compressImage, compressVideo } from "../utils/mediaOptimizer";
import Analytics from "../components/Analytics";
import * as XLSX from "xlsx";
import mammoth from "mammoth";

type Testimony = { 
  id: string; 
  name?: string; 
  title?: string;
  content?: string; 
  summary?: string;
  approved?: boolean; 
  images?: string[];
  videos?: string[];
  previewImage?: string;
  previewVideo?: string;
  createdAt: string;
  email?: string;
  phone?: string;
};
type Crusade = { 
  id: string; 
  title?: string; 
  description?: string;
  summary?: string;
  date?: string;
  attendance?: number;
  zone?: string;
  type?: string;
  images?: string[];
  videos?: string[];
  previewImage?: string;
  previewVideo?: string;
  createdAt: string;
};
type Message = { id: string; name?: string; email?: string; message?: string; phone?: string; subject?: string; createdAt: string };
type Song = { id: string; title?: string; artist?: string; lyrics?: string; date?: string; createdAt: string };
type Comment = { id: string; name: string; comment: string; createdAt: string };

function useAuthToken() {
  const [token, setToken] = useState<string>(() => localStorage.getItem("authToken") || "");
  const save = (t: string) => {
    setToken(t);
    if (t) localStorage.setItem("authToken", t);
    else localStorage.removeItem("authToken");
  };
  const headers = useMemo<Record<string, string>>(
    () => (token ? { Authorization: `Bearer ${token}` } : ({} as Record<string, string>)),
    [token]
  );
  return { token, setToken: save, headers: headers as HeadersInit };
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function AdminPage() {
  const { token, setToken, headers } = useAuthToken();
  const [tab, setTab] = useState<"testimonies" | "crusades" | "messages" | "songs" | "comments" | "users" | "crusade-types" | "analytics">("testimonies");
  const [role, setRole] = useState<string>("");
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [crusades, setCrusades] = useState<Crusade[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [editingLyrics, setEditingLyrics] = useState("");
  const [editingDate, setEditingDate] = useState("");
  const [songEditLoading, setSongEditLoading] = useState(false);
  const [bulkImportLoading, setBulkImportLoading] = useState(false);
  const [bulkImportError, setBulkImportError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<Array<{id:string; name:string; email:string; role:string; status:string; created_at?: string;}>>([]);
  const [crusadeTypes, setCrusadeTypes] = useState<Array<{id:string; name:string; description?:string; created_at?:string;}>>([]);

  const uploadMedia = useCallback(
    async (dataUrl: string, scope: 'testimonies' | 'crusades') => {
      if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl;
      const authHeaders: Record<string, string> = {};
      const headerSource = headers as HeadersInit;
      if (headerSource instanceof Headers) {
        headerSource.forEach((value, key) => {
          authHeaders[key] = value;
        });
      } else if (Array.isArray(headerSource)) {
        headerSource.forEach(([key, value]) => {
          authHeaders[key] = value;
        });
      } else if (headerSource && typeof headerSource === 'object') {
        Object.assign(authHeaders, headerSource as Record<string, string>);
      }

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { ...authHeaders, 'content-type': 'application/json' },
        body: JSON.stringify({ dataUrl, folder: `unendingpraise/${scope}` }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Upload failed');
      }

      const payload = await res.json();
      return (payload?.url as string) || dataUrl;
    },
    [headers]
  );

  const uploadTestimonyMedia = useCallback(
    (dataUrl: string) => uploadMedia(dataUrl, 'testimonies'),
    [uploadMedia]
  );

  const uploadCrusadeMedia = useCallback(
    (dataUrl: string) => uploadMedia(dataUrl, 'crusades'),
    [uploadMedia]
  );

  // Admin comments management
  const [commentEntityType, setCommentEntityType] = useState<"testimony" | "crusade">("testimony");
  const [commentEntityId, setCommentEntityId] = useState<string>("");
  const [managedComments, setManagedComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const toCamelTestimony = (row: any): Testimony => {
    let images = [];
    let videos = [];
    try {
      if (typeof row.images === 'string') {
        images = JSON.parse(row.images);
      } else if (Array.isArray(row.images)) {
        images = row.images;
      }
    } catch (e) {
      console.error('Error parsing images:', e);
    }
    try {
      if (typeof row.videos === 'string') {
        videos = JSON.parse(row.videos);
      } else if (Array.isArray(row.videos)) {
        videos = row.videos;
      }
    } catch (e) {
      console.error('Error parsing videos:', e);
    }
    return {
      id: row.id,
      name: row.name,
      title: row.title,
      content: row.content,
      summary: row.summary,
      approved: row.approved,
      images: images,
      videos: videos,
      previewImage: row.previewImage ?? row.preview_image,
      previewVideo: row.previewVideo ?? row.preview_video,
      createdAt: row.createdAt ?? row.created_at ?? new Date().toISOString(),
      email: row.email,
      phone: row.phone,
    };
  };
  const toCamelCrusade = (row: any): Crusade => {
    let images = [];
    let videos = [];
    try {
      if (typeof row.images === 'string') {
        images = JSON.parse(row.images);
      } else if (Array.isArray(row.images)) {
        images = row.images;
      }
    } catch (e) {
      console.error('Error parsing images:', e);
    }
    try {
      if (typeof row.videos === 'string') {
        videos = JSON.parse(row.videos);
      } else if (Array.isArray(row.videos)) {
        videos = row.videos;
      }
    } catch (e) {
      console.error('Error parsing videos:', e);
    }
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      summary: row.summary,
      date: row.date,
      attendance: row.attendance ? parseInt(row.attendance) : undefined,
      zone: row.zone,
      type: row.type,
      images: images,
      videos: videos,
      previewImage: row.previewImage ?? row.preview_image,
      previewVideo: row.previewVideo ?? row.preview_video,
      createdAt: row.createdAt ?? row.created_at ?? new Date().toISOString(),
    };
  };

  const refreshCrusadeTypes = async () => {
    try {
      const types = await api<Array<{id:string; name:string; description?:string; created_at?:string;}>>("/api/crusade-types");
      setCrusadeTypes(types);
    } catch (e: any) {
      console.error("Failed to load crusade types:", e);
    }
  };

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, c, m, s] = await Promise.all([
        api<Testimony[]>("/api/testimonies"),
        api<Crusade[]>("/api/crusades"),
        api<Message[]>("/api/messages"),
        api<Song[]>("/api/songs"),
      ]);
      setTestimonies((t as any[]).map(toCamelTestimony));
      setCrusades((c as any[]).map(toCamelCrusade));
      setMessages(m);
      setSongs(s);
      await refreshCrusadeTypes();
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // load current user role if logged in
    const loadRole = async () => {
      if (!token) return;
      try {
        const res = await fetch('/api/auth/me', { headers: headers as HeadersInit });
        if (res.ok) {
          const data = await res.json();
          setRole(data?.user?.role || "");
        }
      } catch {}
    };
    loadRole();
    refreshCrusadeTypes();
  }, [token]); // Re-run when token changes

  const approveTestimony = async (id: string) => {
    await api<Testimony>(`/api/testimonies/${id}/approve`, { method: "POST", headers: headers as HeadersInit });
    refresh();
  };

  const deleteItem = async (kind: string, id: string) => {
    await fetch(`/api/${kind}/${id}`, { method: "DELETE", headers: headers as HeadersInit });
    refresh();
  };

  const createCrusade = async (payload: Partial<Crusade>) => {
    try {
      // Clean payload - remove undefined values and ensure arrays are arrays
      const cleanPayload: any = {};
      Object.keys(payload).forEach(key => {
        const value = payload[key as keyof Crusade];
        if (value !== undefined) {
          if (key === 'images' || key === 'videos') {
            cleanPayload[key] = Array.isArray(value) ? value : [];
          } else {
            cleanPayload[key] = value;
          }
        }
      });
      
      const res = await fetch(`/api/crusades`, {
        method: "POST",
        headers: Object.assign({}, headers as Record<string, string>, { "content-type": "application/json" }),
        body: JSON.stringify(cleanPayload),
      });
      
      const contentType = res.headers.get("content-type");
      let data: any;
      
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Server returned non-JSON response (${res.status}): ${text || 'Unknown error'}`);
      }
      
      if (!res.ok) {
        throw new Error(data?.error || data?.details || `HTTP ${res.status}: Failed to create crusade`);
      }
      refresh();
    } catch (err: any) {
      const errorMsg = err?.message || err?.error || err?.details || "Failed to create crusade";
      alert(`Error creating crusade: ${errorMsg}`);
      console.error('Create crusade error:', err);
      console.error('Payload sent:', payload);
      throw err;
    }
  };

  const createTestimony = async (payload: Partial<Testimony>) => {
    await api<Testimony>(`/api/testimonies`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    refresh();
  };

  const createMessage = async (payload: Partial<Message>) => {
    await api<Message>(`/api/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    refresh();
  };

  const createSong = async (payload: Partial<Song>) => {
    await api<Song>(`/api/songs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    refresh();
  };

  const updateSong = async (id: string, payload: Partial<Song>) => {
    await api<Song>(`/api/songs/${id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    await refresh();
  };

  // Helper function to parse Word document text
  const parseWordDocumentText = (text: string): Partial<Song>[] => {
    const songs: Partial<Song>[] = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return songs;
    }
    
    // Find header row
    let headerRow = 0;
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('date') && (line.includes('song') || line.includes('s/n'))) {
        headerRow = i;
        break;
      }
    }
    
    // Parse header to find column indices
    const headerLine = lines[headerRow];
    // Word tables are often tab-separated or have multiple spaces
    let separator: string | RegExp = '\t';
    if (!headerLine.includes('\t')) {
      // Try to detect separator
      if (headerLine.match(/\s{3,}/)) {
        separator = /\s{3,}/;
      } else if (headerLine.includes('|')) {
        separator = '|';
      }
    }
    
    const headerParts = headerLine.split(separator).map(p => p.trim()).filter(p => p);
    let dateCol = -1;
    const songCols: number[] = [];
    
    headerParts.forEach((cell, idx) => {
      const cellStr = cell.toLowerCase();
      if (cellStr.includes('date') && !cellStr.includes('song')) {
        dateCol = idx;
      } else if (cellStr.includes('song')) {
        songCols.push(idx);
      }
    });
    
    // If no SONG columns found but we have DATE, look for columns after DATE
    if (songCols.length === 0 && dateCol >= 0) {
      for (let i = dateCol + 1; i < headerParts.length; i++) {
        const cellStr = headerParts[i].toLowerCase();
        if (!cellStr.includes('date') && !cellStr.includes('s/n') && !cellStr.includes('serial')) {
          songCols.push(i);
        }
      }
    }
    
    // Helper function to normalize date
    const normalizeDate = (dateValue: string): string | null => {
      if (!dateValue) return null;
      const datePattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
      const match = dateValue.match(datePattern);
      if (match) {
        let month = match[1].padStart(2, '0');
        let day = match[2].padStart(2, '0');
        let year = match[3];
        if (year.length === 2) year = '20' + year;
        return `${year}-${month}-${day}`;
      }
      return null;
    };
    
    // Helper function to extract title and lyrics
    // Title appears BEFORE "Verse 1" or other section labels
    const extractSongFromCell = (cellValue: string): { title: string; lyrics: string } => {
      if (!cellValue) return { title: '', lyrics: '' };
      const cellText = cellValue.trim();
      if (!cellText) return { title: '', lyrics: '' };
      
      const lines = cellText.split(/\r?\n/).map(l => l.trim()).filter(l => l);
      if (lines.length === 0) return { title: '', lyrics: '' };
      
      // Section labels include: Verse, Chorus, Bridge, Intro, Outro, Solo, Pre-chorus, All:, etc.
      const sectionPattern = /^(verse|chorus|bridge|intro|outro|solo|pre-chorus|interlude|tag|all:)\s*\d*/i;
      
      // Find the first section label
      let firstSectionIdx = -1;
      for (let i = 0; i < lines.length; i++) {
        if (sectionPattern.test(lines[i].toLowerCase())) {
          firstSectionIdx = i;
          break;
        }
      }
      
      let title = '';
      let lyricsStartIdx = -1;
      
      if (firstSectionIdx >= 0) {
        // Title is the line BEFORE the first section label
        if (firstSectionIdx > 0) {
          title = lines[firstSectionIdx - 1];
        }
        // Lyrics start after the section label
        lyricsStartIdx = firstSectionIdx + 1;
      } else {
        // No section label found - first line is title, rest are lyrics
        if (lines.length > 0) {
          title = lines[0];
          lyricsStartIdx = 1;
        }
      }
      
      // Extract lyrics
      const lyrics = lyricsStartIdx >= 0 && lyricsStartIdx < lines.length 
        ? lines.slice(lyricsStartIdx).join('\n').trim()
        : '';
      
      return { title: title.trim(), lyrics };
    };
    
    // Parse data rows
    for (let i = headerRow + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parse the line with the same separator
      let parts: string[] = [];
      if (separator === '\t') {
        parts = line.split('\t').map(p => p.trim()).filter(p => p);
      } else if (separator instanceof RegExp) {
        parts = line.split(separator).map(p => p.trim()).filter(p => p);
      } else {
        parts = line.split(separator).map(p => p.trim()).filter(p => p);
      }
      
      // Get date for this row
      let rowDate: string | null = null;
      if (dateCol >= 0 && parts[dateCol]) {
        rowDate = normalizeDate(parts[dateCol]);
      }
      
      // Extract songs from SONG columns
      for (const songCol of songCols) {
        if (songCol >= parts.length) continue;
        
        const songData = extractSongFromCell(parts[songCol]);
        
        // Accept songs with either title or lyrics (or both)
        if (songData.title || songData.lyrics) {
          const song: Partial<Song> = {
            title: songData.title || 'Untitled',
            lyrics: songData.lyrics,
            date: rowDate || undefined,
            artist: undefined,
          };
          songs.push(song);
        }
      }
    }
    
    return songs;
  };

  const parseSongsFromFile = async (file: File): Promise<Partial<Song>[]> => {
    return new Promise((resolve, reject) => {
      const fileName = file.name.toLowerCase();
      
      // For .docx files, we need to read as ArrayBuffer
      if (fileName.endsWith('.docx')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = e.target?.result;
            if (!data || !(data instanceof ArrayBuffer)) {
              reject(new Error("Failed to read Word document. Please ensure the file is a valid .docx file and not corrupted."));
              return;
            }
            
            mammoth.extractRawText({ arrayBuffer: data })
              .then((result) => {
                try {
                  const songs = parseWordDocumentText(result.value);
                  resolve(songs);
                } catch (error: any) {
                  reject(new Error(`Failed to parse Word document: ${error.message}`));
                }
              })
              .catch((error: any) => {
                const errorMsg = error.message || 'Unknown error';
                if (errorMsg.includes('Corrupted zip') || errorMsg.includes('missing')) {
                  reject(new Error("The Word document appears to be corrupted or incomplete. Please try:\n1. Opening and re-saving the file in Word\n2. Converting to Excel (.xlsx) or CSV format\n3. Ensuring the file is not password protected"));
                } else {
                  reject(new Error(`Failed to parse Word document: ${errorMsg}. If the file is a .doc file (old format), please convert it to .docx or use Excel/CSV format instead.`));
                }
              });
          } catch (error: any) {
            reject(new Error(`Failed to read file: ${error.message}`));
          }
        };
        reader.onerror = () => {
          reject(new Error("Failed to read Word document file."));
        };
        reader.readAsArrayBuffer(file);
        return;
      }
      
      // For other file types (Excel, CSV, Text)
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error("Failed to read file"));
            return;
          }

          let songs: Partial<Song>[] = [];

          if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
            // Parse CSV or text file - handle format with S/N, DATE, SONG 1-6 columns
            const text = typeof data === 'string' ? data : new TextDecoder().decode(data as ArrayBuffer);
            const lines = text.split('\n').filter(line => line.trim());
            
            if (lines.length === 0) {
              resolve([]);
              return;
            }
            
            // Find header row
            let headerRow = 0;
            for (let i = 0; i < Math.min(5, lines.length); i++) {
              const line = lines[i].toLowerCase();
              if (line.includes('date') && (line.includes('song') || line.includes('s/n'))) {
                headerRow = i;
                break;
              }
            }
            
            // Parse header to find column indices
            const headerLine = lines[headerRow];
            let separator = ',';
            if (headerLine.includes('\t')) separator = '\t';
            else if (headerLine.includes(',')) separator = ',';
            else if (headerLine.includes('|')) separator = '|';
            
            const headerParts = headerLine.split(separator).map(p => p.trim().replace(/^"|"$/g, ''));
            let dateCol = -1;
            const songCols: number[] = [];
            
            headerParts.forEach((cell, idx) => {
              const cellStr = cell.toLowerCase();
              if (cellStr.includes('date') && !cellStr.includes('song')) {
                dateCol = idx;
              } else if (cellStr.includes('song')) {
                songCols.push(idx);
              }
            });
            
            // If no SONG columns found but we have DATE, look for columns after DATE
            if (songCols.length === 0 && dateCol >= 0) {
              for (let i = dateCol + 1; i < headerParts.length; i++) {
                const cellStr = headerParts[i].toLowerCase();
                if (!cellStr.includes('date') && !cellStr.includes('s/n') && !cellStr.includes('serial')) {
                  songCols.push(i);
                }
              }
            }
            
            // Helper function to normalize date
            const normalizeDate = (dateValue: string): string | null => {
              if (!dateValue) return null;
              const datePattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
              const match = dateValue.match(datePattern);
              if (match) {
                let month = match[1].padStart(2, '0');
                let day = match[2].padStart(2, '0');
                let year = match[3];
                if (year.length === 2) year = '20' + year;
                return `${year}-${month}-${day}`;
              }
              return null;
            };
            
            // Helper function to extract title and lyrics
            // Title appears BEFORE "Verse 1" or other section labels
            const extractSongFromCell = (cellValue: string): { title: string; lyrics: string } => {
              if (!cellValue) return { title: '', lyrics: '' };
              const cellText = cellValue.trim();
              if (!cellText) return { title: '', lyrics: '' };
              
              const lines = cellText.split(/\r?\n/).map(l => l.trim()).filter(l => l);
              if (lines.length === 0) return { title: '', lyrics: '' };
              
              // Section labels include: Verse, Chorus, Bridge, Intro, Outro, Solo, Pre-chorus, All:, etc.
              const sectionPattern = /^(verse|chorus|bridge|intro|outro|solo|pre-chorus|interlude|tag|all:)\s*\d*/i;
              
              // Find the first section label
              let firstSectionIdx = -1;
              for (let i = 0; i < lines.length; i++) {
                if (sectionPattern.test(lines[i].toLowerCase())) {
                  firstSectionIdx = i;
                  break;
                }
              }
              
              let title = '';
              let lyricsStartIdx = -1;
              
              if (firstSectionIdx >= 0) {
                // Title is the line BEFORE the first section label
                if (firstSectionIdx > 0) {
                  title = lines[firstSectionIdx - 1];
                }
                // Lyrics start after the section label
                lyricsStartIdx = firstSectionIdx + 1;
              } else {
                // No section label found - first line is title, rest are lyrics
                if (lines.length > 0) {
                  title = lines[0];
                  lyricsStartIdx = 1;
                }
              }
              
              // Extract lyrics
              const lyrics = lyricsStartIdx >= 0 && lyricsStartIdx < lines.length 
                ? lines.slice(lyricsStartIdx).join('\n').trim()
                : '';
              
              return { title: title.trim(), lyrics };
            };
            
            // Parse data rows
            for (let i = headerRow + 1; i < lines.length; i++) {
              const line = lines[i].trim();
              if (!line) continue;
              
              // Parse the line with the same separator
              let parts: string[] = [];
              if (separator === '\t') {
                parts = line.split('\t').map(p => p.trim().replace(/^"|"$/g, ''));
              } else if (separator === ',') {
                // Handle quoted CSV values
                parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
              } else {
                parts = line.split(separator).map(p => p.trim());
              }
              
              // Get date for this row
              let rowDate: string | null = null;
              if (dateCol >= 0 && parts[dateCol]) {
                rowDate = normalizeDate(parts[dateCol]);
              }
              
              // Extract songs from SONG columns
              for (const songCol of songCols) {
                if (songCol >= parts.length) continue;
                
                const songData = extractSongFromCell(parts[songCol]);
                
                // Accept songs with either title or lyrics (or both)
                if (songData.title || songData.lyrics) {
                  const song: Partial<Song> = {
                    title: songData.title || 'Untitled',
                    lyrics: songData.lyrics,
                    date: rowDate || undefined,
                    artist: undefined,
                  };
                  songs.push(song);
                }
              }
            }
          } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            // Parse Excel file - handle format with S/N, DATE, SONG 1, SONG 2, SONG 3 columns
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
            
            if (jsonData.length === 0) {
              resolve([]);
              return;
            }
            
            // Find header row (look for DATE, SONG 1, SONG 2, etc.)
            let headerRow = 0;
            for (let i = 0; i < Math.min(5, jsonData.length); i++) {
              const row = jsonData[i] || [];
              const rowStr = row.map((cell: any) => String(cell).toLowerCase()).join(' ');
              if (rowStr.includes('date') && (rowStr.includes('song') || rowStr.includes('s/n'))) {
                headerRow = i;
                break;
              }
            }
            
            const headerRowData = jsonData[headerRow] || [];
            
            // Find DATE column
            let dateCol = -1;
            const songCols: number[] = [];
            
            headerRowData.forEach((cell: any, idx: number) => {
              const cellStr = String(cell).toLowerCase();
              if (cellStr.includes('date') && !cellStr.includes('song')) {
                dateCol = idx;
              } else if (cellStr.includes('song')) {
                songCols.push(idx);
              }
            });
            
            // If no SONG columns found but we have DATE, look for columns after DATE
            // Also check for numbered song columns (SONG 1, SONG 2, etc. up to SONG 6 or more)
            if (songCols.length === 0 && dateCol >= 0) {
              // Look for columns that might be songs (after DATE and S/N columns)
              for (let i = dateCol + 1; i < headerRowData.length; i++) {
                const cellStr = String(headerRowData[i] || '').toLowerCase();
                // If it's not clearly a date or S/N column, assume it's a song column
                if (!cellStr.includes('date') && !cellStr.includes('s/n') && !cellStr.includes('serial')) {
                  songCols.push(i);
                }
              }
            }
            
            // Sort song columns to ensure proper order
            songCols.sort((a, b) => a - b);
            
            // Helper function to normalize date
            const normalizeDate = (dateValue: any): string | null => {
              if (!dateValue) return null;
              
              let dateStr = '';
              if (typeof dateValue === 'number') {
                // Excel date serial number
                const excelDate = XLSX.SSF.parse_date_code(dateValue);
                if (excelDate) {
                  return `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
                }
                return null;
              } else {
                dateStr = String(dateValue).trim();
              }
              
              // Parse M/D/YYYY or other formats
              const datePattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
              const match = dateStr.match(datePattern);
              if (match) {
                let month = match[1].padStart(2, '0');
                let day = match[2].padStart(2, '0');
                let year = match[3];
                if (year.length === 2) year = '20' + year;
                return `${year}-${month}-${day}`;
              }
              
              return null;
            };
            
            // Helper function to extract title and lyrics from a cell
            // Title appears BEFORE "Verse 1" or other section labels
            const extractSongFromCell = (cellValue: any): { title: string; lyrics: string } => {
              if (!cellValue) return { title: '', lyrics: '' };
              
              const cellText = String(cellValue).trim();
              if (!cellText) return { title: '', lyrics: '' };
              
              // Split by newlines
              const lines = cellText.split(/\r?\n/).map(l => l.trim()).filter(l => l);
              
              if (lines.length === 0) return { title: '', lyrics: '' };
              
              // Section labels include: Verse, Chorus, Bridge, Intro, Outro, Solo, Pre-chorus, All:, etc.
              const sectionPattern = /^(verse|chorus|bridge|intro|outro|solo|pre-chorus|interlude|tag|all:)\s*\d*/i;
              
              // Find the first section label
              let firstSectionIdx = -1;
              for (let i = 0; i < lines.length; i++) {
                if (sectionPattern.test(lines[i].toLowerCase())) {
                  firstSectionIdx = i;
                  break;
                }
              }
              
              let title = '';
              let lyricsStartIdx = -1;
              
              if (firstSectionIdx >= 0) {
                // Title is the line BEFORE the first section label
                if (firstSectionIdx > 0) {
                  title = lines[firstSectionIdx - 1];
                }
                // Lyrics start after the section label
                lyricsStartIdx = firstSectionIdx + 1;
              } else {
                // No section label found - first line is title, rest are lyrics
                if (lines.length > 0) {
                  title = lines[0];
                  lyricsStartIdx = 1;
                }
              }
              
              // Extract lyrics
              const lyrics = lyricsStartIdx >= 0 && lyricsStartIdx < lines.length 
                ? lines.slice(lyricsStartIdx).join('\n').trim()
                : '';
              
              return { title: title.trim(), lyrics };
            };
            
            // Parse data rows
            for (let i = headerRow + 1; i < jsonData.length; i++) {
              const row = jsonData[i] || [];
              
              // Skip empty rows
              if (row.every((cell: any) => !cell || String(cell).trim() === '')) continue;
              
              // Get date for this row
              let rowDate: string | null = null;
              if (dateCol >= 0 && row[dateCol]) {
                rowDate = normalizeDate(row[dateCol]);
              }
              
              // Extract songs from SONG columns
              for (const songCol of songCols) {
                if (songCol >= row.length) continue;
                
                const songData = extractSongFromCell(row[songCol]);
                
                // Accept songs with either title or lyrics (or both)
                if (songData.title || songData.lyrics) {
                  const song: Partial<Song> = {
                    title: songData.title || 'Untitled',
                    lyrics: songData.lyrics,
                    date: rowDate || undefined,
                    artist: undefined, // No artist in this format
                  };
                  songs.push(song);
                }
              }
            }
          } else {
            // This should not be reached for .docx files as they're handled separately
            reject(new Error("Unsupported file format. Please use CSV, Excel (.xlsx, .xls), Word (.docx), or text files."));
            return;
          }

          resolve(songs);
        } catch (error: any) {
          reject(new Error(`Failed to parse file: ${error.message}`));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const handleBulkImport = async (file: File) => {
    setBulkImportLoading(true);
    setBulkImportError(null);
    
    try {
      const songsToImport = await parseSongsFromFile(file);
      
      if (songsToImport.length === 0) {
        setBulkImportError("No songs found in the file. Please check:\n1. The file has a header row with 'DATE' and 'SONG' columns\n2. Song titles appear BEFORE 'Verse 1' labels\n3. The file format matches the expected structure (S/N, DATE, SONG 1, SONG 2, etc.)");
        setBulkImportLoading(false);
        return;
      }
      
      // Create songs one by one
      let successCount = 0;
      let errorCount = 0;
      
      for (const song of songsToImport) {
        try {
          await createSong(song);
          successCount++;
        } catch (err: any) {
          console.error("Error creating song:", err);
          errorCount++;
        }
      }
      
      if (errorCount > 0) {
        setBulkImportError(`Imported ${successCount} songs successfully. ${errorCount} songs failed to import.`);
      } else {
        setBulkImportError(null);
        alert(`Successfully imported ${successCount} song${successCount === 1 ? '' : 's'}!`);
      }
    } catch (error: any) {
      setBulkImportError(error.message || "Failed to import songs");
    } finally {
      setBulkImportLoading(false);
    }
  };

  // Auth UI
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submitAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body = mode === "login" ? { email, password } : { name, email, password };
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Auth failed");
      setToken(data.token);
      setError(null);
      // Refresh role immediately after login
      setTimeout(async () => {
        try {
          const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${data.token}` } });
          if (res.ok) {
            const userData = await res.json();
            setRole(userData?.user?.role || "");
          }
        } catch {}
      }, 100);
      refresh();
    } catch (err: any) {
      setError(err?.message || "Auth failed");
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#54037C]/10 to-[#8A4EBF]/10 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-[#54037C]/20">
          <div className="text-center mb-8">
            <img src="/logo.png" alt="Unending praise" className="h-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-[#54037C] mb-2">Admin Portal</h1>
            <p className="text-gray-600 text-sm">Unending Praise - Pastor Chris Live</p>
          </div>
          <div className="flex gap-2 mb-6 bg-[#54037C]/5 rounded-full p-1">
            <button 
              className={`flex-1 px-4 py-2 rounded-full text-sm font-semibold transition ${mode === "login" ? "bg-[#54037C] text-white shadow-md" : "text-gray-600"}`} 
              onClick={() => setMode("login")}
            >
              Login
            </button>
            <button 
              className={`flex-1 px-4 py-2 rounded-full text-sm font-semibold transition ${mode === "register" ? "bg-[#54037C] text-white shadow-md" : "text-gray-600"}`} 
              onClick={() => setMode("register")}
            >
              Register
            </button>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
          <form className="space-y-4" onSubmit={submitAuth}>
            {mode === "register" && (
              <Input label="Name" value={name} onChange={setName} type="text" />
            )}
            <Input label="Email" value={email} onChange={setEmail} type="email" />
            <Input label="Password" value={password} onChange={setPassword} type="password" />
            <button className="w-full px-4 py-3 bg-[#54037C] hover:bg-[#54037C]/90 text-white font-semibold rounded-xl transition shadow-md">
              {mode === "login" ? "Login" : "Register"}
            </button>
            {/* Removed default admin credentials hint */}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF9F6] to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-[#54037C]/10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#54037C] mb-2">Admin Dashboard</h1>
              <p className="text-gray-600 text-sm">Manage content for Unending Praise</p>
            </div>
            <div className="flex gap-2">
              <button 
                className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition text-sm" 
                onClick={() => { setToken(""); }}
              >
          Logout
        </button>
              <button 
                className="px-4 py-2 rounded-xl bg-[#54037C] hover:bg-[#54037C]/90 text-white font-medium transition text-sm shadow-md" 
                onClick={refresh}
              >
                Refresh
              </button>
            </div>
          </div>
      </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-2 border border-[#54037C]/10">
          {((() => {
            const base = ["testimonies", "crusades", "messages", "songs", "comments"] as const;
            if (role === 'superadmin') return ([...base, 'crusade-types', 'users', 'analytics'] as const);
            if (!role || role === 'admin') return ([...base, 'crusade-types', 'analytics'] as const);
            if (role === 'testimony') return ["testimonies", "comments"] as const;
            if (role === 'crusade') return (["crusades", "crusade-types", "comments"] as const);
            if (role === 'messages') return ["messages"] as const;
            if (role === 'songs') return ["songs"] as const;
            return base;
          })()).map((k) => (
          <button
            key={k}
              className={`px-4 py-2 rounded-xl font-semibold text-sm transition capitalize ${
                tab === k 
                  ? "bg-[#54037C] text-white shadow-md" 
                  : "bg-transparent text-gray-600 hover:bg-[#54037C]/10"
              }`}
              onClick={() => setTab(k as any)}
          >
            {k}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl mb-4 text-center">
          Loading…
        </div>
      )}

      {tab === "testimonies" && (
        <section className="space-y-6">
          <TestimonyForm onSubmit={createTestimony} onUploadMedia={uploadTestimonyMedia} />
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-[#54037C]/10">
            <h2 className="text-xl font-bold text-[#54037C] mb-4">Pending Approvals ({testimonies.filter(t => !t.approved).length})</h2>
            <div className="space-y-4">
              {testimonies.filter(t => !t.approved).length === 0 && <div className="text-sm text-gray-500 text-center py-8">No pending testimonies</div>}
              {testimonies.filter(t => !t.approved).map((t) => (
                <TestimonyItem 
                  key={t.id} 
                  testimony={t} 
                  onApprove={() => approveTestimony(t.id)}
                  onDelete={() => deleteItem("testimonies", t.id)}
                  onUploadMedia={uploadTestimonyMedia}
                  onUpdate={async (payload) => {
                    await api<Testimony>(`/api/testimonies/${t.id}`, {
                      method: "PUT",
                      headers: Object.assign({}, headers as Record<string, string>, { "content-type": "application/json" }),
                      body: JSON.stringify(payload),
                    });
                    refresh();
                  }}
                />
              ))}
            </div>
                </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-[#54037C]/10">
            <h2 className="text-xl font-bold text-[#54037C] mb-4">Approved ({testimonies.filter(t => t.approved).length})</h2>
            <div className="space-y-4">
              {testimonies.filter(t => t.approved).length === 0 && <div className="text-sm text-gray-500 text-center py-8">No approved testimonies yet</div>}
              {testimonies.filter(t => t.approved).map((t) => (
                <TestimonyItem 
                  key={t.id} 
                  testimony={t} 
                  onApprove={() => approveTestimony(t.id)}
                  onDelete={() => deleteItem("testimonies", t.id)}
                  onUploadMedia={uploadTestimonyMedia}
                  onUpdate={async (payload) => {
                    await api<Testimony>(`/api/testimonies/${t.id}`, {
                      method: "PUT",
                      headers: Object.assign({}, headers as Record<string, string>, { "content-type": "application/json" }),
                      body: JSON.stringify(payload),
                    });
                    refresh();
                  }}
                />
              ))}
                </div>
              </div>
        </section>
      )}

      {tab === "crusades" && (
        <section className="space-y-6">
          <CrusadeForm onSubmit={createCrusade} crusadeTypes={crusadeTypes} onUploadMedia={uploadCrusadeMedia} />
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-[#54037C]/10">
            <h2 className="text-xl font-bold text-[#54037C] mb-4">Crusades ({crusades.length})</h2>
            <div className="space-y-4">
              {crusades.length === 0 && <div className="text-sm text-gray-500 text-center py-8">No crusades yet</div>}
              {crusades.map((c) => (
                <CrusadeItem 
                  key={c.id} 
                  crusade={c}
                  crusadeTypes={crusadeTypes}
                  onDelete={() => deleteItem("crusades", c.id)}
                  onUploadMedia={uploadCrusadeMedia}
                  onUpdate={async (payload) => {
                    await api<Crusade>(`/api/crusades/${c.id}`, {
                      method: "PUT",
                      headers: Object.assign({}, headers as Record<string, string>, { "content-type": "application/json" }),
                      body: JSON.stringify(payload),
                    });
                    refresh();
                  }}
                />
              ))}
                </div>
              </div>
        </section>
      )}

      {tab === "messages" && (
        <section className="space-y-6">
          <MessageForm onSubmit={createMessage} />
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-[#54037C]/10">
            <h2 className="text-xl font-bold text-[#54037C] mb-4">Messages ({messages.length})</h2>
            <div className="space-y-4">
              {messages.length === 0 && <div className="text-sm text-gray-500 text-center py-8">No messages yet</div>}
              {messages.map((m) => (
                <div key={m.id} className="p-4 border border-gray-200 rounded-xl bg-white hover:shadow-md transition">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold">{m.name}</h3>
                        {m.subject && <span className="px-2 py-1 bg-[#54037C]/10 text-[#54037C] text-xs rounded-full">{m.subject}</span>}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">{m.email} {m.phone && `• ${m.phone}`}</div>
                      <p className="text-sm text-gray-700">{m.message}</p>
                      <div className="text-xs text-gray-500 mt-2">{new Date(m.createdAt).toLocaleString()}</div>
                </div>
                    <button className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm h-fit" onClick={() => deleteItem("messages", m.id)}>
                    Delete
                  </button>
                </div>
              </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {tab === "songs" && (
        <section className="space-y-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-[#54037C]/10">
            <h3 className="text-lg font-bold text-[#54037C] mb-4">Bulk Import Songs</h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload an Excel (.xlsx, .xls), Word (.docx), or CSV file with your song schedule. Expected format:
            </p>
            <ul className="text-sm text-gray-600 mb-4 list-disc list-inside space-y-1">
              <li><strong>Columns:</strong> S/N, DATE, SONG 1, SONG 2, SONG 3, SONG 4, SONG 5, SONG 6 (and more if needed)</li>
              <li><strong>Date format:</strong> M/D/YYYY (e.g., 4/12/2025)</li>
              <li><strong>Each SONG column:</strong> Title at the top, then "Verse 1" label, followed by lyrics</li>
              <li><strong>Multiple songs per row:</strong> One row can contain up to 6 songs (SONG 1-6) or more</li>
              <li>No artist field needed - titles are extracted automatically</li>
              <li><strong>Supported formats:</strong> Excel (.xlsx, .xls), Word (.docx), CSV (.csv), Text (.txt)</li>
            </ul>
            <div className="mb-4">
              <input
                type="file"
                accept=".csv,.xlsx,.xls,.docx,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleBulkImport(file);
                    e.target.value = ''; // Reset input
                  }
                }}
                disabled={bulkImportLoading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#54037C] file:text-white hover:file:bg-[#54037C]/90 file:cursor-pointer disabled:opacity-50"
              />
            </div>
            {bulkImportLoading && (
              <div className="text-sm text-blue-600">Importing songs...</div>
            )}
            {bulkImportError && (
              <div className={`text-sm ${bulkImportError.includes('Successfully') ? 'text-green-600' : 'text-red-600'}`}>
                {bulkImportError}
              </div>
            )}
          </div>
          <SongForm onSubmit={createSong} />
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-[#54037C]/10">
            <h2 className="text-xl font-bold text-[#54037C] mb-4">Songs ({songs.length})</h2>
            <div className="space-y-4">
              {songs.length === 0 && <div className="text-sm text-gray-500 text-center py-8">No songs yet</div>}
              {[...songs].sort((a, b) => (a.date || '').localeCompare(b.date || '')).map((s) => {
                const isEditing = editingSongId === s.id;
                return (
                <div key={s.id} className="p-4 border border-gray-200 rounded-xl bg-white hover:shadow-md transition">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{s.title} {s.artist ? `- ${s.artist}` : ''}</h3>
                      <div className="text-sm text-gray-600 mb-2">📅 Date: {s.date || 'unspecified'}</div>
                      {isEditing ? (
                        <form
                          className="space-y-3"
                          onSubmit={async (e) => {
                            e.preventDefault();
                            setSongEditLoading(true);
                            try {
                              await updateSong(s.id, { lyrics: editingLyrics, date: editingDate });
                              setEditingSongId(null);
                              setEditingLyrics("");
                              setEditingDate("");
                            } catch (err: any) {
                              const message = err?.message || "Failed to update song";
                              alert(message);
                            } finally {
                              setSongEditLoading(false);
                            }
                          }}
                        >
                          <label className="text-sm block">
                            <div className="mb-1 text-gray-700 font-medium">Date</div>
                            <input
                              type="date"
                              className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#54037C]"
                              value={editingDate}
                              onChange={(e) => setEditingDate(e.target.value)}
                            />
                          </label>
                          <label className="text-sm block">
                            <div className="mb-1 text-gray-700 font-medium">Lyrics</div>
                            <textarea
                              className="w-full border rounded-xl px-3 py-2 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-[#54037C]"
                              value={editingLyrics}
                              onChange={(e) => setEditingLyrics(e.target.value)}
                            />
                          </label>
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              className="px-4 py-2 bg-[#54037C] text-white rounded-xl text-sm font-semibold disabled:opacity-60"
                              disabled={songEditLoading}
                            >
                              {songEditLoading ? "Saving…" : "Save"}
                            </button>
                            <button
                              type="button"
                              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-sm font-semibold"
                              onClick={() => {
                                setEditingSongId(null);
                                setEditingLyrics("");
                                setEditingDate("");
                              }}
                              disabled={songEditLoading}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : s.lyrics ? (
                        <details className="text-sm text-gray-700">
                          <summary className="cursor-pointer text-[#54037C] font-medium">View Lyrics</summary>
                          <pre className="mt-2 whitespace-pre-wrap font-sans">{s.lyrics}</pre>
                        </details>
                      ) : (
                        <div className="text-sm text-gray-500 italic">No lyrics provided.</div>
                      )}
                      <div className="text-xs text-gray-500 mt-2">Created: {new Date(s.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="flex gap-2">
                      {isEditing ? null : (
                        <button
                          className="px-3 py-2 bg-[#54037C] hover:bg-[#54037C]/90 text-white rounded-xl text-sm h-fit"
                          onClick={() => {
                            setEditingSongId(s.id);
                            setEditingLyrics(s.lyrics || "");
                            setEditingDate(s.date || "");
                          }}
                        >
                          Edit Lyrics
                        </button>
                      )}
                      <button
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm h-fit disabled:opacity-60"
                        onClick={() => deleteItem("songs", s.id)}
                        disabled={isEditing}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          </div>
        </section>
      )}

      {tab === "comments" && (
        <section className="space-y-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-[#54037C]/10">
            <h2 className="text-xl font-bold text-[#54037C] mb-4">Manage Comments</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Entity Type</label>
                <select
                  value={commentEntityType}
                  onChange={(e) => { setCommentEntityType(e.target.value as any); setCommentEntityId(""); setManagedComments([]); }}
                  className="w-full border rounded-xl p-2"
                >
                  <option value="testimony">Testimony</option>
                  <option value="crusade">Crusade</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Select {commentEntityType}</label>
                <select
                  value={commentEntityId}
                  onChange={async (e) => {
                    const id = e.target.value; 
                    setCommentEntityId(id);
                    if (!id) { setManagedComments([]); return; }
                    setCommentsLoading(true);
                    try {
                      const list = await api<Comment[]>(`/api/comments/${commentEntityType}/${id}`);
                      setManagedComments(list);
                    } finally { setCommentsLoading(false); }
                  }}
                  className="w-full border rounded-xl p-2"
                >
                  <option value="">Select…</option>
                  {(commentEntityType === "testimony" ? testimonies : crusades).map((e) => (
                    <option key={e.id} value={e.id}>{('title' in e && e.title) ? (e as any).title : (e as any).name || e.id}</option>
                  ))}
                </select>
              </div>
            </div>

            {commentsLoading ? (
              <div className="text-sm text-gray-600">Loading comments…</div>
            ) : commentEntityId && managedComments.length === 0 ? (
              <div className="text-sm text-gray-600">No comments yet for this {commentEntityType}.</div>
            ) : (
              <div className="space-y-3">
                {managedComments.map((c) => (
                  <div key={c.id} className="p-3 border rounded-xl flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-sm">{c.name}</div>
                      <div className="text-sm text-gray-700">{c.comment}</div>
                      <div className="text-xs text-gray-500 mt-1">{c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</div>
                    </div>
                    <button
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs"
                      onClick={async () => {
                        if (!commentEntityId) return;
                        await fetch(`/api/comments/${commentEntityType}/${commentEntityId}/${c.id}`, { method: 'DELETE', headers });
                        const list = await api<Comment[]>(`/api/comments/${commentEntityType}/${commentEntityId}`);
                        setManagedComments(list);
                      }}
                    >
                    Delete
                  </button>
                </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {tab === "crusade-types" && (
        <section className="space-y-6">
          <div className="bg-gradient-to-br from-[#54037C]/10 to-[#8A4EBF]/10 rounded-2xl shadow-lg p-6 border-2 border-[#54037C]/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-8 bg-[#54037C] rounded-full"></div>
              <div>
                <h2 className="text-2xl font-bold text-[#54037C]">Manage Crusade Types</h2>
                <p className="text-sm text-gray-600">Create and manage different types of crusades (e.g., Prison, Online, Youth, etc.) with their details</p>
              </div>
            </div>
            <CrusadeTypeForm onSubmit={async (payload) => {
              await api(`/api/crusade-types`, {
                method: "POST",
                headers: Object.assign({}, headers as Record<string, string>, { "content-type": "application/json" }),
                body: JSON.stringify(payload),
              });
              await refreshCrusadeTypes();
            }} />
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-[#54037C]/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-[#54037C]">All Crusade Types</h2>
                <p className="text-sm text-gray-600">Total: {crusadeTypes.length} type{crusadeTypes.length !== 1 ? 's' : ''}</p>
              </div>
              {crusadeTypes.length > 0 && (
                <div className="px-3 py-1 bg-[#54037C]/10 text-[#54037C] rounded-full text-sm font-medium">
                  {crusadeTypes.length} Active
                </div>
              )}
            </div>
            <div className="space-y-4">
              {crusadeTypes.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <div className="text-gray-400 mb-2">📋</div>
                  <div className="text-sm text-gray-500">No crusade types yet. Create your first type above.</div>
                  <div className="text-xs text-gray-400 mt-1">Crusade types help organize and categorize your crusades (e.g., Prison, Online, Youth, etc.)</div>
                </div>
              )}
              {crusadeTypes.map((type) => (
                <CrusadeTypeItem 
                  key={type.id}
                  type={type}
                  onDelete={async () => {
                    if (confirm(`Are you sure you want to delete the "${type.name}" crusade type? This won't delete crusades of this type, but you won't be able to create new ones with this type.`)) {
                      await api(`/api/crusade-types/${type.id}`, { method: "DELETE", headers: headers as HeadersInit });
                      await refreshCrusadeTypes();
                    }
                  }}
                  onUpdate={async (payload) => {
                    await api(`/api/crusade-types/${type.id}`, {
                      method: "PUT",
                      headers: Object.assign({}, headers as Record<string, string>, { "content-type": "application/json" }),
                      body: JSON.stringify(payload),
                    });
                    await refreshCrusadeTypes();
                  }}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {tab === "analytics" && (
        <section className="space-y-6">
          <Analytics headers={headers} />
        </section>
      )}

      {tab === "users" && role === 'superadmin' && (
        <section className="space-y-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-[#54037C]/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#54037C]">User Management</h2>
              <button
                className="px-3 py-2 bg-[#54037C] hover:bg-[#54037C]/90 text-white rounded-xl text-sm"
                onClick={async () => {
                  try {
                    const list = await api<typeof users>("/api/admin/users", { headers: headers as HeadersInit });
                    setUsers(list);
                  } catch (e:any) { setError(e?.message || 'Failed to load users'); }
                }}
              >
                Load Users
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Pending</h3>
                <div className="space-y-3">
                  {users.filter(u=>u.status!== 'active').map(u => (
                    <div key={u.id} className="p-3 border rounded-xl flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">{u.name} <span className="text-gray-500 text-sm">{u.email}</span></div>
                        <div className="text-xs text-gray-500">role: {u.role} • status: {u.status}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          className="border rounded px-2 py-1 text-sm"
                          value={u.role}
                          onChange={async (e) => {
                            const roleVal = e.target.value;
                            await fetch(`/api/admin/users/${u.id}/role`, { method:'PUT', headers: Object.assign({}, headers as Record<string,string>, { 'content-type':'application/json' }), body: JSON.stringify({ role: roleVal }) });
                            const list = await api<typeof users>("/api/admin/users", { headers: headers as HeadersInit });
                            setUsers(list);
                          }}
                        >
                          {['admin','testimony','crusade','messages','songs','pending'].map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <button
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                          onClick={async () => {
                            await fetch(`/api/admin/users/${u.id}/activate`, { method:'PUT', headers: headers as HeadersInit });
                            const list = await api<typeof users>("/api/admin/users", { headers: headers as HeadersInit });
                            setUsers(list);
                          }}
                        >Approve</button>
                      </div>
                    </div>
                  ))}
                  {users.filter(u=>u.status!== 'active').length === 0 && <div className="text-sm text-gray-500">No pending users</div>}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Active</h3>
                <div className="space-y-3">
                  {users.filter(u=>u.status=== 'active').map(u => (
                    <div key={u.id} className="p-3 border rounded-xl flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">{u.name} <span className="text-gray-500 text-sm">{u.email}</span></div>
                        <div className="text-xs text-gray-500">role: {u.role} • status: {u.status}</div>
                      </div>
                      <div>
                        <select
                          className="border rounded px-2 py-1 text-sm"
                          value={u.role}
                          onChange={async (e) => {
                            const roleVal = e.target.value;
                            await fetch(`/api/admin/users/${u.id}/role`, { method:'PUT', headers: Object.assign({}, headers as Record<string,string>, { 'content-type':'application/json' }), body: JSON.stringify({ role: roleVal }) });
                            const list = await api<typeof users>("/api/admin/users", { headers: headers as HeadersInit });
                            setUsers(list);
                          }}
                        >
                          {['superadmin','admin','testimony','crusade','messages','songs'].map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                  {users.filter(u=>u.status=== 'active').length === 0 && <div className="text-sm text-gray-500">No active users</div>}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
      </div>
    </div>
  );
}

function TestimonyItem({ testimony, onApprove, onDelete, onUpdate, onUploadMedia }: { 
  testimony: Testimony; 
  onApprove: () => void;
  onDelete: () => void;
  onUpdate: (payload: Partial<Testimony>) => Promise<void>;
  onUploadMedia: (dataUrl: string) => Promise<string>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(testimony.name || "");
  const [title, setTitle] = useState(testimony.title || "");
  const [content, setContent] = useState(testimony.content || "");
  const [summary, setSummary] = useState(testimony.summary || "");
  const [images, setImages] = useState<string[]>(Array.isArray(testimony.images) ? testimony.images : []);
  const [videos, setVideos] = useState<string[]>(Array.isArray(testimony.videos) ? testimony.videos : []);
  const [previewImage, setPreviewImage] = useState(testimony.previewImage || "");
  const [previewVideo, setPreviewVideo] = useState(testimony.previewVideo || "");

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      try {
        if (file.type.startsWith("image/")) {
          const compressed = await compressImage(file);
          const uploaded = await onUploadMedia(compressed);
          setImages(prev => [...prev, uploaded]);
          if (!previewImage && !previewVideo) setPreviewImage(uploaded);
        } else if (file.type.startsWith("video/")) {
          const compressed = await compressVideo(file);
          const uploaded = await onUploadMedia(compressed);
          setVideos(prev => [...prev, uploaded]);
          if (!previewImage && !previewVideo) setPreviewVideo(uploaded);
        }
      } catch (err: any) {
        console.error('Media upload failed', err);
        alert(`Error processing ${file.name}: ${err?.message || 'Upload failed'}`);
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    const removed = newImages.splice(index, 1)[0];
    setImages(newImages);
    if (previewImage === removed) setPreviewImage(newImages[0] || "");
  };

  const removeVideo = (index: number) => {
    const newVideos = [...videos];
    const removed = newVideos.splice(index, 1)[0];
    setVideos(newVideos);
    if (previewVideo === removed) setPreviewVideo(newVideos[0] || "");
  };

  const handleUrlAdd = (url: string, type: 'image' | 'video') => {
    if (!url.trim()) {
      alert('Please enter a URL');
      return;
    }
    try {
      new URL(url);
      if (type === 'image') {
        setImages(prev => [...prev, url]);
        if (!previewImage && !previewVideo) setPreviewImage(url);
      } else {
        setVideos(prev => [...prev, url]);
        if (!previewImage && !previewVideo) setPreviewVideo(url);
      }
    } catch (err) {
      alert('Please enter a valid URL (e.g., https://example.com/image.jpg)');
    }
  };

  if (editing) {
    return (
      <div className="p-4 border-2 border-[#54037C] rounded-xl bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Input label="Name" value={name} onChange={setName} />
          <Input label="Title" value={title} onChange={setTitle} />
        </div>
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-1 block">Content</label>
          <textarea
            className="w-full border border-gray-300 rounded-xl px-4 py-2 h-32"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-1 block">Summary</label>
          <textarea
            className="w-full border border-gray-300 rounded-xl px-4 py-2 h-20"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Media (Images & Videos)</label>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Upload Files:</label>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleMediaUpload}
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Add Image URL:</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleUrlAdd(e.currentTarget.value, 'image');
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                      if (input) {
                        handleUrlAdd(input.value, 'image');
                        input.value = '';
                      }
                    }}
                    className="px-3 py-2 bg-[#54037C] text-white rounded-xl text-sm hover:bg-[#54037C]/90"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Add Video URL:</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="https://example.com/video.mp4"
                    className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleUrlAdd(e.currentTarget.value, 'video');
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                      if (input) {
                        handleUrlAdd(input.value, 'video');
                        input.value = '';
                      }
                    }}
                    className="px-3 py-2 bg-[#54037C] text-white rounded-xl text-sm hover:bg-[#54037C]/90"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
          {(images.length > 0 || videos.length > 0) && (
            <div className="mt-4 space-y-4">
              {images.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2">Images:</p>
                  <div className="grid grid-cols-4 gap-2">
                    {images.map((img, idx) => (
                      <div key={`img-${idx}`} className="relative">
                        <img src={img} alt={`Preview ${idx}`} className="w-full h-24 object-cover rounded-lg border-2 border-gray-200" />
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewImage(img);
                            setPreviewVideo("");
                          }}
                          className={`absolute top-1 right-1 text-xs px-2 py-1 rounded ${
                            previewImage === img ? 'bg-[#54037C] text-white' : 'bg-white/80 text-gray-700'
                          }`}
                        >
                          {previewImage === img ? '✓ Preview' : 'Set'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 left-1 text-xs px-2 py-1 rounded bg-red-500 text-white"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {videos.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2">Videos:</p>
                  <div className="grid grid-cols-4 gap-2">
                    {videos.map((vid, idx) => (
                      <div key={`vid-${idx}`} className="relative">
                        <video src={vid} className="w-full h-24 object-cover rounded-lg border-2 border-gray-200" muted />
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewVideo(vid);
                            setPreviewImage("");
                          }}
                          className={`absolute top-1 right-1 text-xs px-2 py-1 rounded ${
                            previewVideo === vid ? 'bg-[#54037C] text-white' : 'bg-white/80 text-gray-700'
                          }`}
                        >
                          {previewVideo === vid ? '✓ Preview' : 'Set'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeVideo(idx)}
                          className="absolute top-1 left-1 text-xs px-2 py-1 rounded bg-red-500 text-white"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 bg-[#54037C] text-white rounded-xl"
            onClick={() => {
              onUpdate({ name, title, content, summary, images, videos, previewImage, previewVideo }).then(() => setEditing(false));
            }}
          >
            Save
          </button>
          <button
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl"
            onClick={() => {
              setEditing(false);
              setName(testimony.name || "");
              setTitle(testimony.title || "");
              setContent(testimony.content || "");
              setSummary(testimony.summary || "");
              setImages(Array.isArray(testimony.images) ? testimony.images : []);
              setVideos(Array.isArray(testimony.videos) ? testimony.videos : []);
              setPreviewImage(testimony.previewImage || "");
              setPreviewVideo(testimony.previewVideo || "");
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border border-gray-200 rounded-xl bg-white hover:shadow-md transition">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-lg">{title || "Untitled"}</h3>
            {testimony.approved ? (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Approved</span>
            ) : (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Pending</span>
            )}
          </div>
          <div className="text-sm text-gray-600 mb-2">By: {testimony.name || "Anonymous"}</div>
          {(testimony.email || testimony.phone) && (
            <div className="text-sm text-gray-600 mb-2">
              {testimony.email || ''} {testimony.phone ? `• ${testimony.phone}` : ''}
            </div>
          )}
          {testimony.previewVideo ? (
            <video src={testimony.previewVideo} className="w-32 h-20 object-cover rounded-lg mb-2" controls />
          ) : testimony.previewImage && (
            <img src={testimony.previewImage} alt="Preview" className="w-32 h-20 object-cover rounded-lg mb-2" />
          )}
          <p className="text-sm text-gray-700 mb-2">{testimony.summary || testimony.content?.substring(0, 100)}...</p>
          <div className="text-xs text-gray-500">{new Date(testimony.createdAt).toLocaleString()}</div>
        </div>
        <div className="flex flex-col gap-2">
          {!testimony.approved && (
            <button className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm" onClick={onApprove}>
              Approve
            </button>
          )}
          <button className="px-3 py-2 bg-[#54037C] hover:bg-[#54037C]/90 text-white rounded-xl text-sm" onClick={() => setEditing(true)}>
            Edit
          </button>
          <button className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function CrusadeItem({ crusade, onDelete, onUpdate, crusadeTypes = [], onUploadMedia }: { 
  crusade: Crusade; 
  onDelete: () => void;
  onUpdate: (payload: Partial<Crusade>) => Promise<void>;
  crusadeTypes?: Array<{id:string; name:string; description?:string;}>;
  onUploadMedia: (dataUrl: string) => Promise<string>;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(crusade.title || "");
  const [date, setDate] = useState(crusade.date || "");
  const [attendance, setAttendance] = useState(crusade.attendance?.toString() || "");
  const [zone, setZone] = useState(crusade.zone || "");
  const [description, setDescription] = useState(crusade.description || "");
  const [summary, setSummary] = useState(crusade.summary || "");
  const [type, setType] = useState(crusade.type || "");
  const [newType, setNewType] = useState("");
  const [images, setImages] = useState<string[]>(Array.isArray(crusade.images) ? crusade.images : []);
  const [videos, setVideos] = useState<string[]>(Array.isArray(crusade.videos) ? crusade.videos : []);
  const [previewImage, setPreviewImage] = useState(crusade.previewImage || "");
  const [previewVideo, setPreviewVideo] = useState(crusade.previewVideo || "");

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      try {
        if (file.type.startsWith("image/")) {
          const compressed = await compressImage(file);
          const uploaded = await onUploadMedia(compressed);
          setImages(prev => [...prev, uploaded]);
          if (!previewImage && !previewVideo) setPreviewImage(uploaded);
        } else if (file.type.startsWith("video/")) {
          const compressed = await compressVideo(file);
          const uploaded = await onUploadMedia(compressed);
          setVideos(prev => [...prev, uploaded]);
          if (!previewImage && !previewVideo) setPreviewVideo(uploaded);
        }
      } catch (err: any) {
        console.error('Media upload failed', err);
        alert(`Error processing ${file.name}: ${err?.message || 'Upload failed'}`);
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    const removed = newImages.splice(index, 1)[0];
    setImages(newImages);
    if (previewImage === removed) setPreviewImage(newImages[0] || "");
  };

  const removeVideo = (index: number) => {
    const newVideos = [...videos];
    const removed = newVideos.splice(index, 1)[0];
    setVideos(newVideos);
    if (previewVideo === removed) setPreviewVideo(newVideos[0] || "");
  };

  const handleUrlAdd = (url: string, type: 'image' | 'video') => {
    if (!url.trim()) {
      alert('Please enter a URL');
      return;
    }
    try {
      new URL(url);
      if (type === 'image') {
        setImages(prev => [...prev, url]);
        if (!previewImage && !previewVideo) setPreviewImage(url);
      } else {
        setVideos(prev => [...prev, url]);
        if (!previewImage && !previewVideo) setPreviewVideo(url);
      }
    } catch (err) {
      alert('Please enter a valid URL (e.g., https://example.com/image.jpg)');
    }
  };

  if (editing) {
    return (
      <div className="p-4 border-2 border-[#54037C] rounded-xl bg-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Input label="Title" value={title} onChange={setTitle} />
          <Input label="Date" value={date} onChange={setDate} />
          <Input label="Attendance" value={attendance} onChange={setAttendance} type="number" />
        </div>
        <div className="mb-4">
          <Input label="Zone" value={zone} onChange={setZone} placeholder="e.g., Zone A, Lagos Zone" />
        </div>
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-1 block">Crusade Type (select existing or add new)</label>
          <div className="grid grid-cols-2 gap-2">
            <select value={type} onChange={(e) => {
              setType(e.target.value);
              setNewType("");
            }} className="w-full border border-gray-300 rounded-xl px-4 py-2">
              <option value="">— Select Type —</option>
              {crusadeTypes.map((t) => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
            <input
              placeholder="or create new type name"
              className="w-full border border-gray-300 rounded-xl px-4 py-2"
              value={newType}
              onChange={(e) => {
                setNewType(e.target.value);
                setType("");
              }}
            />
          </div>
          {type && crusadeTypes.find(t => t.name === type)?.description && (
            <div className="mt-2 text-xs text-gray-600 bg-blue-50 p-2 rounded-lg border border-blue-200">
              <strong className="text-[#54037C]">{crusadeTypes.find(t => t.name === type)?.name}:</strong> {crusadeTypes.find(t => t.name === type)?.description}
            </div>
          )}
        </div>
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
          <textarea
            className="w-full border border-gray-300 rounded-xl px-4 py-2 h-24"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-1 block">Summary</label>
          <textarea
            className="w-full border border-gray-300 rounded-xl px-4 py-2 h-20"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Media (Images & Videos)</label>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Upload Files:</label>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleMediaUpload}
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Add Image URL:</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleUrlAdd(e.currentTarget.value, 'image');
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                      if (input) {
                        handleUrlAdd(input.value, 'image');
                        input.value = '';
                      }
                    }}
                    className="px-3 py-2 bg-[#54037C] text-white rounded-xl text-sm hover:bg-[#54037C]/90"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Add Video URL:</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="https://example.com/video.mp4"
                    className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleUrlAdd(e.currentTarget.value, 'video');
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                      if (input) {
                        handleUrlAdd(input.value, 'video');
                        input.value = '';
                      }
                    }}
                    className="px-3 py-2 bg-[#54037C] text-white rounded-xl text-sm hover:bg-[#54037C]/90"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
          {(images.length > 0 || videos.length > 0) && (
            <div className="mt-4 space-y-4">
              {images.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2">Images:</p>
                  <div className="grid grid-cols-4 gap-2">
                    {images.map((img, idx) => (
                      <div key={`img-${idx}`} className="relative">
                        <img src={img} alt={`Preview ${idx}`} className="w-full h-24 object-cover rounded-lg border-2 border-gray-200" />
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewImage(img);
                            setPreviewVideo("");
                          }}
                          className={`absolute top-1 right-1 text-xs px-2 py-1 rounded ${
                            previewImage === img ? 'bg-[#54037C] text-white' : 'bg-white/80 text-gray-700'
                          }`}
                        >
                          {previewImage === img ? '✓ Preview' : 'Set'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 left-1 text-xs px-2 py-1 rounded bg-red-500 text-white"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {videos.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2">Videos:</p>
                  <div className="grid grid-cols-4 gap-2">
                    {videos.map((vid, idx) => (
                      <div key={`vid-${idx}`} className="relative">
                        <video src={vid} className="w-full h-24 object-cover rounded-lg border-2 border-gray-200" muted />
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewVideo(vid);
                            setPreviewImage("");
                          }}
                          className={`absolute top-1 right-1 text-xs px-2 py-1 rounded ${
                            previewVideo === vid ? 'bg-[#54037C] text-white' : 'bg-white/80 text-gray-700'
                          }`}
                        >
                          {previewVideo === vid ? '✓ Preview' : 'Set'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeVideo(idx)}
                          className="absolute top-1 left-1 text-xs px-2 py-1 rounded bg-red-500 text-white"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 bg-[#54037C] text-white rounded-xl"
            onClick={() => {
              const finalType = newType.trim() ? newType.trim() : type;
              onUpdate({ title, date, attendance: attendance ? parseInt(attendance) : undefined, zone, type: finalType, description, summary, images, videos, previewImage, previewVideo }).then(() => {
                setEditing(false);
                setNewType("");
              });
            }}
          >
            Save
          </button>
          <button
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl"
            onClick={() => {
              setEditing(false);
              setTitle(crusade.title || "");
              setDate(crusade.date || "");
              setAttendance(crusade.attendance?.toString() || "");
              setZone(crusade.zone || "");
              setDescription(crusade.description || "");
              setSummary(crusade.summary || "");
              setType(crusade.type || "");
              setNewType("");
              setImages(Array.isArray(crusade.images) ? crusade.images : []);
              setVideos(Array.isArray(crusade.videos) ? crusade.videos : []);
              setPreviewImage(crusade.previewImage || "");
              setPreviewVideo(crusade.previewVideo || "");
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border border-gray-200 rounded-xl bg-white hover:shadow-md transition">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-2">{crusade.title || "Untitled"}</h3>
          <div className="text-sm text-gray-600 mb-2">
            {crusade.attendance && <span className="mr-4">👥 {crusade.attendance.toLocaleString()} attendees</span>}
            {crusade.date && <span className="mr-4">📅 {crusade.date}</span>}
            {crusade.zone && <span>🌍 Zone: {crusade.zone}</span>}
          </div>
          {crusade.previewVideo ? (
            <video src={crusade.previewVideo} className="w-32 h-20 object-cover rounded-lg mb-2" controls />
          ) : crusade.previewImage && (
            <img src={crusade.previewImage} alt="Preview" className="w-32 h-20 object-cover rounded-lg mb-2" />
          )}
          {crusade.type && <div className="text-xs text-gray-600 mb-1">Type: <span className="font-semibold">{crusade.type}</span></div>}
          <p className="text-sm text-gray-700 mb-2">{crusade.summary || crusade.description?.substring(0, 100)}...</p>
          <div className="text-xs text-gray-500">{new Date(crusade.createdAt).toLocaleString()}</div>
        </div>
        <div className="flex flex-col gap-2">
          <button className="px-3 py-2 bg-[#54037C] hover:bg-[#54037C]/90 text-white rounded-xl text-sm" onClick={() => setEditing(true)}>
            Edit
          </button>
          <button className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function CrusadeForm({ onSubmit, crusadeTypes = [], onUploadMedia }: { onSubmit: (payload: Partial<Crusade>) => Promise<void>; crusadeTypes?: Array<{id:string; name:string; description?:string;}>; onUploadMedia: (dataUrl: string) => Promise<string> }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [attendance, setAttendance] = useState("");
  const [zone, setZone] = useState("");
  const [description, setDescription] = useState("");
  const [summary, setSummary] = useState("");
  const [type, setType] = useState<string>("");
  const [newType, setNewType] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState("");
  const [previewVideo, setPreviewVideo] = useState("");

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      try {
        if (file.type.startsWith("image/")) {
          const compressed = await compressImage(file);
          const uploaded = await onUploadMedia(compressed);
          setImages(prev => [...prev, uploaded]);
          if (!previewImage && !previewVideo) setPreviewImage(uploaded);
        } else if (file.type.startsWith("video/")) {
          const compressed = await compressVideo(file);
          const uploaded = await onUploadMedia(compressed);
          setVideos(prev => [...prev, uploaded]);
          if (!previewImage && !previewVideo) setPreviewVideo(uploaded);
        }
      } catch (err: any) {
        console.error('Media upload failed', err);
        alert(`Error processing ${file.name}: ${err?.message || 'Upload failed'}`);
      }
    }
  };

  const handleUrlAdd = (url: string, type: 'image' | 'video') => {
    if (!url.trim()) {
      alert('Please enter a URL');
      return;
    }
    try {
      new URL(url);
      if (type === 'image') {
        setImages(prev => [...prev, url]);
        if (!previewImage && !previewVideo) setPreviewImage(url);
      } else {
        setVideos(prev => [...prev, url]);
        if (!previewImage && !previewVideo) setPreviewVideo(url);
      }
    } catch (err) {
      alert('Please enter a valid URL (e.g., https://example.com/image.jpg)');
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    const removed = newImages.splice(index, 1)[0];
    setImages(newImages);
    if (previewImage === removed) {
      setPreviewImage(newImages[0] || "");
    }
  };

  const removeVideo = (index: number) => {
    const newVideos = [...videos];
    const removed = newVideos.splice(index, 1)[0];
    setVideos(newVideos);
    if (previewVideo === removed) {
      setPreviewVideo(newVideos[0] || "");
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-[#54037C]/10">
      <h2 className="text-xl font-bold text-[#54037C] mb-4">Create New Crusade</h2>
      <p className="text-sm text-gray-600 mb-4">Fill in all the details below to create a comprehensive crusade entry</p>
    <form
        className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!title.trim() || !date.trim() || !attendance || (!type && !newType.trim())) {
          alert("Please fill in all required fields: Title, Date, Attendance, and Crusade Type");
          return;
        }
        try {
          const finalType = newType.trim() ? newType.trim() : type;
          const attendanceNum = attendance && attendance.trim() ? parseInt(attendance) : undefined;
          if (attendanceNum !== undefined && isNaN(attendanceNum)) {
            alert("Attendance must be a valid number");
            return;
          }
          await onSubmit({ title, date, attendance: attendanceNum, zone: zone || undefined, description: description || undefined, summary: summary || undefined, type: finalType, images: images.length > 0 ? images : undefined, videos: videos.length > 0 ? videos : undefined, previewImage: previewImage || undefined, previewVideo: previewVideo || undefined });
          setTitle("");
          setDate("");
          setAttendance("");
          setZone("");
          setDescription("");
          setSummary("");
          setType("");
          setNewType("");
          setImages([]);
          setVideos([]);
          setPreviewImage("");
          setPreviewVideo("");
        } catch (err) {
          // Error already handled in createCrusade
        }
      }}
    >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Title *" value={title} onChange={setTitle} placeholder="e.g., A Day of Blessings" />
          <Input label="Date *" value={date} onChange={setDate} placeholder="YYYY-MM-DD or Dec 2023" />
          <Input label="Attendance *" value={attendance} onChange={setAttendance} type="number" placeholder="e.g., 5000" />
          <Input label="Zone" value={zone} onChange={setZone} placeholder="e.g., Zone A, Lagos Zone" />
          <label className="text-sm">
            <div className="mb-1 font-medium text-gray-700">Crusade Type * (select existing or add new)</div>
            <div className="grid grid-cols-2 gap-2">
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2">
                <option value="">— Select Type —</option>
                {crusadeTypes.map((t) => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
              <input
                placeholder="or create new type name"
                className="w-full border border-gray-300 rounded-xl px-4 py-2"
                value={newType}
                onChange={(e) => {
                  setNewType(e.target.value);
                  setType(""); // Clear selection when typing new type
                }}
              />
            </div>
            {type && crusadeTypes.find(t => t.name === type)?.description && (
              <div className="mt-2 text-xs text-gray-600 bg-blue-50 p-2 rounded-lg border border-blue-200">
                <strong className="text-[#54037C]">{crusadeTypes.find(t => t.name === type)?.name}:</strong> {crusadeTypes.find(t => t.name === type)?.description}
              </div>
            )}
          </label>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Full Description * <span className="text-gray-500 font-normal">(Detailed information about the crusade)</span>
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#54037C] focus:border-transparent h-32"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide a comprehensive description of the crusade: what happened, who attended, key moments, testimonies, etc. This will be shown on the crusade details page."
            required
          />
          <p className="text-xs text-gray-500 mt-1">This detailed description will be displayed on the individual crusade page.</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Summary <span className="text-gray-500 font-normal">(Short preview text)</span>
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#54037C] focus:border-transparent h-20"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="A brief summary that will appear in previews and carousels (auto-generated from description if left empty)"
          />
          <p className="text-xs text-gray-500 mt-1">This short summary appears in carousels and preview cards. Leave empty to auto-generate from description.</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Media (Images & Videos)</label>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Upload Files:</label>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleMediaUpload}
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Add Image URL:</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleUrlAdd(e.currentTarget.value, 'image');
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                      if (input) {
                        handleUrlAdd(input.value, 'image');
                        input.value = '';
                      }
                    }}
                    className="px-3 py-2 bg-[#54037C] text-white rounded-xl text-sm hover:bg-[#54037C]/90"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Add Video URL:</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="https://example.com/video.mp4"
                    className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleUrlAdd(e.currentTarget.value, 'video');
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                      if (input) {
                        handleUrlAdd(input.value, 'video');
                        input.value = '';
                      }
                    }}
                    className="px-3 py-2 bg-[#54037C] text-white rounded-xl text-sm hover:bg-[#54037C]/90"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
          {(images.length > 0 || videos.length > 0) && (
            <div className="mt-4 space-y-4">
              {images.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2">Images:</p>
                  <div className="grid grid-cols-4 gap-2">
                    {images.map((img, idx) => (
                      <div key={`img-${idx}`} className="relative">
                        <img src={img} alt={`Preview ${idx}`} className="w-full h-24 object-cover rounded-lg border-2 border-gray-200" />
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewImage(img);
                            setPreviewVideo("");
                          }}
                          className={`absolute top-1 right-1 text-xs px-2 py-1 rounded ${
                            previewImage === img ? 'bg-[#54037C] text-white' : 'bg-white/80 text-gray-700'
                          }`}
                        >
                          {previewImage === img ? '✓ Preview' : 'Set'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 left-1 text-xs px-2 py-1 rounded bg-red-500 text-white"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {videos.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2">Videos:</p>
                  <div className="grid grid-cols-4 gap-2">
                    {videos.map((vid, idx) => (
                      <div key={`vid-${idx}`} className="relative">
                        <video src={vid} className="w-full h-24 object-cover rounded-lg border-2 border-gray-200" muted />
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewVideo(vid);
                            setPreviewImage("");
                          }}
                          className={`absolute top-1 right-1 text-xs px-2 py-1 rounded ${
                            previewVideo === vid ? 'bg-[#54037C] text-white' : 'bg-white/80 text-gray-700'
                          }`}
                        >
                          {previewVideo === vid ? '✓ Preview' : 'Set'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeVideo(idx)}
                          className="absolute top-1 left-1 text-xs px-2 py-1 rounded bg-red-500 text-white"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <button type="submit" className="w-full px-4 py-3 bg-[#54037C] hover:bg-[#54037C]/90 text-white font-semibold rounded-xl transition shadow-md">
          Create Crusade
        </button>
    </form>
    </div>
  );
}

function TestimonyForm({ onSubmit, onUploadMedia }: { onSubmit: (payload: Partial<Testimony>) => Promise<void>; onUploadMedia: (dataUrl: string) => Promise<string> }) {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState("");
  const [previewVideo, setPreviewVideo] = useState("");

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      try {
        if (file.type.startsWith("image/")) {
          const compressed = await compressImage(file);
          const uploaded = await onUploadMedia(compressed);
          setImages(prev => [...prev, uploaded]);
          if (!previewImage && !previewVideo) setPreviewImage(uploaded);
        } else if (file.type.startsWith("video/")) {
          const compressed = await compressVideo(file);
          const uploaded = await onUploadMedia(compressed);
          setVideos(prev => [...prev, uploaded]);
          if (!previewImage && !previewVideo) setPreviewVideo(uploaded);
        }
      } catch (err: any) {
        console.error('Media upload failed', err);
        alert(`Error processing ${file.name}: ${err?.message || 'Upload failed'}`);
      }
    }
  };

  const handleUrlAdd = (url: string, type: 'image' | 'video') => {
    if (!url.trim()) {
      alert('Please enter a URL');
      return;
    }
    try {
      new URL(url);
      if (type === 'image') {
        setImages(prev => [...prev, url]);
        if (!previewImage && !previewVideo) setPreviewImage(url);
      } else {
        setVideos(prev => [...prev, url]);
        if (!previewImage && !previewVideo) setPreviewVideo(url);
      }
    } catch (err) {
      alert('Please enter a valid URL (e.g., https://example.com/image.jpg)');
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-[#54037C]/10">
      <h2 className="text-xl font-bold text-[#54037C] mb-4">Create New Testimony</h2>
    <form
        className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
          onSubmit({ name, title, content, summary, images, videos, previewImage, previewVideo, approved: false }).then(() => {
          setName("");
            setTitle("");
          setContent("");
            setSummary("");
            setImages([]);
            setVideos([]);
            setPreviewImage("");
            setPreviewVideo("");
        });
      }}
    >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Name" value={name} onChange={setName} placeholder="Author name" />
          <Input label="Title" value={title} onChange={setTitle} placeholder="Testimony title" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Content</label>
          <textarea
            className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#54037C] focus:border-transparent h-32"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Full testimony content..."
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Summary (for preview)</label>
          <textarea
            className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#54037C] focus:border-transparent h-20"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Short summary (auto-generated if left empty)"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Media (Images & Videos)</label>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Upload Files:</label>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleMediaUpload}
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Add Image URL:</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleUrlAdd(e.currentTarget.value, 'image');
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                      if (input) {
                        handleUrlAdd(input.value, 'image');
                        input.value = '';
                      }
                    }}
                    className="px-3 py-2 bg-[#54037C] text-white rounded-xl text-sm hover:bg-[#54037C]/90"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Add Video URL:</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="https://example.com/video.mp4"
                    className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleUrlAdd(e.currentTarget.value, 'video');
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                      if (input) {
                        handleUrlAdd(input.value, 'video');
                        input.value = '';
                      }
                    }}
                    className="px-3 py-2 bg-[#54037C] text-white rounded-xl text-sm hover:bg-[#54037C]/90"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
          {(images.length > 0 || videos.length > 0) && (
            <div className="mt-4 space-y-4">
              {images.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2">Images:</p>
                  <div className="grid grid-cols-4 gap-2">
                    {images.map((img, idx) => (
                      <div key={`img-${idx}`} className="relative">
                        <img src={img} alt={`Preview ${idx}`} className="w-full h-24 object-cover rounded-lg border-2 border-gray-200" />
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewImage(img);
                            setPreviewVideo("");
                          }}
                          className={`absolute top-1 right-1 text-xs px-2 py-1 rounded ${
                            previewImage === img ? 'bg-[#54037C] text-white' : 'bg-white/80 text-gray-700'
                          }`}
                        >
                          {previewImage === img ? '✓ Preview' : 'Set'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {videos.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2">Videos:</p>
                  <div className="grid grid-cols-4 gap-2">
                    {videos.map((vid, idx) => (
                      <div key={`vid-${idx}`} className="relative">
                        <video src={vid} className="w-full h-24 object-cover rounded-lg border-2 border-gray-200" muted />
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewVideo(vid);
                            setPreviewImage("");
                          }}
                          className={`absolute top-1 right-1 text-xs px-2 py-1 rounded ${
                            previewVideo === vid ? 'bg-[#54037C] text-white' : 'bg-white/80 text-gray-700'
                          }`}
                        >
                          {previewVideo === vid ? '✓ Preview' : 'Set'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <button className="w-full px-4 py-3 bg-[#54037C] hover:bg-[#54037C]/90 text-white font-semibold rounded-xl transition shadow-md">
          Add Testimony
        </button>
    </form>
    </div>
  );
}

function MessageForm({ onSubmit }: { onSubmit: (payload: Partial<Message>) => Promise<void> }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMsg] = useState("");
  return (
    <form
      className="grid gap-2 md:grid-cols-4 items-end"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, email, message }).then(() => {
          setName("");
          setEmail("");
          setMsg("");
        });
      }}
    >
      <Input label="Name" value={name} onChange={setName} />
      <Input label="Email" value={email} onChange={setEmail} />
      <Input label="Message" value={message} onChange={setMsg} />
      <button className="px-4 py-2 bg-blue-600 text-white rounded">Add Message</button>
    </form>
  );
}

function CrusadeTypeForm({ onSubmit }: { onSubmit: (payload: { name: string; description?: string }) => Promise<void> }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  return (
    <form
      className="space-y-4 bg-white rounded-xl p-5 border border-gray-200"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) {
          alert("Please enter a crusade type name");
          return;
        }
        onSubmit({ name: name.trim(), description: description.trim() || undefined }).then(() => {
          setName("");
          setDescription("");
        }).catch((err) => {
          alert(err?.message || "Failed to create crusade type");
        });
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input label="Type Name *" value={name} onChange={setName} placeholder="e.g., Prison, Online, Youth" required />
          <p className="text-xs text-gray-500 mt-1">This name will be used to categorize crusades</p>
        </div>
        <div className="flex items-end">
          <div className="w-full">
            <div className="text-xs text-gray-600 mb-2">💡 Examples: Prison, Online, Youth, Outreach, Healing, Revival</div>
          </div>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">
          Description/Details <span className="text-gray-500 font-normal">(Optional but recommended)</span>
        </label>
        <textarea
          className="w-full border border-gray-300 rounded-xl px-4 py-2 h-36 focus:outline-none focus:ring-2 focus:ring-[#54037C] focus:border-transparent"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter comprehensive details about this crusade type. For example: 'Prison crusades focus on ministering to inmates, sharing the gospel, and providing hope and transformation in correctional facilities. These events typically include worship, preaching, prayer, and testimonies.'"
        />
        <p className="text-xs text-gray-500 mt-1">This description helps clarify what this crusade type represents and will be shown when selecting this type while creating crusades.</p>
      </div>
      <button type="submit" className="w-full md:w-auto px-8 py-3 bg-[#54037C] hover:bg-[#54037C]/90 text-white rounded-xl font-semibold transition shadow-md">
        ➕ Create Crusade Type
      </button>
    </form>
  );
}

function CrusadeTypeItem({ 
  type, 
  onDelete, 
  onUpdate 
}: { 
  type: { id: string; name: string; description?: string; created_at?: string };
  onDelete: () => void;
  onUpdate: (payload: { name?: string; description?: string }) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(type.name);
  const [description, setDescription] = useState(type.description || "");

  if (editing) {
    return (
      <div className="p-5 border-2 border-[#54037C] rounded-xl bg-gradient-to-br from-[#54037C]/5 to-white">
        <div className="mb-4">
          <Input label="Type Name *" value={name} onChange={setName} />
          <p className="text-xs text-gray-500 mt-1">This name will be used to categorize crusades</p>
        </div>
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Description/Details <span className="text-gray-500 font-normal">(Optional but recommended)</span>
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-xl px-4 py-2 h-36 focus:outline-none focus:ring-2 focus:ring-[#54037C] focus:border-transparent"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter comprehensive details about this crusade type..."
          />
          <p className="text-xs text-gray-500 mt-1">This description will be shown when selecting this type while creating crusades.</p>
        </div>
        <div className="flex gap-2">
          <button
            className="px-6 py-2 bg-[#54037C] hover:bg-[#54037C]/90 text-white rounded-xl font-medium transition"
            onClick={() => {
              onUpdate({ name: name.trim(), description: description.trim() || undefined }).then(() => setEditing(false));
            }}
          >
            💾 Save Changes
          </button>
          <button
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition"
            onClick={() => {
              setName(type.name);
              setDescription(type.description || "");
              setEditing(false);
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 border-2 border-gray-200 rounded-xl bg-white hover:shadow-lg hover:border-[#54037C]/30 transition-all">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 rounded-full bg-[#54037C]"></div>
            <h3 className="font-bold text-xl text-[#54037C]">{type.name}</h3>
          </div>
          {type.description ? (
            <div className="pl-5">
              <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap leading-relaxed">{type.description}</p>
            </div>
          ) : (
            <div className="pl-5">
              <p className="text-xs text-gray-400 italic bg-gray-50 p-2 rounded border border-dashed border-gray-300">
                ⚠️ No description provided. Consider adding details about this crusade type.
              </p>
            </div>
          )}
          {type.created_at && (
            <div className="pl-5 text-xs text-gray-500 mt-2">
              Created: {new Date(type.created_at).toLocaleString()}
            </div>
          )}
        </div>
        <div className="flex flex-row md:flex-col gap-2 md:w-auto w-full">
          <button 
            className="flex-1 md:flex-none px-4 py-2 bg-[#54037C] hover:bg-[#54037C]/90 text-white rounded-xl text-sm font-medium transition" 
            onClick={() => setEditing(true)}
          >
            ✏️ Edit
          </button>
          <button 
            className="flex-1 md:flex-none px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition" 
            onClick={onDelete}
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean }) {
  return (
    <label className="text-sm">
      <div className="mb-1 font-medium text-gray-700">{label}</div>
      <input
        type={type}
        className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#54037C] focus:border-transparent"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </label>
  );
}

function SongForm({ onSubmit }: { onSubmit: (payload: Partial<Song>) => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [date, setDate] = useState("");
  return (
    <form
      className="grid gap-2 md:grid-cols-4 items-end"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ title, artist, lyrics, date }).then(() => {
          setTitle("");
          setArtist("");
          setLyrics("");
          setDate("");
        });
      }}
    >
      <Input label="Title" value={title} onChange={setTitle} />
      <Input label="Artist" value={artist} onChange={setArtist} />
      <label className="text-sm md:col-span-2">
        <div className="mb-1">Lyrics</div>
        <textarea className="w-full border rounded px-3 py-2 h-[88px]" value={lyrics} onChange={(e) => setLyrics(e.target.value)} />
      </label>
      <Input label="Date" value={date} onChange={setDate} placeholder="YYYY-MM-DD" />
      <button className="px-4 py-2 bg-blue-600 text-white rounded">Add Song</button>
    </form>
  );
}


