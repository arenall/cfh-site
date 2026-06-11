// ─────────────────────────────────────────────────────────────────────────────
// build-insights-email.js
// CFH Club Insights — Email Template Function
//
// Usage: buildInsightsEmail(clubData, stripeData, templateType)
//
// templateType: 'active_weekly' | 'quiet_weekly' | 'monthly'
//
// clubData  — entry from clubs.json
// stripeData — output from getClubStripeData()
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the full HTML email string for a club insights send.
 *
 * @param {object} clubData      - Club entry from clubs.json
 * @param {object} stripeData    - Output from get-club-stripe-data.js
 * @param {string} templateType  - 'active_weekly' | 'quiet_weekly' | 'monthly'
 * @param {Date}   windowEnd     - The Friday this email covers (used for date labels)
 * @returns {string}             - Complete HTML email string ready to send via Resend
 */
function buildInsightsEmail(clubData, stripeData, templateType, windowEnd) {
  const css        = buildCSS();
  const topBar     = buildTopBar(templateType);
  const hero       = buildHero(clubData, stripeData, templateType, windowEnd);
  const statStrip  = buildStatStrip(clubData, stripeData, templateType, windowEnd);
  const body       = buildBody(clubData, stripeData, templateType, windowEnd);
  const signoff    = buildSignoff(clubData, stripeData, templateType);
  const footer     = buildFooter(clubData);
  const preheader  = buildPreheader(clubData, stripeData, templateType);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CFH Club Insights — ${esc(clubData.club_name)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap" rel="stylesheet">
<style>${css}</style>
</head>
<body>
<div class="preheader">${preheader}</div>
<div class="wrap">
  ${topBar}
  <div class="card">
    ${hero}
    ${statStrip}
    <div class="body">
      ${body}
    </div>
    ${signoff}
  </div>
  ${footer}
</div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PREHEADER (email preview text)
// ─────────────────────────────────────────────────────────────────────────────

function buildPreheader(clubData, stripeData, templateType) {
  if (templateType === 'active_weekly') {
    return `${stripeData.weekTotalText} raised this week · ${stripeData.donationCount} new supporter${stripeData.donationCount !== 1 ? 's' : ''} · ${stripeData.settlementAmountText} settled to your account`;
  }
  if (templateType === 'quiet_weekly') {
    return `Your weekly update from CFH · Season total ${stripeData.seasonTotalText} · Keep the momentum going`;
  }
  return `${stripeData.monthTotalText} raised this month · ${stripeData.monthDonationCount} supporter${stripeData.monthDonationCount !== 1 ? 's' : ''} · Monthly summary inside`;
}

// ─────────────────────────────────────────────────────────────────────────────
// TOP BAR
// ─────────────────────────────────────────────────────────────────────────────

function buildTopBar(templateType) {
  const label = templateType === 'monthly' ? 'Monthly Club Summary' : 'Weekly Club Insights';
  return `
  <div class="topbar">
    <div class="topbar-brand">
      <div class="topbar-icon">
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="7" cy="8" r="3" fill="white" opacity="0.9"/>
          <circle cx="13" cy="8" r="3" fill="white" opacity="0.6"/>
          <path d="M2 16c0-2.5 2.2-4 5-4s5 1.5 5 4" stroke="white" stroke-width="1.5" stroke-linecap="round" opacity="0.9"/>
          <path d="M13 12c2 0 5 1 5 4" stroke="white" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
        </svg>
      </div>
      <div class="topbar-wordmark">Community <span>Fundraising</span> Hub</div>
    </div>
    <div class="topbar-meta">${label}</div>
  </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────────────────────

function buildHero(clubData, stripeData, templateType, windowEnd) {
  if (templateType === 'monthly') {
    const monthName = windowEnd.toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' });
    return `
    <div class="hero">
      <div class="hero-eyebrow">Monthly Club Summary</div>
      <div class="hero-title">${esc(clubData.club_name)}</div>
      <div style="margin-top:10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <div class="hero-week-badge">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="rgba(255,255,255,0.6)" stroke-width="1.2"/><path d="M5 3v2l1.5 1" stroke="rgba(255,255,255,0.6)" stroke-width="1.2" stroke-linecap="round"/></svg>
          ${monthName}
        </div>
      </div>
    </div>`;
  }

  const weekEndLabel = windowEnd.toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const weekBadge = `Week ${clubData.week_number} of 4`;
  const eyebrow = templateType === 'quiet_weekly' ? 'Weekly Update' : 'Club Insights Summary';

  return `
    <div class="hero">
      <div class="hero-eyebrow">${eyebrow}</div>
      <div class="hero-title">${esc(clubData.club_name)}</div>
      <div style="margin-top:10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <div class="hero-week-badge">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="rgba(255,255,255,0.6)" stroke-width="1.2"/><path d="M5 3v2l1.5 1" stroke="rgba(255,255,255,0.6)" stroke-width="1.2" stroke-linecap="round"/></svg>
          ${weekBadge}
        </div>
        <div style="font-size:12px;color:rgba(255,255,255,0.40)">Week ending ${weekEndLabel}</div>
      </div>
    </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT STRIP
// ─────────────────────────────────────────────────────────────────────────────

function buildStatStrip(clubData, stripeData, templateType, windowEnd) {
  const programmeStartLabel = new Date(clubData.programme_start).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' });

  if (templateType === 'active_weekly') {
    return `
    <div class="stats">
      <div class="stat">
        <div class="stat-label">Raised this week</div>
        <div class="stat-value">${stripeData.weekTotalText}</div>
        <div class="stat-sub">${stripeData.donationCount} donation${stripeData.donationCount !== 1 ? 's' : ''}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Total raised</div>
        <div class="stat-value green">${stripeData.seasonTotalText}</div>
        <div class="stat-sub">Since ${programmeStartLabel}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Settled to club</div>
        <div class="stat-value">${stripeData.totalNetSettledText}</div>
        <div class="stat-sub">${esc(clubData.bank_account_name)}</div>
      </div>
    </div>`;
  }

  if (templateType === 'quiet_weekly') {
    return `
    <div class="stats">
      <div class="stat">
        <div class="stat-label">Season total</div>
        <div class="stat-value green">${stripeData.seasonTotalText}</div>
        <div class="stat-sub">${stripeData.totalDonationCount} supporter${stripeData.totalDonationCount !== 1 ? 's' : ''}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Net to club</div>
        <div class="stat-value">${stripeData.totalNetSettledText}</div>
        <div class="stat-sub">${esc(clubData.bank_account_name)}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Programme week</div>
        <div class="stat-value">${clubData.week_number}</div>
        <div class="stat-sub">of first 4</div>
      </div>
    </div>`;
  }

  // monthly
  return `
    <div class="stats">
      <div class="stat">
        <div class="stat-label">Raised this month</div>
        <div class="stat-value">${stripeData.monthTotalText}</div>
        <div class="stat-sub">${stripeData.monthDonationCount} donation${stripeData.monthDonationCount !== 1 ? 's' : ''}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Total raised</div>
        <div class="stat-value green">${stripeData.seasonTotalText}</div>
        <div class="stat-sub">Since ${programmeStartLabel}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Settled to club</div>
        <div class="stat-value">${stripeData.totalNetSettledText}</div>
        <div class="stat-sub">${esc(clubData.bank_account_name)}</div>
      </div>
    </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// BODY (main content — switches per template)
// ─────────────────────────────────────────────────────────────────────────────

function buildBody(clubData, stripeData, templateType, windowEnd) {
  if (templateType === 'active_weekly')  return buildBodyActiveWeekly(clubData, stripeData, windowEnd);
  if (templateType === 'quiet_weekly')   return buildBodyQuietWeekly(clubData, stripeData, windowEnd);
  return buildBodyMonthly(clubData, stripeData, windowEnd);
}

// ── Template 1: Active Weekly ─────────────────────────────────────────────

function buildBodyActiveWeekly(clubData, stripeData, windowEnd) {
  const donorRows   = buildDonorList(stripeData.donorList);
  const progressBar = buildProgressBar(clubData, stripeData);
  const miniStats   = buildMiniStats(clubData, stripeData);
  const settlement  = buildSettlement(clubData, stripeData, windowEnd);
  const nudge       = buildNudge(clubData, clubData.week_number);

  return `
      <!-- This week's supporters -->
      <div class="section-head">
        <div class="section-icon green">
          <svg viewBox="0 0 16 16" fill="none"><path d="M8 1l1.9 3.8 4.2.6-3 3 .7 4.2L8 10.5l-3.8 2 .7-4.2-3-3 4.2-.6z" fill="#1F9E68"/></svg>
        </div>
        <div class="section-title">This Week's Supporters</div>
      </div>

      <div class="donor-list">${donorRows}</div>

      <div class="donor-shoutout">
        <svg viewBox="0 0 14 14" fill="none"><path d="M2 7c0-2.8 2.2-5 5-5s5 2.2 5 5-2.2 5-5 5-5-2.2-5-5z" fill="#1F9E68" opacity="0.2"/><path d="M5 7l1.5 1.5L9.5 5" stroke="#1F9E68" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Each supporter has been tagged in a social media shoutout within 24 hours of their donation.
      </div>

      <div class="divider"></div>

      <!-- Season progress -->
      <div class="section-head">
        <div class="section-icon blue">
          <svg viewBox="0 0 16 16" fill="none"><rect x="1" y="9" width="3" height="6" rx="1" fill="#1769AA"/><rect x="6" y="6" width="3" height="9" rx="1" fill="#1769AA" opacity="0.7"/><rect x="11" y="3" width="3" height="12" rx="1" fill="#1769AA" opacity="0.45"/></svg>
        </div>
        <div class="section-title">Season Progress</div>
      </div>

      ${progressBar}
      ${miniStats}

      <div class="divider"></div>

      <!-- Settlement -->
      <div class="section-head">
        <div class="section-icon green">
          <svg viewBox="0 0 16 16" fill="none"><path d="M2 8h12M8 2l4 4-4 4" stroke="#1F9E68" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="section-title">This Week's Settlement</div>
      </div>

      ${settlement}

      <div class="divider"></div>

      ${nudge}`;
}

// ── Template 2: Quiet Weekly ──────────────────────────────────────────────

function buildBodyQuietWeekly(clubData, stripeData, windowEnd) {
  const nudge = buildNudge(clubData, clubData.week_number);

  return `
      <!-- Quiet week message -->
      <div class="section-head">
        <div class="section-icon amber">
          <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#E08A0E" stroke-width="1.5"/><path d="M8 5v3.5" stroke="#E08A0E" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="11" r="0.75" fill="#E08A0E"/></svg>
        </div>
        <div class="section-title">A Quiet Week — That's Normal</div>
      </div>

      <div style="background:#FEF4E0;border:1px solid rgba(224,138,14,0.20);border-radius:10px;padding:18px 20px;margin-bottom:24px">
        <p style="font-size:14px;color:#344258;line-height:1.7;margin:0">
          No donations came through this week — and that's completely normal. Most sponsorship clusters in the first two weeks after outreach goes out. The businesses you haven't heard from yet just need a nudge.
        </p>
        <p style="font-size:14px;color:#344258;line-height:1.7;margin:12px 0 0">
          <strong>One action this week:</strong> Pick two businesses from your list who haven't donated yet. Send a short follow-up — or better yet, call them. Try: <em>"Hi [Name], just checking you got our note about ${esc(clubData.club_name)}'s fundraising this season. Happy to answer any questions."</em> Two minutes. That's all it takes.
        </p>
        <a href="https://${esc(clubData.club_page_url)}" style="display:inline-flex;align-items:center;gap:6px;margin-top:14px;background:#E08A0E;color:#fff;font-size:13px;font-weight:600;padding:9px 16px;border-radius:8px;text-decoration:none">
          View your fundraising page
          <svg viewBox="0 0 13 13" fill="none" width="13" height="13"><path d="M2 6.5h9M7 2.5l4 4-4 4" stroke="white" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </a>
      </div>

      <!-- Season summary -->
      <div class="section-head">
        <div class="section-icon blue">
          <svg viewBox="0 0 16 16" fill="none"><rect x="1" y="9" width="3" height="6" rx="1" fill="#1769AA"/><rect x="6" y="6" width="3" height="9" rx="1" fill="#1769AA" opacity="0.7"/><rect x="11" y="3" width="3" height="12" rx="1" fill="#1769AA" opacity="0.45"/></svg>
        </div>
        <div class="section-title">Season So Far</div>
      </div>

      ${buildMiniStats(clubData, stripeData)}

      <div class="divider"></div>

      ${nudge}`;
}

// ── Template 3: Monthly ───────────────────────────────────────────────────

function buildBodyMonthly(clubData, stripeData, windowEnd) {
  const monthName   = windowEnd.toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' });
  const donorRows   = buildDonorList(stripeData.donorList);
  const progressBar = buildProgressBar(clubData, stripeData);
  const hasActivity = stripeData.monthDonationCount > 0;

  return `
      <!-- Where you're at -->
      <div class="section-head">
        <div class="section-icon blue">
          <svg viewBox="0 0 16 16" fill="none"><rect x="1" y="9" width="3" height="6" rx="1" fill="#1769AA"/><rect x="6" y="6" width="3" height="9" rx="1" fill="#1769AA" opacity="0.7"/><rect x="11" y="3" width="3" height="12" rx="1" fill="#1769AA" opacity="0.45"/></svg>
        </div>
        <div class="section-title">Where You're At</div>
      </div>

      <div style="background:#EBF4FC;border-radius:10px;padding:18px 20px;margin-bottom:8px">
        <p style="font-size:14px;color:#162035;line-height:1.7;margin:0">
          <strong>${esc(clubData.club_name)}</strong> has raised <strong>${stripeData.seasonTotalText}</strong> since going live. That's real money going directly into your club — funded by local businesses who want to see your community succeed.
        </p>
        <div style="display:flex;gap:20px;margin-top:14px;flex-wrap:wrap">
          <div><div style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;color:#637087;margin-bottom:3px">Total supporters</div><div style="font-family:sans-serif;font-weight:800;font-size:20px;color:#162035">${stripeData.totalDonationCount}</div></div>
          <div><div style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;color:#637087;margin-bottom:3px">Largest donation</div><div style="font-family:sans-serif;font-weight:800;font-size:20px;color:#1F9E68">${stripeData.largestDonationText}</div><div style="font-size:12px;color:#637087">from ${esc(stripeData.largestDonorName)}</div></div>
        </div>
      </div>

      ${progressBar}

      <div class="divider"></div>

      <!-- This month's supporters -->
      <div class="section-head">
        <div class="section-icon green">
          <svg viewBox="0 0 16 16" fill="none"><path d="M8 1l1.9 3.8 4.2.6-3 3 .7 4.2L8 10.5l-3.8 2 .7-4.2-3-3 4.2-.6z" fill="#1F9E68"/></svg>
        </div>
        <div class="section-title">${monthName} Supporters</div>
      </div>

      ${hasActivity ? `
      <div class="donor-list">${donorRows}</div>
      <div class="donor-shoutout">
        <svg viewBox="0 0 14 14" fill="none"><path d="M2 7c0-2.8 2.2-5 5-5s5 2.2 5 5-2.2 5-5 5-5-2.2-5-5z" fill="#1F9E68" opacity="0.2"/><path d="M5 7l1.5 1.5L9.5 5" stroke="#1F9E68" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        Each supporter has been tagged in a social media shoutout within 24 hours of their donation.
      </div>` : `
      <div style="background:#F4FAFF;border:1px solid rgba(23,105,170,0.10);border-radius:10px;padding:18px 20px;margin-bottom:8px">
        <p style="font-size:14px;color:#637087;line-height:1.7;margin:0">No donations this month yet — consider a fresh round of outreach to businesses you haven't heard from, or a follow-up to existing supporters.</p>
      </div>`}

      <div class="divider"></div>

      <!-- Financial summary -->
      <div class="section-head">
        <div class="section-icon green">
          <svg viewBox="0 0 16 16" fill="none"><path d="M2 8h12M8 2l4 4-4 4" stroke="#1F9E68" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="section-title">Financial Summary</div>
      </div>

      <div class="mini-stats">
        <div class="mini-stat">
          <div class="mini-stat-label">Gross raised (all time)</div>
          <div class="mini-stat-value">${stripeData.seasonTotalText}</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-label">Net to club (all time)</div>
          <div class="mini-stat-value green">${stripeData.totalNetSettledText}</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-label">This month gross</div>
          <div class="mini-stat-value">${stripeData.monthTotalText}</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-label">CFH fee (7%)</div>
          <div class="mini-stat-value" style="font-size:15px">${stripeData.totalFeesText}</div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Keep the momentum -->
      <div class="nudge">
        <div class="nudge-eyebrow">Keep the momentum going</div>
        <div class="nudge-title">Sponsorship doesn't have to taper.</div>
        <div class="nudge-body">
          Consider reaching out to businesses you haven't heard from yet — a personal follow-up goes a long way. Share your fundraising page on your club's social media, or let existing supporters know the page is still open. Some will give again, or refer others.
        </div>
        <a href="https://${esc(clubData.club_page_url)}" class="nudge-action" style="color:#fff;text-decoration:none">
          View your fundraising page
          <svg viewBox="0 0 13 13" fill="none" width="13" height="13"><path d="M2 6.5h9M7 2.5l4 4-4 4" stroke="white" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </a>
      </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// Donor list rows
function buildDonorList(donorList) {
  if (!donorList || donorList.length === 0) {
    return '<div class="donor-item"><div class="donor-left"><div style="font-size:14px;color:#637087">No donations recorded for this period.</div></div></div>';
  }

  const avatarColours = ['', ' blue', ' navy', ' style="background:#5B2D8E"', ' style="background:#C0392B"'];

  return donorList.map((donor, i) => {
    const initials = donor.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('');
    const colourClass = i < 3 ? avatarColours[i] : avatarColours[3];
    const avatarAttr  = colourClass.startsWith(' style') ? `class="donor-avatar"${colourClass}` : `class="donor-avatar${colourClass}"`;

    return `
        <div class="donor-item">
          <div class="donor-left">
            <div ${avatarAttr}>${initials}</div>
            <div>
              <div class="donor-name">${esc(donor.name)}</div>
              <div class="donor-date">${donor.date}</div>
            </div>
          </div>
          <div class="donor-amount">${formatNZD(donor.amount)}</div>
        </div>`;
  }).join('');
}

// Progress bar (omitted if no season_goal set)
function buildProgressBar(clubData, stripeData) {
  if (!clubData.season_goal) return '';

  const pct     = Math.min(Math.round((stripeData.seasonTotal / clubData.season_goal) * 100), 100);
  const toGo    = Math.max(clubData.season_goal - stripeData.seasonTotal, 0);

  return `
      <div class="progress-section">
        <div class="progress-label-row">
          <div class="progress-label">Progress toward ${formatNZD(clubData.season_goal)} season goal</div>
          <div class="progress-pct">${pct}%</div>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width:${pct}%"></div>
        </div>
        <div class="progress-meta">
          <span>${stripeData.seasonTotalText} raised</span>
          <span>${formatNZD(toGo)} to go</span>
        </div>
      </div>`;
}

// Mini stats grid
function buildMiniStats(clubData, stripeData) {
  const programmeStartLabel = new Date(clubData.programme_start).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });

  return `
      <div class="mini-stats">
        <div class="mini-stat">
          <div class="mini-stat-label">Total supporters</div>
          <div class="mini-stat-value">${stripeData.totalDonationCount}</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-label">Largest donation</div>
          <div class="mini-stat-value green">${stripeData.largestDonationText}</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-label">Programme started</div>
          <div class="mini-stat-value" style="font-size:13px;padding-top:2px">${programmeStartLabel}</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-label">CFH fee (7%)</div>
          <div class="mini-stat-value" style="font-size:15px">${stripeData.totalFeesText}</div>
        </div>
      </div>`;
}

// Settlement banner
function buildSettlement(clubData, stripeData, windowEnd) {
  const settleDateLabel = windowEnd.toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });

  return `
      <div class="settlement">
        <div class="settlement-left">
          <div class="settlement-eyebrow">Paid to your account</div>
          <div class="settlement-amount">${stripeData.settlementAmountText}</div>
          <div class="settlement-meta">${esc(clubData.bank_account_name)} · ${settleDateLabel}</div>
        </div>
        <div class="settlement-badge">✓ Settled</div>
      </div>`;
}

