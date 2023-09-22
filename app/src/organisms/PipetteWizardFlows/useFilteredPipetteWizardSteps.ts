import * as React from 'react'

import { getPipetteWizardSteps } from './getPipetteWizardSteps'
import { getPipetteWizardStepsForProtocol } from './getPipetteWizardStepsForProtocol'
import { useFilterWizardStepsFrom } from '../../resources/wizards/hooks'

import type { Subsystem } from '@opentrons/api-client'
import type { LoadedPipette, PipetteMount } from '@opentrons/shared-data'
import type {
  PipetteWizardFlow,
  PipetteWizardStep,
  SelectablePipettes,
} from './types'
import type { AttachedPipettesFromInstrumentsQuery } from '../Devices/hooks'

interface UseFilteredPipetteWizardStepsProps {
  memoizedPipetteInfo: LoadedPipette[] | null
  flowType: PipetteWizardFlow
  mount: PipetteMount
  selectedPipette: SelectablePipettes
  isGantryEmpty: boolean
  attachedPipettes: AttachedPipettesFromInstrumentsQuery
  subsystem: Subsystem
}

export const useFilteredPipetteWizardSteps = ({
  memoizedPipetteInfo,
  flowType,
  mount,
  selectedPipette,
  isGantryEmpty,
  attachedPipettes,
  subsystem,
}: UseFilteredPipetteWizardStepsProps): PipetteWizardStep[] => {
  const determinedPipetteWizardSteps = React.useMemo(
    () =>
      memoizedPipetteInfo == null
        ? getPipetteWizardSteps(flowType, mount, selectedPipette, isGantryEmpty)
        : getPipetteWizardStepsForProtocol(
            attachedPipettes,
            memoizedPipetteInfo,
            mount
          ),
    []
  )
  return useFilterWizardStepsFrom(determinedPipetteWizardSteps, subsystem)
}
