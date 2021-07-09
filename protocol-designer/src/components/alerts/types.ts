import { ReactNode } from 'react'
export type AlertLevel = 'timeline' | 'form'
export type AlertType = 'error' | 'warning'
// generic alert (warning or error) formatted for rendering
export interface AlertData {
  title: string
  description: ReactNode
  dismissId?: string
}
