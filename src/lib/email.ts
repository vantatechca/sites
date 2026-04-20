import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_EMAIL = process.env.EMAIL_FROM || "noreply@siteforge.app";
const FROM_NAME = process.env.EMAIL_FROM_NAME || "SiteForge";

function baseTemplate(content: string): string {
  const primaryColor = "#2D5A8C";
  const secondaryColor = "#1A1A2E";
  const accentColor = "#E8491D";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${FROM_NAME}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f7;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${secondaryColor}; padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">${FROM_NAME}</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 24px 40px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #868e96; font-size: 13px; line-height: 1.5;">
                This email was sent by ${FROM_NAME}.<br>
                Please do not reply directly to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buttonHtml(text: string, url: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0;">
      <tr>
        <td align="center">
          <a href="${url}" style="display: inline-block; background-color: #2D5A8C; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600; letter-spacing: 0.3px;">${text}</a>
        </td>
      </tr>
    </table>`;
}

export async function sendMagicLink(
  email: string,
  url: string
): Promise<void> {
  const content = `
    <h2 style="margin: 0 0 16px; color: #1A1A2E; font-size: 20px; font-weight: 600;">Sign in to your portal</h2>
    <p style="margin: 0 0 8px; color: #495057; font-size: 15px; line-height: 1.6;">
      Click the button below to sign in to your client portal. This link is valid for 15 minutes.
    </p>
    ${buttonHtml("Sign In", url)}
    <p style="margin: 0; color: #868e96; font-size: 13px; line-height: 1.5;">
      If you did not request this link, you can safely ignore this email.
    </p>
    <p style="margin: 16px 0 0; color: #868e96; font-size: 12px; line-height: 1.5; word-break: break-all;">
      Or copy this link: ${url}
    </p>`;

  await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: email,
    subject: `Sign in to ${FROM_NAME}`,
    html: baseTemplate(content),
  });
}

export async function sendWelcomeEmail(
  clientName: string,
  email: string,
  portalUrl: string
): Promise<void> {
  const content = `
    <h2 style="margin: 0 0 16px; color: #1A1A2E; font-size: 20px; font-weight: 600;">Welcome to ${FROM_NAME}, ${clientName}!</h2>
    <p style="margin: 0 0 8px; color: #495057; font-size: 15px; line-height: 1.6;">
      Your client portal account has been created. Through the portal you can:
    </p>
    <ul style="margin: 16px 0; padding-left: 24px; color: #495057; font-size: 15px; line-height: 1.8;">
      <li>Track your project progress in real time</li>
      <li>Review and approve deliverables</li>
      <li>Communicate directly with your project team</li>
      <li>View invoices and payment history</li>
    </ul>
    ${buttonHtml("Access Your Portal", portalUrl)}
    <p style="margin: 0; color: #868e96; font-size: 13px; line-height: 1.5;">
      If you have any questions, your project manager will be happy to help.
    </p>`;

  await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: email,
    subject: `Welcome to ${FROM_NAME} - Your Client Portal`,
    html: baseTemplate(content),
  });
}

export async function sendMilestoneNotification(
  clientEmail: string,
  projectName: string,
  milestoneName: string
): Promise<void> {
  const content = `
    <h2 style="margin: 0 0 16px; color: #1A1A2E; font-size: 20px; font-weight: 600;">Milestone Reached!</h2>
    <p style="margin: 0 0 8px; color: #495057; font-size: 15px; line-height: 1.6;">
      Great news! A milestone has been completed on your project.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0; background-color: #f0f7ff; border-radius: 6px; border-left: 4px solid #2D5A8C;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 4px; color: #868e96; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Project</p>
          <p style="margin: 0 0 12px; color: #1A1A2E; font-size: 16px; font-weight: 600;">${projectName}</p>
          <p style="margin: 0 0 4px; color: #868e96; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Milestone</p>
          <p style="margin: 0; color: #1A1A2E; font-size: 16px; font-weight: 600;">${milestoneName}</p>
        </td>
      </tr>
    </table>
    <p style="margin: 0; color: #495057; font-size: 15px; line-height: 1.6;">
      Log in to your portal to see the latest updates and what comes next.
    </p>`;

  await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: clientEmail,
    subject: `${FROM_NAME} - Milestone Completed: ${milestoneName}`,
    html: baseTemplate(content),
  });
}

export async function sendDeliverableNotification(
  clientEmail: string,
  projectName: string,
  deliverableName: string
): Promise<void> {
  const content = `
    <h2 style="margin: 0 0 16px; color: #1A1A2E; font-size: 20px; font-weight: 600;">New Deliverable Ready</h2>
    <p style="margin: 0 0 8px; color: #495057; font-size: 15px; line-height: 1.6;">
      A new deliverable has been published for your review.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0; background-color: #f0f7ff; border-radius: 6px; border-left: 4px solid #2D5A8C;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 4px; color: #868e96; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Project</p>
          <p style="margin: 0 0 12px; color: #1A1A2E; font-size: 16px; font-weight: 600;">${projectName}</p>
          <p style="margin: 0 0 4px; color: #868e96; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Deliverable</p>
          <p style="margin: 0; color: #1A1A2E; font-size: 16px; font-weight: 600;">${deliverableName}</p>
        </td>
      </tr>
    </table>
    <p style="margin: 0; color: #495057; font-size: 15px; line-height: 1.6;">
      Please log in to your portal to review and provide feedback.
    </p>`;

  await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: clientEmail,
    subject: `${FROM_NAME} - New Deliverable: ${deliverableName}`,
    html: baseTemplate(content),
  });
}

export async function sendInvoiceNotification(
  clientEmail: string,
  invoiceNumber: string,
  amount: number
): Promise<void> {
  const formattedAmount = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amount);

  const content = `
    <h2 style="margin: 0 0 16px; color: #1A1A2E; font-size: 20px; font-weight: 600;">New Invoice</h2>
    <p style="margin: 0 0 8px; color: #495057; font-size: 15px; line-height: 1.6;">
      A new invoice has been issued for your project.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0; background-color: #f0f7ff; border-radius: 6px; border-left: 4px solid #2D5A8C;">
      <tr>
        <td style="padding: 20px;">
          <p style="margin: 0 0 4px; color: #868e96; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Invoice Number</p>
          <p style="margin: 0 0 12px; color: #1A1A2E; font-size: 16px; font-weight: 600;">${invoiceNumber}</p>
          <p style="margin: 0 0 4px; color: #868e96; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Amount</p>
          <p style="margin: 0; color: #1A1A2E; font-size: 24px; font-weight: 700;">${formattedAmount}</p>
        </td>
      </tr>
    </table>
    <p style="margin: 0; color: #495057; font-size: 15px; line-height: 1.6;">
      Log in to your portal to view the full invoice details and make a payment.
    </p>`;

  await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: clientEmail,
    subject: `${FROM_NAME} - Invoice ${invoiceNumber}: ${formattedAmount}`,
    html: baseTemplate(content),
  });
}
