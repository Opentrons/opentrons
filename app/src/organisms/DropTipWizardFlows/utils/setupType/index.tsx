import * as React from 'react'

import { useDropTipCommandErrors } from '../utils'
import { useDropTipMaintenanceRun } from './useDropTipMaintenanceRun'
import { useChainMaintenanceCommands } from '../../../../resources/runs'

import type { ErrorDetails } from '../utils'
import type { DropTipWizardFlowsProps } from '../..'
import type { PipetteData } from '@opentrons/api-client'
import type { PipetteModelSpecs } from '@opentrons/shared-data'

export interface UseDropTipSetupTypeParams {
  issuedCommandsType: DropTipWizardFlowsProps['issuedCommandsType']
  mount: PipetteData['mount']
  instrumentModelSpecs: PipetteModelSpecs
  closeFlow: () => void
}

export function useDropTipSetupTypeUtils(params: UseDropTipSetupTypeParams) {
  const {
    chainRunCommands,
    isCommandMutationLoading: isChainCommandMutationLoading,
  } = useChainMaintenanceCommands()

  // TOME: I will most likely refactor out the error details to a higher level in a bit. You'll have to think about how ER flows work with that.
  const [errorDetails, setErrorDetails] = React.useState<null | ErrorDetails>(
    null
  )
  const setRobustErrorDetails = useDropTipCommandErrors(setErrorDetails)

  const activeMaintenanceRunId = useDropTipMaintenanceRun({
    ...params,
    chainRunCommands,
    setErrorDetails: setRobustErrorDetails,
  })

  // Return the command utils as well.
  return { activeMaintenanceRunId }
}
