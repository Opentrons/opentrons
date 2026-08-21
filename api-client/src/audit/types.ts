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

export interface LogPeriodDetails {
  id: string
  startedAt: string
  endedAt: string | null
  recordCount: number
  totalSizeBytes: number
  attachedFilenames: string[]
}

export interface LogPeriodDetailsResponse {
  data: LogPeriodDetails
}
