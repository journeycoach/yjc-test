import { sql } from './_db.js';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';

const SCORE_MAP = {
  q1: ['head', 'action', 'heart'],
  q2: ['head', 'heart', 'action'],
  q3: ['head', 'heart', 'action'],
  q4: ['heart', 'head', 'action'],
  q5: ['head', 'heart', 'action'],
  q6: ['heart', 'head', 'action'],
  q7: ['heart', 'head', 'action'],
};

const GUIDE_META = {
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

async function ensureTable() {
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

function computeScores(answers) {
  const scores = { heart: 0, head: 0, action: 0 };

  for (const [questionKey, optionCenters] of Object.entries(SCORE_MAP)) {
    const selectedIndex = answers?.[questionKey];
    if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= optionCenters.length) {
      throw new Error(`Missing or invalid answer for ${questionKey}.`);
    }
    const center = optionCenters[selectedIndex];
    scores[center] += 1;
  }

  return scores;
}

function resolveResultCenter(scores, answers) {
  const maxScore = Math.max(scores.heart, scores.head, scores.action);
  const leaders = Object.entries(scores)
    .filter(([, score]) => score === maxScore)
    .map(([center]) => center);

  if (leaders.length === 1) return leaders[0];

  const finalAnswerCenter = SCORE_MAP.q7[answers.q7];
  if (leaders.includes(finalAnswerCenter)) return finalAnswerCenter;

  if (leaders.includes('action') && leaders.includes('head')) return 'action';

  return leaders[0];
}

function buildUserEmail({ name, guide, siteUrl }) {
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      name,
      email,
      company,
      source,
      answers,
    } = req.body || {};

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

    await ensureTable();

    const parsedAnswers = Object.fromEntries(
      Object.entries(answers || {}).map(([key, value]) => [key, Number(value)])
    );
    const scores = computeScores(parsedAnswers);
    const center = resolveResultCenter(scores, parsedAnswers);
    const guide = GUIDE_META[center];

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
          html: buildUserEmail({ name: name.trim(), guide, siteUrl }),
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
  } catch (err) {
    console.error('hidden ceiling api error:', err);
    return res.status(500).json({ error: err.message || 'Could not complete the assessment.' });
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
