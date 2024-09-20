export type AlertLevel = 'timeline' | 'form'
export type AlertType = 'error' | 'warning'

export interface AlertData {
  title: string
  description: React.ReactNode
  dismissId?: string
}
