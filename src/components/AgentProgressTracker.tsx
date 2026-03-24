import { Fragment } from 'react'

export type AgentStatus = 'pending' | 'running' | 'complete' | 'error'

export interface AgentState {
  status: AgentStatus
  result: unknown
}

interface AgentProgressTrackerProps {
  agents: Record<string, AgentState>
}

const AGENT_ORDER = ['market_data', 'technical_analysis', 'sentiment', 'recommendation']

const AGENT_LABELS: Record<string, string> = {
  market_data: 'Market Data',
  technical_analysis: 'Technical Analysis',
  sentiment: 'Sentiment',
  recommendation: 'Recommendation',
}

const ICON: Record<AgentStatus, string> = {
  pending: '·',
  running: '◌',
  complete: '✓',
  error: '✕',
}

const NODE_STYLES: Record<AgentStatus, string> = {
  pending:  'border-slate-600 text-slate-500 bg-slate-800/50',
  running:  'border-yellow-400 text-yellow-400 bg-yellow-400/10 animate-pulse',
  complete: 'border-green-400 text-green-400 bg-green-400/10',
  error:    'border-red-400 text-red-400 bg-red-400/10',
}

const LINE_STYLES: Record<AgentStatus, string> = {
  pending:  'bg-slate-700',
  running:  'bg-yellow-400/40',
  complete: 'bg-green-400/50',
  error:    'bg-red-400/40',
}

export function AgentProgressTracker({ agents }: AgentProgressTrackerProps) {
  if (Object.keys(agents).length === 0) return <div></div>

  const steps = AGENT_ORDER.filter((name) => name in agents)

  return (
    <div className="flex items-start w-full px-1 py-2">
      {steps.map((name, i) => {
        const state = agents[name]
        const isLast = i === steps.length - 1

        return (
          <Fragment key={name}>
            {/* Step node */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-base font-bold transition-all duration-300 ${NODE_STYLES[state.status]}`}
              >
                {/* sr-only preserves status text for accessibility + tests */}
                <span className="sr-only transition-all duration-300">{state.status}</span>
                <span aria-hidden="true">{ICON[state.status]}</span>
              </div>
              <span className="text-xs text-slate-400 text-center leading-tight max-w-[64px]">
                {AGENT_LABELS[name] ?? name}
              </span>
            </div>

            {/* Connector line — vertically centered with the icon (mt = half icon height) */}
            {!isLast && (
              <div className={`flex-1 h-px mt-4 mx-1 transition-all duration-500 ${LINE_STYLES[state.status]}`} />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}
