import { useEffect, useState } from 'react'

import {
  useDropTipLocations,
  useDropTipRouting,
  useDropTipWithType,
} from './hooks'
import { DropTipWizard } from './DropTipWizard'

import type { PipetteModelSpecs, RobotType } from '@opentrons/shared-data'
import type { PipetteData } from '@opentrons/api-client'
import type {
  DropTipModalStyle,
  FixitCommandTypeUtils,
  IssuedCommandsType,
} from './types'

/** Provides the user toggle for rendering Drop Tip Wizard Flows.
 *
 * NOTE: Rendering these flows is independent of whether tips are actually attached. First use useTipAttachmentStatus
 * to get tip attachment status.
 */
export function useDropTipWizardFlows(): {
  showDTWiz: boolean
  enableDTWiz: () => void
  disableDTWiz: () => void
} {
  const [showDTWiz, setShowDTWiz] = useState(false)

  return {
    showDTWiz,
    enableDTWiz: () => {
      setShowDTWiz(true)
    },
    disableDTWiz: () => {
      setShowDTWiz(false)
    },
  }
}

export interface DropTipWizardFlowsProps {
  robotType: RobotType
  mount: PipetteData['mount']
  instrumentModelSpecs: PipetteModelSpecs
  /* isTakeover allows for optionally specifying a different callback if a different client cancels the "setup" type flow. */
  closeFlow: (isTakeover?: boolean) => void
  modalStyle: DropTipModalStyle
  /* Optional. If provided, DT will issue "fixit" commands. */
  fixitCommandTypeUtils?: FixitCommandTypeUtils
}

export function DropTipWizardFlows(
  props: DropTipWizardFlowsProps
): JSX.Element {
  const { fixitCommandTypeUtils } = props

  const issuedCommandsType: IssuedCommandsType =
    fixitCommandTypeUtils != null ? 'fixit' : 'setup'

  const dropTipWithTypeUtils = useDropTipWithType({
    ...props,
    issuedCommandsType,
  })
  const dropTipRoutingUtils = useDropTipRouting(fixitCommandTypeUtils)
  const dropTipCommandLocations = useDropTipLocations(props.robotType) // Prefetch to reduce client latency

  // If the flow unrenders for any reason (ex, the pipette card managing the flow unrenders), don't re-render the flow
  // after it closes.
  useEffect(() => {
    return () => {
      dropTipWithTypeUtils.dropTipCommands.handleCleanUpAndClose()
    }
  }, [])

  return (
    <DropTipWizard
      {...props}
      {...dropTipWithTypeUtils}
      {...dropTipRoutingUtils}
      issuedCommandsType={issuedCommandsType}
      dropTipCommandLocations={dropTipCommandLocations}
    />
  )
}
