import { useState, useCallback } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
// Shared across all tools. Dark header, light content, indigo accent.
const T = {
  // Base
  headerBg:     "#0f172a",
  headerBorder: "#1e293b",
  pageBg:       "#f8f9fb",
  cardBg:       "#ffffff",
  cardBorder:   "#e5e7eb",
  // Text
  textPrimary:  "#111827",
  textSecondary:"#374151",
  textMuted:    "#6b7280",
  textFaint:    "#9ca3af",
  // Accent — indigo
  accent:       "#1a6b3c",
  accentLight:  "#f0fdf4",
  accentBorder: "#bbf7d0",
  accentText:   "#166534",
  // States
  success:      "#16a34a",
  successLight: "#f0fdf4",
  successBorder:"#bbf7d0",
  warning:      "#d97706",
  warningLight: "#fffbeb",
  warningBorder:"#fde68a",
  danger:       "#dc2626",
  dangerLight:  "#fef2f2",
  dangerBorder: "#fecaca",
  // Input
  inputBg:      "#ffffff",
  inputBorder:  "#d1d5db",
  inputFocus:   "#1a6b3c",
  // Mono font for labels/numbers
  mono:         "'DM Mono', monospace",
  sans:         "'Inter', sans-serif",
};

const formatCurrency = (n) => n >= 1000000 ? `$${(n/1000000).toFixed(1)}M` : n >= 1000 ? `$${(n/1000).toFixed(0)}K` : `$${n}`;
const formatNumber   = (n) => n >= 1000 ? `${(n/1000).toFixed(1)}K` : String(Math.round(n));

const WORKING_WEEKS   = 48;
const AVG_REP_OTE     = 120000;
const MGMT_OVERHEAD   = 1.3;

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────

function Tooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-block", marginLeft: 5 }}>
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{
          cursor: "help", color: T.textFaint, fontSize: 11,
          fontFamily: T.mono, border: `1px solid ${T.cardBorder}`,
          borderRadius: "50%", width: 15, height: 15,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: T.cardBg,
        }}
      >?</span>
      {show && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 6px)", left: "50%",
          transform: "translateX(-50%)",
          background: T.headerBg, border: `1px solid ${T.headerBorder}`,
          borderRadius: 6, padding: "8px 12px", width: 220,
          fontSize: 12, color: "#94a3b8", lineHeight: 1.5,
          zIndex: 100, pointerEvents: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.2)"
        }}>
          {text}
        </div>
      )}
    </span>
  );
}

function Label({ children, tooltip }) {
  return (
    <label style={{
      display: "flex", alignItems: "center",
      fontFamily: T.mono, fontSize: 10,
      letterSpacing: "0.1em", textTransform: "uppercase",
      color: T.textMuted, marginBottom: 8, fontWeight: 500
    }}>
      {children}
      {tooltip && <Tooltip text={tooltip} />}
    </label>
  );
}

function Field({ label, tooltip, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <Label tooltip={tooltip}>{label}</Label>
      {children}
    </div>
  );
}

function SliderInput({ value, onChange, min, max, step, format }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontFamily: T.mono, fontSize: 14, color: T.accent, fontWeight: 600 }}>
          {format(value)}
        </span>
        <span style={{ fontFamily: T.mono, fontSize: 11, color: T.textFaint }}>
          {format(min)} – {format(max)}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: T.accent, cursor: "pointer" }}
      />
    </div>
  );
}

function SegBtn({ options, value, onChange }) {
  return (
    <div style={{
      display: "flex", gap: 1,
      background: T.cardBorder, borderRadius: 7, padding: 2
    }}>
      {options.map(opt => (
        <button key={opt.value} onClick={() => onChange(opt.value)} style={{
          flex: 1, padding: "7px 6px",
          background: value === opt.value ? T.headerBg : T.cardBg,
          border: "none", borderRadius: 5, cursor: "pointer",
          fontFamily: T.mono, fontSize: 10,
          letterSpacing: "0.06em", textTransform: "uppercase",
          color: value === opt.value ? "#e2e8f0" : T.textMuted,
          transition: "all 0.15s", fontWeight: value === opt.value ? 600 : 400
        }}>{opt.label}</button>
      ))}
    </div>
  );
}

