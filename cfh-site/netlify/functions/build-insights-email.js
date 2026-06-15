// ─────────────────────────────────────────────────────────────────────────────
// build-insights-email.js
// CFH Club Insights — Email Template Function
// Uses hosted images for header + hero bg for full email client compatibility
// ─────────────────────────────────────────────────────────────────────────────

const TOPBAR_IMG  = 'https://cfh.org.nz/images/cfh-email-topbar.png';
const HERO_BG_IMG = 'https://cfh.org.nz/images/cfh-email-hero-bg.png';

function buildInsightsEmail(clubData, stripeData, templateType, windowEnd) {

  const fridayLabel = windowEnd.toLocaleDateString('en-NZ', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  const programmeStartLabel = new Date(clubData.programme_start).toLocaleDateString('en-NZ', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  const weekLabel = templateType === 'monthly'
    ? `Month ${Math.ceil(clubData.week_number / 4)} summary`
    : `Week ${clubData.week_number} of 4`;

  const preheader = buildPreheader(clubData, stripeData, templateType);
  const statStrip = buildStatStrip(clubData, stripeData, templateType, programmeStartLabel);
  const body      = buildBody(clubData, stripeData, templateType, fridayLabel, programmeStartLabel);
  const signoff   = buildSignoff(clubData, stripeData, templateType);

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>CFH Club Insights — ${clubData.club_name}</title>
<style>
  body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
  table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
  img { border:0; outline:none; text-decoration:none; display:block; }
  body { margin:0 !important; padding:0 !important; background-color:#EAEFF5; }
</style>
</head>
<body style="margin:0;padding:0;background-color:#EAEFF5;font-family:Arial,sans-serif">

<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#EAEFF5">${preheader}</div>

<!-- Outer -->
<table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#EAEFF5">
<tr><td align="center" style="padding:32px 16px 48px">
<table border="0" cellpadding="0" cellspacing="0" width="620" style="max-width:620px;width:100%">

  <!-- TOP BAR IMAGE -->
  <tr>
    <td style="border-radius:12px 12px 0 0;overflow:hidden;line-height:0;font-size:0">
      <img src="${TOPBAR_IMG}" width="620" height="52" alt="Community Fundraising Hub — Weekly Club Insights" style="width:100%;max-width:620px;height:auto;border-radius:12px 12px 0 0">
    </td>
  </tr>

  <!-- HERO — background image with HTML text overlay -->
  <tr>
    <td background="${HERO_BG_IMG}" bgcolor="#162035" style="background-image:url('${HERO_BG_IMG}');background-color:#162035;background-size:cover;background-position:center;padding:28px 32px 24px">
      <!--[if gte mso 9]>
      <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:620px">
        <v:fill type="tile" src="${HERO_BG_IMG}" color="#162035"/>
        <v:textbox inset="0,0,0,0">
      <![endif]-->
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td>
            <p style="margin:0 0 8px;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.5);font-family:Arial,sans-serif">Club Insights Summary</p>
            <p style="margin:0 0 14px;font-size:22px;font-weight:bold;color:#ffffff;line-height:1.2;font-family:Arial,sans-serif">${clubData.club_name}</p>
            <table border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td bgcolor="#2a3f5e" style="background-color:#2a3f5e;border-radius:20px;padding:4px 14px">
                  <span style="font-size:12px;color:rgba(255,255,255,0.8);font-family:Arial,sans-serif">${weekLabel}</span>
                </td>
                <td style="padding-left:12px">
                  <span style="font-size:12px;color:rgba(255,255,255,0.45);font-family:Arial,sans-serif">Week ending ${fridayLabel}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <!--[if gte mso 9]>
        </v:textbox>
      </v:rect>
      <![endif]-->
    </td>
  </tr>

  <!-- CARD BODY -->
  <tr>
    <td bgcolor="#ffffff" style="background-color:#ffffff;border-radius:0 0 16px 16px">

      ${statStrip}

      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr><td style="padding:28px 32px">
          ${body}
        </td></tr>
      </table>

      ${signoff}

    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td align="center" style="padding:20px 24px 0">
      <p style="margin:0;font-size:11.5px;color:#8a9bb0;line-height:1.8;text-align:center;font-family:Arial,sans-serif">
        Community Fundraising Hub · Charitable Trust Board · New Zealand<br>
        You're receiving this because you're registered as a contact for ${clubData.club_name}.<br>
        <a href="mailto:hello@cfh.org.nz" style="color:#8a9bb0">hello@cfh.org.nz</a> &nbsp;·&nbsp; <a href="https://cfh.org.nz" style="color:#8a9bb0">cfh.org.nz</a>
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT STRIP
// ─────────────────────────────────────────────────────────────────────────────
function buildStatStrip(clubData, stripeData, templateType, programmeStartLabel) {
  const col1Label = templateType === 'monthly' ? 'Raised this month' : 'Raised this week';
  const col1Value = templateType === 'monthly' ? stripeData.monthTotalText : stripeData.weekTotalText;
  const col1Sub   = templateType === 'monthly'
    ? `${stripeData.monthDonationCount} donation${stripeData.monthDonationCount !== 1 ? 's' : ''}`
    : `${stripeData.donationCount} donation${stripeData.donationCount !== 1 ? 's' : ''}`;

  return `
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td width="33%" bgcolor="#ffffff" style="background-color:#ffffff;padding:20px 16px 18px;text-align:center;border-right:2px solid #EAF3FC;border-bottom:2px solid #EAF3FC">
          <p style="margin:0 0 6px;font-size:10px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:#637087;font-family:Arial,sans-serif">${col1Label}</p>
          <p style="margin:0 0 4px;font-weight:bold;font-size:26px;color:#1769AA;line-height:1;font-family:Arial,sans-serif">${col1Value}</p>
          <p style="margin:0;font-size:11.5px;color:#637087;font-family:Arial,sans-serif">${col1Sub}</p>
        </td>
        <td width="33%" bgcolor="#ffffff" style="background-color:#ffffff;padding:20px 16px 18px;text-align:center;border-right:2px solid #EAF3FC;border-bottom:2px solid #EAF3FC">
          <p style="margin:0 0 6px;font-size:10px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:#637087;font-family:Arial,sans-serif">Total raised</p>
          <p style="margin:0 0 4px;font-weight:bold;font-size:26px;color:#1F9E68;line-height:1;font-family:Arial,sans-serif">${stripeData.seasonTotalText}</p>
          <p style="margin:0;font-size:11.5px;color:#637087;font-family:Arial,sans-serif">Since ${programmeStartLabel}</p>
        </td>
        <td width="34%" bgcolor="#ffffff" style="background-color:#ffffff;padding:20px 16px 18px;text-align:center;border-bottom:2px solid #EAF3FC">
          <p style="margin:0 0 6px;font-size:10px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:#637087;font-family:Arial,sans-serif">Settled to club</p>
          <p style="margin:0 0 4px;font-weight:bold;font-size:26px;color:#1769AA;line-height:1;font-family:Arial,sans-serif">${stripeData.totalNetSettledText}</p>
          <p style="margin:0;font-size:11.5px;color:#637087;font-family:Arial,sans-serif">${clubData.bank_account_name}</p>
        </td>
      </tr>
    </table>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// BODY ROUTER
// ─────────────────────────────────────────────────────────────────────────────
function buildBody(clubData, stripeData, templateType, fridayLabel, programmeStartLabel) {
  if (templateType === 'active_weekly') return buildActiveWeekly(clubData, stripeData, fridayLabel, programmeStartLabel);
  if (templateType === 'quiet_weekly') return buildQuietWeekly(clubData, stripeData, programmeStartLabel);
  return buildMonthly(clubData, stripeData, fridayLabel, programmeStartLabel);
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVE WEEKLY
// ─────────────────────────────────────────────────────────────────────────────
function buildActiveWeekly(clubData, stripeData, fridayLabel, programmeStartLabel) {
  const avatarColors = ['#1F9E68','#1769AA','#162035','#5B2D8E'];
  const donorRows = stripeData.donorList.map((donor, i) => {
    const initials = donor.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
    const color = avatarColors[i % avatarColors.length];
    const border = i < stripeData.donorList.length - 1 ? 'border-bottom:1px solid #d4f0e2' : '';
    return `
      <tr>
        <td bgcolor="#E4F7EF" style="background-color:#E4F7EF;padding:13px 16px;${border}">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="34" valign="middle" style="padding-right:11px">
                <div style="width:34px;height:34px;border-radius:8px;background-color:${color};text-align:center;line-height:34px;font-weight:bold;font-size:12px;color:#ffffff;font-family:Arial,sans-serif">${initials}</div>
              </td>
              <td valign="middle">
                <p style="margin:0;font-weight:bold;font-size:14px;color:#162035;font-family:Arial,sans-serif">${donor.name}</p>
                <p style="margin:0;font-size:12px;color:#637087;font-family:Arial,sans-serif">${donor.date}</p>
              </td>
              <td align="right" valign="middle">
                <span style="font-weight:bold;font-size:16px;color:#1F9E68;font-family:Arial,sans-serif">${formatNZD(donor.amount)}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
  }).join('');

  return `
    <p style="margin:0 0 14px;font-weight:bold;font-size:15px;color:#162035;font-family:Arial,sans-serif">⭐&nbsp; This Week's Supporters</p>

    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-radius:10px;border:1px solid #c8ecdb;overflow:hidden;margin-bottom:8px">
      ${donorRows}
    </table>

    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px">
      <tr>
        <td bgcolor="#d4f0e2" style="background-color:#d4f0e2;border-radius:6px;padding:10px 14px;font-size:12.5px;color:#157A50;font-family:Arial,sans-serif">
          ✓ &nbsp;Each supporter has been tagged in a social media shoutout within 24 hours.
        </td>
      </tr>
    </table>

    <table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="height:1px;background-color:#EAF3FC;font-size:0;line-height:0">&nbsp;</td></tr></table>
    <div style="height:24px;line-height:24px;font-size:24px">&nbsp;</div>

    <p style="margin:0 0 14px;font-weight:bold;font-size:15px;color:#162035;font-family:Arial,sans-serif">📊&nbsp; Season Progress</p>
    ${buildProgressSection(clubData, stripeData, programmeStartLabel)}

    <div style="height:24px;line-height:24px;font-size:24px">&nbsp;</div>
    <table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="height:1px;background-color:#EAF3FC;font-size:0;line-height:0">&nbsp;</td></tr></table>
    <div style="height:24px;line-height:24px;font-size:24px">&nbsp;</div>

    <p style="margin:0 0 14px;font-weight:bold;font-size:15px;color:#162035;font-family:Arial,sans-serif">💸&nbsp; This Week's Settlement</p>
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px">
      <tr>
        <td bgcolor="#E4F7EF" style="background-color:#E4F7EF;border:1px solid #c8ecdb;border-radius:10px;padding:16px 20px">
          <p style="margin:0 0 3px;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:1.5px;color:#157A50;font-family:Arial,sans-serif">Paid to your account</p>
          <p style="margin:0 0 3px;font-weight:bold;font-size:26px;color:#1F9E68;line-height:1;font-family:Arial,sans-serif">${stripeData.settlementAmountText}</p>
          <p style="margin:0;font-size:12px;color:#637087;font-family:Arial,sans-serif">${clubData.bank_account_name} · ${fridayLabel}</p>
        </td>
        <td bgcolor="#E4F7EF" style="background-color:#E4F7EF;border:1px solid #c8ecdb;border-left:none;border-radius:0 10px 10px 0;padding:16px 20px;text-align:right;vertical-align:middle;width:100px">
          <div style="background-color:#1F9E68;color:#ffffff;font-size:12px;font-weight:bold;padding:7px 14px;border-radius:8px;font-family:Arial,sans-serif;white-space:nowrap;display:inline-block">✓ Settled</div>
        </td>
      </tr>
    </table>

    <table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="height:1px;background-color:#EAF3FC;font-size:0;line-height:0">&nbsp;</td></tr></table>
    <div style="height:24px;line-height:24px;font-size:24px">&nbsp;</div>

    ${buildNudge(clubData)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// QUIET WEEKLY
// ─────────────────────────────────────────────────────────────────────────────
function buildQuietWeekly(clubData, stripeData, programmeStartLabel) {
  return `
    <p style="margin:0 0 14px;font-weight:bold;font-size:15px;color:#162035;font-family:Arial,sans-serif">🕐&nbsp; A Quiet Week — That's Normal</p>

    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px">
      <tr>
        <td bgcolor="#FEF4E0" style="background-color:#FEF4E0;border:1px solid #f5d98a;border-radius:10px;padding:18px 20px;font-size:13.5px;color:#344258;line-height:1.65;font-family:Arial,sans-serif">
          No donations came through this week — and that's completely normal. Most sponsorship clusters in the first two weeks after outreach goes out. The businesses you haven't heard from yet just need a nudge.
        </td>
      </tr>
    </table>

    <table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="height:1px;background-color:#EAF3FC;font-size:0;line-height:0">&nbsp;</td></tr></table>
    <div style="height:24px;line-height:24px;font-size:24px">&nbsp;</div>

    <p style="margin:0 0 14px;font-weight:bold;font-size:15px;color:#162035;font-family:Arial,sans-serif">📊&nbsp; Season So Far</p>
    ${buildMiniStats(clubData, stripeData, programmeStartLabel)}

    <div style="height:24px;line-height:24px;font-size:24px">&nbsp;</div>
    <table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="height:1px;background-color:#EAF3FC;font-size:0;line-height:0">&nbsp;</td></tr></table>
    <div style="height:24px;line-height:24px;font-size:24px">&nbsp;</div>

    ${buildNudge(clubData)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MONTHLY
// ─────────────────────────────────────────────────────────────────────────────
function buildMonthly(clubData, stripeData, fridayLabel, programmeStartLabel) {
  return `
    <p style="margin:0 0 14px;font-weight:bold;font-size:15px;color:#162035;font-family:Arial,sans-serif">📊&nbsp; This Month's Summary</p>
    ${buildProgressSection(clubData, stripeData, programmeStartLabel)}

    <div style="height:24px;line-height:24px;font-size:24px">&nbsp;</div>
    <table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="height:1px;background-color:#EAF3FC;font-size:0;line-height:0">&nbsp;</td></tr></table>
    <div style="height:24px;line-height:24px;font-size:24px">&nbsp;</div>

    <p style="margin:0 0 14px;font-weight:bold;font-size:15px;color:#162035;font-family:Arial,sans-serif">💸&nbsp; Monthly Settlement</p>
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px">
      <tr>
        <td bgcolor="#E4F7EF" style="background-color:#E4F7EF;border:1px solid #c8ecdb;border-radius:10px;padding:16px 20px">
          <p style="margin:0 0 3px;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:1.5px;color:#157A50;font-family:Arial,sans-serif">Paid to your account</p>
          <p style="margin:0 0 3px;font-weight:bold;font-size:26px;color:#1F9E68;line-height:1;font-family:Arial,sans-serif">${stripeData.monthNetText}</p>
          <p style="margin:0;font-size:12px;color:#637087;font-family:Arial,sans-serif">${clubData.bank_account_name} · ${fridayLabel}</p>
        </td>
        <td bgcolor="#E4F7EF" style="background-color:#E4F7EF;border:1px solid #c8ecdb;border-left:none;border-radius:0 10px 10px 0;padding:16px 20px;text-align:right;vertical-align:middle;width:100px">
          <div style="background-color:#1F9E68;color:#ffffff;font-size:12px;font-weight:bold;padding:7px 14px;border-radius:8px;font-family:Arial,sans-serif;white-space:nowrap;display:inline-block">✓ Settled</div>
        </td>
      </tr>
    </table>

    <table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="height:1px;background-color:#EAF3FC;font-size:0;line-height:0">&nbsp;</td></tr></table>
    <div style="height:24px;line-height:24px;font-size:24px">&nbsp;</div>

    ${buildNudge(clubData)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS SECTION
// ─────────────────────────────────────────────────────────────────────────────
function buildProgressSection(clubData, stripeData, programmeStartLabel) {
  let progressBar = '';
  if (clubData.season_goal && clubData.season_goal > 0) {
    const pct = Math.min(100, Math.round((stripeData.seasonTotal / clubData.season_goal) * 100));
    const toGo = Math.max(0, clubData.season_goal - stripeData.seasonTotal);
    progressBar = `
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:10px">
        <tr>
          <td bgcolor="#EBF4FC" style="background-color:#EBF4FC;border-radius:10px;padding:18px 20px">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:10px">
              <tr>
                <td><span style="font-size:12.5px;font-weight:bold;color:#162035;font-family:Arial,sans-serif">Progress toward ${formatNZD(clubData.season_goal)} season goal</span></td>
                <td align="right"><span style="font-weight:bold;font-size:18px;color:#1769AA;font-family:Arial,sans-serif">${pct}%</span></td>
              </tr>
            </table>
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:10px">
              <tr>
                <td bgcolor="#D0E6F5" style="background-color:#D0E6F5;border-radius:99px;height:8px;font-size:0;line-height:0" height="8">
                  <table border="0" cellpadding="0" cellspacing="0" width="${pct}%">
                    <tr><td bgcolor="#1769AA" style="background-color:#1769AA;border-radius:99px;height:8px;font-size:0;line-height:0" height="8">&nbsp;</td></tr>
                  </table>
                </td>
              </tr>
            </table>
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td><span style="font-size:12px;color:#637087;font-family:Arial,sans-serif">${stripeData.seasonTotalText} raised</span></td>
                <td align="right"><span style="font-size:12px;color:#637087;font-family:Arial,sans-serif">${formatNZD(toGo)} to go</span></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;
  }
  return progressBar + buildMiniStats(clubData, stripeData, programmeStartLabel);
}

// ─────────────────────────────────────────────────────────────────────────────
// MINI STATS
// ─────────────────────────────────────────────────────────────────────────────
function buildMiniStats(clubData, stripeData, programmeStartLabel) {
  return `
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td width="48%" valign="top" style="padding-bottom:10px">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr><td bgcolor="#ffffff" style="background-color:#ffffff;border:1px solid #D0E6F5;border-radius:8px;padding:12px 14px">
              <p style="margin:0 0 4px;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;color:#637087;font-family:Arial,sans-serif">Total supporters</p>
              <p style="margin:0;font-weight:bold;font-size:17px;color:#162035;font-family:Arial,sans-serif">${stripeData.totalDonationCount}</p>
            </td></tr>
          </table>
        </td>
        <td width="4%"></td>
        <td width="48%" valign="top" style="padding-bottom:10px">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr><td bgcolor="#ffffff" style="background-color:#ffffff;border:1px solid #D0E6F5;border-radius:8px;padding:12px 14px">
              <p style="margin:0 0 4px;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;color:#637087;font-family:Arial,sans-serif">Largest donation</p>
              <p style="margin:0;font-weight:bold;font-size:17px;color:#1F9E68;font-family:Arial,sans-serif">${stripeData.largestDonationText}</p>
            </td></tr>
          </table>
        </td>
      </tr>
      <tr>
        <td width="48%" valign="top">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr><td bgcolor="#ffffff" style="background-color:#ffffff;border:1px solid #D0E6F5;border-radius:8px;padding:12px 14px">
              <p style="margin:0 0 4px;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;color:#637087;font-family:Arial,sans-serif">Programme started</p>
              <p style="margin:0;font-weight:bold;font-size:13px;color:#162035;font-family:Arial,sans-serif">${programmeStartLabel}</p>
            </td></tr>
          </table>
        </td>
        <td width="4%"></td>
        <td width="48%" valign="top">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr><td bgcolor="#ffffff" style="background-color:#ffffff;border:1px solid #D0E6F5;border-radius:8px;padding:12px 14px">
              <p style="margin:0 0 4px;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;color:#637087;font-family:Arial,sans-serif">CFH fee (7%)</p>
              <p style="margin:0;font-weight:bold;font-size:15px;color:#162035;font-family:Arial,sans-serif">${stripeData.totalFeesText}</p>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// NUDGE
// ─────────────────────────────────────────────────────────────────────────────
function buildNudge(clubData) {
  const weekNum = clubData.week_number;
  let title, body;
  if (weekNum === 1) {
    title = 'Follow up with a phone call.';
    body  = 'Your page is live and your first emails are out — great start. Now follow up with a phone call to each business you contacted. A 2-minute call converts far better than a second email.';
  } else if (weekNum === 2) {
    title = "You're in the follow-up window — use it.";
    body  = `Week 2 is when follow-up calls convert. Pick up the phone. A 2-minute call to each business you haven't heard from yet will do more than any second email. Try: "Hi [Name], just checking you got our note about ${clubData.club_name} this season. Happy to answer anything."`;
  } else if (weekNum === 3) {
    title = 'Warm leads go cold fast — act this week.';
    body  = `Pick two businesses from your list who haven't donated yet and give them a call. Try: "Hi [Name], just checking you got our note about ${clubData.club_name}'s fundraising this season. Happy to answer any questions." Two minutes. That's all it takes.`;
  } else if (weekNum === 4) {
    title = 'Final week of weekly updates.';
    body  = "After this week, your summaries move to monthly. Now is the time to close out any warm leads — a final personal message to anyone who showed interest but hasn't donated yet. Keep it simple and genuine.";
  } else {
    title = 'Keep the momentum going.';
    body  = "Reach out to any businesses who haven't donated yet — a brief personal message goes a long way. Your page is live and ready.";
  }

  return `
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td bgcolor="#162035" style="background-color:#162035;border-radius:12px;padding:22px 24px">
          <p style="margin:0 0 8px;font-size:10px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.4);font-family:Arial,sans-serif">One thing for next week</p>
          <p style="margin:0 0 10px;font-weight:bold;font-size:16px;color:#ffffff;font-family:Arial,sans-serif">${title}</p>
          <p style="margin:0 0 16px;font-size:13.5px;color:rgba(255,255,255,0.72);line-height:1.65;font-family:Arial,sans-serif">${body}</p>
          <a href="${clubData.club_page_url}" style="display:inline-block;background-color:#1769AA;color:#ffffff;font-size:13px;font-weight:bold;padding:10px 18px;border-radius:8px;text-decoration:none;font-family:Arial,sans-serif">View your fundraising page &rarr;</a>
        </td>
      </tr>
    </table>`;
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
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid #EAF3FC">
      <tr><td style="padding:24px 32px 28px">
        <p style="margin:0 0 16px;font-size:14px;color:#344258;line-height:1.7;font-family:Arial,sans-serif">${text}</p>
        <p style="margin:0 0 3px;font-weight:bold;font-size:14px;color:#1769AA;font-family:Arial,sans-serif">The Community Fundraising Hub Team</p>
        <p style="margin:0;font-size:12.5px;color:#637087;font-family:Arial,sans-serif">hello@cfh.org.nz &nbsp;·&nbsp; cfh.org.nz</p>
      </td></tr>
    </table>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PREHEADER
// ─────────────────────────────────────────────────────────────────────────────
function buildPreheader(clubData, stripeData, templateType) {
  if (templateType === 'active_weekly') return `${stripeData.weekTotalText} raised this week · ${stripeData.donationCount} new supporter${stripeData.donationCount !== 1 ? 's' : ''} · ${stripeData.settlementAmountText} settled`;
  if (templateType === 'quiet_weekly') return `Your week ${clubData.week_number} update · ${clubData.club_name} · Keep the momentum going`;
  return `Monthly summary · ${stripeData.monthTotalText} raised · ${clubData.club_name}`;
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
