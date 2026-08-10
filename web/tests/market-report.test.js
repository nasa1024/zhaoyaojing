import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv, buildCountryReport, reportToCsv } from '../scripts/build-country-performance-report.mjs';

test('parseCsv handles quotes, commas, CRLF and percent values', () => {
  const rows = parseCsv('Country,Event name,Event count,Note\r\n"United States",analysis_started,"1,200","a, b"\r\n');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].country, 'United States');
  assert.equal(rows[0].eventname, 'analysis_started');
  assert.equal(rows[0].eventcount, '1,200');
  assert.equal(rows[0].note, 'a, b');
});

test('buildCountryReport joins GA4, AdSense and GSC by normalized country', () => {
  const ga4Rows = parseCsv(`Country,Event name,Event count,Sessions,Total users
USA,analysis_started,100,250,200
United States,analysis_completed,60,250,200
DEU,analysis_start,40,120,95
Germany,analysis_complete,30,120,95
Germany,analysis_error,2,120,95
`);
  const adsenseRows = parseCsv(`Country,Estimated earnings,Page views,Page RPM,Currency
United States,25.00,5000,5.00,USD
Germany,9.60,1200,8.00,EUR
`);
  const gscRows = parseCsv(`Country,Clicks,Impressions,CTR,Position
us,80,1000,8%,10
Germany,30,300,10%,8
`);
  const report = buildCountryReport({ ga4Rows, adsenseRows, gscRows });
  const us = report.find((row) => row.country === 'United States');
  const de = report.find((row) => row.country === 'Germany');
  assert.ok(us);
  assert.ok(de);
  assert.equal(us.analysis_starts, 100);
  assert.equal(us.analysis_completes, 60);
  assert.equal(us.completion_rate, 0.6);
  assert.equal(us.page_rpm, 5);
  assert.equal(us.gsc_ctr, 0.08);
  assert.equal(de.analysis_errors, 2);
  assert.equal(de.completion_rate, 0.75);
  assert.equal(de.page_rpm, 8);
  assert.equal(de.gsc_average_position, 8);
});

test('reportToCsv emits dashboard-ready percentage and money fields', () => {
  const csv = reportToCsv([{ country: 'Germany', currency: 'EUR', sessions: 1, users: 1, analysis_starts: 2, analysis_completes: 1, completion_rate: 0.5, analysis_errors: 0, adsense_page_views: 100, adsense_earnings: 1, page_rpm: 10, earnings_per_completion: 1, gsc_clicks: 2, gsc_impressions: 10, gsc_ctr: 0.2, gsc_average_position: 8.5, monetization_score: 3.2 }]);
  assert.match(csv, /50\.00%/);
  assert.match(csv, /20\.00%/);
  assert.match(csv, /10\.0000/);
});
