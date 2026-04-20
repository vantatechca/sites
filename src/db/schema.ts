import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  boolean,
  integer,
  decimal,
  date,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "manager",
  "team_member",
  "client",
]);

export const departmentEnum = pgEnum("department", [
  "design",
  "development",
  "content",
  "qa",
  "project_management",
]);

export const projectTierEnum = pgEnum("project_tier", [
  "basic",
  "pro",
  "enterprise",
]);

export const projectStatusEnum = pgEnum("project_status", [
  "intake",
  "requirements",
  "design",
  "development",
  "content",
  "review_internal",
  "client_review",
  "revisions",
  "final_qa",
  "launch_prep",
  "launched",
  "post_launch",
  "completed",
  "on_hold",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "not_started",
  "in_progress",
  "completed",
  "skipped",
  "blocked",
]);

export const checkinStatusEnum = pgEnum("checkin_status", [
  "pending",
  "submitted",
  "ai_processed",
  "reviewed",
]);

export const messageThreadTypeEnum = pgEnum("message_thread_type", [
  "client_chat",
  "internal_chat",
  "deliverable_comment",
]);

export const deliverableTypeEnum = pgEnum("deliverable_type", [
  "screenshot",
  "live_preview_link",
  "file",
  "video",
  "text_update",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "viewed",
  "paid",
  "overdue",
  "cancelled",
]);

// ─── Tables ───────────────────────────────────────────────────────────────────

// 1. Users
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    passwordHash: text("password_hash"),
    role: userRoleEnum("role").notNull().default("team_member"),
    avatarUrl: text("avatar_url"),
    department: departmentEnum("department"),
    specialization: varchar("specialization", { length: 255 }),
    maxConcurrentProjects: integer("max_concurrent_projects").default(5),
    currentProjectCount: integer("current_project_count").default(0).notNull(),
    timezone: varchar("timezone", { length: 64 }).default("America/Toronto"),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    lastCheckinAt: timestamp("last_checkin_at", { withTimezone: true }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("users_email_idx").on(table.email),
    index("users_role_idx").on(table.role),
  ]
);

// 2. Clients
export const clients = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    companyName: varchar("company_name", { length: 255 }).notNull(),
    contactName: varchar("contact_name", { length: 255 }).notNull(),
    contactEmail: varchar("contact_email", { length: 255 }).notNull(),
    contactPhone: varchar("contact_phone", { length: 50 }),
    industry: varchar("industry", { length: 128 }),
    websiteUrl: text("website_url"),
    brandingAssets: jsonb("branding_assets").$type<Record<string, unknown>>(),
    billingAddress: jsonb("billing_address").$type<{
      street?: string;
      city?: string;
      province?: string;
      postalCode?: string;
      country?: string;
    }>(),
    notes: text("notes"),
    tags: text("tags")
      .array()
      .default([])
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("clients_user_id_idx").on(table.userId)]
);

// 3. Projects
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    projectName: varchar("project_name", { length: 255 }).notNull(),
    shopifyStoreUrl: text("shopify_store_url"),
    liveDomain: text("live_domain"),
    tier: projectTierEnum("tier").notNull().default("basic"),
    status: projectStatusEnum("status").notNull().default("intake"),
    statusHistory: jsonb("status_history")
      .$type<
        Array<{ status: string; changedAt: string; changedBy?: string }>
      >()
      .default([])
      .notNull(),
    progressPercent: integer("progress_percent").default(0).notNull(),
    currentPhase: varchar("current_phase", { length: 128 }),
    startDate: date("start_date"),
    estimatedCompletionDate: date("estimated_completion_date"),
    actualCompletionDate: date("actual_completion_date"),
    projectManagerId: uuid("project_manager_id").references(() => users.id, {
      onDelete: "set null",
    }),
    teamMembers: jsonb("team_members")
      .$type<
        Array<{ userId: string; role: string; department?: string }>
      >()
      .default([])
      .notNull(),
    clientVisibleNotes: text("client_visible_notes"),
    internalNotes: text("internal_notes"),
    contractValue: decimal("contract_value", {
      precision: 12,
      scale: 2,
    }),
    amountPaid: decimal("amount_paid", { precision: 12, scale: 2 })
      .default("0")
      .notNull(),
    amountRemaining: decimal("amount_remaining", {
      precision: 12,
      scale: 2,
    }),
    priority: integer("priority").default(5).notNull(),
    tags: text("tags")
      .array()
      .default([])
      .notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("projects_client_id_idx").on(table.clientId),
    index("projects_status_idx").on(table.status),
    index("projects_project_manager_id_idx").on(table.projectManagerId),
  ]
);

