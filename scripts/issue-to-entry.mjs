#!/usr/bin/env node
// Issue本文をパースして events.json に項目を追加するスクリプト
// GitHub Actions内で実行される。Issue本文を stdin から読む。

import fs from "fs";

const ISSUE_TITLE = process.env.ISSUE_TITLE || "";
const ISSUE_BODY = process.env.ISSUE_BODY || "";
const ISSUE_NUMBER = process.env.ISSUE_NUMBER || "";

// Issue本文をパースして項目の配列を返す
function parseIssue(body) {
  const entries = [];

  // パターン1: Issue template形式（### N 区切り、または最初の項目がフォーム経由）
  // フォーム経由の最初の項目を抽出
  const firstEntry = parseFormBody(body);
  if (firstEntry) entries.push(firstEntry);

  // バッチセクション（### 2, ### 3, ...）を抽出
  const batchSections = body.split(/^### (?=\d)/m);
  for (let i = 1; i < batchSections.length; i++) {
    const section = batchSections[i];
    const entry = parseBatchSection(section);
    if (entry) entries.push(entry);
  }

  // パターン2: ### 1 から始まる場合（全部バッチ形式）
  if (entries.length === 0) {
    const allSections = body.split(/^### (?=\d)/m);
    for (let i = 1; i < allSections.length; i++) {
      const entry = parseBatchSection(allSections[i]);
      if (entry) entries.push(entry);
    }
  }

  return entries.filter(Boolean);
}

// Issue templateのフォーム本文をパース（最初の項目）
function parseFormBody(body) {
  // "### 年" セクションを探す（templateの構造化フォーム）
  const yearMatch = body.match(/###\s*年\s*\n+(.+?)(?=\n###|\n$|$)/s);
  if (!yearMatch) return null;

  const year = parseInt(yearMatch[1].trim(), 10);
  if (isNaN(year)) return null;

  const title = extractField(body, "タイトル");
  const category = extractDropdown(body, "カテゴリ");
  const sub = extractDropdown(body, "分野");
  const icon = extractField(body, "アイコン名");
  const description = extractField(body, "解説");
  const links = extractField(body, "Wikipediaリンク");
  const query = extractField(body, "検索クエリ");

  if (!title || !category || !icon) return null;

  const cat = category.replace(/\s*\(.*\)/, "").trim();
  const s = sub ? sub.replace(/\s*\(.*\)/, "").trim() : undefined;

  return buildEntry({ year, title, cat, s, icon, description, links, query });
}

// バッチセクション（### N 形式）をパース
function parseBatchSection(section) {
  const year = extractBulletField(section, "年");
  const title = extractBulletField(section, "タイトル");
  const category = extractBulletField(section, "カテゴリ");
  const sub = extractBulletField(section, "分野");
  const icon = extractBulletField(section, "アイコン");
  const description = extractBulletField(section, "解説");
  const links = extractBulletField(section, "リンク");
  const query = extractBulletField(section, "検索クエリ");

  const y = parseInt(year, 10);
  if (isNaN(y) || !title) return null;

  const cat = (category || "tech").replace(/\s*\(.*\)/, "").trim();
  const s = sub ? sub.replace(/\s*\(.*\)/, "").trim() : undefined;

  return buildEntry({ year: y, title, cat, s, icon: icon || "chip", description, links, query });
}

function extractField(body, fieldName) {
  const re = new RegExp(`###\\s*${fieldName}\\s*\\n+(.+?)(?=\\n###|\\n$|$)`, "s");
  const m = body.match(re);
  return m ? m[1].replace(/_No response_/, "").trim() : null;
}

function extractDropdown(body, fieldName) {
  const re = new RegExp(`###\\s*${fieldName}[\\s\\S]*?\\n[-\\*]\\s*(.+)`, "m");
  const m = body.match(re);
  if (!m) {
    // fallback: ### fieldName \n value
    return extractField(body, fieldName);
  }
  return m[1].trim();
}

function extractBulletField(section, fieldName) {
  const re = new RegExp(`[-\\*]\\s*${fieldName}:\\s*(.+)`, "i");
  const m = section.match(re);
  return m ? m[1].trim() : null;
}

function buildEntry({ year, title, cat, s, icon, description, links, query }) {
  const entry = { y: year, t: title, cat };

  if (s && s !== "sf") entry.s = s;
  entry.ic = icon || "chip";

  if (description) entry.n = description;

  if (links) {
    const arr = links.split(/[,、]/).map((l) => l.trim()).filter(Boolean);
    if (arr.length) entry.l = arr;
  }

  if (query) entry.q = query;

  // 追加日（今日）
  entry.a = new Date().toISOString().slice(0, 10);

  return entry;
}

// メイン処理
const body = ISSUE_BODY || fs.readFileSync("/dev/stdin", "utf8");
const entries = parseIssue(body);

if (entries.length === 0) {
  console.error("No valid entries found in issue body.");
  console.error("Issue body:");
  console.error(body.slice(0, 2000));
  process.exit(1);
}

console.log(`Parsed ${entries.length} entry(ies) from issue #${ISSUE_NUMBER}:`);
entries.forEach((e, i) => {
  console.log(`  ${i + 1}. [${e.y}] ${e.t} (${e.cat})`);
});

// events.json に追記
const eventsPath = "src/events.json";
const events = JSON.parse(fs.readFileSync(eventsPath, "utf8"));

// 重複チェック（同年同タイトル）
const existing = new Set(events.map((e) => `${e.y}-${e.t}`));
const newEntries = entries.filter((e) => {
  const key = `${e.y}-${e.t}`;
  if (existing.has(key)) {
    console.log(`  SKIP (duplicate): ${key}`);
    return false;
  }
  return true;
});

if (newEntries.length === 0) {
  console.log("All entries are duplicates. No changes needed.");
  process.exit(0);
}

events.push(...newEntries);
events.sort((a, b) => a.y - b.y || a.t.localeCompare(b.t, "ja"));

fs.writeFileSync(eventsPath, JSON.stringify(events, null, 2) + "\n");
console.log(`Added ${newEntries.length} new entry(ies) to ${eventsPath}`);
