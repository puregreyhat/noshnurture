"use client";

import React, { useEffect, useRef, useState } from "react";

/* ─── tiny colour palette ─── */
const C = {
  emerald: "#34d399",
  cyan: "#22d3ee",
  orange: "#fb923c",
  violet: "#a78bfa",
  pink: "#f472b6",
  bg: "#050505",
  card: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.07)",
};

/* ─── 1. BAR CHART — Inventory by Category ─── */
function BarChart() {
  const data = [
    { label: "Dairy", value: 28, color: C.cyan },
    { label: "Veggies", value: 45, color: C.emerald },
    { label: "Fruits", value: 33, color: C.orange },
    { label: "Grains", value: 20, color: C.violet },
    { label: "Proteins", value: 38, color: C.pink },
    { label: "Spices", value: 55, color: C.emerald },
  ];
  const max = Math.max(...data.map((d) => d.value));
  const W = 560, H = 220, pad = 40;
  const barW = (W - pad * 2) / data.length;

  return (
    <ChartCard title="📦 Inventory by Category" subtitle="Current stock counts per food group">
      <svg viewBox={`0 0 ${W} ${H + 40}`} className="w-full">
        {/* grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = pad + (1 - t) * H;
          return (
            <g key={t}>
              <line x1={pad} y1={y} x2={W - pad} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <text x={pad - 6} y={y + 4} fill="rgba(255,255,255,0.3)" fontSize="10" textAnchor="end">
                {Math.round(t * max)}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const bh = (d.value / max) * H;
          const x = pad + i * barW + barW * 0.15;
          const w = barW * 0.7;
          const y = pad + H - bh;
          return (
            <g key={i}>
              <rect x={x} y={y} width={w} height={bh} rx="6" fill={d.color} opacity="0.85">
                <animate attributeName="height" from="0" to={bh} dur="0.8s" begin={`${i * 0.1}s`} fill="freeze" />
                <animate attributeName="y" from={pad + H} to={y} dur="0.8s" begin={`${i * 0.1}s`} fill="freeze" />
              </rect>
              <text x={x + w / 2} y={H + pad + 16} fill="rgba(255,255,255,0.5)" fontSize="10" textAnchor="middle">
                {d.label}
              </text>
              <text x={x + w / 2} y={y - 6} fill={d.color} fontSize="11" textAnchor="middle" fontWeight="bold">
                {d.value}
              </text>
            </g>
          );
        })}
      </svg>
    </ChartCard>
  );
}

/* ─── 2. LINE CHART — Items Expiring (next 7 days) ─── */
function LineChart() {
  const data = [4, 7, 3, 12, 5, 9, 2];
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const W = 560, H = 200, pad = 40;
  const max = Math.max(...data);
  const pts = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (W - pad * 2),
    y: pad + (1 - v / max) * H,
  }));
  const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${pts[0].x},${pad + H} ` + polyline + ` ${pts[pts.length - 1].x},${pad + H}`;

  return (
    <ChartCard title="⏰ Expiry Timeline" subtitle="Items expiring in the next 7 days">
      <svg viewBox={`0 0 ${W} ${H + 50}`} className="w-full">
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.orange} stopOpacity="0.4" />
            <stop offset="100%" stopColor={C.orange} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((t) => {
          const y = pad + (1 - t) * H;
          return <line key={t} x1={pad} y1={y} x2={W - pad} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />;
        })}
        <polygon points={area} fill="url(#lineGrad)" />
        <polyline points={polyline} fill="none" stroke={C.orange} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill={C.orange} />
            <text x={p.x} y={pad + H + 18} fill="rgba(255,255,255,0.4)" fontSize="10" textAnchor="middle">{labels[i]}</text>
            <text x={p.x} y={p.y - 10} fill={C.orange} fontSize="11" textAnchor="middle" fontWeight="bold">{data[i]}</text>
          </g>
        ))}
      </svg>
    </ChartCard>
  );
}

/* ─── 3. DONUT CHART — Food Status Breakdown ─── */
function DonutChart() {
  const slices = [
    { label: "Fresh", value: 55, color: C.emerald },
    { label: "Expiring Soon", value: 25, color: C.orange },
    { label: "Expired", value: 12, color: "#ef4444" },
    { label: "Consumed", value: 8, color: C.violet },
  ];
  const total = slices.reduce((a, b) => a + b.value, 0);
  const cx = 130, cy = 130, R = 90, r = 52;
  let angle = -Math.PI / 2;

  const paths = slices.map((s) => {
    const sweep = (s.value / total) * 2 * Math.PI;
    const x1 = cx + R * Math.cos(angle);
    const y1 = cy + R * Math.sin(angle);
    const x2 = cx + R * Math.cos(angle + sweep);
    const y2 = cy + R * Math.sin(angle + sweep);
    const xi1 = cx + r * Math.cos(angle);
    const yi1 = cy + r * Math.sin(angle);
    const xi2 = cx + r * Math.cos(angle + sweep);
    const yi2 = cy + r * Math.sin(angle + sweep);
    const large = sweep > Math.PI ? 1 : 0;
    const d = `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${r} ${r} 0 ${large} 0 ${xi1} ${yi1} Z`;
    angle += sweep;
    return { ...s, d };
  });

  return (
    <ChartCard title="🥗 Food Status Breakdown" subtitle="Distribution of inventory health states">
      <div className="flex items-center gap-6">
        <svg viewBox="0 0 260 260" style={{ width: 200, minWidth: 200 }}>
          {paths.map((s, i) => (
            <path key={i} d={s.d} fill={s.color} opacity="0.9" stroke={C.bg} strokeWidth="2" />
          ))}
          <text x={cx} y={cy - 8} fill="white" fontSize="22" fontWeight="bold" textAnchor="middle">{total}</text>
          <text x={cx} y={cy + 12} fill="rgba(255,255,255,0.4)" fontSize="10" textAnchor="middle">Total Items</text>
        </svg>
        <div className="flex flex-col gap-3">
          {slices.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{s.label}</span>
              <span style={{ color: s.color, fontWeight: "bold", fontSize: 13, marginLeft: "auto", paddingLeft: 12 }}>{s.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

/* ─── 4. HORIZONTAL BAR — Top Ingredients Used in Recipes ─── */
function HorizontalBar() {
  const data = [
    { label: "Tomato", value: 42, color: C.orange },
    { label: "Onion", value: 38, color: C.violet },
    { label: "Garlic", value: 35, color: C.cyan },
    { label: "Rice", value: 30, color: C.emerald },
    { label: "Chicken", value: 27, color: C.pink },
  ];
  const max = Math.max(...data.map((d) => d.value));
  const trackW = 320;

  return (
    <ChartCard title="🍳 Top Used Ingredients" subtitle="Most frequently matched in AI recipe suggestions">
      <div className="flex flex-col gap-5 py-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-4">
            <span style={{ width: 64, color: "rgba(255,255,255,0.5)", fontSize: 13, textAlign: "right" }}>{d.label}</span>
            <div style={{ width: trackW, height: 16, background: "rgba(255,255,255,0.04)", borderRadius: 8, overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${(d.value / max) * 100}%`,
                  background: d.color,
                  borderRadius: 8,
                  opacity: 0.85,
                  animation: `growX 0.8s ease ${i * 0.1}s both`,
                }}
              />
            </div>
            <span style={{ color: d.color, fontWeight: "bold", fontSize: 13 }}>{d.value}</span>
          </div>
        ))}
      </div>
      <style>{`@keyframes growX { from { width: 0 } }`}</style>
    </ChartCard>
  );
}

