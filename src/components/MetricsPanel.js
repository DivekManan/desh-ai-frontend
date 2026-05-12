import { useState, useEffect } from "react";

const CARD = { background: "#111827", border: "1px solid #1e293b", borderRadius: 8, padding: "16px 20px" };
const LEVEL_COLOR = { CRITICAL: "#ef4444", HIGH: "#f97316", MEDIUM: "#eab308", LOW: "#22c55e", CLEAN: "#22c55e" };

export default function MetricsPanel({ metrics, alerts, api }) {
  const [infra, setInfra] = useState(null);
  const [loading, setLoading] = useState(false);
  const [demoResult, setDemoResult] = useState(null);

  useEffect(() => {
    fetch(`${api}/api/v1/infrastructure/status`)
      .then(r => r.json()).then(setInfra).catch(() => {});
  }, [api]);

  const runDemo = async () => {
    setLoading(true);
    setDemoResult(null);
    try {
      const packets = Array.from({ length: 80 }, (_, i) => ({
        source_ip: `192.168.${Math.floor(i/10)}.${i % 254 + 1}`,
        dest_ip: "10.0.0.1", port: 80,
        protocol: "TCP", payload_size: 64, flags: ["SYN"]
      }));
      const r = await fetch(`${api}/api/v1/threats/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packets, infrastructure_id: "demo-node-live" })
      });
      setDemoResult(await r.json());
    } catch (e) {
      setDemoResult({ error: "API offline — start backend with: uvicorn backend.main:app --reload" });
    }
    setLoading(false);
  };

  const statCards = [
    { label: "Threats Detected", value: metrics?.desh_threats_total ?? "—", color: "#ef4444" },
    { label: "Threats Blocked",  value: metrics?.desh_threats_blocked_total ?? "—", color: "#f97316" },
    { label: "Detection Accuracy", value: metrics ? `${(metrics.desh_detection_accuracy * 100).toFixed(1)}%` : "—", color: "#38bdf8" },
    { label: "Avg MTTR",         value: metrics ? `${metrics.desh_mttr_seconds}s` : "—", color: "#22c55e" },
    { label: "Self-Heals",       value: metrics?.desh_self_heals_total ?? "—", color: "#a78bfa" },
    { label: "Quantum Keys Gen", value: metrics?.desh_quantum_keys_total ?? "—", color: "#34d399" },
  ];

  return (
    <div>
      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 12, marginBottom: 24 }}>
        {statCards.map(c => (
          <div key={c.label} style={CARD}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        {/* Infrastructure nodes */}
        <div style={CARD}>
          <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 12, letterSpacing: 1 }}>SMART INFRASTRUCTURE NODES</div>
          {infra ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.entries(infra.nodes).map(([id, node]) => (
                <div key={id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                    background: node.status === "healthy" ? "#22c55e" : node.status === "alert" ? "#ef4444" : "#eab308" }} />
                  <span style={{ fontSize: 12, flex: 1, color: "#cbd5e1" }}>{id}</span>
                  <span style={{ fontSize: 11, color: node.threat_score > 0.6 ? "#ef4444" : node.threat_score > 0.3 ? "#eab308" : "#22c55e" }}>
                    {(node.threat_score * 100).toFixed(0)}%
                  </span>
                  <div style={{ width: 60, background: "#1e293b", borderRadius: 4, height: 4 }}>
                    <div style={{ width: `${node.threat_score * 100}%`, height: 4, borderRadius: 4,
                      background: node.threat_score > 0.6 ? "#ef4444" : node.threat_score > 0.3 ? "#eab308" : "#22c55e" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : <div style={{ color: "#475569", fontSize: 12 }}>Loading nodes…</div>}
        </div>

        {/* Recent alerts */}
        <div style={CARD}>
          <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 12, letterSpacing: 1 }}>RECENT ALERTS (WebSocket)</div>
          {alerts.length === 0 ? (
            <div style={{ color: "#475569", fontSize: 12 }}>Waiting for live threats… (WebSocket connected)</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
              {alerts.slice(0, 8).map((a, i) => (
                <div key={i} style={{ fontSize: 11, display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ color: LEVEL_COLOR[a.level] || "#38bdf8", width: 60, flexShrink: 0 }}>{a.level}</span>
                  <span style={{ color: "#94a3b8" }}>{a.threat_type || a.type}</span>
                  <span style={{ color: "#475569", marginLeft: "auto" }}>{a.node}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Live Demo */}
      <div style={CARD}>
        <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 12, letterSpacing: 1 }}>LIVE DEMO — DDoS THREAT ANALYSIS</div>
        <button onClick={runDemo} disabled={loading}
          style={{ padding: "8px 20px", background: loading ? "#1e293b" : "#0ea5e9", border: "none",
            borderRadius: 6, color: "#fff", cursor: loading ? "wait" : "pointer", fontFamily: "monospace", fontSize: 13 }}>
          {loading ? "Analyzing…" : "▶ Run Live DDoS Detection"}
        </button>
        {demoResult && (
          <div style={{ marginTop: 16, background: "#0a0e1a", borderRadius: 6, padding: 16, fontSize: 12 }}>
            {demoResult.error ? (
              <span style={{ color: "#ef4444" }}>{demoResult.error}</span>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ color: "#64748b", marginBottom: 4 }}>THREAT TYPE</div>
                  <div style={{ color: LEVEL_COLOR[demoResult.threat_level] || "#38bdf8", fontSize: 18, fontWeight: 700 }}>
                    {demoResult.threat_type}
                  </div>
                  <div style={{ color: "#475569", marginTop: 2 }}>Level: {demoResult.threat_level}</div>
                </div>
                <div>
                  <div style={{ color: "#64748b", marginBottom: 4 }}>CONFIDENCE</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#38bdf8" }}>
                    {(demoResult.confidence_score * 100).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div style={{ color: "#64748b", marginBottom: 4 }}>MITRE ATT&CK</div>
                  <div style={{ color: "#a78bfa" }}>{demoResult.mitre_attack_mapping?.technique}</div>
                </div>
                <div>
                  <div style={{ color: "#64748b", marginBottom: 4 }}>AUTO-HEAL</div>
                  <div style={{ color: "#22c55e" }}>{demoResult.recommended_action?.auto_heal ? "✓ TRIGGERED" : "NOT REQUIRED"}</div>
                </div>
                {demoResult.explainability?.feature_contributions?.length > 0 && (
                  <div style={{ gridColumn: "1/-1" }}>
                    <div style={{ color: "#64748b", marginBottom: 6 }}>TOP SHAP FEATURES (XAI)</div>
                    {demoResult.explainability.feature_contributions.slice(0, 3).map((f, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                        <span style={{ color: "#38bdf8", width: 140 }}>{f.feature}</span>
                        <span style={{ color: "#22c55e" }}>+{f.shap_value?.toFixed(3)}</span>
                        <span style={{ color: "#475569" }}>{f.human_readable?.slice(0, 60)}…</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
