export type AgentStatus = 'pending' | 'running' | 'complete' | 'error'

export interface AgentState {
  status: AgentStatus
  result: unknown
}

interface AgentProgressTrackerProps {
  agents: Record<string, AgentState>
}

const STATUS_STYLES: Record<AgentStatus, string> = {
  pending: 'bg-slate-100 text-slate-600',
  running: 'bg-yellow-100 text-yellow-700 animate-pulse',
  complete: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
}

const AGENT_LABELS: Record<string, string> = {
  market_data: 'Market Data',
  technical_analysis: 'Technical Analysis',
  sentiment: 'Sentiment',
  recommendation: 'Recommendation',
}

export function AgentProgressTracker({ agents }: AgentProgressTrackerProps) {
  const entries = Object.entries(agents)
  if (entries.length === 0) return <div></div>

  return (
    <div className="flex flex-col gap-2">
      {entries.map(([name, state]) => (
        <div
          key={name}
          className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
        >
          <span className="text-sm font-medium text-slate-800">
            {AGENT_LABELS[name] ?? name}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[state.status]}`}
          >
            {state.status}
          </span>
        </div>
      ))}
    </div>
  )
}