function MetricCard({ label, value, sub, highlight, warning }) {
  const borderColor = warning ? T.danger : highlight ? T.accent : T.cardBorder;
  const labelColor  = warning ? T.danger : highlight ? T.accent : T.textMuted;
  const valueColor  = warning ? T.danger : T.textPrimary;

  return (
    <div style={{
      background: T.cardBg,
      border: `1px solid ${T.cardBorder}`,
      borderTop: `3px solid ${borderColor}`,
      borderRadius: 8, padding: "16px 18px"
    }}>
      <div style={{
        fontFamily: T.mono, fontSize: 10,
        letterSpacing: "0.1em", textTransform: "uppercase",
        color: labelColor, marginBottom: 8
      }}>{label}</div>
      <div style={{
        fontFamily: T.mono, fontSize: 24,
        fontWeight: 700, color: valueColor, lineHeight: 1
      }}>{value}</div>
      {sub && (
        <div style={{
          fontFamily: T.mono, fontSize: 11,
          color: T.textFaint, marginTop: 6, lineHeight: 1.4
        }}>{sub}</div>
      )}
    </div>
  );
}

function Flag({ text, type }) {
  const cfg = {
    warning: { bg: T.dangerLight,  border: T.dangerBorder,  left: T.danger,  icon: "⚠", color: "#991b1b" },
    insight: { bg: T.accentLight,  border: T.accentBorder,  left: T.accent,  icon: "◆", color: T.accentText },
  }[type];

  return (
    <div style={{
      display: "flex", gap: 12, alignItems: "flex-start",
      padding: "12px 14px",
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderLeft: `3px solid ${cfg.left}`,
      borderRadius: 6, marginBottom: 8
    }}>
      <span style={{ color: cfg.left, fontSize: 13, flexShrink: 0, marginTop: 1 }}>{cfg.icon}</span>
      <p style={{ fontFamily: T.sans, fontSize: 13, color: cfg.color, margin: 0, lineHeight: 1.6 }}>{text}</p>
    </div>
  );
}

// ─── COMPUTE ──────────────────────────────────────────────────────────────────

