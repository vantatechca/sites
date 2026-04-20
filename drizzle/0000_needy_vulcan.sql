CREATE TYPE "public"."checkin_status" AS ENUM('pending', 'submitted', 'ai_processed', 'reviewed');--> statement-breakpoint
CREATE TYPE "public"."deliverable_type" AS ENUM('screenshot', 'live_preview_link', 'file', 'video', 'text_update');--> statement-breakpoint
CREATE TYPE "public"."department" AS ENUM('design', 'development', 'content', 'qa', 'project_management');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."message_thread_type" AS ENUM('client_chat', 'internal_chat', 'deliverable_comment');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('intake', 'requirements', 'design', 'development', 'content', 'review_internal', 'client_review', 'revisions', 'final_qa', 'launch_prep', 'launched', 'post_launch', 'completed', 'on_hold');--> statement-breakpoint
CREATE TYPE "public"."project_tier" AS ENUM('basic', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('not_started', 'in_progress', 'completed', 'skipped', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'manager', 'team_member', 'client');--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"user_id" uuid NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "branding_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_name" varchar(255) NOT NULL,
	"logo_light_url" text,
	"logo_dark_url" text,
	"favicon_url" text,
	"primary_color" varchar(9) DEFAULT '#2D5A8C' NOT NULL,
	"secondary_color" varchar(9) DEFAULT '#1A1A2E' NOT NULL,
	"accent_color" varchar(9) DEFAULT '#E8491D' NOT NULL,
	"font_heading" varchar(128) DEFAULT 'Inter' NOT NULL,
	"font_body" varchar(128) DEFAULT 'Inter' NOT NULL,
	"portal_domain" text,
	"welcome_message" text,
	"footer_text" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checklist_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"phases" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"contact_name" varchar(255) NOT NULL,
	"contact_email" varchar(255) NOT NULL,
	"contact_phone" varchar(50),
	"industry" varchar(128),
	"website_url" text,
	"branding_assets" jsonb,
	"billing_address" jsonb,
	"notes" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_checkins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"checkin_date" date NOT NULL,
	"raw_response" text,
	"ai_summary" text,
	"ai_extracted_updates" jsonb,
	"ai_confidence_score" numeric(4, 3),
	"ai_flags" jsonb,
	"status" "checkin_status" DEFAULT 'pending' NOT NULL,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deliverables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"task_id" uuid,
	"name" varchar(512) NOT NULL,
	"description" text,
	"type" "deliverable_type" NOT NULL,
	"file_url" text,
	"preview_url" text,
	"client_visible" boolean DEFAULT true NOT NULL,
	"client_approved" boolean DEFAULT false NOT NULL,
	"client_feedback" text,
	"published_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"invoice_number" varchar(64) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'CAD' NOT NULL,
	"description" text,
	"milestone_name" varchar(255),
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"due_date" date,
	"paid_at" timestamp with time zone,
	"payment_method" varchar(128),
	"pdf_url" text,
	"visible_to_client" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"thread_type" "message_thread_type" NOT NULL,
	"parent_message_id" uuid,
	"sender_id" uuid NOT NULL,
	"body" text NOT NULL,
	"attachments" jsonb,
	"deliverable_id" uuid,
	"is_visible_to_client" boolean DEFAULT false NOT NULL,
	"is_read_by_client" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"type" text NOT NULL,
	"link" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"template_task_id" text,
	"phase_name" varchar(128) NOT NULL,
	"name" varchar(512) NOT NULL,
	"description" text,
	"status" "task_status" DEFAULT 'not_started' NOT NULL,
	"assigned_to" uuid,
	"estimated_hours" numeric(6, 2),
	"actual_hours" numeric(6, 2) DEFAULT '0' NOT NULL,
	"is_milestone" boolean DEFAULT false NOT NULL,
	"client_visible" boolean DEFAULT false NOT NULL,
	"client_label" varchar(255),
	"client_status_override" varchar(128),
	"tier_applicable" boolean DEFAULT true NOT NULL,
	"depends_on" text[] DEFAULT '{}',
	"sort_order" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone,
	"completed_by" uuid,
	"notes" text,
	"attachments" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"project_name" varchar(255) NOT NULL,
	"shopify_store_url" text,
	"live_domain" text,
	"tier" "project_tier" DEFAULT 'basic' NOT NULL,
	"status" "project_status" DEFAULT 'intake' NOT NULL,
	"status_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"progress_percent" integer DEFAULT 0 NOT NULL,
	"current_phase" varchar(128),
	"start_date" date,
	"estimated_completion_date" date,
	"actual_completion_date" date,
	"project_manager_id" uuid,
	"team_members" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"client_visible_notes" text,
	"internal_notes" text,
	"contract_value" numeric(12, 2),
	"amount_paid" numeric(12, 2) DEFAULT '0' NOT NULL,
	"amount_remaining" numeric(12, 2),
	"priority" integer DEFAULT 5 NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"password_hash" text,
	"role" "user_role" DEFAULT 'team_member' NOT NULL,
	"avatar_url" text,
	"department" "department",
	"specialization" varchar(255),
	"max_concurrent_projects" integer DEFAULT 5,
	"current_project_count" integer DEFAULT 0 NOT NULL,
	"timezone" varchar(64) DEFAULT 'America/Toronto',
	"last_login_at" timestamp with time zone,
	"last_checkin_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_templates" ADD CONSTRAINT "checklist_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_checkins" ADD CONSTRAINT "daily_checkins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_task_id_project_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."project_tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_deliverable_id_deliverables_id_fk" FOREIGN KEY ("deliverable_id") REFERENCES "public"."deliverables"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_project_manager_id_users_id_fk" FOREIGN KEY ("project_manager_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_log_project_id_idx" ON "activity_log" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "clients_user_id_idx" ON "clients" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "daily_checkins_user_id_idx" ON "daily_checkins" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "daily_checkins_checkin_date_idx" ON "daily_checkins" USING btree ("checkin_date");--> statement-breakpoint
CREATE INDEX "invoices_project_id_idx" ON "invoices" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "invoices_client_id_idx" ON "invoices" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "messages_project_id_idx" ON "messages" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "messages_thread_type_idx" ON "messages" USING btree ("thread_type");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "project_tasks_project_id_idx" ON "project_tasks" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_tasks_assigned_to_idx" ON "project_tasks" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "project_tasks_status_idx" ON "project_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "projects_client_id_idx" ON "projects" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "projects_status_idx" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "projects_project_manager_id_idx" ON "projects" USING btree ("project_manager_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");