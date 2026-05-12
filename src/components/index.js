// ── ThreatMap ─────────────────────────────────────────────────
import { useState } from "react";

const CARD = { background: "#111827", border: "1px solid #1e293b", borderRadius: 8, padding: "16px 20px" };

export function ThreatMap({ api }) {
  const [threatInput, setThreatInput] = useState("");
  const [infraId, setInfraId] = useState("smart-grid-node-01");
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);

  const presets = {
    "DDoS Attack": Array.from({length:80},(_,i)=>({source_ip:`10.0.0.${i%254+1}`,dest_ip:"192.168.1.1",port:80,protocol:"TCP",payload_size:64,flags:["SYN"]})),
    "Port Scan":   Array.from({length:50},(_,i)=>({source_ip:"172.16.0.1",dest_ip:"10.0.0.1",port:i+1,protocol:"TCP",payload_size:44,flags:["SYN"]})),
    "Exfiltration":Array.from({length:20},(_,i)=>({source_ip:"10.0.1.50",dest_ip:"8.8.8.8",port:443,protocol:"TCP",payload_size:9000+i,flags:["ACK"]})),
    "Clean":       Array.from({length:15},()=>({source_ip:"10.0.0.10",dest_ip:"10.0.0.1",port:443,protocol:"TCP",payload_size:1200,flags:["ACK"]})),
  };

  const analyze = async (pkts) => {
    setLoading(true); setResult(null);
    try {
      const r = await fetch(`${api}/api/v1/threats/analyze`,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({packets:pkts,infrastructure_id:infraId})});
      setResult(await r.json());
    } catch { setResult({error:"API offline"}); }
    setLoading(false);
  };

  const LEVEL_COLOR = {CRITICAL:"#ef4444",HIGH:"#f97316",MEDIUM:"#eab308",LOW:"#22c55e",CLEAN:"#22c55e"};

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={CARD}>
        <div style={{fontSize:13,color:"#94a3b8",marginBottom:12,letterSpacing:1}}>THREAT DETECTION ENGINE — GNN + XAI</div>
        <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
          {Object.entries(presets).map(([name,pkts])=>(
            <button key={name} onClick={()=>analyze(pkts)} disabled={loading}
              style={{padding:"6px 14px",background:"#1e293b",border:"1px solid #334155",borderRadius:6,
                color:"#94a3b8",cursor:"pointer",fontSize:12,fontFamily:"monospace"}}>
              {name}
            </button>
          ))}
        </div>
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <input value={infraId} onChange={e=>setInfraId(e.target.value)}
            style={{flex:1,background:"#0a0e1a",border:"1px solid #1e293b",borderRadius:6,padding:"6px 12px",
              color:"#e2e8f0",fontFamily:"monospace",fontSize:12}}
            placeholder="Infrastructure ID" />
          <button onClick={()=>analyze(presets["DDoS Attack"])} disabled={loading}
            style={{padding:"6px 16px",background:"#0ea5e9",border:"none",borderRadius:6,color:"#fff",cursor:"pointer",fontSize:12}}>
            {loading?"Analyzing…":"Analyze"}
          </button>
        </div>

        {result && !result.error && (
          <div style={{background:"#0a0e1a",borderRadius:8,padding:16,marginTop:8}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:16}}>
              {[
                {label:"Threat Type",val:result.threat_type,color:LEVEL_COLOR[result.threat_level]},
                {label:"Level",val:result.threat_level,color:LEVEL_COLOR[result.threat_level]},
                {label:"Confidence",val:`${(result.confidence_score*100).toFixed(1)}%`,color:"#38bdf8"},
                {label:"Packets",val:result.packet_count,color:"#a78bfa"},
              ].map(c=>(
                <div key={c.label} style={{background:"#111827",borderRadius:6,padding:10}}>
                  <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>{c.label}</div>
                  <div style={{fontSize:16,fontWeight:700,color:c.color}}>{c.val}</div>
                </div>
              ))}
            </div>

            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,color:"#64748b",marginBottom:6}}>MITRE ATT&CK MAPPING</div>
              <div style={{fontSize:12,color:"#a78bfa"}}>{result.mitre_attack_mapping?.tactic} → {result.mitre_attack_mapping?.technique}</div>
            </div>

            <div>
              <div style={{fontSize:11,color:"#64748b",marginBottom:6}}>SHAP EXPLAINABILITY (XAI)</div>
              {result.explainability?.feature_contributions?.slice(0,5).map((f,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <span style={{fontSize:11,color:"#94a3b8",width:160,flexShrink:0}}>{f.feature}</span>
                  <div style={{flex:1,background:"#1e293b",borderRadius:4,height:6}}>
                    <div style={{width:`${Math.min(100,f.shap_value*200)}%`,height:6,borderRadius:4,background:"#0ea5e9"}}/>
                  </div>
                  <span style={{fontSize:11,color:"#0ea5e9",width:50,textAlign:"right"}}>{f.shap_value?.toFixed(3)}</span>
                </div>
              ))}
            </div>

            <div style={{marginTop:12,padding:10,background:"#111827",borderRadius:6,fontSize:11}}>
              <span style={{color:"#64748b"}}>Recommended: </span>
              <span style={{color:LEVEL_COLOR[result.threat_level]}}>{result.recommended_action?.action}</span>
              <span style={{color:"#475569",marginLeft:8}}>{result.recommended_action?.steps?.join(" → ")}</span>
            </div>
          </div>
        )}
        {result?.error && <div style={{color:"#ef4444",fontSize:12,marginTop:8}}>{result.error}</div>}
      </div>
    </div>
  );
}


