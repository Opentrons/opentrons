import { Node } from 'react'
export type AlertLevel = 'timeline' | 'form'
export type AlertType = 'error' | 'warning'
// generic alert (warning or error) formatted for rendering
export type AlertData = {
  title: string
  description: Node
  dismissId?: string
}
