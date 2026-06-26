export interface LogPeriodSummary {
  id: string
  startedAt: string
  endedAt: string | null
}

export interface LogPeriodSummariesResponse {
  data: LogPeriodSummary[]
  meta: { totalLength: number }
}
