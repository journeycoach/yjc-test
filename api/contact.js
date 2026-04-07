import { sql } from './_db.js';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';

const HIDDEN_CEILING_SCORE_MAP = {
  q1: ['head', 'action', 'heart'],
  q2: ['head', 'heart', 'action'],
  q3: ['head', 'heart', 'action'],
  q4: ['heart', 'head', 'action'],
  q5: ['head', 'heart', 'action'],
  q6: ['heart', 'head', 'action'],
  q7: ['heart', 'head', 'action'],
};

const HIDDEN_CEILING_GUIDES = {
  heart: {
    title: 'Connection-Oriented Leader',
    guideLabel: 'Hidden Ceiling Guide for the Connection-Oriented Leader',
    fileName: 'hidden_ceiling_connection_oriented_leader.pdf',
    publicPath: '/assets/downloads/hidden_ceiling_connection_oriented_leader.pdf',
  },
  head: {
    title: 'Thinking-Oriented Leader',
    guideLabel: 'Hidden Ceiling Guide for the Thinking-Oriented Leader',
    fileName: 'hidden_ceiling_thinking_oriented_leader.pdf',
    publicPath: '/assets/downloads/hidden_ceiling_thinking_oriented_leader.pdf',
  },
  action: {
    title: 'Action-Oriented Leader',
    guideLabel: 'Hidden Ceiling Guide for the Action-Oriented Leader',
    fileName: 'hidden_ceiling_action_oriented_leader.pdf',
    publicPath: '/assets/downloads/hidden_ceiling_action_oriented_leader.pdf',
  },
};

