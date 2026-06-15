// ─────────────────────────────────────────────────────────────────────────────
// build-insights-email.js
// CFH Club Insights — Email Template Function
//
// Rebuilt June 2026 to match CFH_Club_Insights_Email_Example.html exactly.
// Usage: buildInsightsEmail(clubData, stripeData, templateType, windowEnd)
// templateType: 'active_weekly' | 'quiet_weekly' | 'monthly'
// ─────────────────────────────────────────────────────────────────────────────

function buildInsightsEmail(clubData, stripeData, templateType, windowEnd) {

  const fridayLabel = windowEnd.toLocaleDateString('en-NZ', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  const css = `
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{
      --blue:#1769AA;--blue2:#125490;--blue-lt:#EBF4FC;--blue-lt2:#D0E6F5;
      --green:#1F9E68;--green2:#157A50;--green-lt:#E4F7EF;
      --amber:#E08A0E;--amber-lt:#FEF4E0;
      --navy:#162035;--text2:#344258;--muted:#637087;
      --white:#FFFFFF;--sky:#F4FAFF;--border:rgba(23,105,170,0.10);
    }
    body{background:#EAEFF5;font-family:"DM Sans",Arial,sans-serif;font-size:16px;color:#162035;line-height:1.6;padding:32px 16px 64px}
    .wrap{max-width:620px;margin:0 auto}
    .preheader{display:none;max-height:0;overflow:hidden;font-size:1px;color:#EAEFF5}
    .topbar{background:#162035;border-radius:12px 12px 0 0;padding:12px 24px;display:flex;align-items:center;justify-content:space-between}
    .topbar-brand{display:flex;align-items:center;gap:8px}
    .topbar-icon{width:26px;height:26px;background:#1769AA;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .topbar-wordmark{font-family:"Syne",Arial,sans-serif;font-weight:800;font-size:13px;color:#fff;letter-spacing:0.01em}
    .topbar-wordmark span{color:#4AAEE8}
    .topbar-meta{font-size:11.5px;color:rgba(255,255,255,0.40)}
    .card{background:#fff;border-radius:0 0 16px 16px;overflow:hidden;box-shadow:0 4px 32px rgba(23,105,170,0.10)}
    .hero{background:linear-gradient(135deg,#162035 0%,#1e3a6e 55%,#1769AA 100%);padding:32px 32px 28px;position:relative;overflow:hidden}
    .hero-eyebrow{font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.45);margin-bottom:8px}
    .hero-title{font-family:"Syne",Arial,sans-serif;font-weight:800;font-size:22px;color:#fff;line-height:1.2;margin-bottom:4px}
    .hero-week-badge{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,0.10);border:1px solid rgba(255,255,255,0.14);border-radius:20px;padding:3px 10px;font-size:11.5px;font-weight:500;color:rgba(255,255,255,0.70)}
    .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#D0E6F5;border-bottom:1px solid rgba(23,105,170,0.10)}
    .stat{background:#fff;padding:20px 20px 18px;text-align:center}
    .stat-label{font-size:10.5px;font-weight:600;letter-spacing:0.07em;text-transform:uppercase;color:#637087;margin-bottom:6px}
    .stat-value{font-family:"Syne",Arial,sans-serif;font-weight:800;font-size:26px;color:#1769AA;line-height:1;margin-bottom:4px}
    .stat-value-green{font-family:"Syne",Arial,sans-serif;font-weight:800;font-size:26px;color:#1F9E68;line-height:1;margin-bottom:4px}
    .stat-sub{font-size:11.5px;color:#637087}
    .body{padding:28px 32px}
    .section-head{display:flex;align-items:center;gap:10px;margin-bottom:16px}
    .section-icon-blue{width:30px;height:30px;border-radius:8px;background:#EBF4FC;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .section-icon-green{width:30px;height:30px;border-radius:8px;background:#E4F7EF;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .section-icon-amber{width:30px;height:30px;border-radius:8px;background:#FEF4E0;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .section-title{font-family:"Syne",Arial,sans-serif;font-weight:800;font-size:15px;color:#162035}
    .divider{height:1px;background:rgba(23,105,170,0.10);margin:24px 0}
    .donor-list{background:#E4F7EF;border-radius:10px;border:1px solid rgba(31,158,104,0.18);overflow:hidden;margin-bottom:8px}
    .donor-item{display:flex;align-items:center;justify-content:space-between;padding:13px 16px;border-bottom:1px solid rgba(31,158,104,0.12)}
    .donor-item-last{display:flex;align-items:center;justify-content:space-between;padding:13px 16px}
    .donor-left{display:flex;align-items:center;gap:11px}
    .donor-avatar{width:34px;height:34px;border-radius:8px;background:#1F9E68;display:flex;align-items:center;justify-content:center;font-family:"Syne",Arial,sans-serif;font-weight:800;font-size:12px;color:#fff;flex-shrink:0}
    .donor-name{font-weight:600;font-size:14px;color:#162035}
    .donor-date{font-size:12px;color:#637087}
    .donor-amount{font-family:"Syne",Arial,sans-serif;font-weight:800;font-size:16px;color:#1F9E68}
    .donor-shoutout{display:flex;align-items:center;gap:6px;background:rgba(31,158,104,0.08);border-radius:6px;padding:8px 14px;font-size:12.5px;color:#157A50;margin-top:0}
    .progress-section{background:#EBF4FC;border-radius:10px;padding:18px 20px;margin-bottom:0}
    .progress-label-row{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px}
    .progress-label{font-size:12.5px;font-weight:600;color:#162035}
    .progress-pct{font-family:"Syne",Arial,sans-serif;font-weight:800;font-size:18px;color:#1769AA}
    .progress-track{height:8px;background:#D0E6F5;border-radius:99px;overflow:hidden;margin-bottom:10px}
    .progress-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#1769AA,#2282CC)}
    .progress-meta{display:flex;justify-content:space-between;font-size:12px;color:#637087}
    .mini-stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}
    .mini-stat{background:#fff;border-radius:8px;border:1px solid rgba(23,105,170,0.10);padding:12px 14px}
    .mini-stat-label{font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;color:#637087;margin-bottom:4px}
    .mini-stat-value{font-family:"Syne",Arial,sans-serif;font-weight:800;font-size:17px;color:#162035}
    .mini-stat-value-green{font-family:"Syne",Arial,sans-serif;font-weight:800;font-size:17px;color:#1F9E68}
    .nudge{background:linear-gradient(135deg,#1e3a6e 0%,#162035 100%);border-radius:12px;padding:22px;position:relative;overflow:hidden}
    .nudge-eyebrow{font-size:10.5px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.40);margin-bottom:8px}
    .nudge-title{font-family:"Syne",Arial,sans-serif;font-weight:800;font-size:15px;color:#fff;margin-bottom:10px}
    .nudge-body{font-size:13.5px;color:rgba(255,255,255,0.72);line-height:1.65}
    .nudge-action{display:inline-flex;align-items:center;gap:6px;margin-top:14px;background:#1769AA;color:#fff;font-size:13px;font-weight:600;padding:9px 16px;border-radius:8px;text-decoration:none}
    .settlement{display:flex;align-items:center;justify-content:space-between;background:#E4F7EF;border:1px solid rgba(31,158,104,0.22);border-radius:10px;padding:16px 20px;margin-bottom:0}
    .settlement-eyebrow{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:#157A50;margin-bottom:3px}
    .settlement-amount{font-family:"Syne",Arial,sans-serif;font-weight:800;font-size:26px;color:#1F9E68;line-height:1}
    .settlement-meta{font-size:12px;color:#637087;margin-top:3px}
    .settlement-badge{background:#1F9E68;color:#fff;font-size:12px;font-weight:600;padding:6px 14px;border-radius:8px;white-space:nowrap}
    .signoff{padding:24px 32px 28px;border-top:1px solid rgba(23,105,170,0.10)}
    .signoff-text{font-size:14px;color:#344258;line-height:1.7;margin-bottom:16px}
    .signoff-name{font-family:"Syne",Arial,sans-serif;font-weight:800;font-size:14px;color:#1769AA;margin-bottom:3px}
    .signoff-contact{font-size:12.5px;color:#637087}
    .footer-email{text-align:center;padding:20px 24px 0;font-size:11.5px;color:rgba(100,115,135,0.70);line-height:1.8}
    .footer-email a{color:#637087;text-decoration:none}
    .quiet-box{background:#FEF4E0;border:1px solid rgba(224,138,14,0.22);border-radius:10px;padding:18px 20px;margin-bottom:0}
    .quiet-title{font-family:"Syne",Arial,sans-serif;font-weight:800;font-size:15px;color:#162035;margin-bottom:8px}
    .quiet-body{font-size:13.5px;color:#344258;line-height:1.65}
    @media(max-width:500px){
      body{padding:0 0 40px}
      .topbar{border-radius:0;padding:12px 16px}
      .card{border-radius:0}
      .hero{padding:24px 20px 22px}
      .hero-title{font-size:19px}
      .stat{padding:16px 10px 14px}
      .stat-value,.stat-value-green{font-size:20px}
      .body{padding:20px 20px}
      .mini-stats{grid-template-columns:1fr 1fr}
      .signoff{padding:20px 20px 24px}
      .settlement{flex-direction:column;align-items:flex-start;gap:12px}
    }
  `;

  const preheader = buildPreheader(clubData, stripeData, templateType);
  const topBar = `
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
      <div class="topbar-meta">${templateType === 'monthly' ? 'Monthly Club Insights' : 'Weekly Club Insights'}</div>
    </div>
  `;

  const hero = buildHero(clubData, stripeData, templateType, fridayLabel);
  const statStrip = buildStatStrip(clubData, stripeData, templateType, fridayLabel);
  const body = buildBody(clubData, stripeData, templateType, fridayLabel);
  const signoff = buildSignoff(clubData, stripeData, templateType);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CFH Club Insights — ${clubData.club_name}</title>
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
  <div class="footer-email">
    Community Fundraising Hub · Charitable Trust Board · New Zealand<br>
    You're receiving this because you're registered as a contact for ${clubData.club_name}.<br>
    <a href="mailto:hello@cfh.org.nz">hello@cfh.org.nz</a> &nbsp;·&nbsp; <a href="https://cfh.org.nz">cfh.org.nz</a>
  </div>
</div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PREHEADER
// ─────────────────────────────────────────────────────────────────────────────
function buildPreheader(clubData, stripeData, templateType) {
  if (templateType === 'active_weekly') {
    return `${stripeData.weekTotalText} raised this week · ${stripeData.donationCount} new supporter${stripeData.donationCount !== 1 ? 's' : ''} · ${stripeData.settlementAmountText} settled to your account`;
  }
  if (templateType === 'quiet_weekly') {
    return `Your week ${clubData.week_number} update · ${clubData.club_name} · Keep the momentum going`;
  }
  return `Monthly summary · ${stripeData.monthTotalText} raised · ${clubData.club_name}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────────────────────
function buildHero(clubData, stripeData, templateType, fridayLabel) {
  const weekLabel = templateType === 'monthly'
    ? `Month ${Math.ceil(clubData.week_number / 4)} summary`
    : `Week ${clubData.week_number} of 4`;

  return `
    <div class="hero">
      <div class="hero-eyebrow">Club Insights Summary</div>
      <div class="hero-title">${clubData.club_name}</div>
      <div style="margin-top:10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <div class="hero-week-badge">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="rgba(255,255,255,0.6)" stroke-width="1.2"/><path d="M5 3v2l1.5 1" stroke="rgba(255,255,255,0.6)" stroke-width="1.2" stroke-linecap="round"/></svg>
          ${weekLabel}
        </div>
        <div style="font-size:12px;color:rgba(255,255,255,0.40)">Week ending ${fridayLabel}</div>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT STRIP
// ─────────────────────────────────────────────────────────────────────────────
function buildStatStrip(clubData, stripeData, templateType, fridayLabel) {
  const programmeStartLabel = new Date(clubData.programme_start).toLocaleDateString('en-NZ', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  if (templateType === 'monthly') {
    return `
      <div class="stats">
        <div class="stat">
          <div class="stat-label">Raised this month</div>
          <div class="stat-value">${stripeData.monthTotalText}</div>
          <div class="stat-sub">${stripeData.monthDonationCount} donation${stripeData.monthDonationCount !== 1 ? 's' : ''}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Total raised</div>
          <div class="stat-value-green">${stripeData.seasonTotalText}</div>
          <div class="stat-sub">Since ${programmeStartLabel}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Settled to club</div>
          <div class="stat-value">${stripeData.totalNetSettledText}</div>
          <div class="stat-sub">${clubData.bank_account_name}</div>
        </div>
      </div>
    `;
  }

  return `
    <div class="stats">
      <div class="stat">
        <div class="stat-label">Raised this week</div>
        <div class="stat-value">${stripeData.weekTotalText}</div>
        <div class="stat-sub">${stripeData.donationCount} donation${stripeData.donationCount !== 1 ? 's' : ''}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Total raised</div>
        <div class="stat-value-green">${stripeData.seasonTotalText}</div>
        <div class="stat-sub">Since ${programmeStartLabel}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Settled to club</div>
        <div class="stat-value">${stripeData.totalNetSettledText}</div>
        <div class="stat-sub">${clubData.bank_account_name}</div>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// BODY
// ─────────────────────────────────────────────────────────────────────────────
function buildBody(clubData, stripeData, templateType, fridayLabel) {
  if (templateType === 'active_weekly') return buildActiveWeekly(clubData, stripeData, fridayLabel);
  if (templateType === 'quiet_weekly') return buildQuietWeekly(clubData, stripeData);
  return buildMonthly(clubData, stripeData, fridayLabel);
}

function buildActiveWeekly(clubData, stripeData, fridayLabel) {
  const donorRows = stripeData.donorList.map((donor, i) => {
    const initials = donor.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const avatarColors = ['#1F9E68', '#1769AA', '#162035', '#5B2D8E'];
    const color = avatarColors[i % avatarColors.length];
    const isLast = i === stripeData.donorList.length - 1;
    return `
      <div class="${isLast ? 'donor-item-last' : 'donor-item'}">
        <div class="donor-left">
          <div class="donor-avatar" style="background:${color}">${initials}</div>
          <div>
            <div class="donor-name">${donor.name}</div>
            <div class="donor-date">${donor.date}</div>
          </div>
        </div>
        <div class="donor-amount">${formatNZD(donor.amount)}</div>
      </div>
    `;
  }).join('');

  const progressSection = buildProgressSection(clubData, stripeData);
  const nudge = buildNudge(clubData, stripeData.donationCount);

  return `
    <!-- This week's supporters -->
    <div class="section-head">
      <div class="section-icon-green">
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
      <div class="section-icon-blue">
        <svg viewBox="0 0 16 16" fill="none"><rect x="1" y="9" width="3" height="6" rx="1" fill="#1769AA"/><rect x="6" y="6" width="3" height="9" rx="1" fill="#1769AA" opacity="0.7"/><rect x="11" y="3" width="3" height="12" rx="1" fill="#1769AA" opacity="0.45"/></svg>
      </div>
      <div class="section-title">Season Progress</div>
    </div>

    ${progressSection}

    <div class="divider"></div>

    <!-- Settlement -->
    <div class="section-head">
      <div class="section-icon-green">
        <svg viewBox="0 0 16 16" fill="none"><path d="M2 8h12M8 2l4 4-4 4" stroke="#1F9E68" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <div class="section-title">This Week's Settlement</div>
    </div>

    <div class="settlement">
      <div>
        <div class="settlement-eyebrow">Paid to your account</div>
        <div class="settlement-amount">${stripeData.settlementAmountText}</div>
        <div class="settlement-meta">${clubData.bank_account_name} · ${fridayLabel}</div>
      </div>
      <div class="settlement-badge">✓ Settled</div>
    </div>

    <div class="divider"></div>

    ${nudge}
  `;
}

function buildQuietWeekly(clubData, stripeData) {
  const progressSection = buildProgressSection(clubData, stripeData);
  const nudge = buildNudge(clubData, 0);

  return `
    <!-- Quiet week message -->
    <div class="section-head">
      <div class="section-icon-amber">
        <svg viewBox="0 0 16 16" fill="none"><path d="M8 2v6l3 3" stroke="#E08A0E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8" cy="8" r="6" stroke="#E08A0E" stroke-width="1.5"/></svg>
      </div>
      <div class="section-title">A Quiet Week — That's Normal</div>
    </div>

    <div class="quiet-box">
      <div class="quiet-body">No donations came through this week — and that's completely normal. Most sponsorship clusters in the first two weeks after outreach goes out. The businesses you haven't heard from yet just need a nudge.</div>
    </div>

    <div class="divider"></div>

    <!-- Season progress -->
    <div class="section-head">
      <div class="section-icon-blue">
        <svg viewBox="0 0 16 16" fill="none"><rect x="1" y="9" width="3" height="6" rx="1" fill="#1769AA"/><rect x="6" y="6" width="3" height="9" rx="1" fill="#1769AA" opacity="0.7"/><rect x="11" y="3" width="3" height="12" rx="1" fill="#1769AA" opacity="0.45"/></svg>
      </div>
      <div class="section-title">Season So Far</div>
    </div>

    ${buildMiniStats(clubData, stripeData)}

    <div class="divider"></div>

    ${nudge}
  `;
}

function buildMonthly(clubData, stripeData, fridayLabel) {
  const progressSection = buildProgressSection(clubData, stripeData);

  return `
    <!-- Monthly summary -->
    <div class="section-head">
      <div class="section-icon-blue">
        <svg viewBox="0 0 16 16" fill="none"><rect x="1" y="9" width="3" height="6" rx="1" fill="#1769AA"/><rect x="6" y="6" width="3" height="9" rx="1" fill="#1769AA" opacity="0.7"/><rect x="11" y="3" width="3" height="12" rx="1" fill="#1769AA" opacity="0.45"/></svg>
      </div>
      <div class="section-title">This Month's Summary</div>
    </div>

    ${progressSection}

    <div class="divider"></div>

    <!-- Settlement -->
    <div class="section-head">
      <div class="section-icon-green">
        <svg viewBox="0 0 16 16" fill="none"><path d="M2 8h12M8 2l4 4-4 4" stroke="#1F9E68" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <div class="section-title">Monthly Settlement</div>
    </div>

    <div class="settlement">
      <div>
        <div class="settlement-eyebrow">Paid to your account</div>
        <div class="settlement-amount">${stripeData.monthNetText}</div>
        <div class="settlement-meta">${clubData.bank_account_name} · ${fridayLabel}</div>
      </div>
      <div class="settlement-badge">✓ Settled</div>
    </div>

    <div class="divider"></div>

    <div class="nudge">
      <div class="nudge-eyebrow">Keep the momentum going</div>
      <div class="nudge-title">Every month is a new chance to reconnect.</div>
      <div class="nudge-body">Reach out to any businesses who haven't donated yet — a brief personal message goes a long way. Your page is live and ready. Every email you send is another chance for a business to invest in your community.</div>
      <a href="${clubData.club_page_url}" class="nudge-action" style="color:#fff;text-decoration:none">
        View your fundraising page
        <svg viewBox="0 0 13 13" fill="none"><path d="M2 6.5h9M7 2.5l4 4-4 4" stroke="white" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </a>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS SECTION
// ─────────────────────────────────────────────────────────────────────────────
function buildProgressSection(clubData, stripeData) {
  const programmeStartLabel = new Date(clubData.programme_start).toLocaleDateString('en-NZ', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  if (clubData.season_goal && clubData.season_goal > 0) {
    const pct = Math.min(100, Math.round((stripeData.seasonTotal / clubData.season_goal) * 100));
    const toGo = Math.max(0, clubData.season_goal - stripeData.seasonTotal);
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
      </div>
      ${buildMiniStats(clubData, stripeData)}
    `;
  }

  return buildMiniStats(clubData, stripeData);
}

function buildMiniStats(clubData, stripeData) {
  const programmeStartLabel = new Date(clubData.programme_start).toLocaleDateString('en-NZ', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  return `
    <div class="mini-stats">
      <div class="mini-stat">
        <div class="mini-stat-label">Total supporters</div>
        <div class="mini-stat-value">${stripeData.totalDonationCount}</div>
      </div>
      <div class="mini-stat">
        <div class="mini-stat-label">Largest donation</div>
        <div class="mini-stat-value-green">${stripeData.largestDonationText}</div>
      </div>
      <div class="mini-stat">
        <div class="mini-stat-label">Programme started</div>
        <div class="mini-stat-value" style="font-size:13px;padding-top:2px">${programmeStartLabel}</div>
      </div>
      <div class="mini-stat">
        <div class="mini-stat-label">CFH fee (7%)</div>
        <div class="mini-stat-value" style="font-size:15px">${stripeData.totalFeesText}</div>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// COACHING NUDGE
// ─────────────────────────────────────────────────────────────────────────────
function buildNudge(clubData, donationCount) {
  const weekNum = clubData.week_number;
  let title, body;

  if (weekNum === 1) {
    title = 'Follow up with a phone call.';
    body = 'Your page is live and your first emails are out — great start. Now follow up with a phone call to each business you contacted. A 2-minute call converts far better than a second email.';
  } else if (weekNum === 2) {
    title = "You're in the follow-up window — use it.";
    body = `Week 2 is when follow-up calls convert. You've already sent your first emails — now pick up the phone. A 2-minute call to each business you haven't heard from yet will do more than any second email. Try: <em style="color:rgba(255,255,255,0.85)">"Hi [Name], just checking you got our note about ${clubData.club_name} this season. Happy to answer anything."</em>`;
  } else if (weekNum === 3) {
    title = 'Warm leads go cold fast — act this week.';
    body = `Pick two businesses from your list who haven't donated yet. Send a short follow-up — or better yet, call them. Try: <em style="color:rgba(255,255,255,0.85)">"Hi [Name], just checking you got our note about ${clubData.club_name}'s fundraising this season. Happy to answer any questions."</em> Two minutes. That's all it takes.`;
  } else if (weekNum === 4) {
    title = 'Final week of weekly updates.';
    body = "After this week, your summaries move to monthly. Now is the time to close out any warm leads — a final personal message to anyone who showed interest but hasn't donated yet. Keep it simple and genuine.";
  } else {
    title = 'Keep the momentum going.';
    body = "Reach out to any businesses who haven't donated yet — a brief personal message goes a long way. Your page is live and ready.";
  }

  return `
    <div class="nudge">
      <div class="nudge-eyebrow">One thing for next week</div>
      <div class="nudge-title">${title}</div>
      <div class="nudge-body">${body}</div>
      <a href="${clubData.club_page_url}" class="nudge-action" style="color:#fff;text-decoration:none">
        View your fundraising page
        <svg viewBox="0 0 13 13" fill="none"><path d="M2 6.5h9M7 2.5l4 4-4 4" stroke="white" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </a>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// SIGN-OFF
// ─────────────────────────────────────────────────────────────────────────────
function buildSignoff(clubData, stripeData, templateType) {
  let text;
  if (templateType === 'active_weekly' && stripeData.donationCount > 0) {
    text = `${stripeData.donationCount} business${stripeData.donationCount !== 1 ? 'es' : ''} chose to invest in your community this week — that's because of the relationships you're building. Keep going.`;
  } else if (templateType === 'quiet_weekly') {
    text = "We're here if you need anything. Your page is live and ready — every email you send is another chance for a business to invest in your community.";
  } else {
    text = "Thanks for being part of Community Fundraising Hub. We're here if you need anything — reach out any time.";
  }

  return `
    <div class="signoff">
      <div class="signoff-text">${text}</div>
      <div class="signoff-name">The Community Fundraising Hub Team</div>
      <div class="signoff-contact">hello@cfh.org.nz &nbsp;·&nbsp; cfh.org.nz</div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function formatNZD(amount) {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency', currency: 'NZD',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount || 0);
}

module.exports = { buildInsightsEmail };
