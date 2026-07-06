import { Resend } from 'resend';

// Default to a dummy key to prevent crashes if env var is missing during testing
const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy");

export async function sendWaitlistApprovalEmail(email: string, name: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email Mock] Sent approval to ${email}`);
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'SideQuest <onboarding@resend.dev>', // User needs a verified domain here eventually
      to: email,
      subject: "You're in. Welcome to SideQuest.",
      html: `
        <div style="font-family: sans-serif; color: #333;">
          <h2>Welcome, ${name}.</h2>
          <p>Your proof of work was verified. You have been approved for the SideQuest Waitlist.</p>
          <p>You can now log in and opt-in for the upcoming weekend draft.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sign-in" style="display:inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">Enter SideQuest</a>
        </div>
      `,
    });

    if (error) {
      console.error("[Resend Error - Waitlist]:", error);
    } else {
      console.log("[Resend Success - Waitlist]:", data);
    }
  } catch (error) {
    console.error("Failed to send approval email", error);
  }
}

export async function sendMatchEmail(email: string, name: string, teammates: any[]) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email Mock] Sent match info to ${email}`);
    return;
  }

  const teammateHtml = teammates.map(t => 
    `<li><strong>${t.name}</strong> (${t.email}) - <a href="${t.proofOfWorkUrl}">Proof of Work</a></li>`
  ).join("");

  try {
    const { data, error } = await resend.emails.send({
      from: 'SideQuest <onboarding@resend.dev>',
      to: email,
      subject: "Your Squad is Ready. ⚔️",
      html: `
        <div style="font-family: sans-serif; color: #333;">
          <h2>It's time to build, ${name}.</h2>
          <p>You have been matched for this weekend's SideQuest. Here is your squad:</p>
          <ul>
            ${teammateHtml}
          </ul>
          <p>Reach out to them immediately to decide what you'll build over the next 72 hours.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="display:inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">View Dashboard</a>
        </div>
      `,
    });

    if (error) {
      console.error("[Resend Error - Match]:", error);
    } else {
      console.log("[Resend Success - Match]:", data);
    }
  } catch (error) {
    console.error("Failed to send match email", error);
  }
}
