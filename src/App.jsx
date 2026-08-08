import { useState, useMemo, useEffect, useRef } from "react";
import { EVENTS } from "./events";
import { THREADS } from "./threads";

// ---- ラインアイコン(全て自作SVG・権利フリー) ----
const P = {
  book: <><path d="M5 4a2 2 0 0 1 2-2h12v18H7a2 2 0 0 0-2 2V4z"/><path d="M7 2v16"/></>,
  tv: <><rect x="3" y="7" width="18" height="12" rx="2"/><path d="M8 3l4 4 4-4"/></>,
  film: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 4v16M16 4v16M3 9h5M3 15h5M16 9h5M16 15h5"/></>,
  robot: <><rect x="5" y="9" width="14" height="10" rx="2"/><path d="M12 5v4"/><circle cx="12" cy="4" r="1"/><circle cx="9" cy="13" r="1"/><circle cx="15" cy="13" r="1"/><path d="M9 17h6"/></>,
  watch: <><circle cx="12" cy="12" r="5"/><path d="M9 3h6l-1 4M9 21h6l-1-4M15 21l1-4M9 3l1 4"/><path d="M12 10v2.5l2 1"/></>,
  comm: <><path d="M12 3l7 4v6c0 4-3 6-7 8-4-2-7-4-7-8V7l7-4z"/><circle cx="12" cy="11" r="2.5"/></>,
  computer: <><rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M9 20h6M12 16v4"/></>,
  chip: <><rect x="7" y="7" width="10" height="10" rx="1"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5M5 5l3 3M19 5l-3 3M5 19l3-3M19 19l-3-3"/></>,
  globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18-3-3-3-15 0-18z"/></>,
  satellite: <><circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="9.5" ry="4"/></>,
  rocket: <><path d="M12 2c3 2.5 4 6.5 4 10l-4 4-4-4c0-3.5 1-7.5 4-10z"/><circle cx="12" cy="9" r="1.5"/><path d="M12 16v5M8 13l-3 4M16 13l3 4"/></>,
  hmd: <><rect x="3" y="8" width="18" height="9" rx="4"/><path d="M9.5 17c0-1.5 5-1.5 5 0M3 12H1M23 12h-2"/></>,
  gamepad: <><rect x="3" y="8" width="18" height="9" rx="4.5"/><path d="M8 10.5v4M6 12.5h4"/><circle cx="15.5" cy="11.5" r="1"/><circle cx="18" cy="13.5" r="1"/></>,
  phone: <><rect x="8" y="2" width="8" height="20" rx="2"/><path d="M11 18h2"/></>,
  video: <><rect x="2" y="7" width="13" height="10" rx="2"/><path d="M15 11l7-3.5v9L15 13z"/></>,
  ai: <><path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z"/><path d="M19 3l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z"/></>,
  ghost: <><path d="M2.5 12S6.5 6 12 6s9.5 6 9.5 6-4 6-9.5 6S2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.5"/><path d="M4 4l16 16"/></>,
  music: <><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></>,
  wifi: <><path d="M4.5 10.5a11 11 0 0 1 15 0M7.5 13.5a7 7 0 0 1 9 0M10.5 16.5a3 3 0 0 1 3 0"/><circle cx="12" cy="19" r="1" fill="currentColor" stroke="none"/></>,
  flag: <><path d="M5 21V4"/><path d="M5 4h12l-2.5 3.5L17 11H5"/></>,
};

function Icon({ name, color, size = 18 }) {
  return (
    <svg
      viewBox="0 0 24 24" width={size} height={size}
      fill="none" stroke={color} strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, marginTop: 2 }}
      aria-hidden="true"
    >
      {P[name] || P.book}
    </svg>
  );
}

// ---- 分野(興味に応じてオン・オフできるフィルタの単位) ----
// PC・ワークステーション・ミニコン・メインフレームは「コンピューター」にまとめている
const SUBS = {
  pc: { label: "コンピューター", c: "tech" },
  ai: { label: "AI", c: "tech" },
  net: { label: "ネット・インフラ", c: "tech" },
  sns: { label: "SNS・ネット文化", c: "tech" },
  mobile: { label: "モバイル・通信", c: "tech" },
  game: { label: "ゲーム", c: "tech" },
  inst: { label: "楽器・DTM", c: "tech" },
  audio: { label: "オーディオ", c: "tech" },
  video: { label: "映像・カメラ・CG", c: "tech" },
  wear: { label: "ウェアラブル", c: "tech" },
  tablet: { label: "タブレット・電子書籍", c: "tech" },
  xr: { label: "VR・AR", c: "tech" },
  robot: { label: "ロボット", c: "tech" },
  space: { label: "宇宙・測位", c: "tech" },
  quantum: { label: "量子", c: "tech" },
  boom: { label: "ブーム・社会現象", c: "tech" },
  other: { label: "その他", c: "tech" },
  artist_w: { label: "洋楽アーティスト", c: "music" },
  artist_j: { label: "邦楽アーティスト", c: "music" },
};

// 旧データ用のフォールバック(sを持たない項目はアイコンから分野を推定する)
const SUB_BY_IC = {
  computer: "pc", chip: "pc", ai: "ai", globe: "net", wifi: "net", phone: "mobile",
  gamepad: "game", music: "inst", video: "video", film: "video", tv: "video",
  watch: "wear", comm: "wear", hmd: "xr", robot: "robot", satellite: "space",
  rocket: "space", ghost: "other", book: "other",
};
const subOf = (e) => e.s || SUB_BY_IC[e.ic] || "other";

// ---- 学齢期の区分(進路・浪人・留年で可変) ----
const PATHS = {
  hs_job: { label: "高卒で就職", years: 0 },
  kosen: { label: "高専(5年)", years: 5, kosen: true },
  vocational: { label: "短大・専門(2年)", years: 2 },
  univ: { label: "大学(4年)", years: 4 },
  univ6: { label: "6年制大学(医・歯・薬・獣医)", years: 6 },
  masters: { label: "修士まで(大学+2年)", years: 4, ms: true },
  phd: { label: "博士まで(大学+5年)", years: 4, ms: true, dr: true },
};

const ADULT_STAGE = { key: "adult", label: "社会人", color: "#37414f", bg: "#eef1f5" };

// ---- 社会人と生まれる前は長くなりすぎるので、技術史の時代でさらに区切る ----
const ERAS = [
  { key: "invention", label: "発明の時代", to: 1945 },
  { key: "mainframe", label: "大型計算機の時代", to: 1974 },
  { key: "micro", label: "PCの時代", to: 1992 },
  { key: "internet", label: "インターネットの時代", to: 2000 },
  { key: "web2", label: "Web 2.0の時代", to: 2006 },
  { key: "mobile", label: "スマートフォンの時代", to: 2019 },
  { key: "ai", label: "AIの時代", to: Infinity },
];
const eraOf = (y) => ERAS.find((e) => y <= e.to);
const SPLIT_STAGES = new Set(["pre", "adult"]);

// 「社会人になった年度」が指定されたら、そこで学齢の帯を打ち切って社会人に切り替える
function applyAdultSage(stages, adultSage) {
  if (adultSage == null) return stages;
  const out = [];
  for (const s of stages) {
    if (s.key === "adult") continue;
    if (s.from >= adultSage) continue; // その進路に到達する前に社会人になった
    out.push({ ...s, to: Math.min(s.to, adultSage - 1) });
  }
  const lastTo = out.length ? out[out.length - 1].to : -Infinity;
  if (Number.isFinite(lastTo) && lastTo < adultSage - 1) {
    // 卒業から就職までに間がある場合(留学・就職浪人・フリーランス期間など)
    out.push({ key: "gap", label: "社会人になる前", from: lastTo + 1, to: adultSage - 1, color: "#7a6a55", bg: "#f5f1e8" });
  }
  out.push({ ...ADULT_STAGE, from: adultSage, to: Infinity });
  return out;
}

