export function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <span className="text-xs font-semibold tracking-widest text-green-400 border border-green-400/25 bg-green-400/10 px-3 py-1 rounded-full">
        SYSTEM ONLINE
      </span>
      <h1 className="text-5xl font-bold tracking-tight text-slate-100">
        Finance Agent
      </h1>
      <p className="text-slate-500 text-base max-w-sm text-center leading-relaxed">
        AI agent infrastructure is initialized and ready.
      </p>
      <div className="grid grid-cols-3 gap-4 mt-4 w-full max-w-2xl">
        <div className="bg-gray-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-1">
          <span className="text-2xl">🤖</span>
          <h2 className="text-sm font-semibold text-slate-300 mt-1">Agents</h2>
          <p className="text-xs text-slate-600">No agents running</p>
        </div>
        <div className="bg-gray-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-1">
          <span className="text-2xl">🔗</span>
          <h2 className="text-sm font-semibold text-slate-300 mt-1">Connections</h2>
          <p className="text-xs text-slate-600">Awaiting configuration</p>
        </div>
        <div className="bg-gray-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-1">
          <span className="text-2xl">📊</span>
          <h2 className="text-sm font-semibold text-slate-300 mt-1">Data</h2>
          <p className="text-xs text-slate-600">No sources connected</p>
        </div>
      </div>
    </div>
  )
}
