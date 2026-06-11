// ─────────────────────────────────────────────────────────────────────────────
// get-club-stripe-data.js
// CFH Club Insights — Stripe Data Fetch Function
//
// Usage: import and call getClubStripeData(club, windowStart, windowEnd)
//
// Returns all Stripe payment data needed to populate the weekly insights email.
// Payments are matched to a club via metadata.club_slug on the PaymentIntent.
// This metadata field must be set in create-stripe-session.js at checkout time.
// ─────────────────────────────────────────────────────────────────────────────

const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Fetch all Stripe payment data for a club within a date window,
 * plus cumulative season totals since programme start.
 *
 * @param {object} club          - Club entry from clubs.json
 * @param {Date}   windowStart   - Start of the reporting period (e.g. last Friday)
 * @param {Date}   windowEnd     - End of the reporting period (e.g. this Friday)
 * @returns {object}             - Structured data for email merge fields
 */
async function getClubStripeData(club, windowStart, windowEnd) {
  const programmeStart = new Date(club.programme_start);

  // ── Fetch all charges for this club since programme start ─────────────────
  // We fetch the full season in one go, then filter for the window.
  // Stripe limits list calls to 100 — we paginate to get everything.

  let allCharges = [];
  let hasMore = true;
  let startingAfter = undefined;

  while (hasMore) {
    const params = {
      limit: 100,
      created: {
        gte: Math.floor(programmeStart.getTime() / 1000),
      },
      expand: ['data.payment_intent'],
    };
    if (startingAfter) params.starting_after = startingAfter;

    const batch = await stripe.charges.list(params);

    // Filter to only successful charges for this club
    // Matches via metadata.club_slug set at checkout in create-stripe-session.js
    const clubCharges = batch.data.filter(charge =>
      charge.status === 'succeeded' &&
      charge.metadata &&
      charge.metadata.club_slug === club.stripe_club_slug
    );

    allCharges = allCharges.concat(clubCharges);
    hasMore = batch.has_more;
    if (batch.data.length > 0) {
      startingAfter = batch.data[batch.data.length - 1].id;
    }
  }

  // ── Season totals (all time since programme start) ────────────────────────
  const seasonTotal = allCharges.reduce((sum, c) => sum + c.amount, 0) / 100;
  const totalDonationCount = allCharges.length;

  // Largest single donation
  const largest = allCharges.reduce((max, c) => c.amount > max.amount ? c : max,
    { amount: 0, metadata: {} }
  );
  const largestDonation = largest.amount / 100;
  const largestDonorName = largest.metadata?.business_name || 'Anonymous';

  // ── Window totals (this week or this month depending on template) ──────────
  const windowStartTs = Math.floor(windowStart.getTime() / 1000);
  const windowEndTs   = Math.floor(windowEnd.getTime() / 1000);

  const windowCharges = allCharges.filter(charge =>
    charge.created >= windowStartTs && charge.created < windowEndTs
  );

  const weekTotal = windowCharges.reduce((sum, c) => sum + c.amount, 0) / 100;
  const donationCount = windowCharges.length;

  // ── Month totals (calendar month of windowEnd) ────────────────────────────
  const monthStart = new Date(windowEnd.getFullYear(), windowEnd.getMonth(), 1);
  const monthStartTs = Math.floor(monthStart.getTime() / 1000);

  const monthCharges = allCharges.filter(charge =>
    charge.created >= monthStartTs && charge.created < windowEndTs
  );

  const monthTotal = monthCharges.reduce((sum, c) => sum + c.amount, 0) / 100;
  const monthDonationCount = monthCharges.length;

  // ── Donor list for the window ─────────────────────────────────────────────
  // Each entry: { name, amount, date }
  // business_name comes from PaymentIntent metadata set at checkout.
  // Falls back to 'Anonymous' if not captured (flags a Taylor action needed).
  const donorList = windowCharges.map(charge => ({
    name:   charge.metadata?.business_name || 'Anonymous',
    amount: charge.amount / 100,
    date:   new Date(charge.created * 1000).toLocaleDateString('en-NZ', {
              day: 'numeric', month: 'long', year: 'numeric'
            }),
  }));

  // ── Calculated fields ──────────────────────────────────────────────────────
  const CFH_FEE_RATE  = 0.07;
  const NET_RATE      = 0.93;

  const totalFeesToDate   = seasonTotal * CFH_FEE_RATE;
  const totalNetSettled   = seasonTotal * NET_RATE;
  const monthNet          = monthTotal  * NET_RATE;
  const monthGross        = monthTotal;
  const seasonGross       = seasonTotal;

  // Settlement amount = net earned this period (simplified — does not subtract
  // previously settled amounts; Ben Morris to reconcile against actuals).
  const settlementAmount  = weekTotal * NET_RATE;

  // Weeks active since programme start
  const msPerWeek   = 7 * 24 * 60 * 60 * 1000;
  const weeksActive = Math.floor((windowEnd - programmeStart) / msPerWeek);

  // ── Return structured data object ─────────────────────────────────────────
  // Field names match the merge fields in CFH_Club_Insights_Summary_v1.docx
  return {
    // Window
    weekTotal,
    donationCount,
    donorList,

    // Month
    monthTotal,
    monthDonationCount,
    monthGross,
    monthNet,

    // Season
    seasonTotal,
    seasonGross,
    totalDonationCount,
    largestDonation,
    largestDonorName,

    // Calculated
    settlementAmount,
    totalFeesToDate,
    totalNetSettled,
    weeksActive,

    // Formatted strings (ready for email merge)
    weekTotalText:        formatNZD(weekTotal),
    monthTotalText:       formatNZD(monthTotal),
    seasonTotalText:      formatNZD(seasonTotal),
    settlementAmountText: formatNZD(settlementAmount),
    largestDonationText:  formatNZD(largestDonation),
    totalFeesText:        formatNZD(totalFeesToDate),
    totalNetSettledText:  formatNZD(totalNetSettled),
    monthNetText:         formatNZD(monthNet),
  };
}

// ── Helper: format a number as NZD ────────────────────────────────────────
function formatNZD(amount) {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

module.exports = { getClubStripeData };
