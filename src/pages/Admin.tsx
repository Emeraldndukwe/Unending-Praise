import { useEffect, useMemo, useState } from "react";
import { compressImage, compressVideo } from "../utils/mediaOptimizer";

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
  location?: string;
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
  const [tab, setTab] = useState<"testimonies" | "crusades" | "messages" | "songs" | "comments" | "users">("testimonies");
  const [role, setRole] = useState<string>("");
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [crusades, setCrusades] = useState<Crusade[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<Array<{id:string; name:string; email:string; role:string; status:string; created_at?: string;}>>([]);

  // Admin comments management
  const [commentEntityType, setCommentEntityType] = useState<"testimony" | "crusade">("testimony");
  const [commentEntityId, setCommentEntityId] = useState<string>("");
  const [managedComments, setManagedComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const toCamelTestimony = (row: any): Testimony => ({
    id: row.id,
    name: row.name,
    title: row.title,
    content: row.content,
    summary: row.summary,
    approved: row.approved,
    images: row.images,
    videos: row.videos,
    previewImage: row.previewImage ?? row.preview_image,
    previewVideo: row.previewVideo ?? row.preview_video,
    createdAt: row.createdAt ?? row.created_at ?? new Date().toISOString(),
    email: row.email,
    phone: row.phone,
  });
  const toCamelCrusade = (row: any): Crusade => ({
    id: row.id,
    title: row.title,
    description: row.description,
    summary: row.summary,
    date: row.date,
    location: row.location,
    images: row.images,
    videos: row.videos,
    previewImage: row.previewImage ?? row.preview_image,
    previewVideo: row.previewVideo ?? row.preview_video,
    createdAt: row.createdAt ?? row.created_at ?? new Date().toISOString(),
  });

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
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // load current user role if logged in
    (async () => {
      if (!token) return;
      try {
        const res = await fetch('/api/auth/me', { headers: headers as HeadersInit });
        if (res.ok) {
          const data = await res.json();
          setRole(data?.user?.role || "");
        }
      } catch {}
    })();
  }, []);

  const approveTestimony = async (id: string) => {
    await api<Testimony>(`/api/testimonies/${id}/approve`, { method: "POST", headers: headers as HeadersInit });
    refresh();
  };

  const deleteItem = async (kind: string, id: string) => {
    await fetch(`/api/${kind}/${id}`, { method: "DELETE", headers: headers as HeadersInit });
    refresh();
  };

  const createCrusade = async (payload: Partial<Crusade>) => {
    await api<Crusade>(`/api/crusades`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    refresh();
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
            {mode === "login" && (
              <p className="text-xs text-center text-gray-500 mt-4">
                Default: admin@unendingpraise.com / admin123
              </p>
            )}
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
            if (role === 'superadmin') return ([...base, 'users'] as const);
            if (!role || role === 'admin') return base;
            if (role === 'testimony') return ["testimonies", "comments"] as const;
            if (role === 'crusade') return ["crusades", "comments"] as const;
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
          <TestimonyForm onSubmit={createTestimony} />
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
          <CrusadeForm onSubmit={createCrusade} />
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-[#54037C]/10">
            <h2 className="text-xl font-bold text-[#54037C] mb-4">Crusades ({crusades.length})</h2>
            <div className="space-y-4">
              {crusades.length === 0 && <div className="text-sm text-gray-500 text-center py-8">No crusades yet</div>}
              {crusades.map((c) => (
                <CrusadeItem 
                  key={c.id} 
                  crusade={c} 
                  onDelete={() => deleteItem("crusades", c.id)}
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
          <SongForm onSubmit={createSong} />
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-[#54037C]/10">
            <h2 className="text-xl font-bold text-[#54037C] mb-4">Songs ({songs.length})</h2>
            <div className="space-y-4">
              {songs.length === 0 && <div className="text-sm text-gray-500 text-center py-8">No songs yet</div>}
              {[...songs].sort((a, b) => (a.date || '').localeCompare(b.date || '')).map((s) => (
                <div key={s.id} className="p-4 border border-gray-200 rounded-xl bg-white hover:shadow-md transition">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{s.title} {s.artist ? `- ${s.artist}` : ''}</h3>
                      <div className="text-sm text-gray-600 mb-2">📅 Date: {s.date || 'unspecified'}</div>
                      {s.lyrics && (
                        <details className="text-sm text-gray-700">
                          <summary className="cursor-pointer text-[#54037C] font-medium">View Lyrics</summary>
                          <pre className="mt-2 whitespace-pre-wrap font-sans">{s.lyrics}</pre>
                        </details>
                      )}
                      <div className="text-xs text-gray-500 mt-2">Created: {new Date(s.createdAt).toLocaleString()}</div>
                    </div>
                    <button className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm h-fit" onClick={() => deleteItem("songs", s.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
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

function TestimonyItem({ testimony, onApprove, onDelete, onUpdate }: { 
  testimony: Testimony; 
  onApprove: () => void;
  onDelete: () => void;
  onUpdate: (payload: Partial<Testimony>) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(testimony.name || "");
  const [title, setTitle] = useState(testimony.title || "");
  const [content, setContent] = useState(testimony.content || "");
  const [summary, setSummary] = useState(testimony.summary || "");

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
        <div className="flex gap-2">
          <button
            className="px-4 py-2 bg-[#54037C] text-white rounded-xl"
            onClick={() => {
              onUpdate({ name, title, content, summary }).then(() => setEditing(false));
            }}
          >
            Save
          </button>
          <button
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl"
            onClick={() => setEditing(false)}
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

function CrusadeItem({ crusade, onDelete, onUpdate }: { 
  crusade: Crusade; 
  onDelete: () => void;
  onUpdate: (payload: Partial<Crusade>) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(crusade.title || "");
  const [date, setDate] = useState(crusade.date || "");
  const [location, setLocation] = useState(crusade.location || "");
  const [description, setDescription] = useState(crusade.description || "");
  const [summary, setSummary] = useState(crusade.summary || "");

  if (editing) {
    return (
      <div className="p-4 border-2 border-[#54037C] rounded-xl bg-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Input label="Title" value={title} onChange={setTitle} />
          <Input label="Date" value={date} onChange={setDate} />
          <Input label="Location" value={location} onChange={setLocation} />
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
        <div className="flex gap-2">
          <button
            className="px-4 py-2 bg-[#54037C] text-white rounded-xl"
            onClick={() => {
              onUpdate({ title, date, location, description, summary }).then(() => setEditing(false));
            }}
          >
            Save
          </button>
          <button
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl"
            onClick={() => setEditing(false)}
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
            {crusade.location && <span className="mr-4">📍 {crusade.location}</span>}
            {crusade.date && <span>📅 {crusade.date}</span>}
          </div>
          {crusade.previewVideo ? (
            <video src={crusade.previewVideo} className="w-32 h-20 object-cover rounded-lg mb-2" controls />
          ) : crusade.previewImage && (
            <img src={crusade.previewImage} alt="Preview" className="w-32 h-20 object-cover rounded-lg mb-2" />
          )}
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

function CrusadeForm({ onSubmit }: { onSubmit: (payload: Partial<Crusade>) => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
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
          setImages(prev => [...prev, compressed]);
          if (!previewImage && !previewVideo) setPreviewImage(compressed);
        } else if (file.type.startsWith("video/")) {
          const compressed = await compressVideo(file);
          setVideos(prev => [...prev, compressed]);
          if (!previewImage && !previewVideo) setPreviewVideo(compressed);
        }
      } catch (err: any) {
        alert(`Error processing ${file.name}: ${err.message}`);
      }
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-[#54037C]/10">
      <h2 className="text-xl font-bold text-[#54037C] mb-4">Create New Crusade</h2>
    <form
        className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
          const finalType = newType.trim() ? newType.trim() : type;
          onSubmit({ title, date, location, description, summary, type: finalType, images, videos, previewImage, previewVideo }).then(() => {
          setTitle("");
          setDate("");
            setLocation("");
          setDescription("");
            setSummary("");
            setType("");
            setNewType("");
            setImages([]);
            setVideos([]);
            setPreviewImage("");
            setPreviewVideo("");
        });
      }}
    >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Title" value={title} onChange={setTitle} placeholder="e.g., A Day of Blessings" />
          <Input label="Date" value={date} onChange={setDate} placeholder="YYYY-MM-DD or Dec 2023" />
          <Input label="Location" value={location} onChange={setLocation} placeholder="e.g., Lagos State" />
          <label className="text-sm">
            <div className="mb-1 font-medium text-gray-700">Type (select or add new)</div>
            <div className="grid grid-cols-2 gap-2">
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border border-gray-300 rounded-xl px-4 py-2">
                <option value="">— Select —</option>
                <option value="prison">prison</option>
                <option value="online">online</option>
              </select>
              <input
                placeholder="or create new"
                className="w-full border border-gray-300 rounded-xl px-4 py-2"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
              />
            </div>
          </label>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
          <textarea
            className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#54037C] focus:border-transparent h-24"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Full description of the crusade..."
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
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleMediaUpload}
            className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm"
          />
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
          Create Crusade
        </button>
    </form>
    </div>
  );
}

function TestimonyForm({ onSubmit }: { onSubmit: (payload: Partial<Testimony>) => Promise<void> }) {
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
          setImages(prev => [...prev, compressed]);
          if (!previewImage && !previewVideo) setPreviewImage(compressed);
        } else if (file.type.startsWith("video/")) {
          const compressed = await compressVideo(file);
          setVideos(prev => [...prev, compressed]);
          if (!previewImage && !previewVideo) setPreviewVideo(compressed);
        }
      } catch (err: any) {
        alert(`Error processing ${file.name}: ${err.message}`);
      }
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
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleMediaUpload}
            className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm"
          />
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

function Input({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="text-sm">
      <div className="mb-1 font-medium text-gray-700">{label}</div>
      <input
        type={type}
        className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#54037C] focus:border-transparent"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
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