// from/toは「コホート年齢」(誕生年度基準。早生まれは前年度の学年に所属)
function buildStages(ronin, ryunen, path, adultSage) {
  const stages = [
    { key: "pre", label: "生まれる前", from: -Infinity, to: -Infinity, color: "#8a8f98", bg: "#f1f2f4" },
    { key: "infant", label: "幼少期", from: -Infinity, to: 6, color: "#b0771e", bg: "#fdf3e0" },
    { key: "elem", label: "小学生", from: 7, to: 12, color: "#c2452d", bg: "#fdeae5" },
    { key: "jhs", label: "中学生", from: 13, to: 15, color: "#1f7a4d", bg: "#e6f5ec" },
  ];
  const cfg = PATHS[path];
  // 高専は中学卒業後の5年間。高校と大学前半をまたぐ独自の帯になる
  if (cfg.kosen) {
    const end = 16 + cfg.years - 1 + ryunen;
    stages.push({ key: "kosen", label: ryunen > 0 ? "高専生(留年込み)" : "高専生", from: 16, to: end, color: "#0f6f8a", bg: "#e3f1f5" });
    stages.push({ ...ADULT_STAGE, from: end + 1, to: Infinity });
    return applyAdultSage(stages, adultSage);
  }
  stages.push({ key: "hs", label: "高校生", from: 16, to: 18, color: "#1e5fa8", bg: "#e7f0fb" });
  let cursor = 19;
  if (cfg.years === 0) {
    stages.push({ ...ADULT_STAGE, from: cursor, to: Infinity });
    return applyAdultSage(stages, adultSage);
  }
  if (ronin > 0) {
    stages.push({ key: "ronin", label: "浪人", from: cursor, to: cursor + ronin - 1, color: "#a8322f", bg: "#fbe9e9" });
    cursor += ronin;
  }
  const schoolLabel = path === "vocational" ? "短大・専門" : "大学生";
  const schoolEnd = cursor + cfg.years - 1 + ryunen;
  stages.push({ key: "univ", label: ryunen > 0 ? `${schoolLabel}(留年込み)` : schoolLabel, from: cursor, to: schoolEnd, color: "#6b3fa0", bg: "#f1e9fa" });
  cursor = schoolEnd + 1;
  if (cfg.ms) {
    stages.push({ key: "ms", label: "大学院(修士)", from: cursor, to: cursor + 1, color: "#4a5fb0", bg: "#eaeefb" });
    cursor += 2;
  }
  if (cfg.dr) {
    stages.push({ key: "dr", label: "大学院(博士)", from: cursor, to: cursor + 2, color: "#31589c", bg: "#e5ecf8" });
    cursor += 3;
  }
  stages.push({ ...ADULT_STAGE, from: cursor, to: Infinity });
  return applyAdultSage(stages, adultSage);
}

function makeGradeLabel(ronin, ryunen, path, adultSage) {
  const cfg = PATHS[path];
  return (age, sage) => {
    if (age < 0) return `${-age}年前`;
    if (adultSage != null && sage >= adultSage) return `${age}歳`;
    if (sage <= 6) return `${age}歳`;
    if (sage <= 12) return `小${sage - 6}`;
    if (sage <= 15) return `中${sage - 12}`;
    if (cfg.kosen) {
      const k = sage - 15;
      if (k <= cfg.years) return `高専${k}`;
      if (k <= cfg.years + ryunen) return `留年`;
      return `${age}歳`;
    }
    if (sage <= 18) return `高${sage - 15}`;
    if (cfg.years === 0) return `${age}歳`;
    const schoolStart = 19 + ronin;
    if (sage < schoolStart) return `浪${sage - 18}`;
    const n = sage - schoolStart + 1;
    if (n <= cfg.years) return path === "vocational" ? `専${n}` : `大${n}`;
    if (n <= cfg.years + ryunen) return `留年`;
    const m = n - cfg.years - ryunen;
    if (cfg.ms && m <= 2) return `修${m}`;
    if (cfg.dr && m <= 5) return `博${m - 2}`;
    return `${age}歳`;
  };
}

// ---- 最近の追加(aフィールドの日付が新しいものを拾う) ----
const RECENT = (() => {
  const dated = EVENTS.filter((e) => e.a);
  if (!dated.length) return null;
  const latest = dated.reduce((m, e) => (e.a > m ? e.a : m), "");
  const items = dated.filter((e) => e.a === latest).sort((x, y) => x.y - y.y);
  // 年代が偏らないよう、範囲全体から等間隔に抜き出して見出しに出す
  const N = Math.min(6, items.length);
  const picks = Array.from({ length: N }, (_, i) =>
    items[Math.round((i * (items.length - 1)) / Math.max(1, N - 1))]
  );
  return { date: latest, items, picks };
})();

// ---- 最近の新機能(手で追記する) ----
const FEATURES = [
  { d: "2026-08-08", t: "「テーマの糸」を追加しました。歌声合成やCG、写真の系譜など13本のテーマを選ぶと、関連項目が年代順に自動再生されます(読み上げ・速度切り替えつき。左右の背景には同じころの別ジャンルの出来事が薄く流れます)" },
  { d: "2026-08-08", t: "すべての帯に技術史の時代(大型計算機/PC/インターネット/Web 2.0/スマートフォン/AI)を併記し、「社会人」と「生まれる前」は時代ごとに折りたためるようにしました" },
  { d: "2026-08-06", t: "期間ごと・入力欄の折りたたみ、解説つきのSNS投稿、項目数と文字数の表示を追加しました" },
  { d: "2026-08-05", t: "20分野の絞り込みフィルタと、項目ごとの共有リンクを追加しました" },
];

// ---- 年表の規模(見出しに表示する) ----
const STATS = EVENTS.reduce(
  (a, e) => ({ count: a.count + 1, chars: a.chars + [...(e.n || "")].length }),
  { count: 0, chars: 0 }
);

// ---- 共有 ----
// ローカル開発時は公開URLを共有する(localhostのリンクを配ってしまわないように)
const SHARE_URL = (() => {
  const fallback = "https://matsuo-koya.github.io/sf-tech-lifeline/";
  if (typeof window === "undefined") return fallback;
  const { origin, pathname, hostname } = window.location;
  return /localhost|127\.0\.0\.1|^$/.test(hostname) ? fallback : origin + pathname;
})();
const HASHTAG = "#SFライフライン";

// 項目の識別子。共有URLに載るのでASCIIのみ(全角カッコや空白が入ると、
// 貼り付け先の自動リンク化で末尾が欠けてリンクが壊れる)
const eid = (e) => {
  const s = `${e.y}-${e.t}`;
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return `${e.y}-${h.toString(36)}`;
};

// ?e= の値から項目を探す。旧形式(年-タイトル)のリンクも救済する。
// 旧形式は括弧や空白を含むため、貼り付け先で末尾が欠けたり全角に変換されることがあるので、
// NFKC正規化して空白を落としたうえで前方一致も見る
const norm = (s) => s.normalize("NFKC").replace(/\s+/g, "").toLowerCase();
const findByShareParam = (raw) => {
  if (!raw) return null;
  let dec = raw;
  try { dec = decodeURIComponent(raw); } catch {}
  const key = norm(dec);
  return (
    EVENTS.find((e) => eid(e) === dec) ||
    EVENTS.find((e) => norm(`${e.y}-${e.t}`) === key) ||
    EVENTS.find((e) => key.length > 6 && norm(`${e.y}-${e.t}`).startsWith(key)) ||
    null
  );
};

// Xの文字数計算に合わせた重み(全角2・半角1)。URLは長さに関わらず23として扱われる
const weigh = (s) => [...s].reduce((n, c) => n + (/[\x00-\x7e]/.test(c) ? 1 : 2), 0);
const clipTo = (s, budget) => {
  if (weigh(s) <= budget) return s;
  let out = "", w = 0;
  for (const c of [...s]) {
    const cw = /[\x00-\x7e]/.test(c) ? 1 : 2;
    if (w + cw > budget - 2) break; // 末尾の「…」の分を残す
    out += c;
    w += cw;
  }
  return out.replace(/[、。]$/, "") + "…";
};

