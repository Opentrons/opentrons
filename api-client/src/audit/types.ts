export interface LogPeriod {
  id: string
  startedAt: string
  endedAt: string | null
}

export interface LogPeriodsResponse {
  data: LogPeriod[]
  meta: { totalLength: number }
}