// Coaching nudge — copy changes by week number
function buildNudge(clubData, weekNumber) {
  const nudges = {
    1: {
      title: 'Your page is live — now make the calls.',
      body:  'Your first outreach emails are out — great start. Now follow up with a phone call to each business you contacted. A 2-minute call converts far better than a second email. Try: <em style="color:rgba(255,255,255,0.85)">"Hi [Name], just checking you got our note about ' + esc(clubData.club_name) + ' this season."</em>',
    },
    2: {
      title: 'You\'re in the follow-up window — use it.',
      body:  'Week 2 is when follow-up calls convert. You\'ve already sent your first emails — now pick up the phone. A 2-minute call to each business you haven\'t heard from yet will do more than any second email. Try: <em style="color:rgba(255,255,255,0.85)">"Hi [Name], just checking you got our note about ' + esc(clubData.club_name) + ' this season. Happy to answer anything."</em>',
    },
    3: {
      title: 'Mid-programme — time to go wide.',
      body:  'You\'ve worked through your main list. Now think broader — are there businesses in your suburb you haven\'t approached yet? Ask your existing supporters if they know anyone else who might be interested. Word of mouth is your best tool at this stage.',
    },
    4: {
      title: 'Final week of daily updates.',
      body:  'After this week, your summaries move to monthly. Now is the time to close out any warm leads — a final personal message to anyone who showed interest but hasn\'t donated yet. Keep it simple and genuine.',
    },
  };

  const nudge = nudges[weekNumber] || nudges[4];

  return `
      <div class="nudge">
        <div class="nudge-eyebrow">One thing for next week</div>
        <div class="nudge-title">${nudge.title}</div>
        <div class="nudge-body">${nudge.body}</div>
        <a href="https://${esc(clubData.club_page_url)}" class="nudge-action" style="color:#fff;text-decoration:none">
          View your fundraising page
          <svg viewBox="0 0 13 13" fill="none" width="13" height="13"><path d="M2 6.5h9M7 2.5l4 4-4 4" stroke="white" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </a>
      </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SIGN-OFF
// ─────────────────────────────────────────────────────────────────────────────

function buildSignoff(clubData, stripeData, templateType) {
  let text;
  if (templateType === 'active_weekly') {
    text = `${stripeData.donationCount} business${stripeData.donationCount !== 1 ? 'es' : ''} chose to invest in your community this week — that's because of the relationships you're building. Keep going.`;
  } else if (templateType === 'quiet_weekly') {
    text = `We're here if you need anything. Your page is live and ready — every email you send is another chance for a business to invest in your community.`;
  } else {
    text = `It's been a great month — we're proud to be part of what ${esc(clubData.club_name)} is building. As always, get in touch if you need anything.`;
  }

  return `
    <div class="signoff">
      <div class="signoff-text">${text}</div>
      <div class="signoff-name">The Community Fundraising Hub Team</div>
      <div class="signoff-contact">hello@cfh.org.nz &nbsp;·&nbsp; cfh.org.nz</div>
    </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────────────────────

function buildFooter(clubData) {
  return `
  <div class="footer">
    Community Fundraising Hub · Charitable Trust Board · New Zealand<br>
    You're receiving this because you're registered as a contact for ${esc(clubData.club_name)}.<br>
    <a href="mailto:hello@cfh.org.nz">Contact CFH</a>
  </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────

