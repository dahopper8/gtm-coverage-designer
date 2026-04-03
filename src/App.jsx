import { useState, useCallback } from "react";

const T = {
  headerBg: "#0f172a", headerBorder: "#1e293b",
  pageBg: "#f8f9fb", cardBg: "#ffffff", cardBorder: "#e5e7eb",
  textPrimary: "#111827", textSecondary: "#374151",
  textMuted: "#6b7280", textFaint: "#9ca3af",
  accent: "#1a6b3c", accentLight: "#f0fdf4",
  accentBorder: "#bbf7d0", accentText: "#166534",
  success: "#16a34a", successLight: "#f0fdf4", successBorder: "#bbf7d0",
  warning: "#d97706", warningLight: "#fffbeb", warningBorder: "#fde68a",
  danger: "#dc2626", dangerLight: "#fef2f2", dangerBorder: "#fecaca",
  mono: "'DM Mono', monospace", sans: "'Inter', sans-serif",
};

const fc = (n) => n >= 1000000 ? `$${(n/1000000).toFixed(1)}M` : n >= 1000 ? `$${(n/1000).toFixed(0)}K` : `$${Math.round(n)}`;
const fn = (n) => n >= 1000 ? `${(n/1000).toFixed(1)}K` : String(Math.round(n));
const WORKING_WEEKS = 48, MGMT_OVERHEAD = 1.3;

const INDUSTRIES = {
  saas:                 { label:"B2B SaaS",                    repOTE:120000, oppsPerSdrPerMonth:8,  coverageBase:4, defaultCycle:6,  defaultWinRate:25, defaultDealSize:50000,  notes:"Subscription model, high inbound potential, SDR-heavy outbound, PLG variants common.", sdrsRelevant:true  },
  industrial:           { label:"Industrial / Manufacturing",   repOTE:95000,  oppsPerSdrPerMonth:4,  coverageBase:3, defaultCycle:9,  defaultWinRate:30, defaultDealSize:150000, notes:"Field sales dominant, distributor/channel-heavy, long incumbent relationships, SDR motion uncommon.", sdrsRelevant:false },
  professional_services:{ label:"Professional Services",        repOTE:110000, oppsPerSdrPerMonth:5,  coverageBase:3, defaultCycle:5,  defaultWinRate:35, defaultDealSize:80000,  notes:"Relationship-driven, partner-led, utilization constraints, referral pipeline significant.", sdrsRelevant:true  },
  healthcare:           { label:"Healthcare & Life Sciences",   repOTE:130000, oppsPerSdrPerMonth:4,  coverageBase:5, defaultCycle:12, defaultWinRate:20, defaultDealSize:200000, notes:"Regulated cycles, committee buying, GPO dynamics, high pipeline coverage required.", sdrsRelevant:true  },
  financial_services:   { label:"Financial Services",           repOTE:125000, oppsPerSdrPerMonth:5,  coverageBase:4, defaultCycle:8,  defaultWinRate:25, defaultDealSize:100000, notes:"Compliance-heavy, relationship-dependent, broker/advisor channel common.", sdrsRelevant:true  },
  logistics:            { label:"Logistics & Supply Chain",     repOTE:90000,  oppsPerSdrPerMonth:6,  coverageBase:3, defaultCycle:5,  defaultWinRate:30, defaultDealSize:60000,  notes:"RFP-driven, incumbent-heavy, margin-sensitive, contract length is a key economic lever.", sdrsRelevant:true  },
  government:           { label:"Government & Public Sector",   repOTE:105000, oppsPerSdrPerMonth:3,  coverageBase:5, defaultCycle:18, defaultWinRate:20, defaultDealSize:300000, notes:"Procurement-driven, longest cycles, sole-source vs. competitive bid, no traditional pipeline motion.", sdrsRelevant:false },
};

function computePlan(i) {
  const wd=i.winRate/100, id=i.inboundRatio/100, pd=i.channelMix/100, cd=i.churnRate/100;
  const industry = INDUSTRIES[i.industry]||INDUSTRIES.saas;
  const repOTE = industry.repOTE;
  const churnLoss=i.existingRevenue*cd;
  const newRev=Math.max(0,i.revenueTarget-i.existingRevenue+churnLoss);
  const deals=newRev/i.dealSize, opps=deals/wd;
  const slots=Math.max(3,Math.min(10,Math.round(8-i.cycleMonths*0.4)));
  const dpy=(WORKING_WEEKS/(i.cycleMonths*4.33))*slots*wd;
  const aeCount=Math.ceil((deals*(1-pd))/dpy);
  const oppsPerSdr=industry.oppsPerSdrPerMonth;
  const sdrCount=Math.ceil((opps*(1-pd)*(1-id))/(oppsPerSdr*12));
  const cov=industry.coverageBase+(i.dealSize>150000?1:i.dealSize>50000?0:-1);
  const pipe=newRev*cov;
  const cm=i.contractLength==="multiyear3"?2.4:i.contractLength==="multiyear2"?1.7:1.0;
  const ltv=i.dealSize*cm*(1/(1-Math.min(0.9,wd*0.3+0.7)))*(i.grossMargin/100);
  const cacCeil=ltv*0.33;
  const estCac=deals>0?((aeCount+sdrCount)*repOTE*MGMT_OVERHEAD)/deals:0;
  const runway=i.totalAccounts>0?i.totalAccounts/(opps*(i.cycleMonths/12)*2):999;
  const seq=id>0.6&&i.dealSize<50000?"inbound-led":id<0.3||i.dealSize>100000?"outbound-led":"blended";
  const flags=[],insights=[];
  if(runway<2)flags.push(`Your addressable account count (${fn(i.totalAccounts)}) suggests market exhaustion in under ${runway.toFixed(1)} years at this velocity.`);
  if(estCac>cacCeil*1.2)flags.push(`Estimated CAC (${fc(estCac)}) exceeds the margin-adjusted ceiling (${fc(cacCeil)}). Unit economics don't close at this rep cost and win rate.`);
  if(i.cycleMonths>9&&id>0.5)flags.push(`A ${i.cycleMonths}-month cycle with ${i.inboundRatio}% inbound is unusual — either the cycle is artificially long or inbound mix is optimistic.`);
  if(i.competitive==="displacement"&&i.cycleMonths<4)flags.push(`Displacement selling with a ${i.cycleMonths}-month cycle is aggressive. Unseating incumbents typically adds 2–4 months.`);
  if(sdrCount>aeCount*2)flags.push(`SDR-to-AE ratio (${sdrCount}:${aeCount}) means pipeline generation will outrun closing capacity.`);
  if(i.churnRate>0){const b=Math.round((churnLoss/Math.max(1,newRev))*100);if(b>30)flags.push(`Churn is consuming ${b}% of your new business effort before you grow a dollar.`);else if(b>15)insights.push(`Churn adds ${fc(Math.round(churnLoss))} to your effective revenue target — ${b}% of your new business burden is replacement, not growth.`);}
  if(i.contractLength==="multiyear3")insights.push(`3-year contracts raise your CAC ceiling roughly 2.4x vs. annual contracts by extending LTV.`);
  if(i.winRate>40&&i.competitive==="contested")insights.push(`A ${i.winRate}% win rate in a contested market is strong. Formalize what's working before the team grows.`);
  if(i.existingRevenue>i.revenueTarget*0.5)insights.push(`Existing revenue covers ${Math.round((i.existingRevenue/i.revenueTarget)*100)}% of your target. Expansion and retention are your primary lever.`);
  return{aeCount,sdrCount,pipelineNeeded:pipe,coverageMultiple:cov,dealsNeeded:Math.ceil(deals),oppsNeeded:Math.ceil(opps),cacCeiling:cacCeil,estimatedCac:estCac,runwayYears:runway,churnLoss,newRevNeeded:newRev,partnerRevenue:i.revenueTarget*pd,directRevenue:i.revenueTarget*(1-pd),sequencing:seq,flags,insights,activeDealSlots:slots,dealsPerRepPerYear:Math.round(dpy*10)/10};
}

