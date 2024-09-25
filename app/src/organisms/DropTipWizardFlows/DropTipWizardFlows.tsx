import { useState } from 'react';

import { useDropTipRouting, useDropTipWithType } from './hooks'
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
  toggleDTWiz: () => void
} {
  const [showDTWiz, setShowDTWiz] = useState(false)

  const toggleDTWiz = (): void => {
    setShowDTWiz(!showDTWiz)
  }

  return { showDTWiz, toggleDTWiz }
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

  return (
    <DropTipWizard
      {...props}
      {...dropTipWithTypeUtils}
      {...dropTipRoutingUtils}
      issuedCommandsType={issuedCommandsType}
    />
  )
}
