// ============================================================
// CFH — Stripe Webhook → Auto Tax Receipt
// File: netlify/functions/stripe-webhook.js
//
// HOW IT WORKS:
// 1. Business pays on the club page via Stripe
// 2. Stripe sends a webhook event to this function
// 3. Function verifies it's genuine (using webhook secret)
// 4. Pulls donor details from the Stripe payment
// 5. Generates a receipt number (CFH-YYYY-NNNN)
// 6. Sends branded tax receipt email via Resend
// 7. Sends a notification email to james@cfh.org.nz
//
// ENVIRONMENT VARIABLES NEEDED IN NETLIFY:
// - STRIPE_SECRET_KEY         → from Stripe dashboard
// - STRIPE_WEBHOOK_SECRET     → from Stripe webhook settings
// - RESEND_API_KEY            → from Resend dashboard
//
// STRIPE WEBHOOK TO REGISTER:
// URL: https://cfh.org.nz/.netlify/functions/stripe-webhook
// Event: payment_intent.succeeded
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
  const month = d.getMonth();
  if (month < 3) {
    return `1 April ${year - 1} – 31 March ${year}`;
  } else {
    return `1 April ${year} – 31 March ${year + 1}`;
  }
}

function receiptNumber(paymentIntentId) {
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
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Donation Receipt — Community Fundraising Hub</title>
  </head>
  <body style="margin:0;padding:0;background:#F4FAFF;font-family:'DM Sans',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4FAFF;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
        <!-- Header -->
        <tr><td style="background:#162035;border-radius:12px 12px 0 0;padding:24px 32px">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="font-family:Arial,sans-serif;font-weight:800;font-size:16px;color:#fff">Community <span style="color:#4AAEE8">Fundraising</span> Hub</span><br>
                <span style="font-size:12px;color:rgba(255,255,255,0.5)">Charitable Trust · Reg. No. 70000374</span>
              </td>
              <td align="right">
                <span style="font-size:11px;color:rgba(255,255,255,0.4)">TAX RECEIPT</span><br>
                <span style="font-size:13px;font-weight:700;color:#fff">${d.receiptNumber}</span>
              </td>
            </tr>
          </table>
        </td></tr>
        <!-- Body -->
        <tr><td style="background:#fff;padding:32px">
          <p style="font-size:15px;color:#162035;margin:0 0 8px">Dear ${d.donorName},</p>
          <p style="font-size:14px;color:#344258;margin:0 0 24px;line-height:1.6">
            Thank you for your contribution to <strong>${d.clubName}</strong> through Community Fundraising Hub.
            This is your official tax receipt — keep it for your records and use it to claim your IRD tax credit.
          </p>
          <!-- Receipt details -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4FAFF;border-radius:10px;margin-bottom:24px">
            <tr><td style="padding:20px 24px">
              <table width="100%" cellpadding="4" cellspacing="0">
                <tr><td style="font-size:12px;color:#637087;width:50%">Receipt number</td><td style="font-size:12px;color:#162035;font-weight:600;text-align:right">${d.receiptNumber}</td></tr>
                <tr><td style="font-size:12px;color:#637087">Donation date</td><td style="font-size:12px;color:#162035;font-weight:600;text-align:right">${d.donationDate}</td></tr>
                <tr><td style="font-size:12px;color:#637087">Tax year</td><td style="font-size:12px;color:#162035;font-weight:600;text-align:right">${d.taxYear}</td></tr>
                <tr><td style="font-size:12px;color:#637087">Donor name</td><td style="font-size:12px;color:#162035;font-weight:600;text-align:right">${d.donorName}</td></tr>
                <tr><td style="font-size:12px;color:#637087">Business name</td><td style="font-size:12px;color:#162035;font-weight:600;text-align:right">${d.businessName}</td></tr>
                <tr><td style="font-size:12px;color:#637087">Business type</td><td style="font-size:12px;color:#162035;font-weight:600;text-align:right">${d.businessType}</td></tr>
                <tr><td style="font-size:12px;color:#637087">Club supported</td><td style="font-size:12px;color:#162035;font-weight:600;text-align:right">${d.clubName}</td></tr>
                <tr><td style="font-size:12px;color:#637087">Sponsorship tier</td><td style="font-size:12px;color:#162035;font-weight:600;text-align:right">${d.tierName}</td></tr>
                <tr><td style="font-size:12px;color:#637087">Stripe reference</td><td style="font-size:12px;color:#162035;font-weight:600;text-align:right">${d.stripePaymentId}</td></tr>
              </table>
            </td></tr>
          </table>
          <!-- Amount -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#162035;border-radius:10px;margin-bottom:24px">
            <tr><td style="padding:20px 24px">
              <table width="100%" cellpadding="4" cellspacing="0">
                <tr>
                  <td style="font-size:13px;color:rgba(255,255,255,0.6)">Donation amount</td>
                  <td style="font-size:22px;font-weight:800;color:#fff;text-align:right">NZ$${d.amountFormatted}</td>
                </tr>
                <tr>
                  <td style="font-size:12px;color:rgba(255,255,255,0.5)">Tax credit (up to 33.33%)</td>
                  <td style="font-size:14px;font-weight:700;color:#4AAEE8;text-align:right">- NZ$${d.taxCreditAmount}</td>
                </tr>
                <tr>
                  <td style="font-size:12px;color:rgba(255,255,255,0.5)">Your effective cost</td>
                  <td style="font-size:16px;font-weight:700;color:#1F9E68;text-align:right">~NZ$${(parseFloat(d.amountFormatted) - parseFloat(d.taxCreditAmount)).toFixed(2)}</td>
                </tr>
              </table>
            </td></tr>
          </table>
          <!-- Charity details -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#EBF4FC;border-radius:10px;margin-bottom:24px">
            <tr><td style="padding:16px 24px">
              <p style="font-size:12px;color:#1769AA;font-weight:700;margin:0 0 6px">Registered NZ Charity</p>
              <p style="font-size:12px;color:#344258;margin:0;line-height:1.6">
                Community Fundraising Hub · Charitable Trust Board · Reg. No. 70000374<br>
                Charity registration CC pending — Donee status DT pending<br>
                IRD No. 148-754-675 · cfh.org.nz
              </p>
            </td></tr>
          </table>
          <p style="font-size:11px;color:#637087;line-height:1.6;margin:0">
            This receipt is issued in accordance with NZ charitable donation requirements. 
            To claim your tax credit, log in to myIR at ird.govt.nz, go to "Donation tax credits" and enter this receipt number. 
            Speak to your accountant for advice on your specific tax situation.
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#162035;border-radius:0 0 12px 12px;padding:16px 32px;text-align:center">
          <p style="font-size:11px;color:rgba(255,255,255,0.35);margin:0">
            Community Fundraising Hub · cfh.org.nz · receipts@cfh.org.nz<br>
            Charitable Trust Board · Inc. No. 70000374 · NZBN 9429053669445
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
  </body>
  </html>
  `;
}

// ── Notification email HTML ───────────────────────────────────

function buildNotificationHtml(d) {
  return `
  <div style="font-family:Arial,sans-serif;padding:24px;max-width:500px">
    <h2 style="color:#162035">New donation received 💰</h2>
    <table cellpadding="6" cellspacing="0">
      <tr><td style="color:#637087">Amount</td><td><strong>NZ$${d.amountFormatted}</strong></td></tr>
      <tr><td style="color:#637087">Club</td><td>${d.clubName}</td></tr>
      <tr><td style="color:#637087">Tier</td><td>${d.tierName}</td></tr>
      <tr><td style="color:#637087">Donor</td><td>${d.donorName}</td></tr>
      <tr><td style="color:#637087">Business</td><td>${d.businessName}</td></tr>
      <tr><td style="color:#637087">Type</td><td>${d.businessType}</td></tr>
      <tr><td style="color:#637087">Email</td><td>${d.businessEmail}</td></tr>
      <tr><td style="color:#637087">Receipt</td><td>${d.receiptNumber}</td></tr>
      <tr><td style="color:#637087">Payment ID</td><td style="font-size:11px">${d.stripePaymentId}</td></tr>
    </table>
  </div>
  `;
}

// ── Main handler ─────────────────────────────────────────────

exports.handler = async (event) => {

  // Verify the webhook is genuinely from Stripe
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

  // Only handle successful payments
  if (stripeEvent.type !== 'payment_intent.succeeded') {
    return { statusCode: 200, body: 'Event type not handled' };
  }

  const pi = stripeEvent.data.object;
  const meta = pi.metadata || {};

  // Try to get customer email and custom fields from multiple sources
  let customerEmail = meta.donor_email || pi.receipt_email || '';
  let donorNameFromSession = '';
  let businessNameFromSession = '';
  let businessTypeFromSession = '';

  // Retrieve from Checkout Session — email + custom fields (name, business name)
  try {
    const sessions = await stripe.checkout.sessions.list({
      payment_intent: pi.id,
      limit: 1,
    });
    if (sessions.data.length > 0) {
      const session = sessions.data[0];
      if (!customerEmail) {
        customerEmail = session.customer_details?.email || '';
        console.log('Email retrieved from checkout session:', customerEmail);
      }
      // Extract custom fields
      const customFields = session.custom_fields || [];
      const bizField    = customFields.find(f => f.key === 'business_name');
      const nameField   = customFields.find(f => f.key === 'contact_person_name');
      const typeField   = customFields.find(f => f.key === 'business_type');
      donorNameFromSession    = nameField?.text?.value || '';
      businessNameFromSession = bizField?.text?.value || '';
      businessTypeFromSession = typeField?.dropdown?.value || '';
      console.log('Custom fields:', donorNameFromSession, businessNameFromSession, businessTypeFromSession);
    }
  } catch (err) {
    console.error('Could not retrieve checkout session:', err.message);
  }

  const donorData = {
    receiptNumber:   receiptNumber(pi.id),
    donationDate:    formatDate(pi.created),
    taxYear:         taxYear(pi.created),
    donorName:       donorNameFromSession || meta.donor_name || 'Valued Donor',
    businessName:    businessNameFromSession || meta.business_name || '—',
    businessType:    businessTypeFromSession || '—',
    businessEmail:   customerEmail,
    gstNumber:       meta.gst_number     || '—',
    amountFormatted: (pi.amount / 100).toFixed(2),
    taxCreditAmount: taxCredit(pi.amount),
    clubName:        meta.club_name      || 'Your Club',
    tierName:        meta.tier_name      || 'Sponsor',
    stripePaymentId: pi.id,
  };

  console.log('Processing receipt for:', donorData.businessEmail, '| Club:', donorData.clubName);

  // Send receipt to donor
  if (donorData.businessEmail) {
    try {
      await resend.emails.send({
        from:    'receipts@cfh.org.nz',
        to:      donorData.businessEmail,
        subject: `Your donation receipt — ${donorData.clubName} (${donorData.receiptNumber})`,
        html:    buildReceiptHtml(donorData),
      });
      console.log('Receipt sent to:', donorData.businessEmail);
    } catch (err) {
      console.error('Failed to send receipt email:', err);
    }
  } else {
    console.error('No email address found — receipt not sent');
  }

  // Notify James
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