// ── AuditChain ────────────────────────────────────────────────
export function AuditChain({ api }) {
  const [chain, setChain]   = useState(null);
  const [verify, setVerify] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [c, v] = await Promise.all([
        fetch(`${api}/api/v1/audit/chain?limit=10`).then(r=>r.json()),
        fetch(`${api}/api/v1/audit/verify`).then(r=>r.json()),
      ]);
      setChain(c); setVerify(v);
    } catch { setChain({error:"API offline"}); }
    setLoading(false);
  };

  const SEV_COLOR = {CRITICAL:"#ef4444",HIGH:"#f97316",MEDIUM:"#eab308",LOW:"#22c55e",INFO:"#38bdf8"};

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={CARD}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontSize:13,color:"#94a3b8",letterSpacing:1}}>DECENTRALIZED AUDIT CHAIN — MERKLE TREE + IPFS</div>
          <button onClick={load} disabled={loading}
            style={{padding:"6px 14px",background:"#0ea5e9",border:"none",borderRadius:6,color:"#fff",cursor:"pointer",fontSize:12}}>
            {loading?"Loading…":"Load Chain"}
          </button>
        </div>

        {verify && (
          <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
            {[
              {label:"Chain Valid",val:verify.valid?"✓ VALID":"✗ TAMPERED",color:verify.valid?"#22c55e":"#ef4444"},
              {label:"Blocks",val:verify.blocks??0,color:"#38bdf8"},
              {label:"Merkle Root",val:chain?.merkle_root?.slice(0,16)+"…",color:"#a78bfa"},
            ].map(c=>(
              <div key={c.label} style={{background:"#0a0e1a",borderRadius:6,padding:"8px 14px"}}>
                <div style={{fontSize:10,color:"#64748b"}}>{c.label}</div>
                <div style={{fontSize:14,fontWeight:700,color:c.color}}>{c.val}</div>
              </div>
            ))}
          </div>
        )}

        {chain?.entries?.length > 0 ? (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {chain.entries.slice().reverse().map((b,i)=>(
              <div key={b.block_id} style={{background:"#0a0e1a",borderRadius:6,padding:12,
                borderLeft:`3px solid ${SEV_COLOR[b.severity]||"#38bdf8"}`}}>
                <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:4}}>
                  <span style={{color:"#475569",fontSize:11}}>#{b.block_id}</span>
                  <span style={{fontSize:12,fontWeight:600,color:"#e2e8f0"}}>{b.event_type}</span>
                  <span style={{fontSize:11,color:SEV_COLOR[b.severity]||"#38bdf8"}}>{b.severity}</span>
                  <span style={{marginLeft:"auto",fontSize:10,color:"#475569"}}>{b.timestamp?.slice(0,19)}</span>
                </div>
                <div style={{fontSize:11,color:"#64748b"}}>
                  Node: <span style={{color:"#94a3b8"}}>{b.node_id}</span>
                  {" · "}Hash: <span style={{color:"#334155",fontFamily:"monospace"}}>{b.hash?.slice(0,24)}…</span>
                  {" · "}IPFS: <span style={{color:"#1e40af"}}>{b.ipfs_cid?.slice(0,20)}…</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{color:"#475569",fontSize:12}}>
            {chain?.error || "Click 'Load Chain' to fetch the immutable audit log from the API."}
          </div>
        )}
      </div>
    </div>
  );
}


