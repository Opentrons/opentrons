import { ResourceMonitor } from './ResourceMonitor'

import type { Dispatch } from '../types'

export function registerResourceMonitor(dispatch: Dispatch): Dispatch {
  const resourceMonitor = new ResourceMonitor()
  return resourceMonitor.start(dispatch)
}
