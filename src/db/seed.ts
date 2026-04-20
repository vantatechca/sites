import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { hashSync } from "bcryptjs";
import {
  users,
  clients,
  projects,
  checklistTemplates,
  brandingConfig,
} from "./schema";

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  console.log("Seeding database...");

  // ─── 1. Branding Config ──────────────────────────────────────────────────────

  console.log("  Creating branding config...");
  await db.insert(brandingConfig).values({
    agencyName: "SiteForge Agency",
    logoLightUrl: "/logo-light.svg",
    logoDarkUrl: "/logo-dark.svg",
    faviconUrl: "/favicon.ico",
    primaryColor: "#2D5A8C",
    secondaryColor: "#1A1A2E",
    accentColor: "#E8491D",
    fontHeading: "Inter",
    fontBody: "Inter",
    portalDomain: "portal.siteforge.com",
    welcomeMessage:
      "Welcome to SiteForge! Track your Shopify website project in real-time.",
    footerText: "SiteForge Agency. All rights reserved.",
    isActive: true,
  });

  // ─── 2. Admin User ───────────────────────────────────────────────────────────

  console.log("  Creating admin user...");
  const [adminUser] = await db
    .insert(users)
    .values({
      email: "admin@siteforge.com",
      name: "SiteForge Admin",
      passwordHash: hashSync("password123", 12),
      role: "admin",
      department: "project_management",
      specialization: "Platform Administration",
      maxConcurrentProjects: 50,
      currentProjectCount: 0,
      timezone: "America/Toronto",
      isActive: true,
    })
    .returning();

  // ─── 3. Team Members ─────────────────────────────────────────────────────────

  console.log("  Creating team members...");
  const [designLead] = await db
    .insert(users)
    .values({
      email: "sarah@siteforge.com",
      name: "Sarah Chen",
      passwordHash: hashSync("password123", 12),
      role: "manager",
      department: "design",
      specialization: "UI/UX Design Lead",
      maxConcurrentProjects: 10,
      currentProjectCount: 0,
      timezone: "America/Toronto",
      isActive: true,
    })
    .returning();

  const [devLead] = await db
    .insert(users)
    .values({
      email: "marcus@siteforge.com",
      name: "Marcus Johnson",
      passwordHash: hashSync("password123", 12),
      role: "manager",
      department: "development",
      specialization: "Shopify Development Lead",
      maxConcurrentProjects: 8,
      currentProjectCount: 0,
      timezone: "America/Toronto",
      isActive: true,
    })
    .returning();

  const [contentWriter] = await db
    .insert(users)
    .values({
      email: "emma@siteforge.com",
      name: "Emma Williams",
      passwordHash: hashSync("password123", 12),
      role: "team_member",
      department: "content",
      specialization: "Copywriting & SEO",
      maxConcurrentProjects: 12,
      currentProjectCount: 0,
      timezone: "America/Toronto",
      isActive: true,
    })
    .returning();

  const [qaEngineer] = await db
    .insert(users)
    .values({
      email: "james@siteforge.com",
      name: "James Park",
      passwordHash: hashSync("password123", 12),
      role: "team_member",
      department: "qa",
      specialization: "Quality Assurance & Testing",
      maxConcurrentProjects: 15,
      currentProjectCount: 0,
      timezone: "America/Toronto",
      isActive: true,
    })
    .returning();

  // ─── 4. Client Users ─────────────────────────────────────────────────────────

  console.log("  Creating client users...");
  const [clientUser1] = await db
    .insert(users)
    .values({
      email: "olivia@bloomnatural.com",
      name: "Olivia Hart",
      role: "client",
      timezone: "America/New_York",
      isActive: true,
    })
    .returning();

  const [clientUser2] = await db
    .insert(users)
    .values({
      email: "daniel@ironforge.com",
      name: "Daniel Reeves",
      role: "client",
      timezone: "America/Chicago",
      isActive: true,
    })
    .returning();

  const [clientUser3] = await db
    .insert(users)
    .values({
      email: "priya@luxeinteriors.com",
      name: "Priya Sharma",
      role: "client",
      timezone: "America/Los_Angeles",
      isActive: true,
    })
    .returning();

  // ─── 5. Clients ───────────────────────────────────────────────────────────────

  console.log("  Creating clients...");
  const [client1] = await db
    .insert(clients)
    .values({
      userId: clientUser1.id,
      companyName: "Bloom Natural Skincare",
      contactName: "Olivia Hart",
      contactEmail: "olivia@bloomnatural.com",
      contactPhone: "+1-416-555-0101",
      industry: "Beauty & Skincare",
      websiteUrl: "https://bloomnatural.com",
      brandingAssets: {
        primaryColor: "#7B9E6B",
        secondaryColor: "#F5E6D3",
        logoUrl: "/clients/bloom/logo.svg",
        fontFamily: "Cormorant Garamond",
      },
      billingAddress: {
        street: "234 Queen St W",
        city: "Toronto",
        province: "ON",
        postalCode: "M5V 2A1",
        country: "CA",
      },
      notes: "Organic skincare brand. Prefers earthy, natural aesthetics.",
      tags: ["skincare", "organic", "toronto"],
    })
    .returning();

  const [client2] = await db
    .insert(clients)
    .values({
      userId: clientUser2.id,
      companyName: "IronForge Fitness Equipment",
      contactName: "Daniel Reeves",
      contactEmail: "daniel@ironforge.com",
      contactPhone: "+1-312-555-0202",
      industry: "Fitness & Sports",
      websiteUrl: "https://ironforgefit.com",
      brandingAssets: {
        primaryColor: "#1A1A1A",
        secondaryColor: "#FF4500",
        logoUrl: "/clients/ironforge/logo.svg",
        fontFamily: "Oswald",
      },
      billingAddress: {
        street: "789 Industrial Blvd",
        city: "Chicago",
        province: "IL",
        postalCode: "60601",
        country: "US",
      },
      notes:
        "Commercial gym equipment manufacturer. Bold, high-energy brand aesthetic.",
      tags: ["fitness", "equipment", "b2b", "chicago"],
    })
    .returning();

  const [client3] = await db
    .insert(clients)
    .values({
      userId: clientUser3.id,
      companyName: "Luxe Interiors Collection",
      contactName: "Priya Sharma",
      contactEmail: "priya@luxeinteriors.com",
      contactPhone: "+1-310-555-0303",
      industry: "Home & Interior Design",
      websiteUrl: "https://luxeinteriors.com",
      brandingAssets: {
        primaryColor: "#2C2C2C",
        secondaryColor: "#C9A96E",
        logoUrl: "/clients/luxe/logo.svg",
        fontFamily: "Playfair Display",
      },
      billingAddress: {
        street: "456 Rodeo Dr, Suite 200",
        city: "Beverly Hills",
        province: "CA",
        postalCode: "90210",
        country: "US",
      },
      notes:
        "High-end interior design firm. Requires premium, luxury aesthetic with 3D product visualization.",
      tags: ["interiors", "luxury", "los-angeles", "high-value"],
    })
    .returning();

  // ─── 6. Projects ──────────────────────────────────────────────────────────────

  console.log("  Creating projects...");
  await db.insert(projects).values([
    {
      clientId: client1.id,
      projectName: "Bloom Natural Skincare - Shopify Store",
      shopifyStoreUrl: "https://bloom-natural.myshopify.com",
      tier: "basic" as const,
      status: "design" as const,
      statusHistory: [
        {
          status: "intake",
          changedAt: "2026-03-01T10:00:00Z",
          changedBy: adminUser.id,
        },
        {
          status: "requirements",
          changedAt: "2026-03-05T14:00:00Z",
          changedBy: adminUser.id,
        },
        {
          status: "design",
          changedAt: "2026-03-12T09:00:00Z",
          changedBy: adminUser.id,
        },
      ],
      progressPercent: 20,
      currentPhase: "Design",
      startDate: "2026-03-01",
      estimatedCompletionDate: "2026-05-15",
      projectManagerId: adminUser.id,
      teamMembers: [
        {
          userId: designLead.id,
          role: "Design Lead",
          department: "design",
        },
        {
          userId: devLead.id,
          role: "Developer",
          department: "development",
        },
        {
          userId: contentWriter.id,
          role: "Content Writer",
          department: "content",
        },
      ],
      clientVisibleNotes:
        "Your Shopify store design is in progress! We will share mockups soon.",
      internalNotes:
        "Client prefers earthy tones. Keep it minimal. 25 products in initial catalog.",
      contractValue: "4500.00",
      amountPaid: "1500.00",
      amountRemaining: "3000.00",
      priority: 5,
      tags: ["basic", "skincare", "q2-2026"],
    },
    {
      clientId: client2.id,
      projectName: "IronForge Fitness - E-Commerce Platform",
      shopifyStoreUrl: "https://ironforge-fit.myshopify.com",
      tier: "pro" as const,
      status: "development" as const,
      statusHistory: [
        {
          status: "intake",
          changedAt: "2026-02-15T10:00:00Z",
          changedBy: adminUser.id,
        },
        {
          status: "requirements",
          changedAt: "2026-02-20T14:00:00Z",
          changedBy: adminUser.id,
        },
        {
          status: "design",
          changedAt: "2026-02-28T09:00:00Z",
          changedBy: adminUser.id,
        },
        {
          status: "development",
          changedAt: "2026-03-15T11:00:00Z",
          changedBy: adminUser.id,
        },
      ],
      progressPercent: 45,
      currentPhase: "Development",
      startDate: "2026-02-15",
      estimatedCompletionDate: "2026-05-30",
      projectManagerId: adminUser.id,
      teamMembers: [
        {
          userId: designLead.id,
          role: "Design Lead",
          department: "design",
        },
        {
          userId: devLead.id,
          role: "Lead Developer",
          department: "development",
        },
        {
          userId: contentWriter.id,
          role: "Content Writer",
          department: "content",
        },
        {
          userId: qaEngineer.id,
          role: "QA Engineer",
          department: "qa",
        },
      ],
      clientVisibleNotes:
        "Development is underway. Custom product configurator is being built.",
      internalNotes:
        "Complex product catalog with 200+ SKUs. Custom weight calculator app needed. B2B wholesale pricing tier required.",
      contractValue: "12000.00",
      amountPaid: "6000.00",
      amountRemaining: "6000.00",
      priority: 3,
      tags: ["pro", "fitness", "b2b", "custom-app", "q2-2026"],
    },
    {
      clientId: client3.id,
      projectName: "Luxe Interiors - Premium Design Portfolio & Shop",
      shopifyStoreUrl: "https://luxe-interiors-collection.myshopify.com",
      tier: "enterprise" as const,
      status: "requirements" as const,
      statusHistory: [
        {
          status: "intake",
          changedAt: "2026-03-20T10:00:00Z",
          changedBy: adminUser.id,
        },
        {
          status: "requirements",
          changedAt: "2026-03-28T14:00:00Z",
          changedBy: adminUser.id,
        },
      ],
      progressPercent: 8,
      currentPhase: "Requirements",
      startDate: "2026-03-20",
      estimatedCompletionDate: "2026-07-31",
      projectManagerId: adminUser.id,
      teamMembers: [
        {
          userId: designLead.id,
          role: "Design Lead",
          department: "design",
        },
        {
          userId: devLead.id,
          role: "Lead Developer",
          department: "development",
        },
        {
          userId: contentWriter.id,
          role: "Content Strategist",
          department: "content",
        },
        {
          userId: qaEngineer.id,
          role: "QA Lead",
          department: "qa",
        },
      ],
      clientVisibleNotes:
        "We are gathering detailed requirements for your premium Shopify experience.",
      internalNotes:
        "Enterprise client. High budget, high expectations. Needs 3D product viewer, AR integration, multi-currency, and custom Shopify Plus features. VIP client - prioritize communication.",
      contractValue: "35000.00",
      amountPaid: "10000.00",
      amountRemaining: "25000.00",
      priority: 1,
      tags: [
        "enterprise",
        "luxury",
        "shopify-plus",
        "3d",
        "ar",
        "vip",
        "q2-2026",
      ],
    },
  ]);

  // ─── 7. Master Checklist Template ─────────────────────────────────────────────

  console.log("  Creating master checklist template...");
  const allTiers = { basic: true, pro: true, enterprise: true };
  const proAndEnterprise = { basic: false, pro: true, enterprise: true };
  const enterpriseOnly = { basic: false, pro: false, enterprise: true };

  await db.insert(checklistTemplates).values({
    name: "Shopify Website Master Checklist",
    version: 1,
    isActive: true,
    createdBy: adminUser.id,
    phases: [
      // ── Phase 1: Intake & Onboarding ───────────────────────────────────
      {
        name: "Intake & Onboarding",
        sortOrder: 1,
        tasks: [
          {
            name: "Send welcome email with portal login credentials",
            description:
              "Send the client their login credentials and a welcome guide explaining the portal, communication process, and project timeline.",
            estimatedHours: 0.5,
            isMilestone: false,
            clientVisible: true,
            clientLabel: "Welcome email sent",
            tierApplicable: allTiers,
          },
          {
            name: "Create project record in SiteForge",
            description:
              "Set up the project in the system with client details, tier, contract value, and assign the project manager.",
            estimatedHours: 0.25,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Assign project manager and core team",
            description:
              "Assign PM based on availability and expertise. Select design, dev, and content team members.",
            estimatedHours: 0.5,
            isMilestone: false,
            clientVisible: true,
            clientLabel: "Team assigned to your project",
            tierApplicable: allTiers,
          },
          {
            name: "Schedule kickoff call with client",
            description:
              "Schedule a 30-60 minute kickoff call to introduce the team, discuss goals, and align expectations.",
            estimatedHours: 0.5,
            isMilestone: false,
            clientVisible: true,
            clientLabel: "Kickoff call scheduled",
            tierApplicable: allTiers,
          },
          {
            name: "Conduct kickoff call",
            description:
              "Hold the kickoff meeting. Cover project goals, brand vision, target audience, competitor references, and timeline.",
            estimatedHours: 1,
            isMilestone: true,
            clientVisible: true,
            clientLabel: "Kickoff call completed",
            tierApplicable: allTiers,
          },
          {
            name: "Collect branding assets from client",
            description:
              "Request and collect logo files, brand guidelines, color palettes, fonts, photography, and any existing marketing materials.",
            estimatedHours: 1,
            isMilestone: false,
            clientVisible: true,
            clientLabel: "Branding assets received",
            tierApplicable: allTiers,
          },
          {
            name: "Collect product data and content from client",
            description:
              "Gather product catalog, descriptions, pricing, images, categories, and any existing content the client wants migrated.",
            estimatedHours: 2,
            isMilestone: false,
            clientVisible: true,
            clientLabel: "Product data received",
            tierApplicable: allTiers,
          },
          {
            name: "Set up Shopify store (dev environment)",
            description:
              "Create the Shopify development store, configure basic settings, and set up the development theme.",
            estimatedHours: 1,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Configure Shopify Plus features",
            description:
              "Set up Shopify Plus exclusive features: checkout.liquid customization, scripts editor, wholesale channel, Flow automation, and multi-currency.",
            estimatedHours: 4,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: enterpriseOnly,
          },
        ],
      },

      // ── Phase 2: Requirements & Planning ───────────────────────────────
      {
        name: "Requirements & Planning",
        sortOrder: 2,
        tasks: [
          {
            name: "Document functional requirements",
            description:
              "Create a detailed requirements document covering site functionality, integrations, page structure, and user flows.",
            estimatedHours: 3,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Define site map and navigation structure",
            description:
              "Map out all pages, collections, product categories, and navigation hierarchy. Include mega-menu structure for Pro/Enterprise.",
            estimatedHours: 2,
            isMilestone: false,
            clientVisible: true,
            clientLabel: "Site structure defined",
            tierApplicable: allTiers,
          },
          {
            name: "Identify required Shopify apps and integrations",
            description:
              "Research and list all third-party apps needed (reviews, email marketing, shipping, accounting, etc.).",
            estimatedHours: 1.5,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Create project timeline with milestones",
            description:
              "Build a detailed project timeline with phase dates, milestones, and client review checkpoints.",
            estimatedHours: 1,
            isMilestone: true,
            clientVisible: true,
            clientLabel: "Project timeline shared",
            tierApplicable: allTiers,
          },
          {
            name: "Plan custom app development",
            description:
              "Scope and plan any custom Shopify apps needed (product configurators, wholesale portals, custom calculators, etc.).",
            estimatedHours: 4,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: proAndEnterprise,
          },
          {
            name: "Define API integration specifications",
            description:
              "Document all API integrations (ERP, CRM, PIM, 3PL, custom backends) with data flow diagrams and authentication requirements.",
            estimatedHours: 6,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: enterpriseOnly,
          },
          {
            name: "Client sign-off on requirements",
            description:
              "Present the complete requirements document to the client for review and formal approval before proceeding.",
            estimatedHours: 1,
            isMilestone: true,
            clientVisible: true,
            clientLabel: "Requirements approved",
            tierApplicable: allTiers,
          },
        ],
      },

      // ── Phase 3: Design ────────────────────────────────────────────────
      {
        name: "Design",
        sortOrder: 3,
        tasks: [
          {
            name: "Create wireframes for key pages",
            description:
              "Design low-fidelity wireframes for homepage, collection pages, product detail page, cart, and checkout flow.",
            estimatedHours: 6,
            isMilestone: false,
            clientVisible: true,
            clientLabel: "Wireframes ready for review",
            tierApplicable: allTiers,
          },
          {
            name: "Design homepage mockup (desktop + mobile)",
            description:
              "Create high-fidelity homepage designs for desktop and mobile breakpoints with all hero sections, featured products, and CTAs.",
            estimatedHours: 8,
            isMilestone: false,
            clientVisible: true,
            clientLabel: "Homepage design ready",
            tierApplicable: allTiers,
          },
          {
            name: "Design product detail page mockup",
            description:
              "Design the product page layout including gallery, variants, add-to-cart, reviews section, and related products.",
            estimatedHours: 4,
            isMilestone: false,
            clientVisible: true,
            clientLabel: "Product page design ready",
            tierApplicable: allTiers,
          },
          {
            name: "Design collection page mockup",
            description:
              "Design collection/category page layout with filters, sorting, grid/list views, and pagination.",
            estimatedHours: 3,
            isMilestone: false,
            clientVisible: true,
            clientLabel: "Collection page design ready",
            tierApplicable: allTiers,
          },
          {
            name: "Design cart and checkout flow",
            description:
              "Design the shopping cart, checkout steps, and order confirmation pages. Include upsell/cross-sell placements.",
            estimatedHours: 4,
            isMilestone: false,
            clientVisible: true,
            clientLabel: "Cart & checkout design ready",
            tierApplicable: allTiers,
          },
          {
            name: "Design interior pages (About, Contact, FAQ, etc.)",
            description:
              "Design all secondary pages: About Us, Contact, FAQ, Shipping Policy, Returns, and any custom pages.",
            estimatedHours: 6,
            isMilestone: false,
            clientVisible: true,
            clientLabel: "Interior page designs ready",
            tierApplicable: allTiers,
          },
          {
            name: "Design custom landing page templates",
            description:
              "Create reusable landing page templates for marketing campaigns, seasonal promotions, and product launches.",
            estimatedHours: 6,
            isMilestone: false,
            clientVisible: true,
            clientLabel: "Landing page templates ready",
            tierApplicable: proAndEnterprise,
          },
          {
            name: "Design 3D product viewer interface",
            description:
              "Design the UI for the 3D product viewer including controls, zoom, rotation, color/material selectors, and AR placement button.",
            estimatedHours: 8,
            isMilestone: false,
            clientVisible: true,
            clientLabel: "3D viewer design ready",
            tierApplicable: enterpriseOnly,
          },
          {
            name: "Create responsive design system and style guide",
            description:
              "Document the complete design system: typography scale, color tokens, spacing, button styles, form elements, and component library.",
            estimatedHours: 4,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Client design review and feedback",
            description:
              "Present all designs to the client via the portal. Walk through each page and collect structured feedback.",
            estimatedHours: 2,
            isMilestone: true,
            clientVisible: true,
            clientLabel: "Design review meeting",
            tierApplicable: allTiers,
          },
          {
            name: "Implement design revisions (round 1)",
            description:
              "Apply client feedback from the design review. Basic tier gets 1 round, Pro gets 2, Enterprise gets 3.",
            estimatedHours: 4,
            isMilestone: false,
            clientVisible: true,
            clientLabel: "Design revisions applied",
            tierApplicable: allTiers,
          },
          {
            name: "Implement design revisions (round 2)",
            description:
              "Second round of design revisions for Pro and Enterprise clients.",
            estimatedHours: 3,
            isMilestone: false,
            clientVisible: true,
            clientLabel: "Second revision round applied",
            tierApplicable: proAndEnterprise,
          },
          {
            name: "Implement design revisions (round 3)",
            description:
              "Third round of design revisions for Enterprise clients.",
            estimatedHours: 3,
            isMilestone: false,
            clientVisible: true,
            clientLabel: "Final revision round applied",
            tierApplicable: enterpriseOnly,
          },
          {
            name: "Client design sign-off",
            description:
              "Obtain formal client approval on all final designs before proceeding to development.",
            estimatedHours: 0.5,
            isMilestone: true,
            clientVisible: true,
            clientLabel: "Designs approved",
            tierApplicable: allTiers,
          },
        ],
      },

      // ── Phase 4: Development ───────────────────────────────────────────
      {
        name: "Development",
        sortOrder: 4,
        tasks: [
          {
            name: "Set up theme development environment",
            description:
              "Initialize the Shopify theme development environment with CLI tools, version control, and deployment pipeline.",
            estimatedHours: 2,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Develop homepage sections",
            description:
              "Build all homepage sections as Shopify theme sections: hero banner, featured collections, testimonials, newsletter signup, etc.",
            estimatedHours: 8,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Develop header and navigation",
            description:
              "Build the responsive header with logo, navigation, search, cart icon, and mobile hamburger menu. Include mega-menu for Pro/Enterprise.",
            estimatedHours: 6,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Develop footer",
            description:
              "Build the footer with navigation links, newsletter signup, social media icons, payment icons, and legal links.",
            estimatedHours: 2,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Develop product detail page template",
            description:
              "Build the product page with image gallery, variant selector, quantity picker, add-to-cart, tabs for description/reviews, and related products.",
            estimatedHours: 8,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Develop collection page template",
            description:
              "Build collection pages with filtering, sorting, pagination, grid/list toggle, and quick-view functionality.",
            estimatedHours: 6,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Develop cart page and drawer cart",
            description:
              "Build the full cart page and slide-out drawer cart with line items, quantity updates, discount code input, and upsells.",
            estimatedHours: 4,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Customize checkout experience",
            description:
              "Customize the Shopify checkout with branding, custom fields, and order summary styling. Full checkout.liquid customization for Plus.",
            estimatedHours: 4,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Develop interior pages",
            description:
              "Build all interior pages: About, Contact (with form), FAQ (accordion), Shipping, Returns, Privacy Policy, Terms of Service.",
            estimatedHours: 6,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Implement search functionality",
            description:
              "Set up Shopify search with predictive search, filters, and search results page. Integrate advanced search app for Pro/Enterprise.",
            estimatedHours: 3,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Build custom landing page sections",
            description:
              "Develop reusable, customizable landing page sections that the client can arrange in the Shopify theme editor.",
            estimatedHours: 8,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: proAndEnterprise,
          },
          {
            name: "Develop custom Shopify app",
            description:
              "Build and deploy the custom Shopify app(s) identified in requirements (product configurator, wholesale portal, etc.).",
            estimatedHours: 40,
            isMilestone: true,
            clientVisible: true,
            clientLabel: "Custom app development complete",
            tierApplicable: proAndEnterprise,
          },
          {
            name: "Integrate 3D product viewer and AR",
            description:
              "Implement the 3D product viewer with model loading, rotation controls, zoom, material switching, and AR placement via WebXR.",
            estimatedHours: 24,
            isMilestone: true,
            clientVisible: true,
            clientLabel: "3D/AR features built",
            tierApplicable: enterpriseOnly,
          },
          {
            name: "Set up multi-currency and multi-language",
            description:
              "Configure Shopify Markets for multi-currency pricing, language translations, and region-specific content.",
            estimatedHours: 8,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: enterpriseOnly,
          },
          {
            name: "Build API integrations",
            description:
              "Develop and test all API integrations: ERP sync, CRM data flow, PIM product feeds, 3PL shipping, and payment gateway connections.",
            estimatedHours: 20,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: enterpriseOnly,
          },
          {
            name: "Implement responsive design across all breakpoints",
            description:
              "Ensure pixel-perfect responsive behavior at mobile (375px), tablet (768px), and desktop (1280px+) breakpoints.",
            estimatedHours: 6,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Implement site-wide animations and interactions",
            description:
              "Add scroll animations, hover effects, page transitions, loading states, and micro-interactions per the design system.",
            estimatedHours: 4,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Development progress review (internal)",
            description:
              "Internal team review of all development work. Check against requirements, design fidelity, and performance benchmarks.",
            estimatedHours: 2,
            isMilestone: true,
            clientVisible: false,
            tierApplicable: allTiers,
          },
        ],
      },

      // ── Phase 5: Content ───────────────────────────────────────────────
      {
        name: "Content",
        sortOrder: 5,
        tasks: [
          {
            name: "Upload and organize product catalog",
            description:
              "Import all products into Shopify with titles, descriptions, images, variants, pricing, SKUs, and inventory levels.",
            estimatedHours: 8,
            isMilestone: false,
            clientVisible: true,
            clientLabel: "Products uploaded",
            tierApplicable: allTiers,
          },
          {
            name: "Create collection structure and rules",
            description:
              "Set up all collections (manual and automated), configure collection rules, sorting, and featured images.",
            estimatedHours: 2,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Write and format homepage content",
            description:
              "Write compelling homepage copy: hero headlines, value propositions, section descriptions, and CTAs.",
            estimatedHours: 3,
            isMilestone: false,
            clientVisible: true,
            clientLabel: "Homepage content ready",
            tierApplicable: allTiers,
          },
          {
            name: "Write SEO-optimized product descriptions",
            description:
              "Write or optimize product descriptions with target keywords, benefits-focused copy, and proper formatting.",
            estimatedHours: 8,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Write interior page content",
            description:
              "Write content for About, FAQ, Shipping, Returns, Contact, and any custom pages.",
            estimatedHours: 4,
            isMilestone: false,
            clientVisible: true,
            clientLabel: "Page content ready for review",
            tierApplicable: allTiers,
          },
          {
            name: "Optimize and upload images",
            description:
              "Process all images: resize, compress, convert to WebP, add alt text, and upload to Shopify CDN.",
            estimatedHours: 3,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Create blog posts and content marketing assets",
            description:
              "Write initial blog posts, buying guides, and content marketing pieces to support SEO and launch marketing.",
            estimatedHours: 8,
            isMilestone: false,
            clientVisible: true,
            clientLabel: "Blog content created",
            tierApplicable: proAndEnterprise,
          },
          {
            name: "Prepare 3D models and AR assets",
            description:
              "Process, optimize, and upload 3D product models. Configure AR assets and test on target devices.",
            estimatedHours: 12,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: enterpriseOnly,
          },
          {
            name: "Set up SEO foundations",
            description:
              "Configure meta titles, descriptions, Open Graph tags, structured data (JSON-LD), sitemap, and robots.txt.",
            estimatedHours: 3,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Client content review",
            description:
              "Share all content with the client for review and approval. Collect feedback on copy, imagery, and product data accuracy.",
            estimatedHours: 1,
            isMilestone: true,
            clientVisible: true,
            clientLabel: "Content review meeting",
            tierApplicable: allTiers,
          },
        ],
      },

      // ── Phase 6: Internal Review ───────────────────────────────────────
      {
        name: "Internal Review",
        sortOrder: 6,
        tasks: [
          {
            name: "Cross-browser testing",
            description:
              "Test on Chrome, Firefox, Safari, and Edge (latest 2 versions). Document and fix any rendering issues.",
            estimatedHours: 4,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Mobile device testing",
            description:
              "Test on iOS Safari (iPhone 13+), Android Chrome (Pixel, Samsung), and tablet devices. Fix touch and viewport issues.",
            estimatedHours: 3,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Performance audit (Core Web Vitals)",
            description:
              "Run Lighthouse audits. Optimize for LCP < 2.5s, FID < 100ms, CLS < 0.1. Fix any performance bottlenecks.",
            estimatedHours: 4,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Accessibility audit (WCAG 2.1 AA)",
            description:
              "Run automated accessibility checks and manual screen reader testing. Fix color contrast, ARIA labels, keyboard navigation, and focus management.",
            estimatedHours: 4,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "SEO audit",
            description:
              "Verify all SEO elements: meta tags, structured data, canonical URLs, image alt text, internal linking, and page speed.",
            estimatedHours: 2,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Test all forms and interactive elements",
            description:
              "Test contact forms, newsletter signup, search, filters, add-to-cart, checkout flow, and all interactive components.",
            estimatedHours: 3,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Test Shopify app integrations",
            description:
              "Verify all installed apps function correctly: reviews, email, shipping calculators, analytics, etc.",
            estimatedHours: 2,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Test custom app functionality",
            description:
              "End-to-end testing of custom Shopify apps: product configurator, wholesale portal, and any custom features.",
            estimatedHours: 8,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: proAndEnterprise,
          },
          {
            name: "Test 3D viewer and AR on target devices",
            description:
              "Test 3D product viewer performance, model loading, and AR placement on iOS and Android devices.",
            estimatedHours: 6,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: enterpriseOnly,
          },
          {
            name: "Test API integrations end-to-end",
            description:
              "Verify all API integrations: data sync accuracy, error handling, retry logic, and failover scenarios.",
            estimatedHours: 8,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: enterpriseOnly,
          },
          {
            name: "Load and stress testing",
            description:
              "Run load tests simulating expected traffic. Verify site handles concurrent users, large catalogs, and peak load scenarios.",
            estimatedHours: 4,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: enterpriseOnly,
          },
          {
            name: "Fix all identified bugs",
            description:
              "Address and resolve all bugs and issues found during testing. Re-test fixes.",
            estimatedHours: 6,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Internal QA sign-off",
            description:
              "QA lead signs off that the site meets all quality standards and is ready for client review.",
            estimatedHours: 1,
            isMilestone: true,
            clientVisible: false,
            tierApplicable: allTiers,
          },
        ],
      },

      // ── Phase 7: Client Review ─────────────────────────────────────────
      {
        name: "Client Review",
        sortOrder: 7,
        tasks: [
          {
            name: "Prepare client review environment",
            description:
              "Set up the preview link, prepare a walkthrough guide, and ensure all features are ready for client testing.",
            estimatedHours: 1,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Send preview link to client",
            description:
              "Share the preview URL with the client through the portal along with a guided tour of the site features.",
            estimatedHours: 0.5,
            isMilestone: true,
            clientVisible: true,
            clientLabel: "Preview link shared",
            tierApplicable: allTiers,
          },
          {
            name: "Conduct client walkthrough session",
            description:
              "Schedule and conduct a live walkthrough with the client, demonstrating all pages, features, and functionality.",
            estimatedHours: 1.5,
            isMilestone: false,
            clientVisible: true,
            clientLabel: "Walkthrough session",
            tierApplicable: allTiers,
          },
          {
            name: "Collect and organize client feedback",
            description:
              "Gather all client feedback from the portal, walkthrough notes, and email. Organize into actionable items by priority.",
            estimatedHours: 1,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Provide feedback estimate to client",
            description:
              "Review feedback items and communicate timeline for implementing changes. Flag any out-of-scope items.",
            estimatedHours: 0.5,
            isMilestone: false,
            clientVisible: true,
            clientLabel: "Feedback timeline shared",
            tierApplicable: allTiers,
          },
        ],
      },

      // ── Phase 8: Revisions ─────────────────────────────────────────────
      {
        name: "Revisions",
        sortOrder: 8,
        tasks: [
          {
            name: "Implement client feedback (round 1)",
            description:
              "Apply all approved client feedback items from the first review round.",
            estimatedHours: 8,
            isMilestone: false,
            clientVisible: true,
            clientLabel: "Revisions applied (round 1)",
            tierApplicable: allTiers,
          },
          {
            name: "Client re-review (round 1)",
            description:
              "Client reviews the implemented changes and provides additional feedback if needed.",
            estimatedHours: 1,
            isMilestone: false,
            clientVisible: true,
            clientLabel: "Re-review (round 1)",
            tierApplicable: allTiers,
          },
          {
            name: "Implement client feedback (round 2)",
            description:
              "Apply feedback from the second review round. Pro tier includes 2 revision rounds.",
            estimatedHours: 6,
            isMilestone: false,
            clientVisible: true,
            clientLabel: "Revisions applied (round 2)",
            tierApplicable: proAndEnterprise,
          },
          {
            name: "Client re-review (round 2)",
            description:
              "Client reviews second round of revisions.",
            estimatedHours: 1,
            isMilestone: false,
            clientVisible: true,
            clientLabel: "Re-review (round 2)",
            tierApplicable: proAndEnterprise,
          },
          {
            name: "Implement client feedback (round 3)",
            description:
              "Apply feedback from the third review round. Enterprise tier includes 3 revision rounds.",
            estimatedHours: 4,
            isMilestone: false,
            clientVisible: true,
            clientLabel: "Revisions applied (round 3)",
            tierApplicable: enterpriseOnly,
          },
          {
            name: "Client re-review (round 3)",
            description:
              "Client reviews third round of revisions.",
            estimatedHours: 1,
            isMilestone: false,
            clientVisible: true,
            clientLabel: "Re-review (round 3)",
            tierApplicable: enterpriseOnly,
          },
          {
            name: "Client approval on all revisions",
            description:
              "Obtain final sign-off from the client that all revisions are satisfactory and the site is ready for final QA.",
            estimatedHours: 0.5,
            isMilestone: true,
            clientVisible: true,
            clientLabel: "All revisions approved",
            tierApplicable: allTiers,
          },
        ],
      },

      // ── Phase 9: Final QA ──────────────────────────────────────────────
      {
        name: "Final QA",
        sortOrder: 9,
        tasks: [
          {
            name: "Full regression testing",
            description:
              "Complete regression test of all functionality after revisions. Verify nothing was broken during revision rounds.",
            estimatedHours: 4,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Final performance check",
            description:
              "Run final Lighthouse audit. Confirm Core Web Vitals targets are met: LCP < 2.5s, FID < 100ms, CLS < 0.1.",
            estimatedHours: 2,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Final accessibility check",
            description:
              "Run final WCAG 2.1 AA compliance check. Verify all previously identified accessibility issues are resolved.",
            estimatedHours: 2,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Security review",
            description:
              "Review security settings: SSL, CSP headers, form validation, XSS prevention, and secure API calls.",
            estimatedHours: 2,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Checkout and payment flow testing",
            description:
              "Test complete purchase flow with test credit cards: add to cart, apply discount, checkout, payment, and order confirmation.",
            estimatedHours: 2,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Email notification testing",
            description:
              "Verify all Shopify email notifications: order confirmation, shipping, refund, abandoned cart, and custom email templates.",
            estimatedHours: 2,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Test all third-party integrations",
            description:
              "Final verification of all app integrations, payment gateways, shipping providers, and analytics tracking.",
            estimatedHours: 3,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Final QA sign-off",
            description:
              "QA lead provides final sign-off. All tests pass. Site is certified ready for launch.",
            estimatedHours: 0.5,
            isMilestone: true,
            clientVisible: true,
            clientLabel: "Site certified for launch",
            tierApplicable: allTiers,
          },
        ],
      },

      // ── Phase 10: Launch Preparation ───────────────────────────────────
      {
        name: "Launch Preparation",
        sortOrder: 10,
        tasks: [
          {
            name: "Configure custom domain and DNS",
            description:
              "Set up the client's custom domain in Shopify. Configure DNS records (A record, CNAME) and verify SSL certificate.",
            estimatedHours: 1,
            isMilestone: false,
            clientVisible: true,
            clientLabel: "Domain configured",
            tierApplicable: allTiers,
          },
          {
            name: "Set up analytics and tracking",
            description:
              "Install and configure Google Analytics 4, Google Tag Manager, Facebook Pixel, and any other tracking pixels.",
            estimatedHours: 2,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Configure payment gateways",
            description:
              "Set up and test live payment processing: Shopify Payments, PayPal, and any additional gateways.",
            estimatedHours: 1,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Configure shipping rates and zones",
            description:
              "Set up shipping zones, rates, carrier-calculated shipping, and free shipping thresholds.",
            estimatedHours: 1.5,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Configure tax settings",
            description:
              "Set up tax rates, tax-exempt products, and automatic tax calculation for applicable regions.",
            estimatedHours: 1,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Set up email marketing integration",
            description:
              "Configure email marketing platform (Klaviyo/Mailchimp) with signup forms, welcome flows, and abandoned cart sequences.",
            estimatedHours: 3,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Create 301 redirects (if migrating)",
            description:
              "Set up URL redirects from old site structure to new. Prevent broken links and preserve SEO equity.",
            estimatedHours: 2,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Submit sitemap to Google Search Console",
            description:
              "Verify the site in Google Search Console, submit the XML sitemap, and configure crawl settings.",
            estimatedHours: 0.5,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Prepare launch-day checklist",
            description:
              "Create a step-by-step launch-day checklist covering DNS switch, password removal, go-live verification, and monitoring plan.",
            estimatedHours: 1,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Client launch briefing",
            description:
              "Brief the client on launch timeline, what to expect, and their responsibilities (DNS access, payment gateway activation).",
            estimatedHours: 0.5,
            isMilestone: true,
            clientVisible: true,
            clientLabel: "Launch briefing completed",
            tierApplicable: allTiers,
          },
        ],
      },

      // ── Phase 11: Launch & Post-Launch ─────────────────────────────────
      {
        name: "Launch & Post-Launch",
        sortOrder: 11,
        tasks: [
          {
            name: "Remove store password and go live",
            description:
              "Remove the Shopify store password, verify the live site is accessible, and confirm SSL is active on the custom domain.",
            estimatedHours: 0.5,
            isMilestone: true,
            clientVisible: true,
            clientLabel: "Site is LIVE",
            tierApplicable: allTiers,
          },
          {
            name: "Post-launch smoke test",
            description:
              "Immediately verify critical flows on the live site: homepage loads, products display, add-to-cart works, checkout functions.",
            estimatedHours: 1,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Verify analytics and tracking on live site",
            description:
              "Confirm all analytics tracking is firing correctly on the live domain: GA4, GTM, Facebook Pixel, etc.",
            estimatedHours: 1,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Monitor site performance (first 48 hours)",
            description:
              "Monitor site uptime, page load times, error rates, and server response during the first 48 hours post-launch.",
            estimatedHours: 2,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Process first test order on live site",
            description:
              "Place a real test order through the live payment gateway. Verify the entire order flow and fulfillment process.",
            estimatedHours: 0.5,
            isMilestone: false,
            clientVisible: false,
            tierApplicable: allTiers,
          },
          {
            name: "Client training session",
            description:
              "Conduct a training session covering: Shopify admin, theme editor, product management, order processing, and app usage.",
            estimatedHours: 2,
            isMilestone: true,
            clientVisible: true,
            clientLabel: "Training session completed",
            tierApplicable: allTiers,
          },
          {
            name: "Deliver documentation and handover package",
            description:
              "Provide the client with: admin guide, theme documentation, app credentials, and support contact information.",
            estimatedHours: 2,
            isMilestone: false,
            clientVisible: true,
            clientLabel: "Documentation delivered",
            tierApplicable: allTiers,
          },
          {
            name: "30-day post-launch support period begins",
            description:
              "Begin the included 30-day support period. Monitor and address any bugs, performance issues, or client questions.",
            estimatedHours: 1,
            isMilestone: false,
            clientVisible: true,
            clientLabel: "Support period active",
            tierApplicable: allTiers,
          },
          {
            name: "Post-launch performance report",
            description:
              "Generate a performance report covering: site speed, SEO scores, accessibility compliance, and initial traffic analytics.",
            estimatedHours: 2,
            isMilestone: false,
            clientVisible: true,
            clientLabel: "Performance report delivered",
            tierApplicable: allTiers,
          },
          {
            name: "Collect client testimonial and feedback",
            description:
              "Request a testimonial and project feedback from the client. Log feedback for process improvement.",
            estimatedHours: 0.5,
            isMilestone: false,
            clientVisible: true,
            clientLabel: "Feedback requested",
            tierApplicable: allTiers,
          },
          {
            name: "Final invoice and project closure",
            description:
              "Send the final invoice for remaining balance. Mark the project as completed in SiteForge. Archive project files.",
            estimatedHours: 1,
            isMilestone: true,
            clientVisible: true,
            clientLabel: "Project completed",
            tierApplicable: allTiers,
          },
        ],
      },
    ],
  });

  console.log("Seeding complete!");
  console.log("");
  console.log("Created:");
  console.log("  - 1 branding config");
  console.log("  - 1 admin user (admin@siteforge.com / password123)");
  console.log("  - 4 team members (sarah, marcus, emma, james @siteforge.com)");
  console.log("  - 3 client users");
  console.log("  - 3 clients (Bloom Natural, IronForge Fitness, Luxe Interiors)");
  console.log("  - 3 projects (basic, pro, enterprise)");
  console.log("  - 1 master checklist template (11 phases, 100+ tasks)");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
