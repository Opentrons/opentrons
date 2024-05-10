import * as React from 'react'
import { createPortal } from 'react-dom'
import { IncompatibleModuleODDModalBody } from './IncompatibleModuleODDModalBody'
import { IncompatibleModuleDesktopModalBody } from './IncompatibleModuleDesktopModalBody'
import { getTopPortalEl, getModalPortalEl } from '../../App/portal'
import { useIncompatibleModulesAttached } from './hooks'

const POLL_INTERVAL_MS = 5000

export interface IncompatibleModuleTakeoverProps {
  isOnDevice: boolean
  robotName?: string
}

export function IncompatibleModuleTakeover({
  isOnDevice,
  robotName,
}: IncompatibleModuleTakeoverProps): JSX.Element {
  const incompatibleModules = useIncompatibleModulesAttached({
    refetchInterval: POLL_INTERVAL_MS,
  })
  return (
    <>
      {incompatibleModules.length !== 0
        ? isOnDevice
          ? createPortal(
              <IncompatibleModuleODDModalBody modules={incompatibleModules} />,
              getTopPortalEl()
            )
          : createPortal(
              <IncompatibleModuleDesktopModalBody
                modules={incompatibleModules}
                robotName={robotName ?? ''}
              />,
              getModalPortalEl()
            )
        : null}
    </>
  )
}