// ─── LEVER SENSITIVITY ────────────────────────────────────────────────────────
function computeLeverSensitivity(inputs, baseResults) {
  const baseGap = baseResults.newRevNeeded;
  if (baseGap <= 0) return [];

  const levers = [];

  // Win rate +5pp
  const wrUp = computePlan({ ...inputs, winRate: Math.min(60, inputs.winRate + 5) });
  const wrRevGain = baseGap - wrUp.newRevNeeded;
  levers.push({ label: `Win rate +5pp (${inputs.winRate}% → ${Math.min(60, inputs.winRate+5)}%)`, aeDelta: baseResults.aeCount - wrUp.aeCount, pipeDelta: baseResults.pipelineNeeded - wrUp.pipelineNeeded, impact: wrRevGain, type: "winrate" });

  // Add 1 AE
  const aeUp = computePlan({ ...inputs, revenueTarget: inputs.revenueTarget }); // same — AE is output not input
  const revPerAE = baseResults.aeCount > 0 ? (inputs.revenueTarget - inputs.existingRevenue) / baseResults.aeCount : 0;
  levers.push({ label: "Add 1 AE", aeDelta: -1, pipeDelta: 0, impact: revPerAE, type: "headcount" });

  // Cycle -2 months
  if (inputs.cycleMonths > 2) {
    const cyUp = computePlan({ ...inputs, cycleMonths: inputs.cycleMonths - 2 });
    levers.push({ label: `Cycle -2mo (${inputs.cycleMonths}mo → ${inputs.cycleMonths-2}mo)`, aeDelta: baseResults.aeCount - cyUp.aeCount, pipeDelta: 0, impact: baseGap - cyUp.newRevNeeded, type: "cycle" });
  }

  // Churn -5pp
  if (inputs.churnRate >= 5) {
    const chUp = computePlan({ ...inputs, churnRate: inputs.churnRate - 5 });
    levers.push({ label: `Churn -5pp (${inputs.churnRate}% → ${inputs.churnRate-5}%)`, aeDelta: baseResults.aeCount - chUp.aeCount, pipeDelta: baseResults.pipelineNeeded - chUp.pipelineNeeded, impact: baseGap - chUp.newRevNeeded, type: "churn" });
  }

  // Deal size +10%
  const dsUp = computePlan({ ...inputs, dealSize: Math.round(inputs.dealSize * 1.1) });
  levers.push({ label: `Deal size +10% (${fc(inputs.dealSize)} → ${fc(Math.round(inputs.dealSize*1.1))})`, aeDelta: baseResults.aeCount - dsUp.aeCount, pipeDelta: baseResults.pipelineNeeded - dsUp.pipelineNeeded, impact: baseGap - dsUp.newRevNeeded, type: "dealsize" });

  return levers.sort((a, b) => b.impact - a.impact);
}

