import { useState, useCallback } from "react";

const formatCurrency = (n) => n >= 1000000 ? `$${(n/1000000).toFixed(1)}M` : n >= 1000 ? `$${(n/1000).toFixed(0)}K` : `$${n}`;
const formatNumber = (n) => n >= 1000 ? `${(n/1000).toFixed(1)}K` : String(Math.round(n));

const WORKING_WEEKS = 48;
const AVG_REP_OTE = 120000;
const MGMT_OVERHEAD = 1.3;

function Tooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-block", marginLeft: 6 }}>
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{ cursor: "help", color: "#64748b", fontSize: 12, fontFamily: "'DM Mono', monospace", border: "1px solid #334155", borderRadius: "50%", width: 16, height: 16, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
      >?</span>
      {show && (
        <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 6, padding: "8px 12px", width: 220, fontSize: 12, color: "#94a3b8", lineHeight: 1.5, zIndex: 100, pointerEvents: "none" }}>
          {text}
          <div style={{ position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%)", width: 8, height: 8, background: "#0f172a", border: "1px solid #1e293b", borderTop: "none", borderLeft: "none", transform: "translateX(-50%) rotate(45deg)" }} />
        </div>
      )}
    </span>
  );
}

function InputField({ label, tooltip, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "flex", alignItems: "center", fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#64748b", marginBottom: 8 }}>
        {label}
        {tooltip && <Tooltip text={tooltip} />}
      </label>
      {children}
    </div>
  );
}

function SliderInput({ value, onChange, min, max, step, format }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>{format(value)}</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#334155" }}>{format(min)} – {format(max)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#22c55e" }} />
    </div>
  );
}

function SegmentButton({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 1, background: "#0f172a", borderRadius: 6, padding: 2 }}>
      {options.map(opt => (
        <button key={opt.value} onClick={() => onChange(opt.value)} style={{
          flex: 1, padding: "8px 6px", background: value === opt.value ? "#1e293b" : "transparent",
          border: "none", borderRadius: 5, cursor: "pointer", fontFamily: "'DM Mono', monospace",
          fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase",
          color: value === opt.value ? "#22c55e" : "#475569", transition: "all 0.15s"
        }}>{opt.label}</button>
      ))}
    </div>
  );
}

function MetricCard({ label, value, sub, highlight, warning }) {
  return (
    <div style={{
      background: "#0f172a", border: `1px solid ${warning ? "#ef444433" : highlight ? "#22c55e33" : "#1e293b"}`,
      borderLeft: `3px solid ${warning ? "#ef4444" : highlight ? "#22c55e" : "#1e293b"}`,
      borderRadius: 8, padding: "16px 18px"
    }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: warning ? "#ef4444" : highlight ? "#22c55e" : "#475569", marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 26, fontWeight: 600, color: warning ? "#fca5a5" : "#f1f5f9", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#475569", marginTop: 6, lineHeight: 1.4 }}>{sub}</div>}
    </div>
  );
}

function WarningFlag({ text }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 14px", background: "#1a0a0a", border: "1px solid #7f1d1d44", borderLeft: "3px solid #ef4444", borderRadius: 6, marginBottom: 8 }}>
      <span style={{ color: "#ef4444", fontSize: 14, flexShrink: 0, marginTop: 1 }}>⚠</span>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#fca5a5", margin: 0, lineHeight: 1.55 }}>{text}</p>
    </div>
  );
}

function InsightFlag({ text }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 14px", background: "#0a1a0f", border: "1px solid #14532d44", borderLeft: "3px solid #22c55e", borderRadius: 6, marginBottom: 8 }}>
      <span style={{ color: "#22c55e", fontSize: 14, flexShrink: 0, marginTop: 1 }}>◆</span>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#86efac", margin: 0, lineHeight: 1.55 }}>{text}</p>
    </div>
  );
}