function compute(inputs) {
  const {
    revenueTarget, dealSize, winRate, cycleMonths, grossMargin,
    inboundRatio, competitive, existingRevenue, totalAccounts, channelMix,
    churnRate, contractLength
  } = inputs;

  const winRateDec = winRate / 100;
  const marginDec  = grossMargin / 100;
  const inboundDec = inboundRatio / 100;
  const partnerDec = channelMix / 100;
  const directDec  = 1 - partnerDec;
  const churnDec   = churnRate / 100;

  const churnLoss    = existingRevenue * churnDec;
  const newRevNeeded = Math.max(0, revenueTarget - existingRevenue + churnLoss);
  const dealsNeeded  = newRevNeeded / dealSize;
  const oppsNeeded   = dealsNeeded / winRateDec;

  const activeDealSlots    = Math.max(3, Math.min(10, Math.round(8 - cycleMonths * 0.4)));
  const dealsPerRepPerYear = (WORKING_WEEKS / (cycleMonths * 4.33)) * activeDealSlots * winRateDec;

  const directOpps          = oppsNeeded * directDec;
  const directDeals         = dealsNeeded * directDec;
  const aeCount             = Math.ceil(directDeals / dealsPerRepPerYear);
  const outboundOppsNeeded  = directOpps * (1 - inboundDec);
  const oppsPerSdrPerMonth  = dealSize > 100000 ? 4 : dealSize > 50000 ? 8 : 12;
  const sdrCount            = Math.ceil(outboundOppsNeeded / (oppsPerSdrPerMonth * 12));

  const coverageMultiple = dealSize > 150000 ? 5 : dealSize > 50000 ? 4 : 3;
  const pipelineNeeded   = newRevNeeded * coverageMultiple;

  const contractMultiplier = contractLength === "multiyear3" ? 2.4 : contractLength === "multiyear2" ? 1.7 : 1.0;
  const ltv        = dealSize * contractMultiplier * (1 / (1 - Math.min(0.9, winRateDec * 0.3 + 0.7))) * marginDec;
  const cacCeiling = ltv * 0.33;

  const totalRepCost = (aeCount + sdrCount) * AVG_REP_OTE * MGMT_OVERHEAD;
  const estimatedCac = dealsNeeded > 0 ? totalRepCost / dealsNeeded : 0;

  const accountsNeededPerYear = oppsNeeded * (cycleMonths / 12) * 2;
  const runwayYears = totalAccounts > 0 ? totalAccounts / accountsNeededPerYear : 999;

  const partnerRevenue = revenueTarget * partnerDec;
  const directRevenue  = revenueTarget * directDec;

  let sequencing = "";
  if (inboundDec > 0.6 && dealSize < 50000) sequencing = "inbound-led";
  else if (inboundDec < 0.3 || dealSize > 100000) sequencing = "outbound-led";
  else sequencing = "blended";

  const flags = [], insights = [];

  if (runwayYears < 2) flags.push(`Your total addressable account count (${formatNumber(totalAccounts)}) suggests you'll exhaust the market in under ${runwayYears.toFixed(1)} years at this pipeline velocity. Either the TAM is understated or the motion needs a land-and-expand component.`);
  if (estimatedCac > cacCeiling * 1.2) flags.push(`Estimated CAC (${formatCurrency(estimatedCac)}) exceeds your margin-adjusted ceiling (${formatCurrency(cacCeiling)}). At this rep cost structure and win rate, the unit economics don't close.`);
  if (cycleMonths > 9 && inboundDec > 0.5) flags.push(`A ${cycleMonths}-month cycle with ${winRate}% inbound is an unusual combination. Either your cycle is artificially long or your inbound mix is optimistic.`);
  if (competitive === "displacement" && cycleMonths < 4) flags.push(`Displacement selling with a ${cycleMonths}-month cycle is aggressive. Unseating an incumbent typically adds 2–4 months of evaluation inertia.`);
  if (sdrCount > aeCount * 2) flags.push(`Your SDR-to-AE ratio (${sdrCount}:${aeCount}) means the pipeline engine will outrun closing capacity. Consider adding AE headcount or shifting inbound mix.`);
  if (grossMargin < 40 && dealSize < 25000) flags.push(`Low margin (${grossMargin}%) with small deal size (${formatCurrency(dealSize)}) creates a very tight CAC window. Direct outbound economics are difficult at this combination.`);

  if (churnRate > 0) {
    const churnBurden = Math.round((churnLoss / newRevNeeded) * 100);
    if (churnBurden > 30) flags.push(`Churn is consuming ${churnBurden}% of your new business effort before you grow a dollar. At ${churnRate}% churn on a ${formatCurrency(existingRevenue)} base, retention investment likely has higher ROI than new logo acquisition.`);
    else if (churnBurden > 15) insights.push(`Churn adds ${formatCurrency(Math.round(churnLoss))} to your effective new revenue target — ${churnBurden}% of your new business burden is replacement, not growth.`);
  }

  if (contractLength === "multiyear3") insights.push(`3-year contracts raise your CAC ceiling roughly 2.4x vs. annual contracts by extending LTV. This justifies higher investment in longer-cycle, higher-touch sales motions.`);
  else if (contractLength === "multiyear2") insights.push(`2-year contracts extend LTV and raise your CAC ceiling about 70% above annual contract economics.`);
  if (winRate > 40 && competitive === "contested") insights.push(`A ${winRate}% win rate in a contested market is strong. Formalize what's working and build it into your qualification criteria before the team grows.`);
  if (inboundDec > 0.5 && competitive === "greenfield") insights.push(`High inbound in a greenfield market suggests strong category creation traction. Invest in content and community now to build defensible inbound before the category matures.`);
  if (existingRevenue > revenueTarget * 0.5) insights.push(`Existing revenue covers ${Math.round((existingRevenue/revenueTarget)*100)}% of your target. Expansion and retention are your primary lever — new business only needs to close the gap.`);
  if (partnerDec > 0.3 && dealSize > 50000) insights.push(`Partner channel at ${channelMix}% of revenue is a strong structural choice for your deal size. Expect 20–30% lower CAC at the cost of some margin and deal control.`);

  return {
    aeCount, sdrCount, pipelineNeeded, coverageMultiple,
    dealsNeeded: Math.ceil(dealsNeeded), oppsNeeded: Math.ceil(oppsNeeded),
    cacCeiling, estimatedCac, runwayYears, churnLoss,
    newRevNeeded, partnerRevenue, directRevenue,
    sequencing, flags, insights, activeDealSlots,
    dealsPerRepPerYear: Math.round(dealsPerRepPerYear * 10) / 10
  };
}