// 4. Checklist Templates
export const checklistTemplates = pgTable("checklist_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  version: integer("version").default(1).notNull(),
  phases: jsonb("phases")
    .$type<
      Array<{
        name: string;
        sortOrder: number;
        tasks: Array<{
          name: string;
          description?: string;
          estimatedHours: number;
          isMilestone: boolean;
          clientVisible: boolean;
          clientLabel?: string;
          tierApplicable: { basic: boolean; pro: boolean; enterprise: boolean };
          dependsOn?: string[];
        }>;
      }>
    >()
    .notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: uuid("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// 5. Project Tasks
export const projectTasks = pgTable(
  "project_tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    templateTaskId: text("template_task_id"),
    phaseName: varchar("phase_name", { length: 128 }).notNull(),
    name: varchar("name", { length: 512 }).notNull(),
    description: text("description"),
    status: taskStatusEnum("status").notNull().default("not_started"),
    assignedTo: uuid("assigned_to").references(() => users.id, {
      onDelete: "set null",
    }),
    estimatedHours: decimal("estimated_hours", {
      precision: 6,
      scale: 2,
    }),
    actualHours: decimal("actual_hours", { precision: 6, scale: 2 })
      .default("0")
      .notNull(),
    isMilestone: boolean("is_milestone").default(false).notNull(),
    clientVisible: boolean("client_visible").default(false).notNull(),
    clientLabel: varchar("client_label", { length: 255 }),
    clientStatusOverride: varchar("client_status_override", { length: 128 }),
    tierApplicable: boolean("tier_applicable").default(true).notNull(),
    dependsOn: text("depends_on")
      .array()
      .default([]),
    sortOrder: integer("sort_order").default(0).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    completedBy: uuid("completed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    attachments: jsonb("attachments")
      .$type<
        Array<{ name: string; url: string; type: string }>
      >(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("project_tasks_project_id_idx").on(table.projectId),
    index("project_tasks_assigned_to_idx").on(table.assignedTo),
    index("project_tasks_status_idx").on(table.status),
  ]
);

// 6. Daily Check-ins
export const dailyCheckins = pgTable(
  "daily_checkins",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    checkinDate: date("checkin_date").notNull(),
    rawResponse: text("raw_response"),
    aiSummary: text("ai_summary"),
    aiExtractedUpdates: jsonb("ai_extracted_updates").$type<
      Array<{
        projectId?: string;
        taskId?: string;
        statusUpdate?: string;
        hoursWorked?: number;
        blockers?: string[];
      }>
    >(),
    aiConfidenceScore: decimal("ai_confidence_score", {
      precision: 4,
      scale: 3,
    }),
    aiFlags: jsonb("ai_flags").$type<
      Array<{ type: string; message: string; severity: string }>
    >(),
    status: checkinStatusEnum("status").notNull().default("pending"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("daily_checkins_user_id_idx").on(table.userId),
    index("daily_checkins_checkin_date_idx").on(table.checkinDate),
  ]
);

// 8. Deliverables (defined before messages for FK reference)
export const deliverables = pgTable("deliverables", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  taskId: uuid("task_id").references(() => projectTasks.id, {
    onDelete: "set null",
  }),
  name: varchar("name", { length: 512 }).notNull(),
  description: text("description"),
  type: deliverableTypeEnum("type").notNull(),
  fileUrl: text("file_url"),
  previewUrl: text("preview_url"),
  clientVisible: boolean("client_visible").default(true).notNull(),
  clientApproved: boolean("client_approved").default(false).notNull(),
  clientFeedback: text("client_feedback"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// 7. Messages
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    threadType: messageThreadTypeEnum("thread_type").notNull(),
    parentMessageId: uuid("parent_message_id"),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    attachments: jsonb("attachments").$type<
      Array<{ name: string; url: string; type: string; size?: number }>
    >(),
    deliverableId: uuid("deliverable_id").references(() => deliverables.id, {
      onDelete: "set null",
    }),
    isVisibleToClient: boolean("is_visible_to_client")
      .default(false)
      .notNull(),
    isReadByClient: boolean("is_read_by_client").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("messages_project_id_idx").on(table.projectId),
    index("messages_thread_type_idx").on(table.threadType),
  ]
);

// 9. Invoices
export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    invoiceNumber: varchar("invoice_number", { length: 64 }).notNull().unique(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("CAD").notNull(),
    description: text("description"),
    milestoneName: varchar("milestone_name", { length: 255 }),
    status: invoiceStatusEnum("status").notNull().default("draft"),
    dueDate: date("due_date"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    paymentMethod: varchar("payment_method", { length: 128 }),
    pdfUrl: text("pdf_url"),
    visibleToClient: boolean("visible_to_client").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("invoices_project_id_idx").on(table.projectId),
    index("invoices_client_id_idx").on(table.clientId),
  ]
);

// 10. Branding Config
export const brandingConfig = pgTable("branding_config", {
  id: uuid("id").defaultRandom().primaryKey(),
  agencyName: varchar("agency_name", { length: 255 }).notNull(),
  logoLightUrl: text("logo_light_url"),
  logoDarkUrl: text("logo_dark_url"),
  faviconUrl: text("favicon_url"),
  primaryColor: varchar("primary_color", { length: 9 })
    .default("#2D5A8C")
    .notNull(),
  secondaryColor: varchar("secondary_color", { length: 9 })
    .default("#1A1A2E")
    .notNull(),
  accentColor: varchar("accent_color", { length: 9 })
    .default("#E8491D")
    .notNull(),
  fontHeading: varchar("font_heading", { length: 128 })
    .default("Inter")
    .notNull(),
  fontBody: varchar("font_body", { length: 128 }).default("Inter").notNull(),
  portalDomain: text("portal_domain"),
  welcomeMessage: text("welcome_message"),
  footerText: text("footer_text"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// 11. Activity Log
export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("activity_log_project_id_idx").on(table.projectId)]
);

// 12. Notifications
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull(),
    type: text("type").notNull(),
    link: text("link"),
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("notifications_user_id_idx").on(table.userId)]
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many, one }) => ({
  client: one(clients, {
    fields: [users.id],
    references: [clients.userId],
  }),
  managedProjects: many(projects, { relationName: "projectManager" }),
  assignedTasks: many(projectTasks, { relationName: "taskAssignee" }),
  completedTasks: many(projectTasks, { relationName: "taskCompleter" }),
  dailyCheckins: many(dailyCheckins),
  sentMessages: many(messages),
  createdDeliverables: many(deliverables),
  activityLogs: many(activityLog),
  notifications: many(notifications),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, {
    fields: [clients.userId],
    references: [users.id],
  }),
  projects: many(projects),
  invoices: many(invoices),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
  projectManager: one(users, {
    fields: [projects.projectManagerId],
    references: [users.id],
    relationName: "projectManager",
  }),
  tasks: many(projectTasks),
  messages: many(messages),
  deliverables: many(deliverables),
  invoices: many(invoices),
  activityLogs: many(activityLog),
}));