function computeDiagnose(i) {
  const industry=INDUSTRIES[i.industry]||INDUSTRIES.saas;
  const wd=i.winRate/100,id=i.inboundRatio/100,pd=i.channelMix/100,cd=i.churnRate/100;
  const slots=Math.max(3,Math.min(10,Math.round(8-i.cycleMonths*0.4)));
  const dpy=(WORKING_WEEKS/(i.cycleMonths*4.33))*slots*wd;
  const outboundOpps=i.sdrCount*i.avgOppsPerSdrPerMonth*12;
  const totalOpps=id<1?outboundOpps/Math.max(0.01,1-id):outboundOpps;
  const closable=Math.min(dpy*i.aeCount,totalOpps*wd);
  const directRev=closable*i.dealSize;
  const partnerRev=directRev*(pd/Math.max(0.01,1-pd));
  const churnLoss=i.existingRevenue*cd;
  const projected=Math.round(i.existingRevenue-churnLoss+directRev+partnerRev);
  const gap=Math.round(i.revenueTarget-projected);
  const onTrack=gap<=0;
  const gapDeals=gap>0?Math.ceil(gap/i.dealSize):0;
  const addlAEs=gap>0?Math.ceil(gapDeals/dpy):0;
  const addlOpps=gap>0?Math.ceil(gapDeals/wd):0;
  const constraints=[];
  const capRatio=(dpy*i.aeCount)>0?closable/(dpy*i.aeCount):0;
  if(i.sdrCount===0&&id<0.8)constraints.push({label:"No outbound pipeline generation",detail:`With 0 SDRs and ${Math.round(id*100)}% inbound, all pipeline depends on inbound volume. Any shortfall directly reduces revenue.`,severity:"high"});
  if(wd<0.2)constraints.push({label:"Low win rate is the primary drag",detail:`A ${i.winRate}% win rate means you need ${Math.round(1/wd)}x pipeline per deal. Improving to 30% would add roughly ${fc(Math.round(i.aeCount*dpy*(0.3-wd)*i.dealSize))} in projected revenue.`,severity:"high"});
  if(i.cycleMonths>9)constraints.push({label:"Long cycle compresses annual capacity",detail:`A ${i.cycleMonths}-month cycle limits each AE to ${dpy.toFixed(1)} deals/year. Compressing by 2 months would materially increase throughput.`,severity:"medium"});
  if(cd>0.15)constraints.push({label:`High churn (${i.churnRate}%) eroding the base`,detail:`You're losing ${fc(Math.round(churnLoss))} annually to churn. Cutting churn in half would add ${fc(Math.round(churnLoss*0.5))} to projected revenue without a single new deal.`,severity:cd>0.25?"high":"medium"});
  if(i.aeCount>0&&capRatio<0.7)constraints.push({label:"Pipeline supply is the bottleneck",detail:`AEs have capacity for ${Math.round(dpy*i.aeCount)} deals but pipeline only supports ${Math.round(closable)}. Invest in pipeline generation before adding closers.`,severity:"medium"});
  if(i.aeCount>0&&capRatio>1.3)constraints.push({label:"Closing capacity is the bottleneck",detail:`Pipeline exceeds what your ${i.aeCount} AE${i.aeCount!==1?"s":""} can close. Adding ${addlAEs} AE${addlAEs!==1?"s":""} could recover the gap.`,severity:"medium"});
  const insights=[];
  if(onTrack)insights.push(`At current setup you're projecting ${fc(projected)} — ${fc(Math.abs(gap))} above target. Adjust inputs to stress-test assumptions.`);
  if(i.sdrCount>0&&id>0.6)insights.push(`With ${Math.round(id*100)}% inbound and ${i.sdrCount} SDR${i.sdrCount!==1?"s":""}, verify SDR-sourced pipeline is closing at a rate that justifies the headcount cost.`);
  return{projectedRevenue:projected,grossNewRevenue:Math.round(directRev+partnerRev),directRevenue:Math.round(directRev),partnerRevenue:Math.round(partnerRev),churnLoss:Math.round(churnLoss),closableDeals:Math.round(closable),totalOpps:Math.round(totalOpps),dealsPerRepPerYear:Math.round(dpy*10)/10,activeDealSlots:slots,gap,gapPct:Math.round((gap/Math.max(1,i.revenueTarget))*100),gapDeals,addlAEs,addlOpps,onTrack,constraints,insights};
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
function Tooltip({text}){
  const[show,setShow]=useState(false);
  return(<span style={{position:"relative",display:"inline-block",marginLeft:5}}>
    <span onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}
      style={{cursor:"help",color:T.textFaint,fontSize:11,fontFamily:T.mono,border:`1px solid ${T.cardBorder}`,borderRadius:"50%",width:15,height:15,display:"inline-flex",alignItems:"center",justifyContent:"center",background:T.cardBg}}>?</span>
    {show&&<div style={{position:"absolute",bottom:"calc(100% + 6px)",left:"50%",transform:"translateX(-50%)",background:T.headerBg,border:`1px solid ${T.headerBorder}`,borderRadius:6,padding:"8px 12px",width:220,fontSize:12,color:"#94a3b8",lineHeight:1.5,zIndex:100,pointerEvents:"none"}}>{text}</div>}
  </span>);
}

function Field({label,tooltip,children}){
  return(<div style={{marginBottom:20}}>
    <label style={{display:"flex",alignItems:"center",fontFamily:T.mono,fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",color:T.textMuted,marginBottom:8}}>
      {label}{tooltip&&<Tooltip text={tooltip}/>}
    </label>
    {children}
  </div>);
}

function Slider({value,onChange,min,max,step,format}){
  return(<div>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
      <span style={{fontFamily:T.mono,fontSize:14,color:T.textPrimary,fontWeight:700}}>{format(value)}</span>
      <span style={{fontFamily:T.mono,fontSize:11,color:T.textFaint}}>{format(min)} – {format(max)}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))} style={{width:"100%",accentColor:T.accent,cursor:"pointer"}}/>
  </div>);
}

function SegBtn({options,value,onChange}){
  return(<div style={{display:"flex",gap:1,background:T.cardBorder,borderRadius:7,padding:2}}>
    {options.map(o=>(
      <button key={o.value} onClick={()=>onChange(o.value)} style={{flex:1,padding:"7px 6px",background:value===o.value?T.headerBg:T.cardBg,border:"none",borderRadius:5,cursor:"pointer",fontFamily:T.mono,fontSize:10,letterSpacing:"0.06em",textTransform:"uppercase",color:value===o.value?"#f1f5f9":"#94a3b8",transition:"all 0.15s",fontWeight:value===o.value?600:400}}>{o.label}</button>
    ))}
  </div>);
}

function Delta({curr,base,format,higherIsBetter=true}){
  if(base===null||base===undefined)return null;
  const diff=curr-base;
  if(diff===0)return null;
  const good=(diff>0&&higherIsBetter)||(diff<0&&!higherIsBetter);
  const color=good?T.success:T.danger;
  const sign=diff>0?"+":"";
  return(
    <span style={{fontFamily:T.mono,fontSize:10,color,fontWeight:600,marginLeft:6,
      background:good?T.successLight:T.dangerLight,border:`1px solid ${good?T.successBorder:T.dangerBorder}`,
      borderRadius:4,padding:"1px 5px",display:"inline-block"}}>
      {sign}{typeof format==="function"?format(Math.abs(diff)):diff}
    </span>
  );
}

