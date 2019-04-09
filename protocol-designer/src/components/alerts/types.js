// @flow
import type { Node } from 'react'
export type AlertLevel = 'timeline' | 'form' // TODO IMMEDIATELY

// generic alert (warning or error) formatted for rendering
export type AlertData = {
  title: string,
  description: Node,
  dismissId?: string,
}