export default async function handler(req, res) {
  try {
    // Only allow POST
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { action, name, email, phone, interest, message, _honey, company, source, answers, 'cf-turnstile-response': turnstileToken } = req.body;

    if (action === 'hidden_ceiling') {
      return await handleHiddenCeiling({
        name,
        email,
        company,
        source,
        answers,
        req,
        res,
      });
    }

    // Honeypot check — bots fill hidden fields; humans leave them blank
    if (_honey) {
      // Silently succeed so the bot thinks it worked
      return res.status(200).json({ ok: true });
    }

    // --- CLOUDFLARE TURNSTILE ---
    if (!turnstileToken) {
      // The token is missing entirely. Reject it.
      return res.status(400).json({ error: "CAPTCHA token missing." });
    }

    // Ask Cloudflare if the token is valid
    const verifyEndpoint = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    const verifyResponse = await fetch(verifyEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${process.env.CLOUDFLARE_TURNSTILE_SECRET}&response=${turnstileToken}`,
    });

    const verifyData = await verifyResponse.json();

    if (!verifyData.success) {
      // Cloudflare says the token is fake or expired. Reject it.
      return res.status(400).json({ error: "CAPTCHA verification failed." });
    }

    // Basic validation
    if (!name || !email || !phone || !interest || !message) {
      return res.status(400).json({ error: 'Name, email, phone, area of interest, and message are required.' });
    }

    // Simple email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    // Save to database — this is the source of truth; email is best-effort
    try {
      await sql`
        INSERT INTO contact_submissions (name, email, phone, interest, message)
        VALUES (${name}, ${email}, ${phone}, ${interest}, ${message})
      `;
    } catch (dbErr) {
      console.error('Failed to save submission to DB:', dbErr);
      return res.status(500).json({ error: 'Could not save your submission. Please try again.' });
    }

    // Attempt email notification — failure does NOT affect the 200 response
    try {
      const smtpPassword = process.env.SMTP_PASSWORD;
      const toEmail = process.env.CONTACT_EMAIL;

      if (!smtpPassword || !toEmail) {
        console.error('Missing SMTP_PASSWORD or CONTACT_EMAIL — skipping email notification.');
      } else {
        const html = `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a1d1e; background: #fff; padding: 32px; border-radius: 8px;">
            <h2 style="color: #c7a96b; margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 16px;">
              New Inquiry — Your Journey Coach
            </h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr>
                <td style="padding: 10px 0; font-weight: bold; width: 140px; vertical-align: top; color: #555;">Name</td>
                <td style="padding: 10px 0;">${escapeHtml(name)}</td>
              </tr>
              <tr style="background: #f9f9f9;">
                <td style="padding: 10px 0; font-weight: bold; vertical-align: top; color: #555;">Email</td>
                <td style="padding: 10px 0;"><a href="mailto:${escapeHtml(email)}" style="color: #c7a96b;">${escapeHtml(email)}</a></td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: bold; vertical-align: top; color: #555;">Phone</td>
                <td style="padding: 10px 0;">${escapeHtml(phone)}</td>
              </tr>
              <tr style="background: #f9f9f9;">
                <td style="padding: 10px 0; font-weight: bold; vertical-align: top; color: #555;">Area of Interest</td>
                <td style="padding: 10px 0;">${escapeHtml(interest)}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: bold; vertical-align: top; color: #555;">Message</td>
                <td style="padding: 10px 0; white-space: pre-wrap;">${escapeHtml(message)}</td>
              </tr>
            </table>
            <p style="color: #999; font-size: 0.85rem; margin-bottom: 0;">
              Sent via yourjourneycoach.com contact form · ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET
            </p>
          </div>
        `;

        const transporter = nodemailer.createTransport({
          host: 'smtp.forwardemail.net',
          port: 465,
          secure: true,
          auth: { user: 'hello@yourjourneycoach.com', pass: smtpPassword },
        });

        await transporter.sendMail({
          from: 'Your Journey Coach <hello@yourjourneycoach.com>',
          to: toEmail,
          replyTo: email,
          subject: `New Inquiry from ${name}`,
          html,
        });
      }
    } catch (emailErr) {
      // Log but do not fail — submission is already saved to the database
      console.error('Email notification failed (submission was saved):', emailErr.message);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Unexpected error in /api/contact:', err);
    return res.status(500).json({ error: 'Runtime API Error: ' + err.message });
  }
}

// Prevent XSS in email HTML
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function handleHiddenCeiling({ name, email, company, source, answers, req, res }) {
  if (company) {
    return res.status(200).json({ ok: true });
  }

  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  await ensureHiddenCeilingTable();

  const parsedAnswers = Object.fromEntries(
    Object.entries(answers || {}).map(([key, value]) => [key, Number(value)])
  );
  const scores = computeHiddenCeilingScores(parsedAnswers);
  const center = resolveHiddenCeilingCenter(scores, parsedAnswers);
  const guide = HIDDEN_CEILING_GUIDES[center];

  let emailSent = false;
  const siteUrl = process.env.PUBLIC_SITE_URL || `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers['x-forwarded-host'] || req.headers.host}`;

  try {
    if (process.env.SMTP_PASSWORD) {
      const transporter = nodemailer.createTransport({
        host: 'smtp.forwardemail.net',
        port: 465,
        secure: true,
        auth: { user: 'hello@yourjourneycoach.com', pass: process.env.SMTP_PASSWORD },
      });

      const attachmentPath = fileURLToPath(new URL(`../assets/downloads/${guide.fileName}`, import.meta.url));

      await transporter.sendMail({
        from: 'Your Journey Coach <hello@yourjourneycoach.com>',
        to: normalizedEmail,
        subject: `Your Hidden Ceiling Guide: ${guide.title}`,
        html: buildHiddenCeilingEmail({ name: name.trim(), guide, siteUrl }),
        attachments: [
          {
            filename: guide.fileName,
            path: attachmentPath,
            contentType: 'application/pdf',
          },
        ],
      });

      emailSent = true;
    } else {
      console.error('Missing SMTP_PASSWORD for hidden ceiling email delivery.');
    }
  } catch (emailErr) {
    console.error('Hidden ceiling email failed:', emailErr);
  }

  await sql`
    INSERT INTO hidden_ceiling_submissions
      (name, email, result_center, heart_score, head_score, action_score, answers, source, guide_filename, email_sent)
    VALUES
      (${name.trim()}, ${normalizedEmail}, ${center}, ${scores.heart}, ${scores.head}, ${scores.action}, ${JSON.stringify(parsedAnswers)}::jsonb, ${source || 'website'}, ${guide.fileName}, ${emailSent})
  `;

  return res.status(200).json({
    ok: true,
    result: {
      center,
      title: guide.title,
      guideUrl: guide.publicPath,
    },
    scores,
    emailSent,
  });
}

async function ensureHiddenCeilingTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS hidden_ceiling_submissions (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      result_center VARCHAR(20) NOT NULL,
      heart_score INTEGER DEFAULT 0,
      head_score INTEGER DEFAULT 0,
      action_score INTEGER DEFAULT 0,
      answers JSONB NOT NULL DEFAULT '{}'::jsonb,
      source VARCHAR(100),
      guide_filename VARCHAR(255),
      email_sent BOOLEAN DEFAULT FALSE,
      submitted_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

function computeHiddenCeilingScores(answers) {
  const scores = { heart: 0, head: 0, action: 0 };

  for (const [questionKey, optionCenters] of Object.entries(HIDDEN_CEILING_SCORE_MAP)) {
    const selectedIndex = answers?.[questionKey];
    if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= optionCenters.length) {
      throw new Error(`Missing or invalid answer for ${questionKey}.`);
    }
    const center = optionCenters[selectedIndex];
    scores[center] += 1;
  }

  return scores;
}

function resolveHiddenCeilingCenter(scores, answers) {
  const maxScore = Math.max(scores.heart, scores.head, scores.action);
  const leaders = Object.entries(scores)
    .filter(([, score]) => score === maxScore)
    .map(([center]) => center);

  if (leaders.length === 1) return leaders[0];

  const finalAnswerCenter = HIDDEN_CEILING_SCORE_MAP.q7[answers.q7];
  if (leaders.includes(finalAnswerCenter)) return finalAnswerCenter;

  if (leaders.includes('action') && leaders.includes('head')) return 'action';

  return leaders[0];
}

function buildHiddenCeilingEmail({ name, guide, siteUrl }) {
  const callUrl = `${siteUrl.replace(/\/$/, '')}/#contact`;
  return `
    <div style="font-family: Georgia, serif; max-width: 620px; margin: 0 auto; color: #1a1d1e; background: #fff; padding: 32px; border-radius: 8px;">
      <p style="font-size: 1rem; line-height: 1.7;">${escapeHtml(name)},</p>
      <p style="font-size: 1rem; line-height: 1.7;">As a leader, your dominant internal operating system is your habit, and your habits are often the exact reason you have achieved your current level of success. Under the pressure of scaling a business or managing a complex team, that same strength can also create a predictable bottleneck.</p>
      <p style="font-size: 1rem; line-height: 1.7;">I analyzed your assessment and attached your <strong>${escapeHtml(guide.guideLabel)}</strong>.</p>
      <p style="font-size: 1rem; line-height: 1.7;">Inside this brief guide, you will find:</p>
      <ul style="line-height: 1.8; padding-left: 1.2rem;">
        <li>An unfiltered look at the specific blindspot associated with your leadership style.</li>
        <li>How the different parts of your internal system react under extreme stress.</li>
        <li>Three immediate, actionable shifts you can make this week to break through your current ceiling.</li>
      </ul>
      <p style="font-size: 1rem; line-height: 1.7;">Reading about your leadership shadow is step one. Doing the work to align your internal system so you can lead with sustainable, high-leverage impact is step two.</p>
      <p style="font-size: 1rem; line-height: 1.7;">If the insights in your guide resonate with the friction you are currently experiencing in your organization, I invite you to <a href="${callUrl}" style="color:#c7a96b;">book a 20-minute Alignment Call</a> with me.</p>
      <p style="font-size: 1rem; line-height: 1.7;">Best regards,<br>John Paine, PCC</p>
      <p style="color:#888; font-size:0.82rem; margin-top: 2rem;">You received this because you requested your Hidden Ceiling guide from ${escapeHtml(siteUrl)}.</p>
    </div>
  `;
}