export const checklistTemplatesRelations = relations(
  checklistTemplates,
  ({ one }) => ({
    creator: one(users, {
      fields: [checklistTemplates.createdBy],
      references: [users.id],
    }),
  })
);

export const projectTasksRelations = relations(
  projectTasks,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [projectTasks.projectId],
      references: [projects.id],
    }),
    assignee: one(users, {
      fields: [projectTasks.assignedTo],
      references: [users.id],
      relationName: "taskAssignee",
    }),
    completer: one(users, {
      fields: [projectTasks.completedBy],
      references: [users.id],
      relationName: "taskCompleter",
    }),
    deliverables: many(deliverables),
  })
);

export const dailyCheckinsRelations = relations(dailyCheckins, ({ one }) => ({
  user: one(users, {
    fields: [dailyCheckins.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  project: one(projects, {
    fields: [messages.projectId],
    references: [projects.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  parentMessage: one(messages, {
    fields: [messages.parentMessageId],
    references: [messages.id],
    relationName: "messageReplies",
  }),
  replies: many(messages, { relationName: "messageReplies" }),
  deliverable: one(deliverables, {
    fields: [messages.deliverableId],
    references: [deliverables.id],
  }),
}));

export const deliverablesRelations = relations(
  deliverables,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [deliverables.projectId],
      references: [projects.id],
    }),
    task: one(projectTasks, {
      fields: [deliverables.taskId],
      references: [projectTasks.id],
    }),
    creator: one(users, {
      fields: [deliverables.createdBy],
      references: [users.id],
    }),
    comments: many(messages),
  })
);

export const invoicesRelations = relations(invoices, ({ one }) => ({
  project: one(projects, {
    fields: [invoices.projectId],
    references: [projects.id],
  }),
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  project: one(projects, {
    fields: [activityLog.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [activityLog.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));
