export interface LogPeriodSummary {
  id: string
  startedAt: string
  endedAt: string | null
}

export interface LogPeriodSummariesResponse {
  data: LogPeriodSummary[]
  meta: { totalLength: number }
}

export type DownloadedLogPeriodResponse = Blob

export interface DeleteLogPeriodQueryParams {
  deletionKey: string
}

export interface PostLogMessageData {
  action: string
  message: string
}

export interface PostLogMessageResponse {
  data: {
    loggedAt: string
  }
}