function buildNarrative(inputs, results) {
  const { revenueTarget, dealSize, cycleMonths, existingRevenue, channelMix } = inputs;
  const { aeCount, sdrCount, sequencing, newRevNeeded, cacCeiling, estimatedCac, churnLoss } = results;
  const motionMap = { "inbound-led": "inbound-led", "outbound-led": "outbound-driven", "blended": "blended inbound/outbound" };
  const compMap   = { greenfield: "greenfield", contested: "contested", displacement: "displacement" };

  const churnNote = inputs.churnRate > 0 && churnLoss > 0
    ? ` Churn erodes ${formatCurrency(Math.round(churnLoss))} of the existing base annually, so the gross new revenue requirement is ${formatCurrency(newRevNeeded)}.`
    : "";
  const existingCover = existingRevenue > 0
    ? ` With ${Math.round((existingRevenue/revenueTarget)*100)}% of the target covered by existing revenue, the new business motion needs to generate ${formatCurrency(newRevNeeded)} in net new ARR.${churnNote}`
    : "";
  const cacNote = estimatedCac > cacCeiling
    ? ` Unit economics are tight — estimated CAC (${formatCurrency(Math.round(estimatedCac))}) is above the margin-adjusted ceiling (${formatCurrency(Math.round(cacCeiling))}), which warrants improving win rate or reducing rep cost before scaling.`
    : ` Unit economics are workable — estimated CAC (${formatCurrency(Math.round(estimatedCac))}) is below the margin-adjusted ceiling (${formatCurrency(Math.round(cacCeiling))}).`;
  const runwayNote = results.runwayYears < 3
    ? ` Account runway is the variable most likely to constrain this model — at current pipeline velocity the addressable market gets thin in under ${results.runwayYears.toFixed(1)} years.`
    : "";

  return `This is a ${motionMap[sequencing]}, ${compMap[inputs.competitive]} motion targeting ${formatCurrency(revenueTarget)} against a ${formatCurrency(dealSize)} average deal and a ${cycleMonths}-month cycle.${existingCover} The math supports ${aeCount} AE${aeCount !== 1 ? "s" : ""}${sdrCount > 0 ? ` and ${sdrCount} SDR${sdrCount !== 1 ? "s" : ""}` : ""} on direct${channelMix > 0 ? `, with ${channelMix}% through partners` : ""}.${cacNote}${runwayNote}`;
}

