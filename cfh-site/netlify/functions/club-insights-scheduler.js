// ─────────────────────────────────────────────────────────────────────────────
// club-insights-scheduler.js
// CFH Club Insights — Netlify Scheduled Function
//
// Runs every Friday at 03:00 UTC (= 3pm NZT standard / 4pm NZDT daylight saving)
// Loops through all active clubs in clubs.json, fetches their Stripe data,
// picks the right email template, and sends via Resend.
//
// Week number is AUTO-CALCULATED from programme_start — no manual updates needed.
//
// Netlify scheduled function docs:
// https://docs.netlify.com/functions/scheduled-functions/
// ─────────────────────────────────────────────────────────────────────────────

const { Resend }             = require('resend');
const { getClubStripeData }  = require('./get-club-stripe-data');
const { buildInsightsEmail } = require('./build-insights-email');
const clubs                  = require('../data/clubs.json');

const resend = new Resend(process.env.RESEND_API_KEY);

// ── Scheduled function config (Netlify Functions v2 format) ───────────────────
// Runs every Friday at 03:00 UTC = 3pm NZT / 4pm NZDT
const config = {
  schedule: '0 3 * * 5',
};

const handler = async () => {

  console.log(`[CFH Insights] Scheduler fired at ${new Date().toISOString()}`);

  const now         = new Date();
  const windowEnd   = getMostRecentFriday(now);
  const windowStart = new Date(windowEnd);
  windowStart.setDate(windowStart.getDate() - 7);

  const activeClubs = clubs.filter(club => club.active);
  console.log(`[CFH Insights] Processing ${activeClubs.length} active club(s)`);

  for (const club of activeClubs) {
    try {
      // ── Auto-calculate week number from programme_start ───────────────────
      const weekNumber  = getWeekNumber(club.programme_start, windowEnd);
      const clubRuntime = { ...club, week_number: weekNumber };

      console.log(`[CFH Insights] ${club.club_name} — week ${weekNumber} (auto-calculated from ${club.programme_start})`);

      // ── 1. Fetch Stripe data ──────────────────────────────────────────────
      const stripeData = await getClubStripeData(clubRuntime, windowStart, windowEnd);

      // ── 2. Determine template type ────────────────────────────────────────
      const templateType = pickTemplate(weekNumber, stripeData);
      console.log(`[CFH Insights] ${club.club_name} → template: ${templateType}`);

      // ── 3. Build email HTML ───────────────────────────────────────────────
      const html = buildInsightsEmail(clubRuntime, stripeData, templateType, windowEnd);

      // ── 4. Build subject line ─────────────────────────────────────────────
      const subject = buildSubject(clubRuntime, stripeData, templateType, windowEnd);

      // ── 5. Send to all nominated contacts ────────────────────────────────
      for (const recipient of club.recipients) {
        const result = await resend.emails.send({
          from:    'CFH Club Insights <hello@cfh.org.nz>',
          to:      recipient,
          subject: subject,
          html:    html,
        });

        if (result.error) {
          console.error(`[CFH Insights] Send failed for ${recipient}:`, result.error);
        } else {
          console.log(`[CFH Insights] Sent to ${recipient} — Resend ID: ${result.data?.id}`);
        }
      }

    } catch (err) {
      console.error(`[CFH Insights] Error processing ${club.club_name}:`, err);
    }
  }

  console.log(`[CFH Insights] All clubs processed. Done.`);
  return { statusCode: 200 };
};

// ─────────────────────────────────────────────────────────────────────────────
// WEEK NUMBER — auto-calculated from programme_start
// ─────────────────────────────────────────────────────────────────────────────

function getWeekNumber(programmeStart, windowEnd) {
  const start      = new Date(programmeStart);
  const msPerWeek  = 7 * 24 * 60 * 60 * 1000;
  const weeksSince = Math.floor((windowEnd - start) / msPerWeek);
  return Math.max(1, weeksSince + 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE SELECTOR
// ─────────────────────────────────────────────────────────────────────────────

function pickTemplate(weekNumber, stripeData) {
  if (weekNumber <= 4) {
    return stripeData.weekTotal > 0 ? 'active_weekly' : 'quiet_weekly';
  }
  return 'monthly';
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBJECT LINE BUILDER
// ─────────────────────────────────────────────────────────────────────────────

function buildSubject(club, stripeData, templateType, windowEnd) {
  if (templateType === 'active_weekly') {
    return `${stripeData.weekTotalText} raised this week · ${club.club_name} · Week ${club.week_number} update`;
  }
  if (templateType === 'quiet_weekly') {
    return `Your Week ${club.week_number} update · ${club.club_name} · Keep the momentum going`;
  }
  const monthName = windowEnd.toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' });
  return `${monthName} summary · ${stripeData.monthTotalText} raised · ${club.club_name}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function getMostRecentFriday(date) {
  const d    = new Date(date);
  const day  = d.getUTCDay();
  const diff = (day + 2) % 7;
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(3, 0, 0, 0);
  return d;
}

module.exports = { handler, config };
