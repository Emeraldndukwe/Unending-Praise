import { Clock, Shield, UserCheck, Users, Trash2, Loader2, Mail, RefreshCw } from "lucide-react";

type TeamUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at?: string;
};

type AdminTeamSectionProps = {
  users: TeamUser[];
  loading: boolean;
  currentUserId?: string;
  onRefresh: () => void;
  onRoleChange: (userId: string, role: string) => Promise<void>;
  onActivate: (userId: string) => Promise<void>;
  onRemove: (userId: string, email: string) => Promise<void>;
};

const ROLE_STYLES: Record<string, string> = {
  superadmin: "bg-gradient-to-r from-[#54037C] to-[#8A4EBF] text-white shadow-sm",
  admin: "bg-[#54037C]/12 text-[#54037C] ring-1 ring-[#54037C]/15",
  testimony: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",
  crusade: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  messages: "bg-amber-50 text-amber-800 ring-1 ring-amber-100",
  songs: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
  pending: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
};

function getInitials(name: string, email: string) {
  const source = name.trim() || email;
  return source
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatJoined(date?: string) {
  if (!date) return null;
  try {
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(
      new Date(date)
    );
  } catch {
    return null;
  }
}

function UserCard({
  user,
  currentUserId,
  pending,
  onRoleChange,
  onActivate,
  onRemove,
}: {
  user: TeamUser;
  currentUserId?: string;
  pending?: boolean;
  onRoleChange: (userId: string, role: string) => Promise<void>;
  onActivate: (userId: string) => Promise<void>;
  onRemove: (userId: string, email: string) => Promise<void>;
}) {
  const roleClass = ROLE_STYLES[user.role] ?? ROLE_STYLES.pending;
  const joined = formatJoined(user.created_at);

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-[#54037C]/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#54037C]/25 hover:shadow-lg">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#54037C]/0 via-[#8A4EBF]/40 to-[#54037C]/0 opacity-0 transition group-hover:opacity-100" />

      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#54037C] to-[#8A4EBF] text-sm font-bold text-white shadow-md shadow-[#54037C]/25">
          {getInitials(user.name, user.email)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="truncate text-base font-bold text-gray-900">{user.name || "Unnamed user"}</h4>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${roleClass}`}>
              {user.role}
            </span>
          </div>

          <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-gray-500">
            <Mail size={13} className="shrink-0 text-[#8A4EBF]/70" />
            {user.email}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {pending ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-100">
                <Clock size={11} />
                Awaiting approval
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-100">
                <UserCheck size={11} />
                Active
              </span>
            )}
            {joined && <span className="text-[11px] text-gray-400">Joined {joined}</span>}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#54037C]/8 pt-4">
        <label className="sr-only" htmlFor={`role-${user.id}`}>
          Role for {user.email}
        </label>
        <select
          id={`role-${user.id}`}
          className="min-w-[140px] flex-1 rounded-xl border border-[#54037C]/15 bg-[#FAF9F6] px-3 py-2.5 text-sm font-medium text-gray-700 outline-none focus:border-[#54037C]/40 focus:ring-2 focus:ring-[#54037C]/10 sm:flex-none"
          value={user.role}
          disabled={!pending && currentUserId === user.id}
          onChange={(event) => onRoleChange(user.id, event.target.value)}
        >
          {(pending
            ? ["admin", "testimony", "crusade", "messages", "songs", "pending"]
            : ["superadmin", "admin", "testimony", "crusade", "messages", "songs"]
          ).map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>

        {pending ? (
          <button
            type="button"
            onClick={() => onActivate(user.id)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#54037C] to-[#7a1eb3] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#54037C]/20 transition hover:brightness-110"
          >
            <UserCheck size={15} />
            Approve
          </button>
        ) : (
          currentUserId !== user.id && (
            <button
              type="button"
              onClick={() => onRemove(user.id, user.email)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
            >
              <Trash2 size={15} />
              Remove
            </button>
          )
        )}
      </div>
    </article>
  );
}

export default function AdminTeamSection({
  users,
  loading,
  currentUserId,
  onRefresh,
  onRoleChange,
  onActivate,
  onRemove,
}: AdminTeamSectionProps) {
  const pendingUsers = users.filter((user) => user.status !== "active");
  const activeUsers = users.filter((user) => user.status === "active");

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total members" value={users.length} icon={Users} accent />
        <StatCard label="Active" value={activeUsers.length} icon={UserCheck} />
        <StatCard label="Pending approval" value={pendingUsers.length} icon={Clock} warn={pendingUsers.length > 0} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <LoadingColumn />
          <LoadingColumn />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <TeamColumn
            title="Pending approval"
            subtitle="New registrations awaiting your review"
            icon={Clock}
            count={pendingUsers.length}
            emptyMessage="No one waiting for approval"
            accent="amber"
          >
            {pendingUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                currentUserId={currentUserId}
                pending
                onRoleChange={onRoleChange}
                onActivate={onActivate}
                onRemove={onRemove}
              />
            ))}
          </TeamColumn>

          <TeamColumn
            title="Active team"
            subtitle="Approved admins and content managers"
            icon={Shield}
            count={activeUsers.length}
            emptyMessage="No active team members yet"
            accent="purple"
          >
            {activeUsers.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                currentUserId={currentUserId}
                onRoleChange={onRoleChange}
                onActivate={onActivate}
                onRemove={onRemove}
              />
            ))}
          </TeamColumn>
        </div>
      )}

      {!loading && users.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#54037C]/20 bg-white/60 px-6 py-10 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-[#54037C]/40" />
          <p className="text-sm font-medium text-gray-700">Team list is empty</p>
          <p className="mt-1 text-sm text-gray-500">New sign-ups will appear under pending approval.</p>
          <button
            type="button"
            onClick={onRefresh}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#54037C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#54037C]/90"
          >
            <RefreshCw size={14} />
            Reload team
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  warn,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 transition ${
        accent
          ? "bg-gradient-to-br from-[#54037C] via-[#6b1899] to-[#8A4EBF] text-white shadow-lg shadow-[#54037C]/20"
          : warn
            ? "border border-amber-200 bg-gradient-to-br from-amber-50 to-white shadow-sm"
            : "border border-[#54037C]/8 bg-white shadow-sm"
      }`}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
          accent ? "bg-white/15" : warn ? "bg-amber-100 text-amber-700" : "bg-[#54037C]/8 text-[#54037C]"
        }`}
      >
        <Icon size={20} />
      </div>
      <p className={`mt-4 text-sm font-medium ${accent ? "text-white/75" : warn ? "text-amber-800/80" : "text-gray-500"}`}>
        {label}
      </p>
      <p className={`text-3xl font-bold tracking-tight ${accent ? "text-white" : warn ? "text-amber-900" : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}

function LoadingColumn() {
  return (
    <div className="rounded-2xl border border-[#54037C]/8 bg-white p-5 shadow-sm">
      <div className="mb-4 h-6 w-40 animate-pulse rounded-lg bg-[#54037C]/10" />
      <div className="space-y-3">
        {[1, 2, 3].map((key) => (
          <div key={key} className="flex gap-4 rounded-2xl border border-gray-100 p-4">
            <div className="h-12 w-12 shrink-0 animate-pulse rounded-2xl bg-[#54037C]/10" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-48 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[#54037C]">
        <Loader2 size={16} className="animate-spin" />
        Loading team…
      </div>
    </div>
  );
}

function TeamColumn({
  title,
  subtitle,
  icon: Icon,
  count,
  emptyMessage,
  accent,
  children,
}: {
  title: string;
  subtitle: string;
  icon: typeof Users;
  count: number;
  emptyMessage: string;
  accent: "amber" | "purple";
  children: React.ReactNode;
}) {
  const headerClass =
    accent === "amber"
      ? "bg-gradient-to-r from-amber-50/80 to-white"
      : "bg-gradient-to-r from-[#54037C]/5 to-white";

  return (
    <section className="overflow-hidden rounded-2xl border border-[#54037C]/10 bg-white shadow-md">
      <header className={`flex items-center justify-between gap-3 border-b border-[#54037C]/8 px-5 py-4 ${headerClass}`}>
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${
              accent === "amber" ? "bg-amber-100 text-amber-700" : "bg-[#54037C]/10 text-[#54037C]"
            }`}
          >
            <Icon size={20} />
          </div>
          <div>
            <h3 className="font-bold text-[#54037C]">{title}</h3>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            accent === "amber" ? "bg-amber-100 text-amber-800" : "bg-[#54037C]/10 text-[#54037C]"
          }`}
        >
          {count}
        </span>
      </header>

      <div className="max-h-[min(70vh,720px)] space-y-3 overflow-y-auto p-4 admin-sidebar-scroll">
        {count === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-[#FAF9F6]/80 py-12 text-center">
            <p className="text-sm text-gray-500">{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
