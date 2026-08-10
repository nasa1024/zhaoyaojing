#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const COUNTRY_ALIASES = new Map(Object.entries({
  us: 'United States', usa: 'United States', 'united states': 'United States', 'united states of america': 'United States', 美国: 'United States', 美國: 'United States',
  de: 'Germany', deu: 'Germany', germany: 'Germany', deutschland: 'Germany', 德国: 'Germany', 德國: 'Germany',
  jp: 'Japan', jpn: 'Japan', japan: 'Japan', 日本: 'Japan',
  kr: 'South Korea', kor: 'South Korea', korea: 'South Korea', 'south korea': 'South Korea', 대한민국: 'South Korea', 韩国: 'South Korea', 韓國: 'South Korea',
  tw: 'Taiwan', twn: 'Taiwan', taiwan: 'Taiwan', 台湾: 'Taiwan', 臺灣: 'Taiwan',
  hk: 'Hong Kong', hkg: 'Hong Kong', 'hong kong': 'Hong Kong', 香港: 'Hong Kong',
  gb: 'United Kingdom', gbr: 'United Kingdom', uk: 'United Kingdom', 'united kingdom': 'United Kingdom', 英国: 'United Kingdom', 英國: 'United Kingdom',
  ca: 'Canada', can: 'Canada', canada: 'Canada', 加拿大: 'Canada',
  au: 'Australia', aus: 'Australia', australia: 'Australia', 澳大利亚: 'Australia', 澳大利亞: 'Australia',
  br: 'Brazil', bra: 'Brazil', brazil: 'Brazil', brasil: 'Brazil', 巴西: 'Brazil',
  fr: 'France', fra: 'France', france: 'France', 法国: 'France', 法國: 'France',
  es: 'Spain', esp: 'Spain', spain: 'Spain', españa: 'Spain', 西班牙: 'Spain',
  mx: 'Mexico', mex: 'Mexico', mexico: 'Mexico', méxico: 'Mexico', 墨西哥: 'Mexico',
  nl: 'Netherlands', nld: 'Netherlands', netherlands: 'Netherlands', nederland: 'Netherlands', 荷兰: 'Netherlands', 荷蘭: 'Netherlands',
  sg: 'Singapore', sgp: 'Singapore', singapore: 'Singapore', 新加坡: 'Singapore',
  ch: 'Switzerland', che: 'Switzerland', switzerland: 'Switzerland', schweiz: 'Switzerland', 瑞士: 'Switzerland',
}));

function normalizeKey(value = '') {
  return String(value)
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_\-./()%：:]+/g, '');
}

function normalizeCountry(value = '') {
  const clean = String(value).trim();
  if (!clean) return '(not set)';
  return COUNTRY_ALIASES.get(clean.toLowerCase()) || clean;
}

function numeric(value) {
  if (value == null || value === '') return 0;
  let text = String(value).trim().replace(/[\u00a0\s]/g, '');
  const percent = text.endsWith('%');
  text = text.replace(/[%$€£¥₹₩RMBUSDDEURGBPJPYKRWNTD]/gi, '').replace(/[^0-9,.-]/g, '');
  if (!text) return 0;
  const comma = text.lastIndexOf(',');
  const dot = text.lastIndexOf('.');
  if (comma >= 0 && dot >= 0) {
    if (comma > dot) text = text.replace(/\./g, '').replace(',', '.');
    else text = text.replace(/,/g, '');
  } else if (comma >= 0) {
    const decimalLike = /,\d{1,2}$/.test(text) && !/,\d{3}(?:,|$)/.test(text);
    text = decimalLike ? text.replace(',', '.') : text.replace(/,/g, '');
  }
  const result = Number(text);
  if (!Number.isFinite(result)) return 0;
  return percent ? result / 100 : result;
}

function csvEscape(value) {
  const text = value == null ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"'; i += 1;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(field); field = ''; }
    else if (char === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
    else field += char;
  }
  if (field.length || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row); }
  const nonEmpty = rows.filter((values) => values.some((value) => value.trim() !== ''));
  if (!nonEmpty.length) return [];
  const headers = nonEmpty[0].map(normalizeKey);
  return nonEmpty.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
}

function pick(row, aliases) {
  for (const alias of aliases) {
    const key = normalizeKey(alias);
    if (Object.prototype.hasOwnProperty.call(row, key) && row[key] !== '') return row[key];
  }
  return '';
}

function emptyCountry(country) {
  return {
    country,
    sessions: 0,
    users: 0,
    analysisStarts: 0,
    analysisCompletes: 0,
    analysisErrors: 0,
    pageViews: 0,
    earnings: 0,
    suppliedPageRpm: 0,
    currency: '',
    gscClicks: 0,
    gscImpressions: 0,
    gscPositionWeight: 0,
  };
}

