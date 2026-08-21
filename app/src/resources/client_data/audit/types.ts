export interface LogDeletionStatus {
  logPeriodId: string
  status: 'pending' | 'completed' | 'failed'
}