function compute(inputs) {
  const {
    revenueTarget, dealSize, winRate, cycleMonths, grossMargin,
    inboundRatio, competitive, existingRevenue, totalAccounts, channelMix,
    churnRate, contractLength
  } = inputs;

  const winRateDec = winRate / 100;
  const marginDec = grossMargin / 100;
  const inboundDec = inboundRatio / 100;
  const partnerDec = channelMix / 100;
  const directDec = 1 - partnerDec;
  const churnDec = churnRate / 100;

  // Churn-adjusted revenue needed
  // Existing base erodes by churn rate; must be replaced before growing
  const churnLoss = existingRevenue * churnDec;
  const newRevNeeded = Math.max(0, revenueTarget - existingRevenue + churnLoss);

  // Deals needed to hit target
  const dealsNeeded = newRevNeeded / dealSize;

  // Opportunities needed (accounting for win rate)
  const oppsNeeded = dealsNeeded / winRateDec;

  // Cycle-adjusted capacity per rep
  // Each rep can run (12 / cycleMonths) deal cycles per year
  // Industry benchmark: rep manages 4-8 active deals simultaneously
  const activeDealSlots = Math.max(3, Math.min(10, Math.round(8 - cycleMonths * 0.4)));
  const dealsPerRepPerYear = (WORKING_WEEKS / (cycleMonths * 4.33)) * activeDealSlots * winRateDec;

  // Direct AEs needed
  const directOpps = oppsNeeded * directDec;
  const directDeals = dealsNeeded * directDec;
  const aeCount = Math.ceil(directDeals / dealsPerRepPerYear);

  // SDR need — outbound accounts for (1 - inboundDec) of pipeline
  const outboundOppsNeeded = directOpps * (1 - inboundDec);
  // Each SDR generates roughly 8-15 opps/month depending on deal size
  const oppsPerSdrPerMonth = dealSize > 100000 ? 4 : dealSize > 50000 ? 8 : 12;
  const sdrCount = Math.ceil(outboundOppsNeeded / (oppsPerSdrPerMonth * 12));

  // Pipeline coverage needed
  // Standard: 3x for transactional, 4x for mid-market, 5x for enterprise
  const coverageMultiple = dealSize > 150000 ? 5 : dealSize > 50000 ? 4 : 3;
  const pipelineNeeded = newRevNeeded * coverageMultiple;

  // CAC ceiling — adjusted for contract length
  // Multi-year contracts extend LTV, raising the CAC ceiling meaningfully
  const contractMultiplier = contractLength === "multiyear3" ? 2.4 : contractLength === "multiyear2" ? 1.7 : 1.0;
  const ltv = dealSize * contractMultiplier * (1 / (1 - Math.min(0.9, winRateDec * 0.3 + 0.7))) * marginDec;
  const cacCeiling = ltv * 0.33; // 3:1 LTV:CAC

  // Actual CAC estimate
  const totalRepCost = (aeCount + sdrCount) * AVG_REP_OTE * MGMT_OVERHEAD;
  const estimatedCac = dealsNeeded > 0 ? totalRepCost / dealsNeeded : 0;

  // Account runway
  const accountsNeededPerYear = oppsNeeded * (cycleMonths / 12) * 2;
  const runwayYears = totalAccounts > 0 ? totalAccounts / accountsNeededPerYear : 999;

  // Channel split
  const partnerRevenue = revenueTarget * partnerDec;
  const directRevenue = revenueTarget * directDec;

  // Sequencing
  let sequencing = "";
  if (inboundDec > 0.6 && dealSize < 50000) sequencing = "inbound-led";
  else if (inboundDec < 0.3 || dealSize > 100000) sequencing = "outbound-led";
  else sequencing = "blended";

  // Flags
  const flags = [];
  const insights = [];

  if (runwayYears < 2) flags.push(`Your total addressable account count (${formatNumber(totalAccounts)}) suggests you'll exhaust the market in under ${runwayYears.toFixed(1)} years at this pipeline velocity. Either the TAM is understated or the motion needs a land-and-expand component to extend account value.`);

  if (estimatedCac > cacCeiling * 1.2) flags.push(`Estimated CAC (${formatCurrency(estimatedCac)}) exceeds your margin-adjusted ceiling (${formatCurrency(cacCeiling)}). At this rep cost structure and win rate, the unit economics don't close. Consider higher deal sizes, improved win rate, or partner channel offload.`);

  if (cycleMonths > 9 && inboundDec > 0.5) flags.push(`A ${cycleMonths}-month sales cycle with a ${winRate}% win rate suggests an enterprise motion, but a ${winRate}% inbound mix implies buyers are already educated. Either your cycle is artificially long or your inbound signal is optimistic.`);

  if (competitive === "displacement" && cycleMonths < 4) flags.push(`Displacement selling with a ${cycleMonths}-month cycle is aggressive. Unseating an incumbent typically adds 2-4 months of evaluation inertia. Your coverage and rep capacity assumptions may be understated.`);

  if (sdrCount > aeCount * 2) flags.push(`Your SDR-to-AE ratio (${sdrCount}:${aeCount}) implies the pipeline generation engine will outrun the closing capacity. Consider adding AE headcount or increasing inbound investment to balance throughput.`);

  if (grossMargin < 40 && dealSize < 25000) flags.push(`Low margin (${grossMargin}%) combined with small deal size (${formatCurrency(dealSize)}) creates a tight CAC window. Direct outbound economics are very challenging at this combination — partner or channel motion may be the only path to positive unit economics.`);

  // Churn flags
  if (churnRate > 0) {
    const churnBurden = Math.round((churnLoss / newRevNeeded) * 100);
    if (churnBurden > 30) flags.push(`Churn is consuming ${churnBurden}% of your new business effort before you grow a dollar. At ${churnRate}% annual churn on a ${formatCurrency(existingRevenue)} base, you're losing ${formatCurrency(Math.round(churnLoss))} per year that new business must replace first. Retention investment has higher ROI than new logo acquisition at this ratio.`);
    else if (churnBurden > 15) insights.push(`Churn adds ${formatCurrency(Math.round(churnLoss))} to your effective new revenue target — ${churnBurden}% of your new business burden is replacement, not growth. Worth tracking as a separate line in your revenue plan.`);
  }

  // Contract length insight
  if (contractLength === "multiyear3") insights.push(`3-year contracts significantly raise your CAC ceiling by extending LTV — your allowable acquisition cost is roughly 2.4x what it would be on annual contracts. This justifies higher investment in enterprise sales motions and longer deal cycles.`);
  else if (contractLength === "multiyear2") insights.push(`2-year contracts extend LTV and raise your CAC ceiling ~70% above annual contract economics. This gives you meaningful room to invest in longer-cycle, higher-touch sales motions if the deal size warrants it.`);

  if (winRate > 40 && competitive === "contested") insights.push(`A ${winRate}% win rate in a contested market is strong. Protect it by formalizing what's working — document your win patterns, isolate the deal characteristics that correlate with wins, and build those into qualification criteria.`);

  if (inboundDec > 0.5 && competitive === "greenfield") insights.push(`High inbound in a greenfield market suggests strong category creation traction. This is a window — invest in content and community now to build defensible inbound before competitors commoditize the category.`);

  if (existingRevenue > revenueTarget * 0.5) insights.push(`Existing revenue covers ${Math.round((existingRevenue/revenueTarget)*100)}% of your target. Expansion and retention economics are your primary lever — your new business motion only needs to close the gap, not carry the number.`);

  if (partnerDec > 0.3 && dealSize > 50000) insights.push(`Partner channel at ${channelMix}% of revenue mix for a ${formatCurrency(dealSize)} deal size is a strong structural choice. Mid-market and enterprise partner motions typically yield 20-30% lower CAC at the cost of margin and deal control.`);

  return {
    aeCount, sdrCount, pipelineNeeded, coverageMultiple,
    dealsNeeded: Math.ceil(dealsNeeded), oppsNeeded: Math.ceil(oppsNeeded),
    cacCeiling, estimatedCac, runwayYears,
    newRevNeeded, partnerRevenue, directRevenue, churnLoss,
    sequencing, flags, insights, activeDealSlots,
    dealsPerRepPerYear: Math.round(dealsPerRepPerYear * 10) / 10
  };
}