function ShareBar({ text, url = SHARE_URL, compact = false, color = "#37414f", note }) {
  const [copied, setCopied] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const t = encodeURIComponent(text);
  const u = encodeURIComponent(url);
  const targets = [
    ["X", `https://x.com/intent/post?text=${t}&url=${u}`],
    ["Bluesky", `https://bsky.app/intent/compose?text=${encodeURIComponent(`${text} ${url}`)}`],
    ...(compact
      ? []
      : [
          ["Facebook", `https://www.facebook.com/sharer/sharer.php?u=${u}`],
          ["LINE", `https://social-plugins.line.me/lineit/share?url=${u}&text=${t}`],
        ]),
  ];
  // 解説つきの投稿文。280(Xの上限)からURL分23と本文を引いた残りに解説を収める
  const head = text.replace(` ${HASHTAG}`, "");
  const room = 280 - 23 - weigh(head) - weigh(HASHTAG) - 5; // 改行3つ分と余裕
  const noteText = note ? `${head}\n\n${clipTo(note, Math.max(40, room))}\n${HASHTAG}` : "";
  const fullText = note ? `${head}\n\n${note}\n${HASHTAG}` : "";
  const copyTo = async (s, setter) => {
    try {
      await navigator.clipboard.writeText(s);
      setter(true);
      setTimeout(() => setter(false), 1600);
    } catch {}
  };
  const base = {
    fontSize: compact ? 11 : 11.5, fontWeight: 700, textDecoration: "none",
    borderRadius: 999, padding: compact ? "3px 10px" : "4px 12px",
    border: `1px solid ${color}44`, background: "#ffffffaa", color,
    cursor: "pointer", lineHeight: 1.6, fontFamily: "inherit",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        {note && <span style={{ fontSize: 10.5, color: "#9aa0a8", flexShrink: 0 }}>タイトルのみ</span>}
        {targets.map(([label, href]) => (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={base}>
            {label}で共有
          </a>
        ))}
        <button onClick={() => copyTo(`${text} ${url}`, setCopied)} style={base}>
          {copied ? "コピーしました" : "リンクをコピー"}
        </button>
      </div>
      {note && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 10.5, color: "#9aa0a8", flexShrink: 0 }}>解説つき</span>
          <a
            href={`https://x.com/intent/post?text=${encodeURIComponent(noteText)}&url=${u}`}
            target="_blank" rel="noopener noreferrer" style={base}
          >
            Xに投稿
          </a>
          <a
            href={`https://bsky.app/intent/compose?text=${encodeURIComponent(`${noteText}\n${url}`)}`}
            target="_blank" rel="noopener noreferrer" style={base}
          >
            Blueskyに投稿
          </a>
          <button onClick={() => copyTo(`${fullText}\n${url}`, setCopiedAll)} style={base}>
            {copiedAll ? "コピーしました" : "解説を全文コピー"}
          </button>
        </div>
      )}
    </div>
  );
}

const CAT = {
  sf: { label: "SF作品", color: "#c2452d" },
  tech: { label: "実テクノロジー", color: "#1e5fa8" },
  music: { label: "音楽・カルチャー", color: "#7a3f9d" },
  me: { label: "自分の出来事", color: "#0f8a5f" },
};

// ---- テーマの糸(年表に散らばった項目を、一本の流れとして自動再生する) ----
// threads.js の { y, m } を実際の項目に解決しておく
const THREAD_LIST = THREADS.map((th) => ({
  ...th,
  events: th.items
    .map(({ y, m }) => EVENTS.find((e) => e.y === y && e.t.includes(m)))
    .filter(Boolean),
})).filter((th) => th.events.length > 1);

const findThread = (key) => THREAD_LIST.find((t) => t.key === key) || null;

// 読み上げに使う日本語の声(環境になければ既定の声のまま)
const jpVoice = () => {
  try {
    return window.speechSynthesis.getVoices().find((v) => /ja[-_]JP/i.test(v.lang)) || null;
  } catch {
    return null;
  }
};

// 読み上げ用のテキスト。括弧の中の補足は読み飛ばす。
// 型番のハイフン(PC-8801など)は音声合成が「の」と読んでしまうので、前後が英数字なら詰めて、
// それ以外のダッシュ類は空白にして読ませない(長音符「ー」は残す)
const DASH = /[-‐‑‒–—―]/;
// 文中のダッシュ(——)は、読み上げでは一拍おく合図として扱う
export const PAUSE = "\u241f";
const deDash = (s) =>
  s
    .replace(new RegExp(`([A-Za-z0-9])${DASH.source}([A-Za-z0-9])`, "g"), "$1$2")
    .replace(new RegExp(`${DASH.source}{2,}`, "g"), PAUSE)
    .replace(new RegExp(DASH.source, "g"), " ");
// 音声合成が読み違える語は、読みを当てておく(気づいたものを足していく)
const READINGS = {
  Copilot: "コパイロット",
  "Mac OS X": "マックオーエス テン",
  VOCALOID: "ボーカロイド",
  MEIKO: "メイコ",
  KAITO: "カイト",
  VISOR: "バイザー",
  Visor: "バイザー",
  MessagePad: "メッセージパッド",
  PalmPilot: "パームパイロット",
  小穴: "コアナ",
  MIDI: "ミディ",
  原型: "ゲンケイ",
  ILM: "アイエルエム",
  自撮り: "ジドリ",
  生成物: "セイセイブツ",
  SynthID: "シンスアイディー",
};
// 単独のローマ数字(MUSIC I、Apple II、ドラゴンクエストIV など)は「アイ」ではなく数として読ませる。
// UNIXやASCIIの中のIやXを拾わないよう、前後に英字がない場合だけ置き換える(DOS/Vなどの「/」直後も除外。
// Xは単独だとJIS XやX端末と紛らわしいので、対象から外してREADINGSで個別に見る)
const ROMAN = {
  I: "ワン", II: "ツー", III: "スリー", IV: "フォー", V: "ファイブ", VI: "シックス",
  VII: "セブン", VIII: "エイト", IX: "ナイン", XI: "イレブン", XII: "トゥエルブ",
  XIII: "サーティーン", XIV: "フォーティーン", XV: "フィフティーン",
};
const ROMAN_RE = new RegExp(
  `(^|[^A-Za-z/_])(${Object.keys(ROMAN).sort((a, b) => b.length - a.length).join("|")})(?![A-Za-z])`,
  "g"
);
// 単独の略語も読みを当てる(AIは「アイ」と読まれてしまうため)。OpenAIのように語の一部なら触らない
const ABBR = { AI: "エーアイ" };
const ABBR_RE = new RegExp(`(^|[^A-Za-z])(${Object.keys(ABBR).join("|")})(?![A-Za-z])`, "g");
const applyReadings = (s) =>
  Object.entries(READINGS)
    .reduce((t, [k, v]) => t.split(k).join(v), s)
    .replace(ROMAN_RE, (_, pre, r) => pre + ROMAN[r])
    .replace(ABBR_RE, (_, pre, a) => pre + ABBR[a]);
const speakText = (ev) =>
  applyReadings(deDash(`${ev.y}年。${ev.t.replace(/[((][^))]*[))]/g, "")}。${ev.n || ""}`));

// 読み上げは文の切れ目で小分けにして順に渡す。長い文章を一度に渡すと、
// 途中で打ち切られたり読み終わりの合図が来なくなるブラウザがあるため。
// pause が立っている区切りのあとには一拍おく(本文の「——」の位置)
const SEG_MAX = 110;
const splitSentences = (t) =>
  (t.match(/[^。!?！？]*[。!?！？]?/g) || [])
    .filter(Boolean)
    .flatMap((sn) =>
      [...sn].length > SEG_MAX * 1.6
        ? sn.split("、").map((x, i, a) => (i < a.length - 1 ? x + "、" : x)).filter(Boolean)
        : sn
    );
const speakSegments = (text) => {
  const out = [];
  const chunks = text.split(PAUSE);
  chunks.forEach((chunk, ci) => {
    const t = chunk.trim();
    if (t) {
      let buf = "";
      for (const sn of splitSentences(t)) {
        if (buf && [...(buf + sn)].length > SEG_MAX) {
          out.push({ t: buf, pause: false });
          buf = sn;
        } else buf += sn;
      }
      if (buf) out.push({ t: buf, pause: false });
    }
    if (ci < chunks.length - 1 && out.length) out[out.length - 1].pause = true;
  });
  return out;
};

// 背景に流す同時代の項目の色(暗い画面で読めるよう、カテゴリー色を明るくしたもの)
const BG_COLOR = { sf: "#e08b78", tech: "#7fa8dd", music: "#b58cd6" };
const BG_ROWS = 7;