// ── QuantumCrypto ────────────────────────────────────────────
export function QuantumCrypto({ api }) {
  const [variant, setVariant] = useState("kyber-768");
  const [nodeId, setNodeId]   = useState("smart-grid-001");
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
//  const [bench, setBench]     = useState(null);

  const generate = async () => {
    setLoading(true); setResult(null);
    try {
      const r = await fetch(`${api}/api/v1/quantum/keygen`,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({node_id:nodeId,algorithm:variant,key_purpose:"session"})});
      setResult(await r.json());
    } catch { setResult({error:"API offline"}); }
    setLoading(false);
  };

  const VARIANTS = [
    {id:"kyber-512",label:"Kyber-512",security:"128-bit PQ"},
    {id:"kyber-768",label:"Kyber-768",security:"192-bit PQ ★"},
    {id:"kyber-1024",label:"Kyber-1024",security:"256-bit PQ"},
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={CARD}>
        <div style={{fontSize:13,color:"#94a3b8",marginBottom:12,letterSpacing:1}}>POST-QUANTUM KEY GENERATION — CRYSTALS-KYBER (NIST FIPS 203)</div>

        <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
          {VARIANTS.map(v=>(
            <button key={v.id} onClick={()=>setVariant(v.id)}
              style={{padding:"6px 14px",background:variant===v.id?"#0ea5e9":"#1e293b",
                border:"1px solid",borderColor:variant===v.id?"#0ea5e9":"#334155",
                borderRadius:6,color:variant===v.id?"#fff":"#94a3b8",cursor:"pointer",fontSize:12,fontFamily:"monospace"}}>
              {v.label} <span style={{fontSize:10,opacity:.7}}>{v.security}</span>
            </button>
          ))}
        </div>

        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <input value={nodeId} onChange={e=>setNodeId(e.target.value)}
            style={{flex:1,background:"#0a0e1a",border:"1px solid #1e293b",borderRadius:6,padding:"6px 12px",
              color:"#e2e8f0",fontFamily:"monospace",fontSize:12}}
            placeholder="Node ID" />
          <button onClick={generate} disabled={loading}
            style={{padding:"6px 16px",background:"#0ea5e9",border:"none",borderRadius:6,color:"#fff",cursor:"pointer",fontSize:12}}>
            {loading?"Generating…":"Generate Key"}
          </button>
        </div>

        {result && !result.error && (
          <div style={{background:"#0a0e1a",borderRadius:8,padding:16}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:12}}>
              {[
                {label:"Key ID",val:result.key_id?.slice(0,18)+"…",color:"#38bdf8"},
                {label:"Algorithm",val:result.algorithm,color:"#22c55e"},
                {label:"Security Level",val:result.security_level,color:"#a78bfa"},
                {label:"Standard",val:result.standard,color:"#f97316"},
              ].map(c=>(
                <div key={c.label} style={{background:"#111827",borderRadius:6,padding:10}}>
                  <div style={{fontSize:10,color:"#64748b",marginBottom:4}}>{c.label}</div>
                  <div style={{fontSize:13,fontWeight:600,color:c.color}}>{c.val}</div>
                </div>
              ))}
            </div>
            <div style={{fontSize:11,fontFamily:"monospace",padding:10,background:"#111827",borderRadius:6}}>
              <div style={{color:"#64748b",marginBottom:4}}>PUBLIC KEY (truncated)</div>
              <div style={{color:"#22c55e",wordBreak:"break-all"}}>{result.public_key}</div>
            </div>
            <div style={{marginTop:8,fontSize:11,color:"#475569"}}>
              Replaces: <span style={{color:"#ef4444"}}>{result.replaces}</span>
            </div>
            {result.parameters && (
              <div style={{marginTop:8,display:"flex",gap:12,fontSize:11}}>
                <span style={{color:"#64748b"}}>n={result.parameters.lattice_dimension_n}</span>
                <span style={{color:"#64748b"}}>k={result.parameters.module_rank_k}</span>
                <span style={{color:"#64748b"}}>q={result.parameters.modulus_q}</span>
              </div>
            )}
          </div>
        )}
        {result?.error && <div style={{color:"#ef4444",fontSize:12,marginTop:8}}>{result.error}</div>}
      </div>

      {/* Comparison table */}
      <div style={CARD}>
        <div style={{fontSize:13,color:"#94a3b8",marginBottom:12,letterSpacing:1}}>QUANTUM vs CLASSICAL COMPARISON</div>
        <table style={{width:"100%",fontSize:12,borderCollapse:"collapse"}}>
          <thead>
            <tr>
              {["Algorithm","Type","Key Size","Quantum Safe","Shor's Attack","NIST Status"].map(h=>(
                <th key={h} style={{textAlign:"left",padding:"6px 8px",color:"#64748b",borderBottom:"1px solid #1e293b",fontSize:11}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ["RSA-2048","Classical","256 bytes","✗ NO","BREAKS IT","Deprecated"],
              ["ECDH-256","Classical","64 bytes","✗ NO","BREAKS IT","Deprecated"],
              ["Kyber-768","Post-Quantum","1184 bytes","✓ YES","Ineffective","FIPS 203 ✓"],
              ["Dilithium-3","Post-Quantum","1952 bytes","✓ YES","Ineffective","FIPS 204 ✓"],
            ].map((row,i)=>(
              <tr key={i} style={{background:i%2===0?"transparent":"#0a0e1a"}}>
                {row.map((cell,j)=>(
                  <td key={j} style={{padding:"7px 8px",
                    color:j===3?(cell.includes("✓")?"#22c55e":"#ef4444"):
                          j===4?(cell.includes("BREAKS")?"#ef4444":"#22c55e"):
                          j===5?(cell.includes("✓")?"#22c55e":"#f97316"):"#cbd5e1"}}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// ── SelfHealing ───────────────────────────────────────────────
export function SelfHealing({ api }) {
  const [incidentId, setIncidentId] = useState("INC-2024-001");
  const [level, setLevel]           = useState("HIGH");
  const [nodes, setNodes]           = useState("smart-grid-001,power-station-005");
  const [strategy, setStrategy]     = useState("auto");
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);

  const trigger = async () => {
    setLoading(true); setResult(null);
    try {
      const r = await fetch(`${api}/api/v1/healing/trigger`,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({incident_id:incidentId,threat_level:level,
          affected_nodes:nodes.split(",").map(n=>n.trim()),healing_strategy:strategy})});
      setResult(await r.json());
    } catch { setResult({error:"API offline"}); }
    setLoading(false);
  };

  const LEVELS = ["CRITICAL","HIGH","MEDIUM","LOW"];
  const STRATEGIES = ["auto","isolate","quarantine","rate_limit","rollback","monitor"];
  const STATUS_COLOR = {COMPLETED:"#22c55e",FAILED:"#ef4444",PENDING:"#eab308"};

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={CARD}>
        <div style={{fontSize:13,color:"#94a3b8",marginBottom:12,letterSpacing:1}}>SELF-HEALING AGENT — PPO REINFORCEMENT LEARNING</div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <div>
            <div style={{fontSize:11,color:"#64748b",marginBottom:4}}>Incident ID</div>
            <input value={incidentId} onChange={e=>setIncidentId(e.target.value)}
              style={{width:"100%",boxSizing:"border-box",background:"#0a0e1a",border:"1px solid #1e293b",
                borderRadius:6,padding:"6px 10px",color:"#e2e8f0",fontFamily:"monospace",fontSize:12}}/>
          </div>
          <div>
            <div style={{fontSize:11,color:"#64748b",marginBottom:4}}>Affected Nodes (comma-sep)</div>
            <input value={nodes} onChange={e=>setNodes(e.target.value)}
              style={{width:"100%",boxSizing:"border-box",background:"#0a0e1a",border:"1px solid #1e293b",
                borderRadius:6,padding:"6px 10px",color:"#e2e8f0",fontFamily:"monospace",fontSize:12}}/>
          </div>
        </div>

        <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
          {LEVELS.map(l=>(
            <button key={l} onClick={()=>setLevel(l)}
              style={{padding:"5px 12px",background:level===l?"#1e293b":"transparent",
                border:`1px solid ${level===l?{CRITICAL:"#ef4444",HIGH:"#f97316",MEDIUM:"#eab308",LOW:"#22c55e"}[l]:"#334155"}`,
                borderRadius:6,color:{CRITICAL:"#ef4444",HIGH:"#f97316",MEDIUM:"#eab308",LOW:"#22c55e"}[l],
                cursor:"pointer",fontSize:12,fontFamily:"monospace"}}>
              {l}
            </button>
          ))}
          <select value={strategy} onChange={e=>setStrategy(e.target.value)}
            style={{background:"#1e293b",border:"1px solid #334155",borderRadius:6,
              padding:"5px 10px",color:"#94a3b8",fontSize:12,fontFamily:"monospace",cursor:"pointer"}}>
            {STRATEGIES.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={trigger} disabled={loading}
            style={{padding:"5px 16px",background:"#0ea5e9",border:"none",borderRadius:6,
              color:"#fff",cursor:"pointer",fontSize:12,fontFamily:"monospace",marginLeft:"auto"}}>
            {loading?"Healing…":"Trigger Healing"}
          </button>
        </div>

        {result && !result.error && (
          <div style={{background:"#0a0e1a",borderRadius:8,padding:16}}>
            <div style={{display:"flex",gap:12,marginBottom:14,flexWrap:"wrap"}}>
              {[
                {label:"Status",val:result.healing_status,color:"#22c55e"},
                {label:"RL Agent",val:result.rl_agent,color:"#a78bfa"},
                {label:"MTTR",val:`${result.recovery_time_seconds?.toFixed(1)}s`,color:"#38bdf8"},
                {label:"Actions",val:result.total_actions,color:"#f97316"},
              ].map(c=>(
                <div key={c.label} style={{background:"#111827",borderRadius:6,padding:"8px 14px"}}>
                  <div style={{fontSize:10,color:"#64748b",marginBottom:2}}>{c.label}</div>
                  <div style={{fontSize:14,fontWeight:700,color:c.color}}>{c.val}</div>
                </div>
              ))}
            </div>

            <div style={{fontSize:11,color:"#64748b",marginBottom:8}}>HEALING STEPS</div>
            {result.actions_taken?.map((step,i)=>(
              <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:6,
                padding:"8px 10px",background:"#111827",borderRadius:6}}>
                <span style={{width:20,height:20,borderRadius:"50%",background:"#1e293b",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,
                  color:"#94a3b8",flexShrink:0}}>{step.step}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,color:"#e2e8f0"}}>{step.action?.replace(/_/g," ")}</div>
                  <div style={{fontSize:10,color:"#475569"}}>{step.timestamp?.slice(11,19)}</div>
                </div>
                <span style={{fontSize:11,color:STATUS_COLOR[step.status]||"#38bdf8"}}>{step.status}</span>
              </div>
            ))}

            {result.explainability && (
              <div style={{marginTop:12,padding:10,background:"#111827",borderRadius:6,fontSize:11}}>
                <div style={{color:"#64748b",marginBottom:4}}>RL POLICY EXPLANATION</div>
                <div style={{color:"#94a3b8"}}>{result.explainability?.policy_used}</div>
                <div style={{color:"#38bdf8",marginTop:4}}>Confidence: {(result.explainability?.confidence*100).toFixed(0)}%</div>
              </div>
            )}
          </div>
        )}
        {result?.error && <div style={{color:"#ef4444",fontSize:12,marginTop:8}}>{result.error}</div>}
      </div>
    </div>
  );
}


// ── LiveFeed ──────────────────────────────────────────────────
export function LiveFeed({ alerts }) {
  if (alerts.length === 0) return null;
  const latest = alerts[0];
  const LEVEL_BG = {CRITICAL:"#450a0a",HIGH:"#431407",MEDIUM:"#422006"};
  const LEVEL_COLOR = {CRITICAL:"#ef4444",HIGH:"#f97316",MEDIUM:"#eab308"};

  return (
    <div style={{position:"fixed",bottom:0,left:0,right:0,
      background:LEVEL_BG[latest.level]||"#0d1120",
      borderTop:`1px solid ${LEVEL_COLOR[latest.level]||"#1e293b"}`,
      padding:"8px 24px",display:"flex",gap:16,alignItems:"center",fontSize:12}}>
      <span style={{color:LEVEL_COLOR[latest.level]||"#38bdf8",fontWeight:700,flexShrink:0}}>
        ⚡ {latest.level||"ALERT"}
      </span>
      <span style={{color:"#e2e8f0"}}>{latest.threat_type||latest.type}</span>
      <span style={{color:"#64748b"}}>Node: {latest.node}</span>
      {latest.confidence && <span style={{color:"#38bdf8"}}>Confidence: {(latest.confidence*100).toFixed(1)}%</span>}
      <span style={{marginLeft:"auto",color:"#475569"}}>{latest.timestamp?.slice(11,19)}</span>
      <span style={{color:"#22c55e",fontSize:11}}>↺ Self-heal triggered</span>
    </div>
  );
}