/* ─── 5. AREA CHART — Weekly Recipe Suggestions Generated ─── */
function AreaChart() {
  const data = [12, 19, 15, 28, 22, 35, 30];
  const labels = ["W1", "W2", "W3", "W4", "W5", "W6", "W7"];
  const W = 560, H = 200, pad = 40;
  const max = Math.max(...data);
  const pts = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (W - pad * 2),
    y: pad + (1 - v / max) * H,
  }));
  const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${pts[0].x},${pad + H} ` + polyline + ` ${pts[pts.length - 1].x},${pad + H}`;

  return (
    <ChartCard title="🤖 AI Recipe Suggestions" subtitle="Weekly count of AI-generated recipe suggestions">
      <svg viewBox={`0 0 ${W} ${H + 50}`} className="w-full">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.violet} stopOpacity="0.5" />
            <stop offset="100%" stopColor={C.violet} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((t) => {
          const y = pad + (1 - t) * H;
          return <line key={t} x1={pad} y1={y} x2={W - pad} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />;
        })}
        <polygon points={area} fill="url(#areaGrad)" />
        <polyline points={polyline} fill="none" stroke={C.violet} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill={C.violet} />
            <text x={p.x} y={pad + H + 18} fill="rgba(255,255,255,0.4)" fontSize="10" textAnchor="middle">{labels[i]}</text>
            <text x={p.x} y={p.y - 10} fill={C.violet} fontSize="11" textAnchor="middle" fontWeight="bold">{data[i]}</text>
          </g>
        ))}
      </svg>
    </ChartCard>
  );
}

/* ─── Card Wrapper ─── */
function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 24,
        padding: "28px 32px",
        backdropFilter: "blur(20px)",
      }}
    >
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{title}</h2>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.08em" }}>{subtitle}</p>
      {children}
    </div>
  );
}

/* ─── PAGE ─── */
export default function AdminGraphs() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        fontFamily: "'Inter', sans-serif",
        padding: "48px 24px",
        color: "#fff",
      }}
    >
      {/* Header */}
      <div style={{ maxWidth: 1100, margin: "0 auto 48px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 18px", borderRadius: 999, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", fontSize: 11, fontWeight: 700, color: C.emerald, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 20 }}>
          ✦ Admin Analytics
        </div>
        <h1 style={{ fontSize: 48, fontWeight: 900, letterSpacing: "-2px", lineHeight: 1.1 }}>
          NoshNurture{" "}
          <span style={{ background: "linear-gradient(90deg, #34d399, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Insights
          </span>
        </h1>
        <p style={{ color: "rgba(255,255,255,0.4)", marginTop: 12, fontSize: 16 }}>
          Live analytics across inventory, expiry, recipes, and ingredients.
        </p>
      </div>

      {/* Grid */}
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))",
          gap: 28,
        }}
      >
        <BarChart />
        <LineChart />
        <DonutChart />
        <HorizontalBar />
        <AreaChart />
      </div>

      {/* Decorative glow */}
      <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: -1 }}>
        <div style={{ position: "absolute", top: "10%", left: "-5%", width: 500, height: 500, background: "rgba(52,211,153,0.04)", borderRadius: "50%", filter: "blur(100px)" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "-5%", width: 500, height: 500, background: "rgba(34,211,238,0.04)", borderRadius: "50%", filter: "blur(100px)" }} />
      </div>
    </div>
  );
}
