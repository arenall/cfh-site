// ============================================================
//  CFH — Stripe Webhook → Auto Tax Receipt
//  File: netlify/functions/stripe-webhook.js
//
//  HOW IT WORKS:
//  1. Business pays on the club page via Stripe
//  2. Stripe sends a webhook event to this function
//  3. Function verifies it's genuine (using webhook secret)
//  4. Pulls donor details from the Stripe payment
//  5. Generates a receipt number (CFH-YYYY-NNNN)
//  6. Sends branded tax receipt email via Resend
//  7. Sends a notification email to james@cfh.org.nz
//
//  ENVIRONMENT VARIABLES NEEDED IN NETLIFY:
//  - STRIPE_SECRET_KEY         → from Stripe dashboard
//  - STRIPE_WEBHOOK_SECRET     → from Stripe webhook settings
//  - RESEND_API_KEY            → from Resend dashboard
//
//  STRIPE WEBHOOK TO REGISTER:
//  URL: https://cfh.org.nz/.netlify/functions/stripe-webhook
//  Event: payment_intent.succeeded
// ============================================================

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// ── Helpers ──────────────────────────────────────────────────

function formatDate(timestamp) {
  return new Date(timestamp * 1000).toLocaleDateString('en-NZ', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

function taxYear(timestamp) {
  const d = new Date(timestamp * 1000);
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-indexed; March = 2
  // NZ tax year: 1 April – 31 March
  if (month < 3) {
    // Jan/Feb/Mar → previous April to this March
    return `1 April ${year - 1} – 31 March ${year}`;
  } else {
    // Apr–Dec → this April to next March
    return `1 April ${year} – 31 March ${year + 1}`;
  }
}

function receiptNumber(paymentIntentId) {
  // CFH-2026-XXXX — last 4 chars of payment ID as numeric-like suffix
  const year = new Date().getFullYear();
  const suffix = paymentIntentId.slice(-6).toUpperCase();
  return `CFH-${year}-${suffix}`;
}

function taxCredit(amountCents) {
  const credit = (amountCents / 100) * (1 / 3);
  return credit.toFixed(2);
}

// ── Receipt email HTML ────────────────────────────────────────

function buildReceiptHtml(d) {
  // d = { receiptNumber, donationDate, taxYear, donorName,
  //        businessName, businessEmail, gstNumber, amount,
  //        amountFormatted, taxCreditAmount, clubName,
  //        tierName, stripePaymentId }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Donation Receipt — Community Fundraising Hub</title>
<style>
  body{margin:0;padding:0;background:#F0F4F8;font-family:Arial,Helvetica,sans-serif;}
  .wrap{width:100%;background:#F0F4F8;padding:32px 0;}
  .box{width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(22,32,53,.10);}
  .hdr{background:#1769AA;padding:28px 36px 20px;}
  .hdr-sub{background:#125490;padding:14px 36px;}
  .sec{padding:24px 36px;}
  .lbl{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#1769AA;margin-bottom:10px;}
  .div{height:1px;background:#EBF4FC;margin:0 36px;}
  table.dt{width:100%;border-collapse:collapse;}
  table.dt td{padding:9px 0;border-bottom:1px solid #EBF4FC;font-size:14px;vertical-align:top;}
  .dl{color:#637087;width:42%;}
  .dv{color:#162035;font-weight:600;text-align:right;}
  .amt{background:#E4F7EF;border:2px solid #1F9E68;border-radius:8px;padding:20px;text-align:center;margin:16px 0;}
  .decl{background:#EBF4FC;border-left:4px solid #1769AA;border-radius:0 6px 6px 0;padding:14px 18px;margin:14px 0;}
  .claim{background:#E4F7EF;border-left:4px solid #1F9E68;border-radius:0 6px 6px 0;padding:14px 18px;margin:14px 0;}
  .myir{background:#F8FBFF;border:1px solid #D0E4F5;border-radius:6px;padding:14px 18px;margin:14px 0;}
  .mr{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #EBF4FC;font-size:13px;}
  .mr:last-child{border-bottom:none;}
  .mk{color:#637087;}
  .mv{color:#162035;font-weight:700;font-family:monospace;}
  .ftr{background:#162035;padding:24px 36px;text-align:center;}
  .ftr p{font-size:11px;color:rgba(255,255,255,.5);line-height:1.8;margin:2px 0;}
  .ftr a{color:#4AAEE8;}
  a{color:#1769AA;}
</style>
</head>
<body>
<div class="wrap">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
<table class="box" width="600" cellpadding="0" cellspacing="0">

  <tr><td class="hdr">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td>
        <span style="font-size:19px;font-weight:700;color:#fff;">Community <span style="color:#A8DCF0;">Fundraising</span> Hub</span>
        <div style="font-size:12px;color:rgba(255,255,255,.55);margin-top:3px;">cfh.org.nz &nbsp;·&nbsp; hello@cfh.org.nz</div>
      </td>
      <td align="right" valign="top">
        <div style="background:#0F4278;border-radius:6px;padding:8px 14px;display:inline-block;">
          <div style="font-size:10px;font-weight:700;letter-spacing:.1em;color:#fff;text-transform:uppercase;">Donation Receipt</div>
          <div style="font-size:11px;color:#A8DCF0;margin-top:2px;">Tax credit eligible</div>
        </div>
      </td>
    </tr></table>
  </td></tr>

  <tr><td class="hdr-sub">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-size:12px;color:rgba(255,255,255,.6);">Receipt No.&nbsp;<strong style="color:#fff;font-family:monospace;">${d.receiptNumber}</strong></td>
      <td align="right" style="font-size:12px;color:rgba(255,255,255,.6);">Date:&nbsp;<strong style="color:#fff;">${d.donationDate}</strong></td>
    </tr></table>
  </td></tr>

  <tr><td class="sec" style="padding-bottom:0;">
    <p style="font-size:15px;color:#162035;line-height:1.6;">
      Hi <strong>${d.donorName}</strong>, thank you for your generous support of
      <strong>${d.clubName}</strong> through Community Fundraising Hub.
      This is your official IRD-compliant tax receipt — please keep it for your records.
    </p>
  </td></tr>

  <tr><td class="sec">
    <div class="lbl">Donation amount</div>
    <div class="amt">
      <div style="font-size:13px;color:#1F9E68;font-weight:600;margin-bottom:6px;">✓ &nbsp;Eligible for NZ donation tax credit</div>
      <div style="font-size:40px;font-weight:700;color:#162035;">NZD $${d.amountFormatted}</div>
      <div style="font-size:12px;color:#637087;margin-top:6px;">You can claim back <strong style="color:#1F9E68;">$${d.taxCreditAmount}</strong> (33.33%) from IRD</div>
    </div>
  </td></tr>

  <tr><td class="div"></td></tr>

  <tr><td class="sec">
    <div class="lbl">Donor details</div>
    <table class="dt" cellpadding="0" cellspacing="0">
      <tr><td class="dl">Full name</td><td class="dv">${d.donorName}</td></tr>
      <tr><td class="dl">Business name</td><td class="dv">${d.businessName}</td></tr>
      <tr><td class="dl">Email</td><td class="dv">${d.businessEmail}</td></tr>
      <tr><td class="dl">GST number</td><td class="dv">${d.gstNumber || '—'}</td></tr>
    </table>
  </td></tr>

  <tr><td class="div"></td></tr>

  <tr><td class="sec">
    <div class="lbl">Donation details</div>
    <table class="dt" cellpadding="0" cellspacing="0">
      <tr><td class="dl">Club supported</td><td class="dv">${d.clubName}</td></tr>
      <tr><td class="dl">Sponsorship tier</td><td class="dv">${d.tierName}</td></tr>
      <tr><td class="dl">Payment method</td><td class="dv">Card (Stripe)</td></tr>
      <tr><td class="dl">Payment reference</td><td class="dv" style="font-family:monospace;font-size:12px;">${d.stripePaymentId}</td></tr>
      <tr><td class="dl">Tax year</td><td class="dv">${d.taxYear}</td></tr>
    </table>
  </td></tr>

  <tr><td class="div"></td></tr>

  <tr><td class="sec">
    <div class="lbl">Gift declaration</div>
    <div class="decl">
      <p style="font-size:13px;color:#162035;line-height:1.7;">
        This donation is a voluntary gift made to <strong>Community Fundraising Hub</strong>.
        No goods or services were received by the donor in exchange for this donation.
        This receipt is issued in accordance with Inland Revenue Department (IRD) donation receipt
        requirements and may be used by the donor to support a donation tax credit claim
        (subject to IRD eligibility rules).
      </p>
    </div>
  </td></tr>

  <tr><td class="div"></td></tr>

  <tr><td class="sec">
    <div class="lbl">How to claim your 33.33% tax credit</div>
    <div class="claim">
      <p style="font-size:13px;color:#1F9E68;font-weight:700;margin-bottom:8px;">Claim online in 5 minutes at myIR</p>
      <div style="font-size:13px;color:#162035;padding:3px 0;">1. &nbsp;Log in to myIR at <a href="https://myir.ird.govt.nz">ird.govt.nz/myir</a></div>
      <div style="font-size:13px;color:#162035;padding:3px 0;">2. &nbsp;Go to <strong>Donation Tax Credit</strong> → click <strong>Add a receipt</strong></div>
      <div style="font-size:13px;color:#162035;padding:3px 0;">3. &nbsp;Enter the organisation details below exactly as shown</div>
      <div style="font-size:13px;color:#162035;padding:3px 0;">4. &nbsp;Upload this email as a PDF or screenshot when prompted</div>
    </div>
    <div class="myir">
      <div style="font-size:10px;font-weight:700;color:#637087;letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px;">Enter these details in myIR</div>
      <div class="mr"><span class="mk">Organisation name</span><span class="mv">Community Fundraising Hub</span></div>
      <div class="mr"><span class="mk">IRD number</span><span class="mv">148-754-675</span></div>
      <div class="mr"><span class="mk">Charity number</span><span class="mv">CC pending — update soon</span></div>
      <div class="mr"><span class="mk">Donation type</span><span class="mv">Other donee organisation</span></div>
      <div class="mr"><span class="mk">Amount</span><span class="mv">NZD $${d.amountFormatted}</span></div>
    </div>
    <p style="font-size:12px;color:#637087;line-height:1.6;margin-top:10px;">
      You can claim donations from up to four previous tax years.
      Questions? Reply to this email or contact <a href="mailto:hello@cfh.org.nz">hello@cfh.org.nz</a>
    </p>
  </td></tr>

  <tr><td class="div"></td></tr>

  <tr><td class="sec">
    <div class="lbl">Issued by</div>
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td>
        <div style="font-size:15px;font-weight:700;color:#162035;">James Renall</div>
        <div style="font-size:12px;color:#637087;">Chair — Community Fundraising Hub</div>
        <div style="font-size:12px;color:#637087;margin-top:3px;">Issued: ${d.donationDate}</div>
      </td>
      <td align="right" valign="top">
        <div style="background:#EBF4FC;border-radius:6px;padding:10px 14px;text-align:right;">
          <div style="font-size:10px;color:#637087;margin-bottom:3px;">Receipt</div>
          <div style="font-size:14px;font-weight:700;font-family:monospace;color:#1769AA;">${d.receiptNumber}</div>
        </div>
      </td>
    </tr></table>
  </td></tr>

  <tr><td class="ftr">
    <p style="color:rgba(255,255,255,.85);font-size:13px;font-weight:600;margin-bottom:6px;">Community <span style="color:#4AAEE8;">Fundraising</span> Hub</p>
    <p>Charitable Trust · Reg. No. 70000374 · NZBN: 9429053669445</p>
    <p>IRD Number: 148-754-675 · Charities Services: CC Number pending</p>
    <p style="margin-top:8px;"><a href="https://cfh.org.nz">cfh.org.nz</a> &nbsp;·&nbsp; <a href="mailto:hello@cfh.org.nz">hello@cfh.org.nz</a></p>
    <p style="margin-top:10px;font-size:10px;color:rgba(255,255,255,.3);">Community Fundraising Hub is a NZ registered charitable trust, funded by platform contributions and trustee time to support community sport clubs across Aotearoa. · Auto-generated by CFH on payment confirmation. Received in error? Email hello@cfh.org.nz</p>
  </td></tr>

</table>
</td></tr></table>
</div>
</body>
</html>`;
}

// ── Notification email to James ───────────────────────────────

function buildNotificationHtml(d) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;">
      <h2 style="color:#1769AA;margin-bottom:4px;">💰 New donation received</h2>
      <p style="color:#637087;font-size:13px;margin-bottom:20px;">CFH Platform · ${d.donationDate}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;color:#637087;border-bottom:1px solid #eee;">Donor</td>
            <td style="padding:8px 0;font-weight:600;color:#162035;text-align:right;border-bottom:1px solid #eee;">${d.donorName}</td></tr>
        <tr><td style="padding:8px 0;color:#637087;border-bottom:1px solid #eee;">Business</td>
            <td style="padding:8px 0;font-weight:600;color:#162035;text-align:right;border-bottom:1px solid #eee;">${d.businessName}</td></tr>
        <tr><td style="padding:8px 0;color:#637087;border-bottom:1px solid #eee;">Club</td>
            <td style="padding:8px 0;font-weight:600;color:#162035;text-align:right;border-bottom:1px solid #eee;">${d.clubName}</td></tr>
        <tr><td style="padding:8px 0;color:#637087;border-bottom:1px solid #eee;">Tier</td>
            <td style="padding:8px 0;font-weight:600;color:#162035;text-align:right;border-bottom:1px solid #eee;">${d.tierName}</td></tr>
        <tr><td style="padding:8px 0;color:#637087;">Amount</td>
            <td style="padding:8px 0;font-weight:700;color:#1F9E68;font-size:18px;text-align:right;">NZD $${d.amountFormatted}</td></tr>
      </table>
      <p style="font-size:12px;color:#637087;margin-top:16px;">Receipt ${d.receiptNumber} sent automatically to ${d.businessEmail}</p>
      <p style="font-size:12px;color:#637087;">Stripe ref: ${d.stripePaymentId}</p>
    </div>`;
}

// ── Main handler ──────────────────────────────────────────────

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  // 1. Verify the webhook is genuinely from Stripe
  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      event.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook verification failed:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  // 2. Only handle successful payments
  if (stripeEvent.type !== 'payment_intent.succeeded') {
    return { statusCode: 200, body: 'Event type not handled' };
  }

  const pi = stripeEvent.data.object; // PaymentIntent object
  const meta = pi.metadata || {};

  // 3. Extract all donor details from the PaymentIntent
  //    These come from the metadata you set when creating the PaymentIntent
  //    (handled in the Stripe session creation function)
  const donorData = {
    receiptNumber:   receiptNumber(pi.id),
    donationDate:    formatDate(pi.created),
    taxYear:         taxYear(pi.created),
    donorName:       meta.donor_name       || 'Valued Donor',
    businessName:    meta.business_name    || '—',
    businessEmail:   meta.donor_email      || pi.receipt_email || '',
    gstNumber:       meta.gst_number       || '—',
    amountFormatted: (pi.amount / 100).toFixed(2),
    taxCreditAmount: taxCredit(pi.amount),
    clubName:        meta.club_name        || 'Your Club',
    tierName:        meta.tier_name        || 'Sponsor',
    stripePaymentId: pi.id,
  };

  // 4. Send receipt to donor
  try {
    await resend.emails.send({
      from:    'receipts@cfh.org.nz',
      to:      donorData.businessEmail,
      subject: `Your donation receipt — ${donorData.clubName} (${donorData.receiptNumber})`,
      html:    buildReceiptHtml(donorData),
    });
  } catch (err) {
    console.error('Failed to send receipt email:', err);
    // Don't return error — still notify James
  }

  // 5. Notify James
  try {
    await resend.emails.send({
      from:    'receipts@cfh.org.nz',
      to:      'james@cfh.org.nz',
      subject: `💰 New donation: $${donorData.amountFormatted} — ${donorData.clubName}`,
      html:    buildNotificationHtml(donorData),
    });
  } catch (err) {
    console.error('Failed to send notification email:', err);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true, receipt: donorData.receiptNumber }),
  };
};
