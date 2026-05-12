import { useState, useEffect } from "react";
import ThreatMap from "./components/ThreatMap";
import AuditChain from "./components/AuditChain";
import QuantumCrypto from "./components/QuantumCrypto";
import SelfHealing from "./components/SelfHealing";
import MetricsPanel from "./components/MetricsPanel";
import LiveFeed from "./components/LiveFeed";

const API = process.env.REACT_APP_API_URL || "http://localhost:8000";
const WS  = process.env.REACT_APP_WS_URL  || "ws://localhost:8000/ws/threats";

export default function App() {
  const [tab, setTab]       = useState("overview");
  const [metrics, setMetrics] = useState(null);
  const [alerts, setAlerts]   = useState([]);

  // Poll metrics
  useEffect(() => {
    const fetch_ = () =>
      fetch(`${API}/metrics`)
        .then(r => r.json())
        .then(setMetrics)
        .catch(() => {});
    fetch_();
    const id = setInterval(fetch_, 5000);
    return () => clearInterval(id);
  }, []);

  // WebSocket live feed
useEffect(() => {
  const pollThreats = () =>
    fetch(`${API}/api/v1/threats/live`)
      .then(r => r.json())
      .then(data => {
        if (data.type === "THREAT_DETECTED") {
          setAlerts(prev => [data, ...prev].slice(0, 50));
        }
      })
      .catch(() => {});
  const id = setInterval(pollThreats, 4000);
  return () => clearInterval(id);
}, []);

  const TABS = [
    { id: "overview",  label: "Overview" },
    { id: "threats",   label: "Threat Map" },
    { id: "healing",   label: "Self-Healing" },
    { id: "quantum",   label: "Quantum Crypto" },
    { id: "audit",     label: "Audit Chain" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0e1a", color: "#e2e8f0", fontFamily: "monospace" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid #1e293b", padding: "12px 24px", display: "flex", alignItems: "center", gap: 16, background: "#0d1120" }}>
        <span style={{ color: "#38bdf8", fontWeight: 700, fontSize: 18, letterSpacing: 2 }}>DESH-QSI</span>
        <span style={{ color: "#475569", fontSize: 12 }}>Quantum-Resistant AI Cybersecurity Framework v1.0</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
          <span style={{ fontSize: 12, color: "#22c55e" }}>OPERATIONAL</span>
        </div>
      </header>

      {/* Nav */}
      <nav style={{ display: "flex", gap: 0, borderBottom: "1px solid #1e293b", padding: "0 24px", background: "#0d1120" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: "10px 20px", background: "none", border: "none", cursor: "pointer",
              color: tab === t.id ? "#38bdf8" : "#64748b",
              borderBottom: tab === t.id ? "2px solid #38bdf8" : "2px solid transparent",
              fontSize: 13, fontFamily: "monospace" }}>
            {t.label}
          </button>
        ))}
      </nav>

      <main style={{ padding: 24 }}>
        {tab === "overview"  && <MetricsPanel metrics={metrics} alerts={alerts} api={API} />}
        {tab === "threats"   && <ThreatMap api={API} />}
        {tab === "healing"   && <SelfHealing api={API} />}
        {tab === "quantum"   && <QuantumCrypto api={API} />}
        {tab === "audit"     && <AuditChain api={API} />}
      </main>

      {/* Live alert ticker */}
      <LiveFeed alerts={alerts} />
    </div>
  );
}