function buildNarrative(inputs, results) {
  const { revenueTarget, dealSize, winRate, cycleMonths, grossMargin, inboundRatio, competitive, existingRevenue, channelMix } = inputs;
  const { aeCount, sdrCount, sequencing, newRevNeeded, runwayYears, cacCeiling, estimatedCac } = results;

  const motionMap = { "inbound-led": "inbound-led", "outbound-led": "outbound-driven", "blended": "blended inbound/outbound" };
  const compMap = { greenfield: "greenfield", contested: "contested", displacement: "displacement" };
  const seqLabel = motionMap[sequencing];
  const compLabel = compMap[competitive];

  const churnNote = inputs.churnRate > 0 && results.churnLoss > 0
    ? ` Churn erodes ${formatCurrency(Math.round(results.churnLoss))} of the existing base annually, so the gross new revenue requirement is ${formatCurrency(results.newRevNeeded)} — not just the gap to target.`
    : "";
  const existingCover = existingRevenue > 0 ? ` With ${Math.round((existingRevenue/revenueTarget)*100)}% of the target covered by existing revenue, the new business motion needs to generate ${formatCurrency(results.newRevNeeded)} in net new ARR.${churnNote}` : "";

  const cacNote = estimatedCac > cacCeiling
    ? ` Unit economics are tight — estimated CAC (${formatCurrency(Math.round(estimatedCac))}) is above the margin-adjusted ceiling (${formatCurrency(Math.round(cacCeiling))}), which warrants either improving win rate or reducing rep cost structure before scaling.`
    : ` Unit economics are workable — estimated CAC (${formatCurrency(Math.round(estimatedCac))}) sits below the margin-adjusted ceiling (${formatCurrency(Math.round(cacCeiling))}).`;

  const runwayNote = runwayYears < 3 ? ` Account runway is the variable most likely to constrain this model — at current pipeline velocity the addressable market gets thin in under ${runwayYears.toFixed(1)} years, which means expansion revenue or TAM expansion needs to be part of the plan from day one.` : "";

  return `This is a ${seqLabel}, ${compLabel} motion targeting ${formatCurrency(revenueTarget)} in revenue against a ${formatCurrency(dealSize)} average deal size and a ${cycleMonths}-month cycle.${existingCover} The math supports a team of ${aeCount} AE${aeCount !== 1 ? "s" : ""}${sdrCount > 0 ? ` and ${sdrCount} SDR${sdrCount !== 1 ? "s" : ""}` : ""} on the direct side${channelMix > 0 ? `, with ${channelMix}% of revenue flowing through partner channels` : ""}.${cacNote}${runwayNote}`;
}

