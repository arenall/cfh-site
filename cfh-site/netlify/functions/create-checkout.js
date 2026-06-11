// ============================================================
// CFH — Dynamic Stripe Checkout Session Creator
// File: netlify/functions/create-checkout.js
//
// HOW IT WORKS:
// 1. Club page calls this function with amount, tier, club name
// 2. Function calculates final amount (with or without 7% fee)
// 3. Creates a Stripe Checkout session
// 4. Returns the session URL to redirect the sponsor
//
// ENVIRONMENT VARIABLES NEEDED IN NETLIFY:
// - STRIPE_SECRET_KEY  → from Stripe dashboard
// ============================================================

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    const body = JSON.parse(event.body);
    const {
      amountCents,     // amount in cents e.g. 100000 for $1000
      tierName,        // e.g. "Gold Sponsor"
      clubName,        // e.g. "Warkworth Netball Club"
      clubSlug,        // e.g. "warkworth-netball" — matches clubs.json stripe_club_slug
      coverFee,        // boolean — true if sponsor is covering the 7% fee
      sponsorName,     // sponsor's full name
      businessName,    // sponsor's business name
      sponsorEmail,    // sponsor's email
      pageUrl,         // the club page URL to redirect back to after payment
    } = body;

    // Validate required fields
    if (!amountCents || !tierName || !clubName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Calculate final amount
    // If coverFee is true, add 7% so CFH receives its fee AND club gets full amount
    const feeMultiplier = coverFee ? 1.095 : 1;
    const finalAmountCents = Math.round(amountCents * feeMultiplier);

    // Build line item description
    const description = coverFee
      ? `${tierName} — ${clubName} (includes ~2.5% payment processing + 7% CFH platform fee)`
      : `${tierName} — ${clubName}`;

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      custom_fields: [
        {
          key: 'business_name',
          label: { type: 'custom', custom: 'Business name' },
          type: 'text',
          optional: false,
        },
        {
          key: 'contact_person_name',
          label: { type: 'custom', custom: 'Contact person name' },
          type: 'text',
          optional: false,
        },
        {
          key: 'business_type',
          label: { type: 'custom', custom: 'Business type' },
          type: 'dropdown',
          dropdown: {
            options: [
              { label: 'Retail',                value: 'retail' },
              { label: 'Hospitality',           value: 'hospitality' },
              { label: 'Trades',                value: 'trades' },
              { label: 'Professional services', value: 'professionalservices' },
              { label: 'Health',                value: 'health' },
              { label: 'Other',                 value: 'other' },
            ],
          },
          optional: false,
        },
      ],
      line_items: [{
        price_data: {
          currency: 'nzd',
          product_data: {
            name: description,
            description: `Supporting ${clubName} through Community Fundraising Hub`,
          },
          unit_amount: finalAmountCents,
        },
        quantity: 1,
      }],
      // Pre-fill customer details if provided
      customer_email: sponsorEmail || undefined,
      // Collect billing details for tax receipt
      billing_address_collection: 'auto',
      // Pass metadata through to webhook for receipt generation
      payment_intent_data: {
        metadata: {
          club_name:             clubName,
          club_slug:             clubSlug || '',   // ← ADDED: links payment to clubs.json entry
          tier_name:             tierName,
          donor_name:            sponsorName || '',
          business_name:         businessName || '',
          donor_email:           sponsorEmail || '',
          cover_fee:             coverFee ? 'yes' : 'no',
          original_amount_cents: amountCents.toString(),
          final_amount_cents:    finalAmountCents.toString(),
        },
      },
      // Redirect URLs
      success_url: `${pageUrl || event.headers.referer || 'https://cfh.org.nz'}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${pageUrl || event.headers.referer || 'https://cfh.org.nz'}?payment=cancelled`,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url }),
    };

  } catch (err) {
    console.error('Checkout session error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
