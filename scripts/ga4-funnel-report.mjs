import { writeFileSync } from 'node:fs';
import { googleAccessToken, requiredEnv } from './lib/google-service-account.mjs';

const ANALYTICS_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
const API_BASE = 'https://analyticsdata.googleapis.com/v1beta/properties/';
const events = (process.env.GA4_FUNNEL_EVENTS || 'page_view,ViewContent,pricing_click,click_call,generate_lead')
  .split(',')
  .map(event => event.trim())
  .filter(Boolean);
const startDate = process.env.GA4_START_DATE || '14daysAgo';
const endDate = process.env.GA4_END_DATE || 'today';
const output = process.env.GA4_REPORT_OUTPUT || 'ga4-funnel-report.json';

requiredEnv(['GA4_PROPERTY_ID', 'GOOGLE_SERVICE_ACCOUNT_EMAIL', 'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY']);

async function runReport() {
  const token = await googleAccessToken(ANALYTICS_SCOPE);
  const res = await fetch(API_BASE + process.env.GA4_PROPERTY_ID + ':runReport', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'eventName' },
        { name: 'pagePathPlusQueryString' },
        { name: 'sessionCampaignName' }
      ],
      metrics: [
        { name: 'eventCount' },
        { name: 'totalUsers' }
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          inListFilter: { values: events }
        }
      },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 10000
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error('GA4 Data API ' + res.status + ': ' + (data.error?.message || JSON.stringify(data)));
  return data;
}

function rowsFromReport(report) {
  return (report.rows || []).map(row => ({
    eventName: row.dimensionValues?.[0]?.value || '',
    pagePath: row.dimensionValues?.[1]?.value || '',
    campaign: row.dimensionValues?.[2]?.value || '',
    eventCount: Number(row.metricValues?.[0]?.value || 0),
    totalUsers: Number(row.metricValues?.[1]?.value || 0)
  }));
}

function summarize(rows) {
  const byEvent = {};
  const byPage = {};
  for (const row of rows) {
    byEvent[row.eventName] = (byEvent[row.eventName] || 0) + row.eventCount;
    if (!byPage[row.pagePath]) byPage[row.pagePath] = { pagePath: row.pagePath, views: 0, leads: 0, calls: 0, pricingClicks: 0 };
    if (row.eventName === 'page_view') byPage[row.pagePath].views += row.eventCount;
    if (row.eventName === 'generate_lead') byPage[row.pagePath].leads += row.eventCount;
    if (row.eventName === 'click_call') byPage[row.pagePath].calls += row.eventCount;
    if (row.eventName === 'pricing_click') byPage[row.pagePath].pricingClicks += row.eventCount;
  }
  return {
    totals: byEvent,
    pages: Object.values(byPage).map(page => ({
      ...page,
      optInRate: page.views ? Number((page.leads / page.views).toFixed(4)) : 0
    })).sort((a, b) => b.leads - a.leads || b.views - a.views)
  };
}

const raw = await runReport();
const rows = rowsFromReport(raw);
const report = {
  ok: true,
  propertyId: process.env.GA4_PROPERTY_ID,
  startDate,
  endDate,
  events,
  summary: summarize(rows),
  rows
};

writeFileSync(output, JSON.stringify(report, null, 2));
console.log('GA4 funnel report written to ' + output);
