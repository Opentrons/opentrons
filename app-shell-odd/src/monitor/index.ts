import type { Dispatch } from '../types'
import { ResourceMonitor } from './ResourceMonitor'

export function registerResourceMonitor(dispatch: Dispatch): Dispatch {
  const resourceMonitor = new ResourceMonitor()
  return resourceMonitor.start(dispatch)
}