function Card({label,value,sub,warning,muted,baseValue,format,higherIsBetter}){
  return(<div style={{background:T.cardBg,border:`1px solid ${T.cardBorder}`,borderTop:`3px solid ${warning?T.danger:muted?T.cardBorder:"#334155"}`,borderRadius:8,padding:"16px 18px"}}>
    <div style={{fontFamily:T.mono,fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",color:warning?T.danger:T.textMuted,marginBottom:8}}>{label}</div>
    <div style={{display:"flex",alignItems:"baseline",gap:4,flexWrap:"wrap"}}>
      <span style={{fontFamily:T.mono,fontSize:24,fontWeight:700,color:warning?T.danger:T.textPrimary,lineHeight:1}}>{value}</span>
      {baseValue!==undefined&&<Delta curr={typeof value==="number"?value:parseFloat(String(value).replace(/[^0-9.-]/g,""))} base={typeof baseValue==="number"?baseValue:parseFloat(String(baseValue).replace(/[^0-9.-]/g,""))} format={format} higherIsBetter={higherIsBetter}/>}
    </div>
    {sub&&<div style={{fontFamily:T.mono,fontSize:11,color:T.textFaint,marginTop:6,lineHeight:1.4}}>{sub}</div>}
  </div>);
}

function Flag({text,type}){
  const c={warning:{bg:T.dangerLight,border:T.dangerBorder,left:T.danger,icon:"⚠",color:"#991b1b"},insight:{bg:T.accentLight,border:T.accentBorder,left:T.accent,icon:"◆",color:T.accentText},medium:{bg:T.warningLight,border:T.warningBorder,left:T.warning,icon:"◎",color:"#92400e"}}[type]||{};
  return(<div style={{display:"flex",gap:12,alignItems:"flex-start",padding:"12px 14px",background:c.bg,border:`1px solid ${c.border}`,borderLeft:`3px solid ${c.left}`,borderRadius:6,marginBottom:8}}>
    <span style={{color:c.left,fontSize:13,flexShrink:0,marginTop:1}}>{c.icon}</span>
    <p style={{fontFamily:T.sans,fontSize:13,color:c.color,margin:0,lineHeight:1.6}}>{text}</p>
  </div>);
}

const dPlan={industry:"saas",revenueTarget:5000000,dealSize:50000,winRate:25,cycleMonths:6,grossMargin:65,inboundRatio:40,competitive:"contested",existingRevenue:1000000,totalAccounts:2000,channelMix:0,churnRate:10,contractLength:"annual"};
const dDiag={industry:"saas",aeCount:4,sdrCount:2,dealSize:50000,winRate:25,cycleMonths:6,grossMargin:65,inboundRatio:40,existingRevenue:1000000,channelMix:0,churnRate:10,avgOppsPerSdrPerMonth:8,revenueTarget:5000000};

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function GTMCoverageDesigner(){
  const[mode,setMode]=useState("plan");
  const[tab,setTab]=useState("coverage");
  const[pi,setPi]=useState(dPlan);
  const[di,setDi]=useState(dDiag);
  const[baseline,setBaseline]=useState(null); // pinned baseline results
  const sp=useCallback((k,v)=>setPi(p=>({...p,[k]:v})),[]);
  const sd=useCallback((k,v)=>setDi(p=>({...p,[k]:v})),[]);
  const pr=computePlan(pi);
  const dr=computeDiagnose(di);
  const levers=computeLeverSensitivity(pi,pr);
  const projColor=dr.onTrack?T.success:T.danger;

  const planTabs=[
    {key:"coverage",label:"Coverage"},
    {key:"sensitivity",label:"Lever Analysis"},
    {key:"economics",label:"Economics"},
    {key:"flags",label:`Flags${pr.flags.length>0?` (${pr.flags.length})`:""}`},
  ];

  const pinBaseline=()=>setBaseline({results:{...pr},inputs:{...pi}});
  const clearBaseline=()=>setBaseline(null);
  const bl=baseline?.results;

  const IND=INDUSTRIES[pi.industry]||INDUSTRIES.saas;
  const IND_D=INDUSTRIES[di.industry]||INDUSTRIES.saas;

  return(
    <div style={{minHeight:"100vh",background:T.pageBg,fontFamily:T.sans,color:T.textPrimary}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(5px);}to{opacity:1;transform:translateY(0);}}
        input[type=range]{-webkit-appearance:none;height:3px;border-radius:2px;background:#e5e7eb;outline:none;width:100%;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:#1a6b3c;cursor:pointer;border:2px solid white;box-shadow:0 1px 4px rgba(26,107,60,0.35);}
        select{appearance:none;}
      `}</style>

      {/* Header */}
      <div style={{background:T.headerBg,padding:"20px 40px",borderBottom:`1px solid ${T.headerBorder}`}}>
        <div style={{maxWidth:1080,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontFamily:T.mono,fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",color:T.accent,marginBottom:5}}>GTM Architecture · Coverage Design</div>
            <h1 style={{margin:0,fontSize:20,fontWeight:700,color:"#f1f5f9",letterSpacing:"-0.02em"}}>GTM Coverage Model Designer</h1>
            <p style={{margin:"3px 0 0",color:"#64748b",fontSize:13}}>
              {mode==="plan"?"Set a target. Get the team and pipeline required to hit it.":"Enter your current setup. See where you're going to land."}
            </p>
          </div>
          <div style={{display:"flex",gap:1,background:T.headerBorder,borderRadius:7,padding:2}}>
            {[{v:"plan",l:"Plan"},{v:"diagnose",l:"Diagnose"}].map(m=>(
              <button key={m.v} onClick={()=>{setMode(m.v);setTab("coverage");setBaseline(null);}} style={{padding:"9px 22px",background:mode===m.v?"#1e293b":"transparent",border:"none",borderRadius:5,cursor:"pointer",fontFamily:T.mono,fontSize:11,letterSpacing:"0.08em",textTransform:"uppercase",color:mode===m.v?"#f1f5f9":"#94a3b8",transition:"all 0.15s",fontWeight:mode===m.v?600:400}}>{m.l}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:1080,margin:"0 auto",padding:"32px 40px 80px",display:"grid",gridTemplateColumns:"320px 1fr",gap:24,alignItems:"start"}}>

        {/* PLAN INPUT */}
        {mode==="plan"&&(
          <div style={{background:T.cardBg,border:`1px solid ${T.cardBorder}`,borderRadius:10,padding:"24px",position:"sticky",top:24,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,paddingBottom:12,borderBottom:`1px solid ${T.cardBorder}`}}>
              <div style={{fontFamily:T.mono,fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",color:T.textMuted}}>Parameters</div>
              {!baseline
                ?<button onClick={pinBaseline} style={{fontFamily:T.mono,fontSize:9,letterSpacing:"0.08em",textTransform:"uppercase",background:T.headerBg,color:"#94a3b8",border:"none",borderRadius:5,padding:"5px 10px",cursor:"pointer"}}>Pin Baseline</button>
                :<button onClick={clearBaseline} style={{fontFamily:T.mono,fontSize:9,letterSpacing:"0.08em",textTransform:"uppercase",background:T.dangerLight,color:T.danger,border:`1px solid ${T.dangerBorder}`,borderRadius:5,padding:"5px 10px",cursor:"pointer"}}>Clear Baseline</button>
              }
            </div>
            {baseline&&(
              <div style={{background:T.accentLight,border:`1px solid ${T.accentBorder}`,borderRadius:6,padding:"8px 12px",marginBottom:16}}>
                <div style={{fontFamily:T.mono,fontSize:9,color:T.accent,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:3}}>Baseline Pinned</div>
                <div style={{fontFamily:T.mono,fontSize:10,color:T.accentText,lineHeight:1.4}}>
                  {INDUSTRIES[baseline.inputs.industry]?.label} · {fc(baseline.inputs.revenueTarget)} target · {baseline.inputs.winRate}% win rate · {baseline.results.aeCount} AEs
                </div>
              </div>
            )}
            <Field label="Industry" tooltip="Sets rep OTE, SDR activity rates, and pipeline coverage assumptions.">
              <select value={pi.industry} onChange={e=>sp("industry",e.target.value)} style={{width:"100%",padding:"8px 10px",border:`1px solid ${T.cardBorder}`,borderRadius:6,fontFamily:T.mono,fontSize:11,color:T.textPrimary,background:T.cardBg,cursor:"pointer"}}>
                {Object.entries(INDUSTRIES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
              <div style={{fontFamily:T.mono,fontSize:10,color:T.textFaint,marginTop:6,lineHeight:1.4}}>{IND.notes}</div>
            </Field>
            <Field label="Annual Revenue Target"><Slider value={pi.revenueTarget} onChange={v=>sp("revenueTarget",v)} min={500000} max={50000000} step={500000} format={fc}/></Field>
            <Field label="Existing / Recurring Revenue" tooltip="ARR carrying into the year."><Slider value={pi.existingRevenue} onChange={v=>sp("existingRevenue",v)} min={0} max={pi.revenueTarget} step={100000} format={fc}/></Field>
            <Field label="Average Deal Size"><Slider value={pi.dealSize} onChange={v=>sp("dealSize",v)} min={5000} max={500000} step={5000} format={fc}/></Field>
            <Field label="Win Rate" tooltip="Qualified opps that close."><Slider value={pi.winRate} onChange={v=>sp("winRate",v)} min={5} max={60} step={1} format={v=>`${v}%`}/></Field>
            <Field label="Average Sales Cycle"><Slider value={pi.cycleMonths} onChange={v=>sp("cycleMonths",v)} min={1} max={18} step={1} format={v=>`${v} mo`}/></Field>
            <Field label="Gross Margin" tooltip="Drives CAC ceiling."><Slider value={pi.grossMargin} onChange={v=>sp("grossMargin",v)} min={10} max={90} step={5} format={v=>`${v}%`}/></Field>
            <Field label="Inbound Pipeline Mix"><Slider value={pi.inboundRatio} onChange={v=>sp("inboundRatio",v)} min={0} max={100} step={5} format={v=>`${v}% inbound`}/></Field>
            <Field label="Partner / Channel Mix"><Slider value={pi.channelMix} onChange={v=>sp("channelMix",v)} min={0} max={70} step={5} format={v=>`${v}% partner`}/></Field>
            <Field label="Annual Churn Rate"><Slider value={pi.churnRate} onChange={v=>sp("churnRate",v)} min={0} max={40} step={1} format={v=>v===0?"No churn":`${v}% churn`}/></Field>
            <Field label="Total Addressable Accounts"><Slider value={pi.totalAccounts} onChange={v=>sp("totalAccounts",v)} min={100} max={50000} step={100} format={v=>fn(v)+" accts"}/></Field>
            <Field label="Contract Length" tooltip="Longer contracts raise your CAC ceiling.">
              <SegBtn value={pi.contractLength} onChange={v=>sp("contractLength",v)} options={[{label:"Mo",value:"monthly"},{label:"1yr",value:"annual"},{label:"2yr",value:"multiyear2"},{label:"3yr",value:"multiyear3"}]}/>
            </Field>
            <Field label="Competitive Position">
              <SegBtn value={pi.competitive} onChange={v=>sp("competitive",v)} options={[{label:"Greenfield",value:"greenfield"},{label:"Contested",value:"contested"},{label:"Displace",value:"displacement"}]}/>
            </Field>
          </div>
        )}

        {/* DIAGNOSE INPUT */}
        {mode==="diagnose"&&(
          <div style={{background:T.cardBg,border:`1px solid ${T.cardBorder}`,borderRadius:10,padding:"24px",position:"sticky",top:24,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
            <div style={{fontFamily:T.mono,fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",color:T.textMuted,marginBottom:20,paddingBottom:12,borderBottom:`1px solid ${T.cardBorder}`}}>Current Setup</div>
            <Field label="Industry" tooltip="Sets rep OTE and activity rate assumptions.">
              <select value={di.industry} onChange={e=>sd("industry",e.target.value)} style={{width:"100%",padding:"8px 10px",border:`1px solid ${T.cardBorder}`,borderRadius:6,fontFamily:T.mono,fontSize:11,color:T.textPrimary,background:T.cardBg,cursor:"pointer"}}>
                {Object.entries(INDUSTRIES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
              <div style={{fontFamily:T.mono,fontSize:10,color:T.textFaint,marginTop:6,lineHeight:1.4}}>{IND_D.notes}</div>
            </Field>
            <Field label="Revenue Target" tooltip="What you're trying to hit."><Slider value={di.revenueTarget} onChange={v=>sd("revenueTarget",v)} min={500000} max={50000000} step={500000} format={fc}/></Field>
            <Field label="AE Count"><Slider value={di.aeCount} onChange={v=>sd("aeCount",v)} min={0} max={30} step={1} format={v=>`${v} AE${v!==1?"s":""}`}/></Field>
            <Field label="SDR Count"><Slider value={di.sdrCount} onChange={v=>sd("sdrCount",v)} min={0} max={20} step={1} format={v=>v===0?"No SDRs":`${v} SDR${v!==1?"s":""}`}/></Field>
            <Field label="Avg Opps / SDR / Month"><Slider value={di.avgOppsPerSdrPerMonth} onChange={v=>sd("avgOppsPerSdrPerMonth",v)} min={1} max={20} step={1} format={v=>`${v} opps/mo`}/></Field>
            <Field label="Average Deal Size"><Slider value={di.dealSize} onChange={v=>sd("dealSize",v)} min={5000} max={500000} step={5000} format={fc}/></Field>
            <Field label="Win Rate"><Slider value={di.winRate} onChange={v=>sd("winRate",v)} min={5} max={60} step={1} format={v=>`${v}%`}/></Field>
            <Field label="Average Sales Cycle"><Slider value={di.cycleMonths} onChange={v=>sd("cycleMonths",v)} min={1} max={18} step={1} format={v=>`${v} mo`}/></Field>
            <Field label="Inbound Pipeline Mix"><Slider value={di.inboundRatio} onChange={v=>sd("inboundRatio",v)} min={0} max={100} step={5} format={v=>`${v}% inbound`}/></Field>
            <Field label="Existing / Recurring Revenue"><Slider value={di.existingRevenue} onChange={v=>sd("existingRevenue",v)} min={0} max={20000000} step={100000} format={fc}/></Field>
            <Field label="Annual Churn Rate"><Slider value={di.churnRate} onChange={v=>sd("churnRate",v)} min={0} max={40} step={1} format={v=>v===0?"No churn":`${v}% churn`}/></Field>
            <Field label="Partner / Channel Mix"><Slider value={di.channelMix} onChange={v=>sd("channelMix",v)} min={0} max={70} step={5} format={v=>`${v}% partner`}/></Field>
          </div>
        )}

        {/* PLAN OUTPUT */}
        {mode==="plan"&&(
          <div>
            <div style={{display:"flex",borderBottom:`1px solid ${T.cardBorder}`,marginBottom:20}}>
              {planTabs.map(t=>(
                <button key={t.key} onClick={()=>setTab(t.key)} style={{background:"none",border:"none",padding:"10px 18px",fontFamily:T.mono,fontSize:11,letterSpacing:"0.08em",textTransform:"uppercase",color:tab===t.key?T.accent:"#94a3b8",borderBottom:tab===t.key?`2px solid ${T.accent}`:"2px solid transparent",cursor:"pointer",transition:"all 0.15s",fontWeight:tab===t.key?600:400}}>{t.label}</button>
              ))}
            </div>

            {tab==="coverage"&&(
              <div style={{animation:"fadeIn 0.25s ease"}}>
                {bl&&(
                  <div style={{background:T.headerBg,border:`1px solid ${T.headerBorder}`,borderRadius:8,padding:"10px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
                    <span style={{fontFamily:T.mono,fontSize:9,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.08em"}}>Comparing to baseline:</span>
                    <span style={{fontFamily:T.mono,fontSize:10,color:"#94a3b8"}}>{INDUSTRIES[baseline.inputs.industry]?.label} · {fc(baseline.inputs.revenueTarget)} · {baseline.inputs.winRate}% win · {bl.aeCount} AEs</span>
                    <span style={{fontFamily:T.mono,fontSize:9,color:T.success,marginLeft:"auto"}}>● deltas shown on cards</span>
                  </div>
                )}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:12}}>
                  <Card label="AEs Required" value={pr.aeCount} sub={`${pr.dealsPerRepPerYear} deals/rep/yr · ${pi.cycleMonths}mo cycle`} baseValue={bl?.aeCount} higherIsBetter={false}/>
                  <Card label="SDRs Required" value={pr.sdrCount} sub={`${Math.round((1-pi.inboundRatio/100)*100)}% outbound burden`} muted baseValue={bl?.sdrCount} higherIsBetter={false}/>
                  <Card label="Pipeline Needed" value={fc(pr.pipelineNeeded)} sub={`${pr.coverageMultiple}x coverage`} muted baseValue={bl?.pipelineNeeded} format={fc} higherIsBetter={false}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
                  <Card label="Deals to Close" value={pr.dealsNeeded} sub={`at ${fc(pi.dealSize)} avg`} muted baseValue={bl?.dealsNeeded} higherIsBetter={false}/>
                  <Card label="Opps Needed" value={fn(pr.oppsNeeded)} sub={`at ${pi.winRate}% win rate`} muted baseValue={bl?.oppsNeeded} higherIsBetter={false}/>
                  <Card label="Account Runway" value={pr.runwayYears>20?"20+ yrs":`${pr.runwayYears.toFixed(1)} yrs`} sub={`${fn(pi.totalAccounts)} addressable`} warning={pr.runwayYears<2}/>
                </div>
                <div style={{background:T.cardBg,border:`1px solid ${T.cardBorder}`,borderRadius:10,padding:"20px",marginBottom:16,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                  <div style={{fontFamily:T.mono,fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",color:T.accent,marginBottom:14}}>Recommended Motion</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16}}>
                    {[
                      {label:"Motion Type",value:pr.sequencing==="inbound-led"?"Inbound-Led":pr.sequencing==="outbound-led"?"Outbound-Driven":"Blended"},
                      {label:"Competitive Context",value:pi.competitive.charAt(0).toUpperCase()+pi.competitive.slice(1)},
                      {label:"Channel Split",value:pi.channelMix>0?`${100-pi.channelMix}% direct · ${pi.channelMix}% partner`:"100% direct"},
                      {label:"Deal Slots / Rep",value:pr.activeDealSlots},
                    ].map(item=>(
                      <div key={item.label}>
                        <div style={{fontFamily:T.mono,fontSize:10,color:T.textFaint,marginBottom:4,letterSpacing:"0.06em",textTransform:"uppercase"}}>{item.label}</div>
                        <div style={{fontSize:14,fontWeight:600,color:T.textPrimary}}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{background:T.accentLight,border:`1px solid ${T.accentBorder}`,borderLeft:`3px solid ${T.accent}`,borderRadius:8,padding:"16px 18px"}}>
                  <div style={{fontFamily:T.mono,fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",color:T.accent,marginBottom:8}}>Architecture Summary</div>
                  <p style={{margin:0,fontSize:14,color:T.accentText,lineHeight:1.75}}>
                    {`[${IND.label}] This is a ${pr.sequencing==="inbound-led"?"inbound-led":pr.sequencing==="outbound-led"?"outbound-driven":"blended"}, ${pi.competitive} motion targeting ${fc(pi.revenueTarget)} against a ${fc(pi.dealSize)} average deal and ${pi.cycleMonths}-month cycle. The math supports ${pr.aeCount} AE${pr.aeCount!==1?"s":""}${pr.sdrCount>0?` and ${pr.sdrCount} SDR${pr.sdrCount!==1?"s":""}`:""} on direct${pi.channelMix>0?`, with ${pi.channelMix}% through partners`:""}. ${pr.estimatedCac>pr.cacCeiling?`Unit economics are tight — estimated CAC (${fc(Math.round(pr.estimatedCac))}) is above the margin-adjusted ceiling (${fc(Math.round(pr.cacCeiling))}).`:`Unit economics are workable — estimated CAC (${fc(Math.round(pr.estimatedCac))}) is below the margin-adjusted ceiling (${fc(Math.round(pr.cacCeiling))}).`}`}
                  </p>
                </div>
              </div>
            )}

            {tab==="sensitivity"&&(
              <div style={{animation:"fadeIn 0.25s ease"}}>
                <div style={{background:T.cardBg,border:`1px solid ${T.cardBorder}`,borderRadius:10,padding:"20px",marginBottom:16,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                  <div style={{fontFamily:T.mono,fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",color:T.textMuted,marginBottom:6}}>Lever Sensitivity Analysis</div>
                  <p style={{margin:"0 0 20px",fontSize:13,color:T.textMuted,lineHeight:1.6}}>Which variables have the most impact on your revenue gap? Ranked by effect on gross new revenue needed, holding all else equal.</p>
                  {levers.length===0?(
                    <div style={{padding:"24px 0",textAlign:"center",color:T.textFaint,fontFamily:T.mono,fontSize:12}}>No gap to analyze — you're already at or above target.</div>
                  ):(
                    levers.map((lever,i)=>{
                      const isTop=i===0;
                      const typeColors={winrate:T.accent,headcount:"#334155",cycle:"#7c3aed",churn:T.danger,dealsize:"#0891b2"};
                      const color=typeColors[lever.type]||T.textMuted;
                      const barWidth=levers[0].impact>0?Math.max(8,Math.round((lever.impact/levers[0].impact)*100)):8;
                      return(
                        <div key={i} style={{marginBottom:14,paddingBottom:14,borderBottom:i<levers.length-1?`1px solid ${T.cardBorder}`:"none"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              {isTop&&<span style={{fontFamily:T.mono,fontSize:9,background:T.accentLight,color:T.accent,border:`1px solid ${T.accentBorder}`,borderRadius:3,padding:"2px 6px",letterSpacing:"0.06em",textTransform:"uppercase"}}>Highest Impact</span>}
                              <span style={{fontSize:13,fontWeight:600,color:T.textPrimary}}>{lever.label}</span>
                            </div>
                            <div style={{textAlign:"right"}}>
                              <span style={{fontFamily:T.mono,fontSize:13,fontWeight:700,color:color}}>{lever.impact>0?`−${fc(Math.round(lever.impact))} new rev needed`:lever.impact<0?`+${fc(Math.round(Math.abs(lever.impact)))} added burden`:"No impact"}</span>
                            </div>
                          </div>
                          <div style={{background:"#e5e7eb",height:6,borderRadius:3}}>
                            <div style={{background:color,height:"100%",borderRadius:3,width:`${barWidth}%`,transition:"width 0.6s ease"}}/>
                          </div>
                          {lever.aeDelta!==0&&<div style={{fontFamily:T.mono,fontSize:10,color:T.textFaint,marginTop:5}}>{lever.aeDelta>0?`Saves ${lever.aeDelta} AE${lever.aeDelta!==1?"s":""}`:`Requires ${Math.abs(lever.aeDelta)} more AE${Math.abs(lever.aeDelta)!==1?"s":""}`}</div>}
                        </div>
                      );
                    })
                  )}
                </div>
                <div style={{background:T.warningLight,border:`1px solid ${T.warningBorder}`,borderLeft:`3px solid ${T.warning}`,borderRadius:8,padding:"14px 16px"}}>
                  <div style={{fontFamily:T.mono,fontSize:9,color:T.warning,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>How to use this</div>
                  <p style={{margin:0,fontSize:13,color:"#92400e",lineHeight:1.65}}>These are independent sensitivities — each assumes you change only that variable. In practice, levers interact. A 5pp win rate improvement combined with a shorter cycle compounds significantly. Use this to identify where to focus, then model the combination.</p>
                </div>
              </div>
            )}

            {tab==="economics"&&(
              <div style={{animation:"fadeIn 0.25s ease"}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
                  <Card label="CAC Ceiling" value={fc(Math.round(pr.cacCeiling))} sub={`Max spend to acquire 1 customer at ${pi.grossMargin}% margin`}/>
                  <Card label="Estimated CAC" value={fc(Math.round(pr.estimatedCac))} sub="Based on rep OTE + management overhead" warning={pr.estimatedCac>pr.cacCeiling}/>
                  <Card label="Direct Revenue" value={fc(Math.round(pr.directRevenue))} sub={`${100-pi.channelMix}% of target via direct`} muted/>
                  <Card label="Partner Revenue" value={fc(Math.round(pr.partnerRevenue))} sub={`${pi.channelMix}% of target via channel`} muted/>
                </div>
                <div style={{background:T.cardBg,border:`1px solid ${T.cardBorder}`,borderRadius:10,padding:"20px",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                  <div style={{fontFamily:T.mono,fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",color:T.textMuted,marginBottom:16}}>Unit Economics Breakdown</div>
                  {[
                    ["Revenue target",fc(pi.revenueTarget)],["Existing / recurring base",fc(pi.existingRevenue)],
                    ["Annual churn loss",pi.churnRate>0?`−${fc(Math.round(pr.churnLoss))}`:"—"],
                    ["Gross new revenue needed",fc(pr.newRevNeeded)],["Deals to close",pr.dealsNeeded],
                    ["Opportunities needed",fn(pr.oppsNeeded)],["Pipeline required",fc(pr.pipelineNeeded)],
                    ["Gross margin",`${pi.grossMargin}%`],["CAC ceiling",fc(Math.round(pr.cacCeiling))],
                    ["Estimated CAC",fc(Math.round(pr.estimatedCac))],
                    ["Rep OTE (industry-adjusted)",fc(IND.repOTE)],
                  ].map(([lbl,val],i,arr)=>(
                    <div key={lbl} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:i<arr.length-1?`1px solid ${T.cardBorder}`:"none"}}>
                      <span style={{fontFamily:T.mono,fontSize:12,color:T.textMuted}}>{lbl}</span>
                      <span style={{fontFamily:T.mono,fontSize:12,color:T.textPrimary,fontWeight:600}}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab==="flags"&&(
              <div style={{animation:"fadeIn 0.25s ease"}}>
                {pr.flags.length===0&&pr.insights.length===0&&<div style={{padding:"48px 0",textAlign:"center",color:T.textFaint,fontFamily:T.mono,fontSize:12}}>No flags or insights for these inputs.</div>}
                {pr.flags.length>0&&<div style={{marginBottom:24}}>
                  <div style={{fontFamily:T.mono,fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",color:T.danger,marginBottom:12}}>⚠ Warning Flags ({pr.flags.length})</div>
                  {pr.flags.map((f,i)=><Flag key={i} text={f} type="warning"/>)}
                </div>}
                {pr.insights.length>0&&<div>
                  <div style={{fontFamily:T.mono,fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",color:T.accent,marginBottom:12}}>◆ Strategic Insights ({pr.insights.length})</div>
                  {pr.insights.map((f,i)=><Flag key={i} text={f} type="insight"/>)}
                </div>}
              </div>
            )}
          </div>
        )}

        {/* DIAGNOSE OUTPUT */}
        {mode==="diagnose"&&(
          <div style={{animation:"fadeIn 0.25s ease"}}>
            <div style={{background:T.cardBg,border:`1px solid ${T.cardBorder}`,borderTop:`3px solid ${projColor}`,borderRadius:10,padding:"24px 28px",marginBottom:20,display:"flex",gap:28,alignItems:"center",boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
              <div style={{textAlign:"center",minWidth:110}}>
                <div style={{fontFamily:T.mono,fontSize:36,fontWeight:800,color:projColor,lineHeight:1}}>{fc(dr.projectedRevenue)}</div>
                <div style={{fontFamily:T.mono,fontSize:9,color:T.textFaint,letterSpacing:"0.1em",textTransform:"uppercase",marginTop:4}}>Projected Revenue</div>
              </div>
              <div style={{flex:1}}>
                <div style={{fontFamily:T.mono,fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",color:projColor,marginBottom:6}}>{dr.onTrack?"On Track":"Below Target"}</div>
                <div style={{fontSize:18,fontWeight:700,color:T.textPrimary,marginBottom:8}}>{dr.onTrack?`${fc(Math.abs(dr.gap))} above target`:`${fc(Math.abs(dr.gap))} gap (${Math.abs(dr.gapPct)}% of target)`}</div>
                <p style={{margin:0,fontSize:13,color:T.textMuted,lineHeight:1.6}}>{dr.onTrack?`Your current team projects ${dr.closableDeals} closed deals at ${fc(di.dealSize)} average. Adjust inputs to stress-test assumptions.`:`To close the gap: ${dr.gapDeals} more deals, ${fn(dr.addlOpps)} more qualified opps, or ${dr.addlAEs} additional AE${dr.addlAEs!==1?"s":""}. See constraint analysis below.`}</p>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:20}}>
              <Card label="Existing / Recurring" value={fc(di.existingRevenue)} sub="Carrying into year" muted/>
              <Card label="Churn Loss" value={`−${fc(dr.churnLoss)}`} sub={`${di.churnRate}% of base`} warning={di.churnRate>20}/>
              <Card label="Gross New Revenue" value={fc(dr.grossNewRevenue)} sub={`${dr.closableDeals} deals at ${fc(di.dealSize)}`} muted/>
              <Card label="Deals / Rep / Year" value={dr.dealsPerRepPerYear} sub={`${di.cycleMonths}mo cycle · ${dr.activeDealSlots} active slots`} muted/>
            </div>
            {dr.constraints.length>0&&(
              <div style={{marginBottom:20}}>
                <div style={{fontFamily:T.mono,fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",color:T.textMuted,marginBottom:12}}>Constraint Analysis</div>
                {dr.constraints.map((c,i)=><Flag key={i} text={`${c.label} — ${c.detail}`} type={c.severity==="high"?"warning":"medium"}/>)}
              </div>
            )}
            {!dr.onTrack&&(
              <div style={{background:T.cardBg,border:`1px solid ${T.cardBorder}`,borderRadius:10,padding:"20px",marginBottom:20,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                <div style={{fontFamily:T.mono,fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",color:T.textMuted,marginBottom:16}}>What It Takes to Close the Gap</div>
                {[["Gap to target",fc(Math.abs(dr.gap))],["Additional deals needed",dr.gapDeals],["Additional opps needed",fn(dr.addlOpps)],["Additional AEs needed",dr.addlAEs]].map(([lbl,val],i,arr)=>(
                  <div key={lbl} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:i<arr.length-1?`1px solid ${T.cardBorder}`:"none"}}>
                    <span style={{fontFamily:T.mono,fontSize:12,color:T.textMuted}}>{lbl}</span>
                    <span style={{fontFamily:T.mono,fontSize:12,color:T.textPrimary,fontWeight:600}}>{val}</span>
                  </div>
                ))}
              </div>
            )}
            {dr.insights.length>0&&(
              <div>
                <div style={{fontFamily:T.mono,fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",color:T.accent,marginBottom:12}}>◆ Insights</div>
                {dr.insights.map((f,i)=><Flag key={i} text={f} type="insight"/>)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