const defaultInputs = {
  revenueTarget: 5000000,
  dealSize: 50000,
  winRate: 25,
  cycleMonths: 6,
  grossMargin: 65,
  inboundRatio: 40,
  competitive: "contested",
  existingRevenue: 1000000,
  totalAccounts: 2000,
  channelMix: 0,
  churnRate: 10,
  contractLength: "annual",
};

export default function GTMCoverageDesigner() {
  const [inputs, setInputs] = useState(defaultInputs);
  const [activeTab, setActiveTab] = useState("coverage");

  const set = useCallback((key, val) => setInputs(p => ({ ...p, [key]: val })), []);
  const results = compute(inputs);
  const narrative = buildNarrative(inputs, results);

  return (
    <div style={{ minHeight: "100vh", background: "#080c10", fontFamily: "'Inter', sans-serif", color: "#e2e8f0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        input[type=range] { -webkit-appearance: none; height: 4px; border-radius: 2px; background: #1e293b; outline: none; cursor: pointer; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #22c55e; cursor: pointer; border: 2px solid #080c10; box-shadow: 0 0 0 2px #22c55e44; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0f172a; } ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#0a0e14", borderBottom: "1px solid #1e293b", padding: "24px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#22c55e", marginBottom: 6 }}>GTM Architecture · Coverage Design</div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.02em" }}>GTM Coverage Model Designer</h1>
            <p style={{ margin: "4px 0 0", color: "#475569", fontSize: 13 }}>Input your business parameters. Get a recommended commercial architecture.</p>
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#1e293b", textAlign: "right" }}>
            David Hopper<br />Commercial Operations
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 40px 80px", display: "grid", gridTemplateColumns: "340px 1fr", gap: 28, alignItems: "start" }}>

        {/* INPUTS */}
        <div style={{ background: "#0a0e14", border: "1px solid #1e293b", borderRadius: 12, padding: "24px", position: "sticky", top: 24 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#475569", marginBottom: 20, paddingBottom: 12, borderBottom: "1px solid #1e293b" }}>Business Parameters</div>

          <InputField label="Annual Revenue Target" tooltip="Total revenue goal — new business plus expansion combined.">
            <SliderInput value={inputs.revenueTarget} onChange={v => set("revenueTarget", v)} min={500000} max={50000000} step={500000} format={formatCurrency} />
          </InputField>

          <InputField label="Existing / Recurring Revenue" tooltip="ARR or recurring revenue base you're carrying into the year. Reduces new business burden.">
            <SliderInput value={inputs.existingRevenue} onChange={v => set("existingRevenue", v)} min={0} max={inputs.revenueTarget} step={100000} format={formatCurrency} />
          </InputField>

          <InputField label="Average Deal Size" tooltip="Average closed-won contract value. Use ACV for subscription businesses.">
            <SliderInput value={inputs.dealSize} onChange={v => set("dealSize", v)} min={5000} max={500000} step={5000} format={formatCurrency} />
          </InputField>

          <InputField label="Win Rate" tooltip="Percentage of qualified opportunities that close. Be honest — most teams overestimate this.">
            <SliderInput value={inputs.winRate} onChange={v => set("winRate", v)} min={5} max={60} step={1} format={v => `${v}%`} />
          </InputField>

          <InputField label="Average Sales Cycle" tooltip="Months from qualified opportunity to closed-won. Include procurement and legal if applicable.">
            <SliderInput value={inputs.cycleMonths} onChange={v => set("cycleMonths", v)} min={1} max={18} step={1} format={v => `${v} mo`} />
          </InputField>

          <InputField label="Gross Margin" tooltip="Product/service gross margin. Drives CAC ceiling and determines how much you can spend to acquire a customer.">
            <SliderInput value={inputs.grossMargin} onChange={v => set("grossMargin", v)} min={10} max={90} step={5} format={v => `${v}%`} />
          </InputField>

          <InputField label="Inbound Pipeline Mix" tooltip="What percentage of pipeline originates from inbound (marketing, PLG, referral) vs. outbound prospecting.">
            <SliderInput value={inputs.inboundRatio} onChange={v => set("inboundRatio", v)} min={0} max={100} step={5} format={v => `${v}% inbound`} />
          </InputField>

          <InputField label="Partner / Channel Mix" tooltip="Percentage of revenue expected through partners, resellers, or channel. Remainder is direct.">
            <SliderInput value={inputs.channelMix} onChange={v => set("channelMix", v)} min={0} max={70} step={5} format={v => `${v}% partner`} />
          </InputField>

          <InputField label="Total Addressable Accounts" tooltip="How many companies in your ICP exist in the market you're pursuing. Used to calculate runway.">
            <SliderInput value={inputs.totalAccounts} onChange={v => set("totalAccounts", v)} min={100} max={50000} step={100} format={v => formatNumber(v) + " accts"} />
          </InputField>

          <InputField label="Annual Churn Rate" tooltip="Percentage of existing ARR lost annually to churn. Leave at 0 for new business only models. Adjusts gross new revenue required.">
            <SliderInput value={inputs.churnRate} onChange={v => set("churnRate", v)} min={0} max={40} step={1} format={v => v === 0 ? "No churn" : `${v}% churn`} />
          </InputField>

          <InputField label="Contract Length" tooltip="Longer contracts increase LTV and raise your CAC ceiling — allowing higher investment per deal. Annual assumes 1-year contracts.">
            <SegmentButton
              value={inputs.contractLength}
              onChange={v => set("contractLength", v)}
              options={[{ label: "Monthly", value: "monthly" }, { label: "Annual", value: "annual" }, { label: "2-Year", value: "multiyear2" }, { label: "3-Year", value: "multiyear3" }]}
            />
          </InputField>

          <InputField label="Annual Churn Rate" tooltip="Percentage of existing ARR lost annually to churn. Leave at 0 for new business only models. Adjusts gross new revenue required.">
            <SliderInput value={inputs.churnRate} onChange={v => set("churnRate", v)} min={0} max={40} step={1} format={v => v === 0 ? "No churn" : `${v}% churn`} />
          </InputField>

          <InputField label="Contract Length" tooltip="Longer contracts increase LTV and raise your CAC ceiling — allowing higher investment per deal. Annual assumes 1-year contracts.">
            <SegmentButton
              value={inputs.contractLength}
              onChange={v => set("contractLength", v)}
              options={[{ label: "Monthly", value: "monthly" }, { label: "Annual", value: "annual" }, { label: "2-Year", value: "multiyear2" }, { label: "3-Year", value: "multiyear3" }]}
            />
          </InputField>

          <InputField label="Competitive Position" tooltip="Greenfield: creating a new category. Contested: established category with active competition. Displacement: replacing an incumbent.">
            <SegmentButton
              value={inputs.competitive}
              onChange={v => set("competitive", v)}
              options={[{ label: "Greenfield", value: "greenfield" }, { label: "Contested", value: "contested" }, { label: "Displacement", value: "displacement" }]}
            />
          </InputField>
        </div>

        {/* OUTPUTS */}
        <div style={{ animation: "fadeIn 0.3s ease" }}>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "1px solid #1e293b" }}>
            {["coverage", "economics", "flags"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                background: "none", border: "none", padding: "10px 20px",
                fontFamily: "'DM Mono', monospace", fontSize: 11,
                letterSpacing: "0.08em", textTransform: "uppercase",
                color: activeTab === tab ? "#f1f5f9" : "#475569",
                borderBottom: activeTab === tab ? "2px solid #22c55e" : "2px solid transparent",
                cursor: "pointer", transition: "all 0.15s"
              }}>
                {tab === "flags" ? `Flags ${results.flags.length > 0 ? `(${results.flags.length})` : ""}` : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === "coverage" && (
            <div style={{ animation: "fadeIn 0.25s ease" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
                <MetricCard label="AEs Required" value={results.aeCount} sub={`${results.dealsPerRepPerYear} deals/rep/yr at ${inputs.cycleMonths}mo cycle`} highlight />
                <MetricCard label="SDRs Required" value={results.sdrCount} sub={`${Math.round((1 - inputs.inboundRatio/100) * 100)}% outbound pipeline burden`} />
                <MetricCard label="Pipeline Needed" value={formatCurrency(results.pipelineNeeded)} sub={`${results.coverageMultiple}x coverage on ${formatCurrency(results.newRevNeeded)} new revenue`} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
                <MetricCard label="Deals to Close" value={results.dealsNeeded} sub={`at ${formatCurrency(inputs.dealSize)} avg deal size`} />
                <MetricCard label="Opps Needed" value={formatNumber(results.oppsNeeded)} sub={`at ${inputs.winRate}% win rate`} />
                <MetricCard label="Account Runway" value={results.runwayYears > 20 ? "20+ yrs" : `${results.runwayYears.toFixed(1)} yrs`} sub={`${formatNumber(inputs.totalAccounts)} addressable accounts`} warning={results.runwayYears < 2} />
              </div>

              {/* Sequencing */}
              <div style={{ background: "#0a0e14", border: "1px solid #1e293b", borderRadius: 10, padding: "20px", marginBottom: 20 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#22c55e", marginBottom: 12 }}>Recommended Motion</div>
                <div style={{ display: "flex", gap: 20 }}>
                  {[
                    { label: "Motion Type", value: results.sequencing === "inbound-led" ? "Inbound-Led" : results.sequencing === "outbound-led" ? "Outbound-Driven" : "Blended" },
                    { label: "Competitive Context", value: inputs.competitive.charAt(0).toUpperCase() + inputs.competitive.slice(1) },
                    { label: "Channel Split", value: inputs.channelMix > 0 ? `${100 - inputs.channelMix}% direct · ${inputs.channelMix}% partner` : "100% direct" },
                    { label: "Active Deal Slots/Rep", value: results.activeDealSlots },
                  ].map(item => (
                    <div key={item.label} style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#475569", marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Narrative */}
              <div style={{ background: "#0a0e14", border: "1px solid #1e293b", borderLeft: "3px solid #22c55e", borderRadius: 8, padding: "18px 20px" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#22c55e", marginBottom: 10 }}>Architecture Summary</div>
                <p style={{ margin: 0, fontSize: 14, color: "#94a3b8", lineHeight: 1.75 }}>{narrative}</p>
              </div>
            </div>
          )}

          {activeTab === "economics" && (
            <div style={{ animation: "fadeIn 0.25s ease" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                <MetricCard label="CAC Ceiling" value={formatCurrency(Math.round(results.cacCeiling))} sub={`Max spend to acquire 1 customer at ${inputs.grossMargin}% margin`} highlight />
                <MetricCard label="Estimated CAC" value={formatCurrency(Math.round(results.estimatedCac))} sub="Based on rep OTE + mgmt overhead" warning={results.estimatedCac > results.cacCeiling} />
                <MetricCard label="Direct Revenue" value={formatCurrency(Math.round(results.directRevenue))} sub={`${100 - inputs.channelMix}% of target via direct motion`} />
                <MetricCard label="Partner Revenue" value={formatCurrency(Math.round(results.partnerRevenue))} sub={`${inputs.channelMix}% of target via channel`} />
              </div>
              <div style={{ background: "#0a0e14", border: "1px solid #1e293b", borderRadius: 10, padding: "20px" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#475569", marginBottom: 16 }}>Unit Economics Logic</div>
                {[
                  ["Revenue target", formatCurrency(inputs.revenueTarget)],
                  ["Existing / recurring base", formatCurrency(inputs.existingRevenue)],
                  ["Annual churn loss", inputs.churnRate > 0 ? `−${formatCurrency(Math.round(results.churnLoss))}` : "—"],
                  ["Gross new revenue needed", formatCurrency(results.newRevNeeded)],
                  ["Deals to close", results.dealsNeeded],
                  ["Opportunities needed", formatNumber(results.oppsNeeded)],
                  ["Pipeline required", formatCurrency(results.pipelineNeeded)],
                  ["Gross margin", `${inputs.grossMargin}%`],
                  ["CAC ceiling", formatCurrency(Math.round(results.cacCeiling))],
                  ["Estimated CAC", formatCurrency(Math.round(results.estimatedCac))],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1e293b" }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#475569" }}>{label}</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#e2e8f0", fontWeight: 600 }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "flags" && (
            <div style={{ animation: "fadeIn 0.25s ease" }}>
              {results.flags.length === 0 && results.insights.length === 0 && (
                <div style={{ padding: "48px 0", textAlign: "center", color: "#475569", fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                  No flags or insights generated for these inputs.
                </div>
              )}
              {results.flags.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#ef4444", marginBottom: 12 }}>⚠ Warning Flags ({results.flags.length})</div>
                  {results.flags.map((f, i) => <WarningFlag key={i} text={f} />)}
                </div>
              )}
              {results.insights.length > 0 && (
                <div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#22c55e", marginBottom: 12 }}>◆ Strategic Insights ({results.insights.length})</div>
                  {results.insights.map((f, i) => <InsightFlag key={i} text={f} />)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
