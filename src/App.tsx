import './App.css'

export default function App() {
  return (
    <div className="app">
      <div className="status-badge">SYSTEM ONLINE</div>
      <h1 className="title">Finance Agent</h1>
      <p className="subtitle">AI agent infrastructure is initialized and ready.</p>
      <div className="grid">
        <div className="card">
          <span className="card-icon">🤖</span>
          <h2>Agents</h2>
          <p>No agents running</p>
        </div>
        <div className="card">
          <span className="card-icon">🔗</span>
          <h2>Connections</h2>
          <p>Awaiting configuration</p>
        </div>
        <div className="card">
          <span className="card-icon">📊</span>
          <h2>Data</h2>
          <p>No sources connected</p>
        </div>
      </div>
    </div>
  )
}