const defaultInputs = {
  revenueTarget: 5000000, dealSize: 50000, winRate: 25, cycleMonths: 6,
  grossMargin: 65, inboundRatio: 40, competitive: "contested",
  existingRevenue: 1000000, totalAccounts: 2000, channelMix: 0,
  churnRate: 10, contractLength: "annual",
};

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function GTMCoverageDesigner() {
  const [inputs, setInputs]     = useState(defaultInputs);
  const [activeTab, setActiveTab] = useState("coverage");
  const set = useCallback((key, val) => setInputs(p => ({ ...p, [key]: val })), []);

  const results   = compute(inputs);
  const narrative = buildNarrative(inputs, results);

  const tabs = [
    { key: "coverage",  label: "Coverage" },
    { key: "economics", label: "Economics" },
    { key: "flags",     label: `Flags${results.flags.length > 0 ? ` (${results.flags.length})` : ""}` },
  ];

  return (
    <div style={{ minHeight: "100vh", background: T.pageBg, fontFamily: T.sans, color: T.textPrimary }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        input[type=range] { -webkit-appearance: none; height: 3px; border-radius: 2px; background: #e5e7eb; outline: none; cursor: pointer; width: 100%; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #1a6b3c; cursor: pointer; border: 2px solid white; box-shadow: 0 1px 4px rgba(79,70,229,0.35); }
        input:focus, select:focus { outline: 2px solid #1a6b3c; outline-offset: 2px; }
      `}</style>

      {/* Header */}
      <div style={{ background: T.headerBg, padding: "20px 40px", borderBottom: `1px solid ${T.headerBorder}` }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: T.accent, marginBottom: 5 }}>
              GTM Architecture · Coverage Design
            </div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
              GTM Coverage Model Designer
            </h1>
            <p style={{ margin: "3px 0 0", color: "#64748b", fontSize: 13 }}>
              Input your parameters. Get a recommended commercial architecture.
            </p>
          </div>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: "#334155", textAlign: "right", lineHeight: 1.6 }}>
            David Hopper<br />Commercial Operations
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 40px 80px", display: "grid", gridTemplateColumns: "320px 1fr", gap: 24, alignItems: "start" }}>

        {/* Input panel */}
        <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: "24px", position: "sticky", top: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: T.textMuted, marginBottom: 20, paddingBottom: 12, borderBottom: `1px solid ${T.cardBorder}` }}>
            Parameters
          </div>

          <Field label="Annual Revenue Target" tooltip="Total revenue goal — new business plus expansion combined.">
            <SliderInput value={inputs.revenueTarget} onChange={v => set("revenueTarget", v)} min={500000} max={50000000} step={500000} format={formatCurrency} />
          </Field>
          <Field label="Existing / Recurring Revenue" tooltip="ARR or recurring revenue you're carrying into the year. Reduces new business burden.">
            <SliderInput value={inputs.existingRevenue} onChange={v => set("existingRevenue", v)} min={0} max={inputs.revenueTarget} step={100000} format={formatCurrency} />
          </Field>
          <Field label="Average Deal Size" tooltip="Average closed-won contract value. Use ACV for subscription businesses.">
            <SliderInput value={inputs.dealSize} onChange={v => set("dealSize", v)} min={5000} max={500000} step={5000} format={formatCurrency} />
          </Field>
          <Field label="Win Rate" tooltip="Percentage of qualified opportunities that close. Most teams overestimate this.">
            <SliderInput value={inputs.winRate} onChange={v => set("winRate", v)} min={5} max={60} step={1} format={v => `${v}%`} />
          </Field>
          <Field label="Average Sales Cycle" tooltip="Months from qualified opportunity to closed-won. Include procurement and legal.">
            <SliderInput value={inputs.cycleMonths} onChange={v => set("cycleMonths", v)} min={1} max={18} step={1} format={v => `${v} mo`} />
          </Field>
          <Field label="Gross Margin" tooltip="Product/service gross margin. Drives CAC ceiling.">
            <SliderInput value={inputs.grossMargin} onChange={v => set("grossMargin", v)} min={10} max={90} step={5} format={v => `${v}%`} />
          </Field>
          <Field label="Inbound Pipeline Mix" tooltip="What percentage of pipeline originates from inbound vs. outbound prospecting.">
            <SliderInput value={inputs.inboundRatio} onChange={v => set("inboundRatio", v)} min={0} max={100} step={5} format={v => `${v}% inbound`} />
          </Field>
          <Field label="Partner / Channel Mix" tooltip="Percentage of revenue through partners or resellers. Remainder is direct.">
            <SliderInput value={inputs.channelMix} onChange={v => set("channelMix", v)} min={0} max={70} step={5} format={v => `${v}% partner`} />
          </Field>
          <Field label="Annual Churn Rate" tooltip="Percentage of existing ARR lost annually. Adjusts gross new revenue required.">
            <SliderInput value={inputs.churnRate} onChange={v => set("churnRate", v)} min={0} max={40} step={1} format={v => v === 0 ? "No churn" : `${v}% churn`} />
          </Field>
          <Field label="Total Addressable Accounts" tooltip="How many ICP-fit companies exist in your target market.">
            <SliderInput value={inputs.totalAccounts} onChange={v => set("totalAccounts", v)} min={100} max={50000} step={100} format={v => formatNumber(v) + " accts"} />
          </Field>
          <Field label="Contract Length" tooltip="Longer contracts raise your CAC ceiling by extending LTV.">
            <SegBtn value={inputs.contractLength} onChange={v => set("contractLength", v)}
              options={[{ label: "Mo", value: "monthly" }, { label: "1yr", value: "annual" }, { label: "2yr", value: "multiyear2" }, { label: "3yr", value: "multiyear3" }]} />
          </Field>
          <Field label="Competitive Position" tooltip="Greenfield: new category. Contested: established competition. Displacement: unseating an incumbent.">
            <SegBtn value={inputs.competitive} onChange={v => set("competitive", v)}
              options={[{ label: "Greenfield", value: "greenfield" }, { label: "Contested", value: "contested" }, { label: "Displace", value: "displacement" }]} />
          </Field>
        </div>

        {/* Output panel */}
        <div>
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: `1px solid ${T.cardBorder}`, marginBottom: 20 }}>
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                background: "none", border: "none", padding: "10px 18px",
                fontFamily: T.mono, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase",
                color: activeTab === tab.key ? T.accent : T.textMuted,
                borderBottom: activeTab === tab.key ? `2px solid ${T.accent}` : "2px solid transparent",
                cursor: "pointer", transition: "all 0.15s", fontWeight: activeTab === tab.key ? 600 : 400
              }}>{tab.label}</button>
            ))}
          </div>

          {/* Coverage tab */}
          {activeTab === "coverage" && (
            <div style={{ animation: "fadeIn 0.25s ease" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                <MetricCard label="AEs Required" value={results.aeCount} sub={`${results.dealsPerRepPerYear} deals/rep/yr · ${inputs.cycleMonths}mo cycle`} highlight />
                <MetricCard label="SDRs Required" value={results.sdrCount} sub={`${Math.round((1 - inputs.inboundRatio/100) * 100)}% outbound burden`} />
                <MetricCard label="Pipeline Needed" value={formatCurrency(results.pipelineNeeded)} sub={`${results.coverageMultiple}x coverage`} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                <MetricCard label="Deals to Close" value={results.dealsNeeded} sub={`at ${formatCurrency(inputs.dealSize)} avg`} />
                <MetricCard label="Opps Needed" value={formatNumber(results.oppsNeeded)} sub={`at ${inputs.winRate}% win rate`} />
                <MetricCard label="Account Runway" value={results.runwayYears > 20 ? "20+ yrs" : `${results.runwayYears.toFixed(1)} yrs`} sub={`${formatNumber(inputs.totalAccounts)} addressable`} warning={results.runwayYears < 2} />
              </div>

              {/* Recommended motion */}
              <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: "20px", marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: T.accent, marginBottom: 14 }}>
                  Recommended Motion
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                  {[
                    { label: "Motion Type", value: results.sequencing === "inbound-led" ? "Inbound-Led" : results.sequencing === "outbound-led" ? "Outbound-Driven" : "Blended" },
                    { label: "Competitive Context", value: inputs.competitive.charAt(0).toUpperCase() + inputs.competitive.slice(1) },
                    { label: "Channel Split", value: inputs.channelMix > 0 ? `${100 - inputs.channelMix}% direct · ${inputs.channelMix}% partner` : "100% direct" },
                    { label: "Deal Slots / Rep", value: results.activeDealSlots },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ fontFamily: T.mono, fontSize: 10, color: T.textFaint, marginBottom: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>{item.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Narrative */}
              <div style={{ background: T.accentLight, border: `1px solid ${T.accentBorder}`, borderLeft: `3px solid ${T.accent}`, borderRadius: 8, padding: "16px 18px" }}>
                <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: T.accent, marginBottom: 8 }}>
                  Architecture Summary
                </div>
                <p style={{ margin: 0, fontSize: 14, color: T.accentText, lineHeight: 1.75 }}>{narrative}</p>
              </div>
            </div>
          )}

          {/* Economics tab */}
          {activeTab === "economics" && (
            <div style={{ animation: "fadeIn 0.25s ease" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                <MetricCard label="CAC Ceiling" value={formatCurrency(Math.round(results.cacCeiling))} sub={`Max spend to acquire 1 customer at ${inputs.grossMargin}% margin`} highlight />
                <MetricCard label="Estimated CAC" value={formatCurrency(Math.round(results.estimatedCac))} sub="Based on rep OTE + management overhead" warning={results.estimatedCac > results.cacCeiling} />
                <MetricCard label="Direct Revenue" value={formatCurrency(Math.round(results.directRevenue))} sub={`${100 - inputs.channelMix}% of target via direct`} />
                <MetricCard label="Partner Revenue" value={formatCurrency(Math.round(results.partnerRevenue))} sub={`${inputs.channelMix}% of target via channel`} />
              </div>
              <div style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: T.textMuted, marginBottom: 16 }}>
                  Unit Economics Breakdown
                </div>
                {[
                  ["Revenue target",           formatCurrency(inputs.revenueTarget)],
                  ["Existing / recurring base", formatCurrency(inputs.existingRevenue)],
                  ["Annual churn loss",         inputs.churnRate > 0 ? `−${formatCurrency(Math.round(results.churnLoss))}` : "—"],
                  ["Gross new revenue needed",  formatCurrency(results.newRevNeeded)],
                  ["Deals to close",            results.dealsNeeded],
                  ["Opportunities needed",      formatNumber(results.oppsNeeded)],
                  ["Pipeline required",         formatCurrency(results.pipelineNeeded)],
                  ["Gross margin",              `${inputs.grossMargin}%`],
                  ["CAC ceiling",               formatCurrency(Math.round(results.cacCeiling))],
                  ["Estimated CAC",             formatCurrency(Math.round(results.estimatedCac))],
                ].map(([label, val], i, arr) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid ${T.cardBorder}` : "none" }}>
                    <span style={{ fontFamily: T.mono, fontSize: 12, color: T.textMuted }}>{label}</span>
                    <span style={{ fontFamily: T.mono, fontSize: 12, color: T.textPrimary, fontWeight: 600 }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flags tab */}
          {activeTab === "flags" && (
            <div style={{ animation: "fadeIn 0.25s ease" }}>
              {results.flags.length === 0 && results.insights.length === 0 && (
                <div style={{ padding: "48px 0", textAlign: "center", color: T.textFaint, fontFamily: T.mono, fontSize: 12 }}>
                  No flags or insights for these inputs.
                </div>
              )}
              {results.flags.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: T.danger, marginBottom: 12 }}>
                    ⚠ Warning Flags ({results.flags.length})
                  </div>
                  {results.flags.map((f, i) => <Flag key={i} text={f} type="warning" />)}
                </div>
              )}
              {results.insights.length > 0 && (
                <div>
                  <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: T.accent, marginBottom: 12 }}>
                    ◆ Strategic Insights ({results.insights.length})
                  </div>
                  {results.insights.map((f, i) => <Flag key={i} text={f} type="insight" />)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