export function buildCountryReport({ ga4Rows = [], adsenseRows = [], gscRows = [] } = {}) {
  const countries = new Map();
  const get = (name) => {
    const country = normalizeCountry(name);
    if (!countries.has(country)) countries.set(country, emptyCountry(country));
    return countries.get(country);
  };

  for (const row of ga4Rows) {
    const country = pick(row, ['country', 'countryname', '国家', '國家']);
    if (!country) continue;
    const entry = get(country);
    const eventName = String(pick(row, ['eventname', 'event', '事件名称', '事件名稱'])).trim();
    const eventCount = numeric(pick(row, ['eventcount', 'events', '事件数', '事件數']));
    const sessions = numeric(pick(row, ['sessions', '会话', '工作階段', '工作阶段']));
    const users = numeric(pick(row, ['totalusers', 'users', '用户', '使用者']));
    entry.sessions = Math.max(entry.sessions, sessions, eventName === 'session_start' ? eventCount : 0);
    entry.users = Math.max(entry.users, users);
    if (['analysis_start', 'analysis_started'].includes(eventName)) entry.analysisStarts += eventCount;
    if (['analysis_complete', 'analysis_completed'].includes(eventName)) entry.analysisCompletes += eventCount;
    if (['analysis_error', 'analysis_failed'].includes(eventName)) entry.analysisErrors += eventCount;
  }

  for (const row of adsenseRows) {
    const country = pick(row, ['country', 'countryname', '国家', '國家']);
    if (!country) continue;
    const entry = get(country);
    entry.earnings += numeric(pick(row, ['estimatedearnings', 'earnings', 'estimatedrevenue', '预计收入', '預估收益', '预估收益']));
    entry.pageViews += numeric(pick(row, ['pageviews', 'views', '网页浏览量', '網頁瀏覽量', '页面浏览量']));
    entry.suppliedPageRpm = Math.max(entry.suppliedPageRpm, numeric(pick(row, ['pagerpm', 'rpm', '网页rpm', '網頁rpm', '页面rpm'])));
    entry.currency ||= String(pick(row, ['currency', '货币', '幣別'])).trim();
  }

  for (const row of gscRows) {
    const country = pick(row, ['country', '国家', '國家']);
    if (!country) continue;
    const entry = get(country);
    const impressions = numeric(pick(row, ['impressions', '展示次数', '曝光次數', '曝光次数']));
    const position = numeric(pick(row, ['position', 'averageposition', '平均排名', '平均位置']));
    entry.gscClicks += numeric(pick(row, ['clicks', '点击次数', '點擊次數']));
    entry.gscImpressions += impressions;
    entry.gscPositionWeight += position * impressions;
  }

  return [...countries.values()].map((entry) => {
    const completionRate = entry.analysisStarts > 0 ? entry.analysisCompletes / entry.analysisStarts : 0;
    const pageRpm = entry.pageViews > 0 ? (entry.earnings / entry.pageViews) * 1000 : entry.suppliedPageRpm;
    const gscCtr = entry.gscImpressions > 0 ? entry.gscClicks / entry.gscImpressions : 0;
    const averagePosition = entry.gscImpressions > 0 ? entry.gscPositionWeight / entry.gscImpressions : 0;
    const earningsPerCompletion = entry.analysisCompletes > 0 ? entry.earnings / entry.analysisCompletes : 0;
    const monetizationScore = pageRpm * completionRate * Math.log10(10 + Math.max(entry.sessions, entry.gscClicks));
    return {
      country: entry.country,
      currency: entry.currency,
      sessions: entry.sessions,
      users: entry.users,
      analysis_starts: entry.analysisStarts,
      analysis_completes: entry.analysisCompletes,
      completion_rate: completionRate,
      analysis_errors: entry.analysisErrors,
      adsense_page_views: entry.pageViews,
      adsense_earnings: entry.earnings,
      page_rpm: pageRpm,
      earnings_per_completion: earningsPerCompletion,
      gsc_clicks: entry.gscClicks,
      gsc_impressions: entry.gscImpressions,
      gsc_ctr: gscCtr,
      gsc_average_position: averagePosition,
      monetization_score: monetizationScore,
    };
  }).sort((a, b) => b.adsense_earnings - a.adsense_earnings || b.page_rpm - a.page_rpm || b.analysis_completes - a.analysis_completes);
}

const OUTPUT_COLUMNS = [
  'country', 'currency', 'sessions', 'users', 'analysis_starts', 'analysis_completes', 'completion_rate', 'analysis_errors',
  'adsense_page_views', 'adsense_earnings', 'page_rpm', 'earnings_per_completion',
  'gsc_clicks', 'gsc_impressions', 'gsc_ctr', 'gsc_average_position', 'monetization_score',
];

export function reportToCsv(report) {
  const percentageKeys = new Set(['completion_rate', 'gsc_ctr']);
  const decimalKeys = new Set(['adsense_earnings', 'page_rpm', 'earnings_per_completion', 'gsc_average_position', 'monetization_score']);
  const lines = [OUTPUT_COLUMNS.join(',')];
  for (const row of report) {
    lines.push(OUTPUT_COLUMNS.map((key) => {
      let value = row[key];
      if (percentageKeys.has(key)) value = `${(Number(value || 0) * 100).toFixed(2)}%`;
      else if (decimalKeys.has(key)) value = Number(value || 0).toFixed(4);
      return csvEscape(value);
    }).join(','));
  }
  return `${lines.join('\n')}\n`;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (!item.startsWith('--')) continue;
    const [rawKey, inline] = item.slice(2).split('=', 2);
    const value = inline ?? argv[i + 1];
    args[rawKey] = value;
    if (inline == null) i += 1;
  }
  return args;
}

function readCsv(file) {
  return parseCsv(fs.readFileSync(path.resolve(file), 'utf8'));
}

export function runCli(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help || !args.ga4 || !args.adsense) {
    console.log('Usage: node scripts/build-country-performance-report.mjs --ga4 ga4.csv --adsense adsense.csv [--gsc gsc.csv] [--out country-performance.csv]');
    return args.help ? 0 : 1;
  }
  const output = path.resolve(args.out || 'country-performance.csv');
  const report = buildCountryReport({
    ga4Rows: readCsv(args.ga4),
    adsenseRows: readCsv(args.adsense),
    gscRows: args.gsc ? readCsv(args.gsc) : [],
  });
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, reportToCsv(report));
  const jsonPath = output.toLowerCase().endsWith('.csv') ? output.slice(0, -4) + '.json' : `${output}.json`;
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Wrote ${report.length} country rows to ${output} and ${jsonPath}`);
  return 0;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) process.exitCode = runCli();