function buildCSS() {
  return `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --blue:#1769AA;--blue2:#125490;--blue-lt:#EBF4FC;--blue-lt2:#D0E6F5;
    --green:#1F9E68;--green2:#157A50;--green-lt:#E4F7EF;
    --amber:#E08A0E;--amber-lt:#FEF4E0;
    --navy:#162035;--text2:#344258;--muted:#637087;
    --white:#FFFFFF;--sky:#F4FAFF;--border:rgba(23,105,170,0.10);
  }
  body{background:#EAEFF5;font-family:"DM Sans",Arial,sans-serif;font-size:16px;color:var(--navy);line-height:1.6;padding:32px 16px 64px}
  .wrap{max-width:620px;margin:0 auto}
  .preheader{display:none;max-height:0;overflow:hidden;font-size:1px;color:#EAEFF5}
  .topbar{background:var(--navy);border-radius:12px 12px 0 0;padding:12px 24px;display:flex;align-items:center;justify-content:space-between}
  .topbar-brand{display:flex;align-items:center;gap:8px}
  .topbar-icon{width:26px;height:26px;background:var(--blue);border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .topbar-icon svg{width:15px;height:15px}
  .topbar-wordmark{font-family:"Syne",Arial,sans-serif;font-weight:800;font-size:13px;color:#fff;letter-spacing:0.01em}
  .topbar-wordmark span{color:#4AAEE8}
  .topbar-meta{font-size:11.5px;color:rgba(255,255,255,0.40)}
  .card{background:var(--white);border-radius:0 0 16px 16px;overflow:hidden;box-shadow:0 4px 32px rgba(23,105,170,0.10)}
  .hero{background:linear-gradient(135deg,var(--navy) 0%,#1e3a6e 55%,#1769AA 100%);padding:32px 32px 28px;position:relative;overflow:hidden}
  .hero::before{content:"";position:absolute;top:-40px;right:-40px;width:220px;height:220px;border-radius:50%;background:rgba(255,255,255,0.04)}
  .hero::after{content:"";position:absolute;bottom:-60px;right:60px;width:160px;height:160px;border-radius:50%;background:rgba(74,174,232,0.07)}
  .hero-eyebrow{font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.45);margin-bottom:8px}
  .hero-title{font-family:"Syne",Arial,sans-serif;font-weight:800;font-size:22px;color:#fff;line-height:1.2;margin-bottom:4px}
  .hero-week-badge{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,0.10);border:1px solid rgba(255,255,255,0.14);border-radius:20px;padding:3px 10px;font-size:11.5px;font-weight:500;color:rgba(255,255,255,0.70)}
  .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--blue-lt2);border-bottom:1px solid var(--border)}
  .stat{background:var(--white);padding:20px 20px 18px;text-align:center}
  .stat-label{font-size:10.5px;font-weight:600;letter-spacing:0.07em;text-transform:uppercase;color:var(--muted);margin-bottom:6px}
  .stat-value{font-family:"Syne",Arial,sans-serif;font-weight:800;font-size:26px;color:var(--blue);line-height:1;margin-bottom:4px}
  .stat-value.green{color:var(--green)}
  .stat-sub{font-size:11.5px;color:var(--muted)}
  .body{padding:28px 32px}
  .section-head{display:flex;align-items:center;gap:10px;margin-bottom:16px}
  .section-icon{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .section-icon.blue{background:var(--blue-lt)}
  .section-icon.green{background:var(--green-lt)}
  .section-icon.amber{background:var(--amber-lt)}
  .section-icon svg{width:15px;height:15px}
  .section-title{font-family:"Syne",Arial,sans-serif;font-weight:800;font-size:15px;color:var(--navy)}
  .divider{height:1px;background:var(--border);margin:24px 0}
  .donor-list{background:var(--green-lt);border-radius:10px;border:1px solid rgba(31,158,104,0.18);overflow:hidden;margin-bottom:8px}
  .donor-item{display:flex;align-items:center;justify-content:space-between;padding:13px 16px;border-bottom:1px solid rgba(31,158,104,0.12)}
  .donor-item:last-child{border-bottom:none}
  .donor-left{display:flex;align-items:center;gap:11px}
  .donor-avatar{width:34px;height:34px;border-radius:8px;background:var(--green);display:flex;align-items:center;justify-content:center;font-family:"Syne",Arial,sans-serif;font-weight:800;font-size:12px;color:#fff;flex-shrink:0}
  .donor-avatar.blue{background:var(--blue)}
  .donor-avatar.navy{background:var(--navy)}
  .donor-name{font-weight:600;font-size:14px;color:var(--navy)}
  .donor-date{font-size:12px;color:var(--muted)}
  .donor-amount{font-family:"Syne",Arial,sans-serif;font-weight:800;font-size:16px;color:var(--green)}
  .donor-shoutout{display:flex;align-items:center;gap:6px;background:rgba(31,158,104,0.08);border-radius:6px;padding:8px 14px;font-size:12.5px;color:var(--green2);margin-top:0}
  .donor-shoutout svg{width:13px;height:13px;flex-shrink:0}
  .progress-section{background:var(--blue-lt);border-radius:10px;padding:18px 20px;margin-bottom:10px}
  .progress-label-row{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px}
  .progress-label{font-size:12.5px;font-weight:600;color:var(--navy)}
  .progress-pct{font-family:"Syne",Arial,sans-serif;font-weight:800;font-size:18px;color:var(--blue)}
  .progress-track{height:8px;background:var(--blue-lt2);border-radius:99px;overflow:hidden;margin-bottom:10px}
  .progress-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,var(--blue),#2282CC)}
  .progress-meta{display:flex;justify-content:space-between;font-size:12px;color:var(--muted)}
  .mini-stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}
  .mini-stat{background:var(--white);border-radius:8px;border:1px solid var(--border);padding:12px 14px}
  .mini-stat-label{font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;color:var(--muted);margin-bottom:4px}
  .mini-stat-value{font-family:"Syne",Arial,sans-serif;font-weight:800;font-size:17px;color:var(--navy)}
  .mini-stat-value.green{color:var(--green)}
  .nudge{background:linear-gradient(135deg,#1e3a6e 0%,var(--navy) 100%);border-radius:12px;padding:22px;position:relative;overflow:hidden}
  .nudge::before{content:"";position:absolute;top:-20px;right:-20px;width:120px;height:120px;border-radius:50%;background:rgba(74,174,232,0.08)}
  .nudge-eyebrow{font-size:10.5px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.40);margin-bottom:8px}
  .nudge-title{font-family:"Syne",Arial,sans-serif;font-weight:800;font-size:15px;color:#fff;margin-bottom:10px}
  .nudge-body{font-size:13.5px;color:rgba(255,255,255,0.72);line-height:1.65}
  .nudge-action{display:inline-flex;align-items:center;gap:6px;margin-top:14px;background:var(--blue);color:#fff;font-size:13px;font-weight:600;padding:9px 16px;border-radius:8px;text-decoration:none}
  .settlement{display:flex;align-items:center;justify-content:space-between;background:var(--green-lt);border:1px solid rgba(31,158,104,0.22);border-radius:10px;padding:16px 20px;margin-bottom:0}
  .settlement-eyebrow{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:var(--green2);margin-bottom:3px}
  .settlement-amount{font-family:"Syne",Arial,sans-serif;font-weight:800;font-size:26px;color:var(--green);line-height:1}
  .settlement-meta{font-size:12px;color:var(--muted);margin-top:3px}
  .settlement-badge{background:var(--green);color:#fff;font-size:12px;font-weight:600;padding:6px 14px;border-radius:8px;white-space:nowrap}
  .signoff{padding:24px 32px 28px;border-top:1px solid var(--border)}
  .signoff-text{font-size:14px;color:var(--text2);line-height:1.7;margin-bottom:16px}
  .signoff-name{font-family:"Syne",Arial,sans-serif;font-weight:800;font-size:14px;color:var(--blue);margin-bottom:3px}
  .signoff-contact{font-size:12.5px;color:var(--muted)}
  .footer{text-align:center;padding:20px 24px 0;font-size:11.5px;color:rgba(100,115,135,0.70);line-height:1.8}
  .footer a{color:var(--muted);text-decoration:none}
  @media(max-width:500px){
    body{padding:0 0 40px}
    .topbar{border-radius:0;padding:12px 16px}
    .card{border-radius:0}
    .hero{padding:24px 20px 22px}
    .hero-title{font-size:19px}
    .stat{padding:16px 10px 14px}
    .stat-value{font-size:20px}
    .body{padding:20px 20px}
    .mini-stats{grid-template-columns:1fr 1fr}
    .signoff{padding:20px 20px 24px}
    .settlement{flex-direction:column;align-items:flex-start;gap:12px}
  }`;
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

// Escape HTML to prevent XSS from donor/club names
function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatNZD(amount) {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

module.exports = { buildInsightsEmail };