function Theater({ thread, gradeLabel, birth, cohortBirth, tts, setTts, speed, setSpeed, onClose }) {
  const evs = thread.events;
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [done, setDone] = useState(false);
  const listRef = useRef(null);

  const font =
    '"Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic Medium", "Noto Sans JP", sans-serif';
  const mono = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

  const go = (i) => {
    setDone(false);
    setIdx(Math.max(0, Math.min(evs.length - 1, i)));
  };

  // 自動送り。読み上げが有効なら読み終わりで、無効なら文字数に応じた時間で次へ
  useEffect(() => {
    if (!playing || done) return;
    const next = () => {
      if (idx + 1 < evs.length) setIdx(idx + 1);
      else {
        setDone(true);
        setPlaying(false);
      }
    };
    const text = speakText(evs[idx]);
    const synth = typeof window !== "undefined" && window.speechSynthesis;
    if (tts && synth) {
      const segs = speakSegments(text);
      const voice = jpVoice();
      let stopped = false, timer = null, watchdog = null;
      // 長い読み上げが勝手に止まるブラウザ対策(定期的に再開をつつく)
      const keepAlive = setInterval(() => {
        try { synth.resume(); } catch {}
      }, 8000);
      const speakFrom = (i) => {
        if (stopped) return;
        if (i >= segs.length) return next();
        const seg = segs[i];
        const u = new SpeechSynthesisUtterance(seg.t);
        u.lang = "ja-JP";
        u.rate = speed;
        if (voice) u.voice = voice;
        let settled = false;
        const done = () => {
          if (settled || stopped) return;
          settled = true;
          clearTimeout(watchdog);
          timer = setTimeout(() => speakFrom(i + 1), seg.pause ? 1000 / speed : 0);
        };
        u.onend = done;
        u.onerror = done;
        synth.speak(u);
        // 読み終わりの合図が来ない場合でも止まらないよう、長さから見積もって打ち切る
        watchdog = setTimeout(done, ([...seg.t].length * 260 + 5000) / speed);
      };
      synth.cancel();
      speakFrom(0);
      // 片付けでは止めた印を立ててから消す(cancelで次に進んでしまわないように)
      return () => {
        stopped = true;
        clearTimeout(timer);
        clearTimeout(watchdog);
        clearInterval(keepAlive);
        synth.cancel();
      };
    }
    const ms = Math.min(16000, 1800 + [...text.split(PAUSE).join("")].length * 70) / speed;
    const timer = setTimeout(next, ms);
    return () => clearTimeout(timer);
  }, [idx, playing, done, tts, speed, evs]);

  // 現在の項目を画面の中央へ送る(これが「自動スクロール」の見え方になる)
  useEffect(() => {
    listRef.current?.querySelector(`[data-i="${idx}"]`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [idx]);

  // 開いている間は背後の年表を動かさない
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") go(idx + 1);
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") go(idx - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, onClose]);

  const gradeOf = (ev) =>
    ev.y < birth ? "生まれる前" : gradeLabel(ev.y - birth, ev.y - cohortBirth);

  // 背景の左右に流す、同じころの別カテゴリーの項目(その糸に入っているものは除く)。
  // 何が同時に起きていた時代なのかを、読まなくても感じられるようにするための層
  const bgRows = useMemo(() => {
    const inThread = new Set(evs.map(eid));
    const year = evs[idx].y;
    let near = [];
    for (let win = 3; win <= 40 && near.length < 21; win += 3) {
      near = EVENTS.filter((e) => Math.abs(e.y - year) <= win && !inThread.has(eid(e)));
    }
    const rows = Array.from({ length: BG_ROWS }, () => []);
    near.forEach((e, i) => rows[i % BG_ROWS].push(e));
    return rows.filter((r) => r.length);
  }, [evs, idx]);

  const ctlBtn = (on = false) => ({
    fontSize: 12, fontWeight: 700, cursor: "pointer", padding: "6px 12px",
    borderRadius: 999, fontFamily: font, lineHeight: 1.2,
    border: `1px solid ${on ? "#e8b04b" : "#4a5160"}`,
    background: on ? "#e8b04b" : "transparent",
    color: on ? "#1b1f27" : "#d7dbe2",
  });

  return (
    <div
      role="dialog"
      aria-label={`テーマ再生:${thread.title}`}
      style={{
        position: "fixed", inset: 0, zIndex: 60, display: "flex", flexDirection: "column",
        background: "#12151b", color: "#eef1f5", fontFamily: font,
      }}
    >
      {/* 見出し */}
      <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #262c36", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10.5, letterSpacing: "0.2em", color: "#8a93a3" }}>テーマの糸</div>
            <div style={{ fontSize: 17, fontWeight: 800, marginTop: 3 }}>{thread.title}</div>
            <div style={{ fontSize: 11.5, color: "#9aa3b2", marginTop: 4, lineHeight: 1.6 }}>
              {thread.lead}
            </div>
          </div>
          <button onClick={onClose} aria-label="閉じる" style={{ ...ctlBtn(), padding: "6px 10px" }}>
            ✕
          </button>
        </div>
        <div style={{ marginTop: 8, height: 3, background: "#262c36", borderRadius: 2 }}>
          <div
            style={{
              width: `${((idx + 1) / evs.length) * 100}%`, height: "100%",
              background: "#e8b04b", borderRadius: 2, transition: "width 0.3s",
            }}
          />
        </div>
      </div>

      {/* 本体(現在の項目が中央に来るよう自動でスクロールする) */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <style>{`
          @keyframes lifelineDriftA { from { transform: translateX(0) } to { transform: translateX(-50%) } }
          @keyframes lifelineDriftB { from { transform: translateX(-50%) } to { transform: translateX(0) } }
        `}</style>
        {/* 同じころに起きていた別カテゴリーの出来事を、左右の背景に薄く流す */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }} aria-hidden="true">
          {bgRows.map((row, i) => (
            <div
              key={i}
              style={{
                position: "absolute", top: `${((i + 0.5) * 100) / bgRows.length}%`,
                left: 0, width: "max-content", display: "flex", gap: 46,
                whiteSpace: "nowrap", lineHeight: 1,
                animation: `lifelineDrift${i % 2 ? "B" : "A"} ${110 + i * 23}s linear infinite`,
              }}
            >
              {[...row, ...row].map((e, j) => (
                <span
                  key={j}
                  style={{
                    fontSize: 13 + ((i * 5) % 9), color: BG_COLOR[e.cat] || "#8a93a3",
                    opacity: 0.34, fontWeight: 600,
                  }}
                >
                  <span style={{ fontFamily: mono, marginRight: 8, opacity: 0.65 }}>{e.y}</span>
                  {e.t.replace(/[((].*$/, "")}
                </span>
              ))}
            </div>
          ))}
        </div>
        {/* 中央は読ませたいので、背景の層を覆い隠す */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background:
              "linear-gradient(90deg, rgba(18,21,27,0) 0%, rgba(18,21,27,0.97) 20%, rgba(18,21,27,0.97) 80%, rgba(18,21,27,0) 100%)",
          }}
        />
        <div ref={listRef} style={{ position: "absolute", inset: 0, overflowY: "auto", padding: "40vh 16px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          {evs.map((ev, i) => {
            const active = i === idx;
            const color = CAT[ev.cat].color;
            return (
              <div
                key={eid(ev)}
                data-i={i}
                onClick={() => go(i)}
                style={{
                  padding: active ? "16px 0" : "9px 0", cursor: "pointer",
                  opacity: active ? 1 : 0.32, transition: "opacity 0.35s",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span
                    style={{
                      fontFamily: mono, fontSize: active ? 15 : 13, fontWeight: 700,
                      color: "#8a93a3", width: 48, flexShrink: 0,
                    }}
                  >
                    {ev.y}
                  </span>
                  <span
                    style={{
                      flexShrink: 0, fontSize: 11, fontWeight: 800, color: "#12151b",
                      background: "#c9ced8", borderRadius: 5, padding: "2px 7px", marginTop: 1,
                    }}
                  >
                    {gradeOf(ev)}
                  </span>
                  <Icon name={ev.ic} color={color} size={active ? 20 : 16} />
                  <span
                    style={{
                      fontSize: active ? 19 : 14, fontWeight: active ? 800 : 500,
                      lineHeight: 1.5, flex: 1,
                    }}
                  >
                    {ev.t}
                  </span>
                </div>
                {active && ev.n && (
                  <div
                    style={{
                      marginTop: 10, marginLeft: 58, paddingLeft: 12,
                      borderLeft: `3px solid ${color}`,
                      fontSize: 13.5, lineHeight: 1.85, color: "#c9ced8",
                    }}
                  >
                    {ev.n}
                  </div>
                )}
              </div>
            );
          })}
          {done && (
            <div style={{ textAlign: "center", marginTop: 24, fontSize: 12.5, color: "#9aa3b2" }}>
              この糸はここまで。
              <button onClick={() => go(0)} style={{ ...ctlBtn(), marginLeft: 10 }}>
                最初から
              </button>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* 操作 */}
      <div
        style={{
          flexShrink: 0, borderTop: "1px solid #262c36", padding: "10px 16px",
          display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
          justifyContent: "center", background: "#171b22",
        }}
      >
        <button onClick={() => go(idx - 1)} style={ctlBtn()} aria-label="前へ">◀</button>
        <button
          onClick={() => {
            if (done) go(0);
            setPlaying((p) => (done ? true : !p));
          }}
          style={{ ...ctlBtn(playing), minWidth: 76 }}
        >
          {playing ? "❙❙ 一時停止" : "▶ 再生"}
        </button>
        <button onClick={() => go(idx + 1)} style={ctlBtn()} aria-label="次へ">▶</button>
        <button onClick={() => setTts(!tts)} style={ctlBtn(tts)}>
          {tts ? "🔊 読み上げ中" : "🔇 読み上げ"}
        </button>
        <button
          onClick={() => setSpeed(speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1)}
          style={ctlBtn(speed !== 1)}
        >
          {speed}倍速
        </button>
        <span style={{ fontFamily: mono, fontSize: 11.5, color: "#8a93a3" }}>
          {idx + 1} / {evs.length}
        </span>
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
            `「${thread.title}」——${thread.lead} ${HASHTAG}`
          )}&url=${encodeURIComponent(`${SHARE_URL}?t=${thread.key}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...ctlBtn(), textDecoration: "none" }}
        >
          この糸をXで共有
        </a>
      </div>
    </div>
  );
}

// ---- 保存(ブラウザのみ。使えない環境では黙ってメモリ動作) ----
const store = {
  load() {
    try { return JSON.parse(window.localStorage.getItem("sf-lifeline") || "null"); } catch { return null; }
  },
  save(data) {
    try { window.localStorage.setItem("sf-lifeline", JSON.stringify(data)); } catch {}
  },
};
const SAVED = (typeof window !== "undefined" && store.load()) || {};

export default function App() {
  const [birth, setBirth] = useState(SAVED.birth ?? 1965);
  const [month, setMonth] = useState(SAVED.month ?? 0); // 0=未設定(任意入力)
  const [ronin, setRonin] = useState(SAVED.ronin ?? 0);
  const [ryunen, setRyunen] = useState(SAVED.ryunen ?? 0);
  const [path, setPath] = useState(SAVED.path ?? "univ");
  const [adultY, setAdultY] = useState(SAVED.adultY ?? ""); // 社会人になった年度(空=進路から自動計算)
  const [myEvents, setMyEvents] = useState(SAVED.my ?? []);
  const [showSF, setShowSF] = useState(SAVED.showSF ?? true);
  const [showTech, setShowTech] = useState(SAVED.showTech ?? true);
  const [showMusic, setShowMusic] = useState(SAVED.showMusic ?? true);
  const [showMe, setShowMe] = useState(SAVED.showMe ?? true);
  // 分野フィルタ。falseが入っている分野だけを非表示にする(未知の分野は既定でオン)
  const [subOff, setSubOff] = useState(SAVED.subOff ?? {});
  // 畳んでいる期間(帯)のキー
  const [closedStages, setClosedStages] = useState(() => new Set(SAVED.closed ?? []));
  // 生年や進路の入力欄。一度入れたら畳んでおける(初回訪問時だけ開いた状態)
  const [setupOpen, setSetupOpen] = useState(SAVED.setupOpen ?? !SAVED.birth);
  const [open, setOpen] = useState(() => new Set());
  const [newY, setNewY] = useState("");
  const [newT, setNewT] = useState("");
  // 再生中のテーマ(nullなら年表を表示)と、読み上げのオン・オフ
  const [thread, setThread] = useState(null);
  const [tts, setTts] = useState(SAVED.tts ?? false);
  // 再生速度はテーマをまたいでも覚えておく
  const [speed, setSpeed] = useState(SAVED.speed ?? 1);

  useEffect(() => {
    store.save({ birth, month, ronin, ryunen, path, adultY, my: myEvents, showSF, showTech, showMusic, showMe, subOff, closed: [...closedStages], setupOpen, tts, speed });
  }, [birth, month, ronin, ryunen, path, adultY, myEvents, showSF, showTech, showMusic, showMe, subOff, closedStages, setupOpen, tts, speed]);

  const toggleStage = (key) =>
    setClosedStages((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const subOn = (k) => subOff[k] !== true;
  const toggleSub = (k) => setSubOff((prev) => ({ ...prev, [k]: !prev[k] }));
  const setAllSubs = (on) =>
    setSubOff(on ? {} : Object.fromEntries(Object.keys(SUBS).map((k) => [k, true])));

  const addMy = () => {
    const y = Number(newY);
    if (!newT.trim() || !Number.isInteger(y) || y < 1900 || y > 2100) return;
    setMyEvents((prev) => [...prev, { y, t: newT.trim() }]);
    setNewY(""); setNewT("");
  };
  const removeMy = (idx) => setMyEvents((prev) => prev.filter((_, i) => i !== idx));

  const toggle = (id) => {
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ?e=<項目ID> で共有されたリンクは、その項目を開いた状態で表示する
  // ?t=<テーマのキー> ならそのテーマの再生を開いた状態で始める
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const th = findThread(q.get("t"));
    if (th) setThread(th);
    const ev = findByShareParam(q.get("e"));
    if (!ev) return;
    const id = eid(ev);
    setOpen((prev) => new Set(prev).add(id));
    setClosedStages(new Set()); // 共有リンクで来たときは帯を畳んだままにしない
    const timer = setTimeout(() => {
      document.getElementById(`ev-${id}`)?.scrollIntoView({ block: "center" });
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const grouped = useMemo(() => {
    const cohortBirth = month >= 1 && month <= 3 ? birth - 1 : birth; // 未設定(0)は4〜12月生まれと同じ扱い
    const ay = Number(adultY);
    const adultSage =
      Number.isInteger(ay) && ay >= 1930 && ay <= 2100 ? Math.max(15, ay - cohortBirth) : null;
    const stages = buildStages(ronin, ryunen, path, adultSage);
    const gradeLabel = makeGradeLabel(ronin, ryunen, path, adultSage);
    const stageOf = (age, sage) =>
      age < 0 ? stages[0] : stages.slice(1).find((s) => sage >= s.from && sage <= s.to);
    const RANK = { me: 0, sf: 1, music: 2, tech: 3 };
    const catOn = { sf: showSF, tech: showTech, music: showMusic };
    const list = [
      // SF作品はカテゴリー単位、テクノロジーと音楽はさらに分野単位で絞り込む
      ...EVENTS.filter((e) => catOn[e.cat] && (e.cat === "sf" || subOff[subOf(e)] !== true)),
      ...(showMe ? myEvents.map((m, i) => ({ y: m.y, t: m.t, cat: "me", ic: "flag", _idx: i })) : []),
    ]
      .map((e) => ({ ...e, age: e.y - birth, sage: e.y - cohortBirth }))
      .sort((a, b) => a.y - b.y || RANK[a.cat] - RANK[b.cat]);
    const groups = [];
    for (const ev of list) {
      const st = stageOf(ev.age, ev.sage);
      const era = SPLIT_STAGES.has(st.key) ? eraOf(ev.y) : null;
      const key = era ? `${st.key}:${era.key}` : st.key;
      const last = groups[groups.length - 1];
      if (last && last.key === key) last.items.push(ev);
      else groups.push({ key, stage: st, era, items: [ev] });
    }
    // 学齢期の帯は分割しないが、またいでいる時代の名前は見出しに併記する
    for (const g of groups) {
      if (g.era) continue;
      const names = [...new Set(g.items.map((e) => eraOf(e.y).label))];
      g.eraSpan = names.join(" → ");
    }
    return { groups, gradeLabel, cohortBirth, shown: list.filter((e) => e.cat !== "me").length };
  }, [birth, month, ronin, ryunen, path, adultY, myEvents, showSF, showTech, showMusic, showMe, subOff]);

  const font =
    '"Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic Medium", "Noto Sans JP", sans-serif';
  const mono = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

  return (
    <div style={{ minHeight: "100vh", background: "#fafaf8", fontFamily: font, color: "#22272e" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 16px 64px" }}>
        {/* ヘッダー */}
        <header style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.25em", color: "#8a8f98", marginBottom: 6 }}>
            SF × テクノロジー 自分史年表
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, lineHeight: 1.35 }}>
            あのSFに、何年生で出会ったか
          </h1>
          <div style={{ fontSize: 11.5, color: "#8a8f98", marginTop: 8, fontFamily: mono }}>
            全{STATS.count}項目・解説{STATS.chars.toLocaleString()}字
            {grouped.shown !== STATS.count && `(表示中 ${grouped.shown}項目)`}
          </div>
          {RECENT && (
            <div
              style={{
                marginTop: 8, fontSize: 11.5, lineHeight: 1.7, color: "#6b7280",
                background: "#fdf3e0", border: "1px solid #efe0c0",
                borderRadius: 8, padding: "7px 12px",
              }}
            >
              <span style={{ fontWeight: 700, color: "#8a5a12" }}>
                最近の追加({RECENT.date}・{RECENT.items.length}項目)
              </span>{" "}
              {RECENT.picks.map((e, i) => (
                <span key={eid(e)}>
                  {i > 0 && " / "}
                  <a
                    href={`?e=${eid(e)}`}
                    style={{ color: "#6b7280", textDecoration: "none", borderBottom: "1px dotted #b0771e" }}
                  >
                    {e.y} {e.t.replace(/[((].*$/, "")}
                  </a>
                </span>
              ))}
              {RECENT.items.length > RECENT.picks.length &&
                ` ほか${RECENT.items.length - RECENT.picks.length}件`}
            </div>
          )}
          {FEATURES.length > 0 && (
            <div
              style={{
                marginTop: 6, fontSize: 11.5, lineHeight: 1.7, color: "#6b7280",
                background: "#eef1f5", border: "1px solid #dde2e8",
                borderRadius: 8, padding: "7px 12px",
              }}
            >
              <span style={{ fontWeight: 700, color: "#37414f" }}>最近の新機能</span>{" "}
              {FEATURES.slice(0, 2).map((f, i) => (
                <span key={i}>
                  {i > 0 && " / "}
                  <span style={{ fontFamily: mono, fontSize: 10.5 }}>{f.d}</span> {f.t}
                </span>
              ))}
            </div>
          )}
          <div style={{ marginTop: 10 }}>
            <ShareBar
              text={`あのSFに、何年生で出会ったか——SF・コンピューター技術ライフライン(${EVENTS.length}項目) ${HASHTAG}`}
            />
          </div>
        </header>

        {/* テーマの糸(年表を横断して、関連する項目が順に流れていく自動再生) */}
        <div
          style={{
            background: "#171b22", border: "1px solid #262c36", borderRadius: 12,
            padding: "12px 16px", marginBottom: 14, color: "#eef1f5",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>テーマの糸をたどる</span>
            <span style={{ fontSize: 11, color: "#9aa3b2" }}>
              関連する項目が自動で流れます(読み上げつき・{THREAD_LIST.length}本)
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 9 }}>
            {THREAD_LIST.map((th) => (
              <button
                key={th.key}
                onClick={() => setThread(th)}
                style={{
                  fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: font,
                  padding: "5px 12px", borderRadius: 999,
                  border: "1px solid #3d4553", background: "#212734", color: "#e8b04b",
                }}
              >
                ▶ {th.title}
                <span style={{ color: "#8a93a3", fontFamily: mono, fontSize: 10.5, marginLeft: 6 }}>
                  {th.events.length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 入力欄(畳めるようにしている) */}
        <button
          onClick={() => setSetupOpen((v) => !v)}
          aria-expanded={setupOpen}
          style={{
            display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", width: "100%",
            background: "#fff", border: "1px solid #e2e4e8", borderRadius: 12,
            padding: "10px 16px", marginBottom: setupOpen ? 14 : 14,
            cursor: "pointer", textAlign: "left", fontFamily: font, color: "#22272e",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700 }}>あなたの設定</span>
          <span style={{ fontFamily: mono, fontSize: 12, color: "#6b7280" }}>
            {birth}年{month ? `${month}月` : ""}生まれ・{PATHS[path].label}
            {ronin ? `・浪人${ronin}年` : ""}
            {ryunen ? `・留年${ryunen}年` : ""}
            {adultY ? `・社会人${adultY}年〜` : ""}
            {myEvents.length ? `・自分の出来事${myEvents.length}件` : ""}
          </span>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: "#8a8f98" }}>{setupOpen ? "畳む ▼" : "変更する ▶"}</span>
        </button>

        {setupOpen && (<>
        {/* 生年入力 */}
        <div
          style={{
            display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
            background: "#fff", border: "1px solid #e2e4e8", borderRadius: 12,
            padding: "14px 16px", marginBottom: 14,
          }}
        >
          <label style={{ fontSize: 13, fontWeight: 700 }}>生まれた年</label>
          <button onClick={() => setBirth((b) => Math.max(1930, b - 1))} style={btnStyle} aria-label="1年戻す">−</button>
          <span style={{ fontFamily: mono, fontSize: 26, fontWeight: 700, minWidth: 76, textAlign: "center" }}>
            {birth}
          </span>
          <button onClick={() => setBirth((b) => Math.min(2010, b + 1))} style={btnStyle} aria-label="1年進める">＋</button>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            style={{
              fontFamily: font, fontSize: 14, fontWeight: 700, cursor: "pointer",
              padding: "7px 8px", borderRadius: 8, border: "1px solid #d5d8dd",
              background: "#fff", color: "#22272e",
            }}
            aria-label="生まれた月"
          >
            <option value={0}>月(任意)</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{m}月</option>
            ))}
          </select>
          <input
            type="range" min={1930} max={2010} value={birth}
            onChange={(e) => setBirth(Number(e.target.value))}
            style={{ flex: 1, minWidth: 140, accentColor: "#c2452d" }}
            aria-label="生まれた年スライダー"
          />
        </div>

        {/* 進路・浪人・留年 */}
        <div
          style={{
            display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap",
            background: "#fff", border: "1px solid #e2e4e8", borderRadius: 12,
            padding: "12px 16px", marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 700 }}>進路</label>
            <select
              value={path}
              onChange={(e) => setPath(e.target.value)}
              style={{
                fontFamily: font, fontSize: 13, fontWeight: 700, cursor: "pointer",
                padding: "7px 10px", borderRadius: 8, border: "1px solid #d5d8dd",
                background: "#fff", color: "#22272e",
              }}
              aria-label="卒業後の進路"
            >
              {Object.entries(PATHS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          {path !== "hs_job" &&
            [
              ["浪人", ronin, setRonin],
              ["留年", ryunen, setRyunen],
            ]
              // 高専は中学卒業後にそのまま入学するため浪人の欄は出さない
              .filter(([label]) => !(PATHS[path].kosen && label === "浪人"))
              .map(([label, val, set]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 700 }}>{label}</label>
                  <button onClick={() => set(Math.max(0, val - 1))} style={btnStyle} aria-label={`${label}を1年減らす`}>−</button>
                  <span style={{ fontFamily: mono, fontSize: 18, fontWeight: 700, minWidth: 40, textAlign: "center" }}>
                    {val}年
                  </span>
                  <button onClick={() => set(Math.min(5, val + 1))} style={btnStyle} aria-label={`${label}を1年増やす`}>＋</button>
                </div>
              ))}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <label style={{ fontSize: 13, fontWeight: 700 }}>社会人になった年度</label>
            <input
              type="number" inputMode="numeric" placeholder="自動"
              value={adultY}
              onChange={(e) => setAdultY(e.target.value)}
              style={{
                fontFamily: mono, fontSize: 14, width: 84, padding: "7px 8px",
                borderRadius: 8, border: "1px solid #d5d8dd",
              }}
              aria-label="社会人になった年度(西暦)"
            />
            {adultY !== "" && (
              <button
                onClick={() => setAdultY("")}
                style={{
                  fontFamily: font, fontSize: 12, fontWeight: 700, cursor: "pointer",
                  padding: "6px 12px", borderRadius: 999,
                  border: "1px solid #d5d8dd", background: "#fff", color: "#6b7280",
                }}
              >
                自動に戻す
              </button>
            )}
          </div>
          <div style={{ fontSize: 11, color: "#8a8f98", width: "100%", marginTop: -6 }}>
            上の進路に当てはまらない場合(中退・編入・専攻科・留学・転職前の空白期間など)は、就職した年度を直接指定すると、そこから先が「社会人」になります。
          </div>
        </div>

        {/* 自分の出来事 */}
        <div
          style={{
            background: "#fff", border: "1px solid #e2e4e8", borderRadius: 12,
            padding: "12px 16px", marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: CAT.me.color }}>自分の出来事</label>
            <input
              type="number" inputMode="numeric" placeholder="西暦"
              value={newY} onChange={(e) => setNewY(e.target.value)}
              onKeyDown={onEnter(addMy)}
              style={{
                fontFamily: mono, fontSize: 14, width: 74, padding: "7px 8px",
                borderRadius: 8, border: "1px solid #d5d8dd",
              }}
              aria-label="出来事の年"
            />
            <input
              type="text" placeholder="初めてのコンピューター、結婚、長女誕生など"
              value={newT} onChange={(e) => setNewT(e.target.value)}
              onKeyDown={onEnter(addMy)}
              style={{
                fontFamily: font, fontSize: 14, flex: 1, minWidth: 180, padding: "7px 10px",
                borderRadius: 8, border: "1px solid #d5d8dd",
              }}
              aria-label="出来事のタイトル"
            />
            <button
              onClick={addMy}
              style={{
                fontFamily: font, fontSize: 13, fontWeight: 700, cursor: "pointer",
                padding: "7px 16px", borderRadius: 999, border: "none",
                background: CAT.me.color, color: "#fff",
              }}
            >
              追加
            </button>
          </div>
          <div style={{ fontSize: 11, color: "#8a8f98", marginTop: 6 }}>
            年表に緑の旗で挿入されます。データはこのブラウザ内にのみ保存されます。
          </div>
        </div>

        </>)}

        {/* 興味のある分野 */}
        <div
          style={{
            background: "#fff", border: "1px solid #e2e4e8", borderRadius: 12,
            padding: "12px 16px", marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>興味のある分野</span>
            <span style={{ fontSize: 11, color: "#8a8f98" }}>チェックを外した分野は年表から消えます</span>
            <span style={{ flex: 1 }} />
            <button onClick={() => setAllSubs(true)} style={miniBtn}>全部オン</button>
            <button onClick={() => setAllSubs(false)} style={miniBtn}>全部オフ</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {Object.entries(SUBS).map(([k, v]) => {
              const on = subOn(k);
              const c = CAT[v.c].color;
              return (
                <label
                  key={k}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 5, cursor: "pointer",
                    fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 999,
                    border: `1.5px solid ${on ? c : "#d5d8dd"}`,
                    background: on ? `${c}12` : "transparent",
                    color: on ? c : "#a0a4ab",
                  }}
                >
                  <input
                    type="checkbox" checked={on} onChange={() => toggleSub(k)}
                    style={{ accentColor: c, margin: 0, cursor: "pointer" }}
                  />
                  {v.label}
                </label>
              );
            })}
          </div>
        </div>

        {/* フィルタ・全開閉 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
          {[
            ["sf", showSF, setShowSF],
            ["tech", showTech, setShowTech],
            ["music", showMusic, setShowMusic],
            ["me", showMe, setShowMe],
          ].map(([k, on, set]) => (
            <button
              key={k}
              onClick={() => set(!on)}
              style={{
                fontFamily: font, fontSize: 12, fontWeight: 700, cursor: "pointer",
                padding: "6px 14px", borderRadius: 999,
                border: `1.5px solid ${CAT[k].color}`,
                background: on ? CAT[k].color : "transparent",
                color: on ? "#fff" : CAT[k].color,
                opacity: on ? 1 : 0.55,
              }}
            >
              {CAT[k].label}
            </button>
          ))}
          <span style={{ flex: 1 }} />
          <button
            onClick={() =>
              setClosedStages((prev) =>
                prev.size ? new Set() : new Set(grouped.groups.map((g) => g.key))
              )
            }
            style={{
              fontFamily: font, fontSize: 12, fontWeight: 700, cursor: "pointer",
              padding: "6px 14px", borderRadius: 999,
              border: "1.5px solid #7a6a55", background: "transparent", color: "#7a6a55",
            }}
          >
            {closedStages.size ? "期間を開く" : "期間を畳む"}
          </button>
          <button
            onClick={() => setOpen(new Set(EVENTS.map(eid)))}
            style={{
              fontFamily: font, fontSize: 12, fontWeight: 700, cursor: "pointer",
              padding: "6px 14px", borderRadius: 999,
              border: "1.5px solid #37414f", background: "transparent", color: "#37414f",
            }}
          >
            解説を開く
          </button>
          <button
            onClick={() => setOpen(new Set())}
            style={{
              fontFamily: font, fontSize: 12, fontWeight: 700, cursor: "pointer",
              padding: "6px 14px", borderRadius: 999,
              border: "1.5px solid #b0b4bb", background: "transparent", color: "#8a8f98",
            }}
          >
            解説を畳む
          </button>
        </div>

        {/* 学齢期グループ */}
        {grouped.groups.map((g, gi) => {
        const stageClosed = closedStages.has(g.key);
        return (
          <section key={gi} style={{ marginBottom: 22 }}>
            <button
              onClick={() => toggleStage(g.key)}
              aria-expanded={!stageClosed}
              style={{
                display: "flex", alignItems: "baseline", gap: 10, width: "100%",
                borderLeft: `6px solid ${g.stage.color}`, border: "none",
                borderLeftWidth: 6, borderLeftStyle: "solid", borderLeftColor: g.stage.color,
                background: g.stage.bg, borderRadius: 8,
                padding: "8px 14px", marginBottom: 8,
                cursor: "pointer", textAlign: "left", fontFamily: font,
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: g.stage.color }}>
                {g.stage.label}
                {(g.era || g.eraSpan) && (
                  <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.75 }}>
                    {" / "}{g.era ? g.era.label : g.eraSpan}
                  </span>
                )}
              </h2>
              <span style={{ fontFamily: mono, fontSize: 12, color: "#6b7280" }}>
                {g.items[0].y}–{g.items[g.items.length - 1].y}
              </span>
              <span style={{ flex: 1 }} />
              <span style={{ fontFamily: mono, fontSize: 11.5, color: "#8a8f98" }}>
                {g.items.length}件
              </span>
              <span style={{ fontSize: 11, color: g.stage.color }} aria-hidden="true">
                {stageClosed ? "▶" : "▼"}
              </span>
            </button>
            {!stageClosed && (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {g.items.map((ev, i) => {
                if (ev.cat === "me") {
                  return (
                    <li key={`me-${ev._idx}`} style={{ borderBottom: "1px solid #ececea", background: "#f2faf6" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 4px" }}>
                        <span style={{ fontFamily: mono, fontSize: 13, color: "#8a8f98", width: 44, flexShrink: 0, paddingTop: 3 }}>
                          {ev.y}
                        </span>
                        <span
                          style={{
                            flexShrink: 0, minWidth: 44, textAlign: "center",
                            fontSize: 13, fontWeight: 800, color: "#fff",
                            background: g.stage.color, borderRadius: 6, padding: "3px 8px",
                          }}
                        >
                          {grouped.gradeLabel(ev.age, ev.sage)}
                        </span>
                        <Icon name="flag" color={CAT.me.color} />
                        <span style={{ fontSize: 14, lineHeight: 1.55, flex: 1, fontWeight: 700, color: CAT.me.color }}>
                          {ev.t}
                        </span>
                        <button
                          onClick={() => removeMy(ev._idx)}
                          aria-label="この出来事を削除"
                          style={{
                            border: "none", background: "none", color: "#b0b4bb",
                            cursor: "pointer", fontSize: 15, paddingTop: 2, lineHeight: 1,
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </li>
                  );
                }
                const id = eid(ev);
                const isOpen = open.has(id);
                const grade = grouped.gradeLabel(ev.age, ev.sage);
                const shareText =
                  (ev.age < 0
                    ? `${ev.y}年(生まれる前)`
                    : `${ev.y}年・${grade}のとき`) + `:${ev.t} ${HASHTAG}`;
                return (
                  <li key={i} id={`ev-${id}`} style={{ borderBottom: "1px solid #ececea" }}>
                    <button
                      onClick={() => toggle(id)}
                      aria-expanded={isOpen}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: 10,
                        padding: "8px 4px", width: "100%", textAlign: "left",
                        background: "none", border: "none", cursor: "pointer",
                        fontFamily: font, color: "#22272e",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: mono, fontSize: 13, color: "#8a8f98",
                          width: 44, flexShrink: 0, paddingTop: 3,
                        }}
                      >
                        {ev.y}
                      </span>
                      <span
                        style={{
                          flexShrink: 0, minWidth: 44, textAlign: "center",
                          fontSize: 13, fontWeight: 800, color: "#fff",
                          background: g.stage.color, borderRadius: 6,
                          padding: "3px 8px",
                        }}
                      >
                        {grade}
                      </span>
                      <Icon name={ev.ic} color={CAT[ev.cat].color} />
                      <span style={{ fontSize: 14, lineHeight: 1.55, flex: 1 }}>{ev.t}</span>
                      {ev.cat !== "sf" && SUBS[subOf(ev)] && (
                        <span
                          style={{
                            fontSize: 10, color: "#9aa0a8", flexShrink: 0,
                            paddingTop: 5, whiteSpace: "nowrap",
                          }}
                        >
                          {SUBS[subOf(ev)].label}
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: 11, color: "#b0b4bb", paddingTop: 4, flexShrink: 0,
                          transform: isOpen ? "rotate(90deg)" : "none",
                          transition: "transform 0.15s",
                        }}
                        aria-hidden="true"
                      >
                        ▶
                      </span>
                    </button>
                    {isOpen && ev.n && (
                      <div
                        style={{
                          margin: "0 4px 10px 108px",
                          padding: "10px 14px",
                          fontSize: 13, lineHeight: 1.75, color: "#3d4450",
                          background: g.stage.bg,
                          borderLeft: `3px solid ${CAT[ev.cat].color}`,
                          borderRadius: "0 8px 8px 0",
                        }}
                      >
                        {ev.n}
                        {ev.q && (
                          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                            <a
                              href={`https://www.amazon.co.jp/s?k=${encodeURIComponent(ev.q)}`}
                              target="_blank" rel="noopener noreferrer"
                              style={{
                                fontSize: 11.5, fontWeight: 700, color: "#fff",
                                textDecoration: "none", borderRadius: 999,
                                padding: "3px 12px", background: "#b0771e",
                              }}
                            >
                              Amazonで探す
                            </a>
                            <a
                              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ev.q)}`}
                              target="_blank" rel="noopener noreferrer"
                              style={{
                                fontSize: 11.5, fontWeight: 700, color: "#fff",
                                textDecoration: "none", borderRadius: 999,
                                padding: "3px 12px", background: "#c2452d",
                              }}
                            >
                              YouTubeで探す
                            </a>
                          </div>
                        )}
                        {ev.l && (
                          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {ev.l.map((t) => {
                              // "https://…|表示名" は外部リンク、それ以外はWikipedia記事名(en:で英語版)
                              // 記事名と表示名が違う場合は "記事名|表示名" と書ける
                              const [rawTarget, rawLabel] = t.split("|");
                              const ext = rawTarget.startsWith("http");
                              const en = rawTarget.startsWith("en:");
                              const article = en ? rawTarget.slice(3) : rawTarget;
                              const title = rawLabel || (ext ? rawTarget : article);
                              const url = ext
                                ? rawTarget
                                : (en
                                    ? "https://en.wikipedia.org/wiki/"
                                    : "https://ja.wikipedia.org/wiki/") +
                                  encodeURIComponent(article.replace(/ /g, "_"));
                              return (
                                <a
                                  key={t}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    fontSize: 11.5, fontWeight: 700,
                                    color: CAT[ev.cat].color, textDecoration: "none",
                                    border: `1px solid ${CAT[ev.cat].color}44`,
                                    borderRadius: 999, padding: "2px 10px",
                                    background: "#ffffffaa",
                                  }}
                                >
                                  {ext ? "▶ " : "W: "}{title}{en ? " (en)" : ""}
                                </a>
                              );
                            })}
                          </div>
                        )}
                        <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px dashed #d5d8dd" }}>
                          <ShareBar
                            compact
                            color={CAT[ev.cat].color}
                            text={shareText}
                            note={ev.n}
                            url={`${SHARE_URL}?e=${encodeURIComponent(id)}`}
                          />
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            )}
          </section>
        );
        })}

        <div
          style={{
            display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
            background: "#fff", border: "1px solid #e2e4e8", borderRadius: 12,
            padding: "12px 16px", marginTop: 8,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700 }}>この年表を共有</span>
          <a
            href="https://www.techno-edge.net/article/2026/08/05/5365.html"
            target="_blank" rel="noopener noreferrer"
            style={{
              fontSize: 11.5, fontWeight: 700, textDecoration: "none",
              borderRadius: 999, padding: "4px 12px",
              border: "1px solid #b0771e", background: "#b0771e", color: "#fff",
            }}
          >
            この年表の解説記事(CloseBox)
          </a>
          <a
            href="https://www.techno-edge.net/article/2026/08/04/5360.html"
            target="_blank" rel="noopener noreferrer"
            style={{
              fontSize: 11.5, fontWeight: 700, textDecoration: "none",
              borderRadius: 999, padding: "4px 12px",
              border: "1px solid #b0771e44", background: "#fdf3e0", color: "#8a5a12",
            }}
          >
            公開時の記事
          </a>
          <a
            href="https://www.techno-edge.net/special/388/recent/CloseBox"
            target="_blank" rel="noopener noreferrer"
            style={{
              fontSize: 11.5, fontWeight: 700, textDecoration: "none",
              borderRadius: 999, padding: "4px 12px",
              border: "1px solid #b0771e44", background: "#fdf3e0", color: "#8a5a12",
            }}
          >
            連載「CloseBox」を読む
          </a>
          <ShareBar
            text={`あのSFに、何年生で出会ったか——SF・コンピューター技術ライフライン(${EVENTS.length}項目) ${HASHTAG}`}
          />
        </div>

        <footer style={{ fontSize: 11, color: "#8a8f98", marginTop: 28, lineHeight: 1.8 }}>
          学齢は誕生年(月は任意入力)からの学年計算。月を入れると1〜3月の早生まれが1つ上の学年として扱われます(未設定時は4〜12月生まれ相当の概算。日単位の区切りは考慮せず)。各年の出来事は、その年の4月に始まる学年に割り当てています。進路・浪人・留年を設定すると、それ以降の帯がその分だけ変わります。高専は中学卒業後の5年間を一続きの帯として扱います。「社会人になった年度」を入れた場合は進路の計算より優先され、その年度から社会人、卒業から就職までに間があればその期間を「社会人になる前」として表示します。「自分の出来事」はこの端末のブラウザ内にのみ保存され、どこにも送信されません。
          アイコン色:赤=SF作品、青=実テクノロジー、紫=音楽・カルチャー。実テクノロジーと音楽は「興味のある分野」でさらに絞り込めます(各行の右端が分野名)。アイコンは全てオリジナルのラインアイコン。各行をタップすると、現代技術とのつながりを解説する蘊蓄コラムが開きます。各行をタップすると解説が開きます(見出しの帯をタップすると、その期間ごと畳めます)。コラム末尾の「W:」はWikipediaの関連項目、「▶」は外部の解説記事(CPU関連は大原雄介氏のASCII.jp連載)へのリンク、「Amazonで探す/YouTubeで探す」は作品の検索結果へのリンクです(在庫・配信状況は検索先でご確認ください)。
          作品年は原則として発表・放映開始年(日本導入年が別にある場合は両方掲載)。
          「テーマの糸」は、年表に散らばった項目をひとつの流れとして順に自動再生する読み物モードです。項目は年代順に送られ、解説はブラウザの音声合成で読み上げられます(読み上げボタンで切り替え。速度も変えられます。スペースキーで一時停止、矢印キーで前後、Escで終了)。読み上げの声は端末に入っている日本語音声を使うため、環境によって聞こえ方が変わります。糸ごとの共有リンク(?t=)も発行されます。左右の背景に薄く流れているのは、その項目と同じころに起きていた別ジャンルの出来事です。
          <div style={{ marginTop: 10 }}>
            このアプリは、テクノエッジの連載{" "}
            <a
              href="https://www.techno-edge.net/special/388/recent/CloseBox"
              target="_blank" rel="noopener noreferrer"
              style={{ color: "#b0771e", fontWeight: 700 }}
            >
              CloseBox
            </a>
            (松尾公也)のために、Claudeとの対話(vibe coding)で制作しました。制作の経緯や項目の背景は{" "}
            <a
              href="https://www.techno-edge.net/article/2026/08/04/5360.html"
              target="_blank" rel="noopener noreferrer"
              style={{ color: "#b0771e", fontWeight: 700 }}
            >
              公開時の記事(8月4日)
            </a>
            と{" "}
            <a
              href="https://www.techno-edge.net/article/2026/08/05/5365.html"
              target="_blank" rel="noopener noreferrer"
              style={{ color: "#b0771e", fontWeight: 700 }}
            >
              3倍に育てた話(8月5日)
            </a>
            をご覧ください。ソースは{" "}
            <a
              href="https://github.com/matsuo-koya/sf-tech-lifeline"
              target="_blank" rel="noopener noreferrer"
              style={{ color: "#b0771e", fontWeight: 700 }}
            >
              GitHub
            </a>
            で公開しています。
          </div>
        </footer>
      </div>

      {thread && (
        <Theater
          thread={thread}
          gradeLabel={grouped.gradeLabel}
          birth={birth}
          cohortBirth={grouped.cohortBirth}
          tts={tts}
          setTts={setTts}
          speed={speed}
          setSpeed={setSpeed}
          onClose={() => setThread(null)}
        />
      )}
    </div>
  );
}

const btnStyle = {
  width: 34, height: 34, borderRadius: 8, border: "1px solid #d5d8dd",
  background: "#fff", fontSize: 18, fontWeight: 700, cursor: "pointer",
  color: "#22272e", lineHeight: 1,
};

// 日本語入力の変換確定のEnterで実行してしまわないようにする
// (変換中はisComposingがtrue。古いSafari等のためkeyCode 229も見る)
const onEnter = (fn) => (e) => {
  if (e.key !== "Enter" || e.nativeEvent?.isComposing || e.keyCode === 229) return;
  fn();
};

const miniBtn = {
  fontSize: 11, fontWeight: 700, cursor: "pointer", padding: "4px 10px",
  borderRadius: 999, border: "1px solid #d5d8dd", background: "#fff", color: "#6b7280",
};
