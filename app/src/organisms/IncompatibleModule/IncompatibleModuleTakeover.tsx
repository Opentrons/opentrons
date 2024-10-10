import { createPortal } from 'react-dom'
import { IncompatibleModuleODDModalBody } from './IncompatibleModuleODDModalBody'
import { IncompatibleModuleDesktopModalBody } from './IncompatibleModuleDesktopModalBody'
import { getTopPortalEl, getModalPortalEl } from '/app/App/portal'
import { useIncompatibleModulesAttached } from './hooks'

const POLL_INTERVAL_MS = 5000

export interface IncompatibleModuleTakeoverProps {
  isOnDevice: boolean
  robotName?: string
}

export function IncompatibleModuleTakeover({
  isOnDevice,
  robotName,
}: IncompatibleModuleTakeoverProps): JSX.Element | null {
  const incompatibleModules = useIncompatibleModulesAttached({
    refetchInterval: POLL_INTERVAL_MS,
  })
  if (incompatibleModules.length === 0) {
    return null
  }
  if (isOnDevice) {
    return createPortal(
      <IncompatibleModuleODDModalBody modules={incompatibleModules} />,
      getTopPortalEl()
    )
  } else {
    return createPortal(
      <IncompatibleModuleDesktopModalBody
        modules={incompatibleModules}
        robotName={robotName ?? ''}
      />,
      getModalPortalEl()
    )
  }
}
