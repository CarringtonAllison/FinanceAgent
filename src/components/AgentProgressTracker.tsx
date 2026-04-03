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
  pending:  'border-[#1AAA89]/20 text-slate-500 bg-[#162820]/50',
  running:  'border-[#F7E460] text-[#F7E460] bg-[#F7E460]/10 animate-pulse',
  complete: 'border-[#6EC5A2] text-[#6EC5A2] bg-[#6EC5A2]/10',
  error:    'border-[#F4532B] text-[#F4532B] bg-[#F4532B]/10',
}

const LINE_STYLES: Record<AgentStatus, string> = {
  pending:  'bg-slate-700',
  running:  'bg-[#F7E460]/40',
  complete: 'bg-[#6EC5A2]/50',
  error:    'bg-[#F4532B]/40',
}

export function AgentProgressTracker({ agents }: AgentProgressTrackerProps) {
  if (Object.keys(agents).length === 0) return <div></div>

  const steps = AGENT_ORDER.filter((name) => name in agents)

  return (
    <div className="flex items-start w-full px-4 py-3">
      {steps.map((name, i) => {
        const state = agents[name]
        const isLast = i === steps.length - 1

        return (
          <Fragment key={name}>
            {/* Step node */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center text-xs sm:text-base font-bold transition-all duration-300 ${NODE_STYLES[state.status]}`}
              >
                {/* sr-only preserves status text for accessibility + tests */}
                <span className="sr-only transition-all duration-300">{state.status}</span>
                <span aria-hidden="true">{ICON[state.status]}</span>
              </div>
              <span className="text-[10px] sm:text-xs text-slate-400 text-center leading-tight w-14 sm:w-[90px]">
                {AGENT_LABELS[name] ?? name}
              </span>
            </div>

            {/* Connector line — vertically centered with the icon (mt = half icon height) */}
            {!isLast && (
              <div className={`flex-1 h-px mt-3 sm:mt-4 mx-0.5 sm:mx-1 transition-all duration-500 ${LINE_STYLES[state.status]}`} />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}
