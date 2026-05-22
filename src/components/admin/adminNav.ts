import {
  LayoutDashboard,
  MessageSquareQuote,
  Map,
  MessageCircle,
  Music,
  Mail,
  Tags,
  Users,
  BarChart3,
  GraduationCap,
  Calendar,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";

export type AdminTab =
  | "dashboard"
  | "testimonies"
  | "crusades"
  | "messages"
  | "songs"
  | "comments"
  | "crusade-types"
  | "users"
  | "analytics"
  | "trainings"
  | "form-submissions"
  | "events";

export type NavItem = {
  id: AdminTab;
  label: string;
  icon: LucideIcon;
  description: string;
};

export const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Overview and quick actions",
  },
  {
    id: "testimonies",
    label: "Testimonies",
    icon: MessageSquareQuote,
    description: "Review, approve, and manage testimonies",
  },
  {
    id: "crusades",
    label: "Crusades",
    icon: Map,
    description: "Manage crusade records and media",
  },
  {
    id: "comments",
    label: "Comments",
    icon: MessageCircle,
    description: "Moderate comments on testimonies and crusades",
  },
  {
    id: "songs",
    label: "Songs",
    icon: Music,
    description: "Manage song library and lyrics",
  },
  {
    id: "messages",
    label: "Messages",
    icon: Mail,
    description: "View contact form messages",
  },
  {
    id: "crusade-types",
    label: "Crusade Types",
    icon: Tags,
    description: "Configure crusade categories",
  },
  {
    id: "users",
    label: "Team",
    icon: Users,
    description: "Manage admin users and roles",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    description: "Traffic and engagement insights",
  },
  {
    id: "trainings",
    label: "Trainings & Resources",
    icon: GraduationCap,
    description: "Videos, documents, and training links",
  },
  {
    id: "events",
    label: "Events",
    icon: Calendar,
    description: "Manage live stream events",
  },
  {
    id: "form-submissions",
    label: "Form Submissions",
    icon: ClipboardList,
    description: "Review crusade form submissions",
  },
];

export function getVisibleTabs(role: string): AdminTab[] {
  const content = ["testimonies", "crusades", "messages", "songs", "comments"] as const;

  if (role === "superadmin") {
    return [
      "dashboard",
      ...content,
      "crusade-types",
      "users",
      "analytics",
      "trainings",
      "events",
      "form-submissions",
    ];
  }
  if (!role || role === "admin") {
    return [
      "dashboard",
      ...content,
      "crusade-types",
      "analytics",
      "events",
      "form-submissions",
    ];
  }
  if (role === "testimony") return ["dashboard", "testimonies", "comments"];
  if (role === "crusade") {
    return ["dashboard", "crusades", "crusade-types", "form-submissions", "comments"];
  }
  if (role === "messages") return ["dashboard", "messages"];
  if (role === "songs") return ["dashboard", "songs"];
  return ["dashboard", ...content];
}

export function getNavItem(tab: AdminTab): NavItem {
  return NAV_ITEMS.find((item) => item.id === tab) ?? NAV_ITEMS[0];
}
