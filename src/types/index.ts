// ============================================================================
// SiteForge - Application Types
// ============================================================================

// --- Enums / Union Types ---

export type UserRole = 'admin' | 'manager' | 'team_member' | 'client'

export type Department =
  | 'design'
  | 'development'
  | 'content'
  | 'qa'
  | 'project_management'

export type ProjectTier = 'basic' | 'pro' | 'enterprise'

export type ProjectStatus =
  | 'intake'
  | 'requirements'
  | 'design'
  | 'development'
  | 'content'
  | 'review_internal'
  | 'client_review'
  | 'revisions'
  | 'final_qa'
  | 'launch_prep'
  | 'launched'
  | 'post_launch'
  | 'completed'
  | 'on_hold'

export type TaskStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'skipped'
  | 'blocked'

export type CheckinStatus =
  | 'pending'
  | 'submitted'
  | 'ai_processed'
  | 'reviewed'

export type ThreadType =
  | 'client_chat'
  | 'internal_chat'
  | 'deliverable_comment'

export type DeliverableType =
  | 'screenshot'
  | 'live_preview_link'
  | 'file'
  | 'video'
  | 'text_update'

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'paid'
  | 'overdue'
  | 'cancelled'

// --- Interfaces ---

export interface User {
  id: string
  name: string
  email: string
  passwordHash: string | null
  role: UserRole
  department: Department | null
  avatarUrl: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Client {
  id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  avatarUrl: string | null
  notes: string | null
  userId: string
  createdAt: Date
  updatedAt: Date
}

export interface Project {
  id: string
  name: string
  slug: string
  tier: ProjectTier
  status: ProjectStatus
  clientId: string
  managerId: string
  description: string | null
  storeUrl: string | null
  previewUrl: string | null
  estimatedLaunchDate: Date | null
  actualLaunchDate: Date | null
  totalBudget: number | null
  currentPhase: string | null
  progressPercent: number
  brandingConfigId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ProjectTask {
  id: string
  projectId: string
  phaseKey: string
  taskKey: string
  title: string
  description: string | null
  status: TaskStatus
  assigneeId: string | null
  sortOrder: number
  dueDate: Date | null
  completedAt: Date | null
  completedById: string | null
  blockedReason: string | null
  createdAt: Date
  updatedAt: Date
}

export interface DailyCheckin {
  id: string
  projectId: string
  userId: string
  status: CheckinStatus
  completedTasks: string | null
  plannedTasks: string | null
  blockers: string | null
  hoursWorked: number | null
  aiSummary: string | null
  aiSentiment: string | null
  reviewedById: string | null
  reviewNotes: string | null
  checkinDate: Date
  createdAt: Date
  updatedAt: Date
}

export interface MessageThread {
  id: string
  projectId: string
  type: ThreadType
  title: string | null
  deliverableId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Message {
  id: string
  threadId: string
  senderId: string
  content: string
  isAiGenerated: boolean
  parentMessageId: string | null
  readByUserIds: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Deliverable {
  id: string
  projectId: string
  type: DeliverableType
  title: string
  description: string | null
  fileUrl: string | null
  previewUrl: string | null
  version: number
  uploadedById: string
  isApproved: boolean
  approvedById: string | null
  approvedAt: Date | null
  clientVisible: boolean
  phaseKey: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Invoice {
  id: string
  projectId: string
  invoiceNumber: string
  status: InvoiceStatus
  amount: number
  currency: string
  description: string | null
  lineItems: InvoiceLineItem[]
  dueDate: Date
  sentAt: Date | null
  viewedAt: Date | null
  paidAt: Date | null
  stripePaymentIntentId: string | null
  stripeInvoiceUrl: string | null
  createdAt: Date
  updatedAt: Date
}

export interface InvoiceLineItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface BrandingConfig {
  id: string
  projectId: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  logoUrl: string | null
  faviconUrl: string | null
  fontHeading: string | null
  fontBody: string | null
  customCss: string | null
  welcomeMessage: string | null
  portalTitle: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ChecklistTemplate {
  id: string
  name: string
  tier: ProjectTier
  description: string | null
  phases: ChecklistPhase[]
  isDefault: boolean
  createdById: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ChecklistPhase {
  key: string
  title: string
  description: string | null
  sortOrder: number
  tasks: ChecklistTask[]
}

export interface ChecklistTask {
  key: string
  title: string
  description: string | null
  assigneeDepartment: Department | null
  sortOrder: number
  requiredForPhaseComplete: boolean
}

export interface ActivityLog {
  id: string
  projectId: string | null
  userId: string
  action: string
  entityType: string
  entityId: string | null
  metadata: Record<string, unknown> | null
  createdAt: Date
}

export interface Notification {
  id: string
  userId: string
  projectId: string | null
  type: string
  title: string
  message: string
  link: string | null
  isRead: boolean
  readAt: Date | null
  createdAt: Date
}

// --- Compound / Utility Types ---

export type ProjectWithClient = Project & {
  client: Client
}

export type ProjectWithDetails = Project & {
  client: Client
  manager: User
  tasks: ProjectTask[]
  brandingConfig: BrandingConfig | null
}

export type TaskWithAssignee = ProjectTask & {
  assignee: User | null
}

export type MessageWithSender = Message & {
  sender: User
}

export type DeliverableWithUploader = Deliverable & {
  uploadedBy: User
  approvedBy: User | null
}

export type InvoiceWithProject = Invoice & {
  project: Project
}

export type CheckinWithUser = DailyCheckin & {
  user: User
  reviewedBy: User | null
}

export type NotificationWithProject = Notification & {
  project: Project | null
}

export type ThreadWithMessages = MessageThread & {
  messages: MessageWithSender[]
}

export type ProjectClientView = Pick<
  Project,
  | 'id'
  | 'name'
  | 'slug'
  | 'tier'
  | 'status'
  | 'description'
  | 'storeUrl'
  | 'previewUrl'
  | 'estimatedLaunchDate'
  | 'actualLaunchDate'
  | 'progressPercent'
> & {
  clientStatusLabel: string
  brandingConfig: BrandingConfig | null
}

// --- Constants ---

export const PROJECT_STATUS_MAP: Record<ProjectStatus, string> = {
  intake: 'Getting Started',
  requirements: 'Gathering Your Info',
  design: 'Designing Your Store',
  development: 'Building Your Store',
  content: 'Adding Content',
  review_internal: 'Quality Check',
  client_review: 'Ready for Your Review',
  revisions: 'Making Your Changes',
  final_qa: 'Final Polish',
  launch_prep: 'Preparing to Launch',
  launched: 'Your Store is Live!',
  post_launch: 'Post-Launch Support',
  completed: 'Completed',
  on_hold: 'On Hold',
} as const

export const PROJECT_STATUS_ORDER: ProjectStatus[] = [
  'intake',
  'requirements',
  'design',
  'development',
  'content',
  'review_internal',
  'client_review',
  'revisions',
  'final_qa',
  'launch_prep',
  'launched',
  'post_launch',
  'completed',
  'on_hold',
]

export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'

export interface TierConfigEntry {
  displayName: string
  color: string
  badgeVariant: BadgeVariant
  maxProducts: number
  maxRevisions: number
  includesCustomDesign: boolean
  includesSEO: boolean
  supportDays: number
}

export const TIER_CONFIG: Record<ProjectTier, TierConfigEntry> = {
  basic: {
    displayName: 'Basic',
    color: '#6B7280',
    badgeVariant: 'secondary',
    maxProducts: 25,
    maxRevisions: 2,
    includesCustomDesign: false,
    includesSEO: false,
    supportDays: 7,
  },
  pro: {
    displayName: 'Pro',
    color: '#3B82F6',
    badgeVariant: 'default',
    maxProducts: 100,
    maxRevisions: 5,
    includesCustomDesign: true,
    includesSEO: true,
    supportDays: 30,
  },
  enterprise: {
    displayName: 'Enterprise',
    color: '#8B5CF6',
    badgeVariant: 'destructive',
    maxProducts: -1, // unlimited
    maxRevisions: -1, // unlimited
    includesCustomDesign: true,
    includesSEO: true,
    supportDays: 90,
  },
} as const

export const DEPARTMENT_LABELS: Record<Department, string> = {
  design: 'Design',
  development: 'Development',
  content: 'Content',
  qa: 'QA',
  project_management: 'Project Management',
} as const

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  team_member: 'Team Member',
  client: 'Client',
} as const

// --- Helper Functions ---

export function getClientStatusLabel(status: ProjectStatus): string {
  return PROJECT_STATUS_MAP[status]
}

export function getTierConfig(tier: ProjectTier): TierConfigEntry {
  return TIER_CONFIG[tier]
}

export function isAgencyRole(role: UserRole): boolean {
  return role === 'admin' || role === 'manager' || role === 'team_member'
}

export function isClientRole(role: UserRole): boolean {
  return role === 'client'
}

export function getProgressForStatus(status: ProjectStatus): number {
  const index = PROJECT_STATUS_ORDER.indexOf(status)
  if (index === -1 || status === 'on_hold') return 0
  // completed is last real status before on_hold
  const completedIndex = PROJECT_STATUS_ORDER.indexOf('completed')
  return Math.round((index / completedIndex) * 100)
}
