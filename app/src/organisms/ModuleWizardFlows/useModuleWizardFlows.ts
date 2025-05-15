import { useEffect, useState, useReducer } from 'react'
import { useSelector } from 'react-redux'

import { useDeleteMaintenanceRunMutation } from '@opentrons/react-api-client'

import { getIsOnDevice } from '/app/redux/config'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'
import { useAttachedPipettesFromInstrumentsQuery } from '/app/resources/instruments'
import {
  useChainMaintenanceCommands,
  useNotifyCurrentMaintenanceRun,
} from '/app/resources/maintenance_runs'
import { useCreateTargetedMaintenanceRunMutation } from '/app/resources/runs'

import { getModuleCalibrationSteps } from './getModuleCalibrationSteps'

import type { SetStateAction } from 'react'
import type { AttachedModule, CommandData } from '@opentrons/api-client'
import type { CreateCommand, DeckConfiguration } from '@opentrons/shared-data'
import type { PipetteInformation } from '/app/redux/pipettes'
import type { ModuleCalibrationWizardStep } from './types'

const RUN_REFETCH_INTERVAL = 5000


export interface UseInitModuleFlowResult {
  showModuleWizard: boolean
  currentStep: ModuleCalibrationWizardStep
  currentStepIndex: number
  totalStepCount: number
  handleCleanUpAndClose: () => void
  wizardFlowBaseProps: {
    attachedPipette: PipetteInformation | null
    chainRunCommands?: (
      commands: CreateCommand[],
      continuePastCommandFailure: boolean
    ) => Promise<CommandData[]>
    isRobotMoving: boolean
    proceed: () => void
    maintenanceRunId?: string
    goBack: () => void
    setErrorMessage: (message: string | null) => void
    errorMessage: string | null
    isOnDevice: boolean
    attachedModule: AttachedModule
    isExiting: boolean
  }
  buildFlowForSelectedModule: (module: AttachedModule) => void
  deckConfig: DeckConfiguration
}

export interface UseInitModuleFlowParams {
  closeFlow: () => void
  attachedModule: AttachedModule
  onComplete?: () => void
}

export function useInitModuleFlow(
  params: UseInitModuleFlowParams
): UseInitModuleFlowResult {
  const { closeFlow, attachedModule, onComplete } = params
  const isOnDevice = useSelector(getIsOnDevice)

  const attachedPipettes = useAttachedPipettesFromInstrumentsQuery()
  const attachedPipette =
    attachedPipettes.left?.data.calibratedOffset?.last_modified != null
      ? attachedPipettes.left
      : attachedPipettes.right

  const deckConfig = useNotifyDeckConfigurationQuery().data ?? []

  const [moduleCalibrationSteps, setModuleCalibrationSteps] = useState<
    ModuleCalibrationWizardStep[]
  >([])
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
  const [totalStepCount, setTotalStepCount] = useState(5)
  const [currentStep, setCurrentStep] = useState(
    moduleCalibrationSteps[currentStepIndex]
  )

  useEffect(() => {
    setTotalStepCount(moduleCalibrationSteps.length - 1)
    setCurrentStep(moduleCalibrationSteps[currentStepIndex])
  }, [currentStepIndex, moduleCalibrationSteps])

  const goBack = (): void => {
    setCurrentStepIndex(
      currentStepIndex === 0 ? currentStepIndex : currentStepIndex - 1
    )
  }
  const [createdMaintenanceRunId, setCreatedMaintenanceRunId] = useState<
    string | null
  >(null)
  // we should start checking for run deletion only after the maintenance run is created
  // and the useCurrentRun poll has returned that created id
  const [
    monitorMaintenanceRunForDeletion,
    setMonitorMaintenanceRunForDeletion,
  ] = useState<boolean>(false)

  const { data: maintenanceRunData } = useNotifyCurrentMaintenanceRun({
    refetchInterval: RUN_REFETCH_INTERVAL,
    enabled: createdMaintenanceRunId != null,
  })
  const {
    chainRunCommands,
    isCommandMutationLoading,
  } = useChainMaintenanceCommands()

  const {
    createTargetedMaintenanceRun,
    isLoading: isCreateLoading,
  } = useCreateTargetedMaintenanceRunMutation({
    onSuccess: (response: { data: { id: SetStateAction<string | null> } }) => {
      setCreatedMaintenanceRunId(response.data.id)
    },
  })

  // this will close the modal in case the run was deleted by the terminate
  // activity modal on the ODD
  useEffect(() => {
    if (
      createdMaintenanceRunId !== null &&
      maintenanceRunData?.data.id === createdMaintenanceRunId
    ) {
      setMonitorMaintenanceRunForDeletion(true)
    }
    if (
      maintenanceRunData?.data.id !== createdMaintenanceRunId &&
      monitorMaintenanceRunForDeletion
    ) {
      closeFlow()
    }
  }, [
    maintenanceRunData?.data.id,
    createdMaintenanceRunId,
    monitorMaintenanceRunForDeletion,
    closeFlow,
  ])

  const [errorMessage, setErrorMessage] = useState<null | string>(null)
  const [isExiting, setIsExiting] = useState<boolean>(false)
  const proceed = (): void => {
    if (!isCommandMutationLoading) {
      setCurrentStepIndex(
        currentStepIndex !== totalStepCount
          ? currentStepIndex + 1
          : currentStepIndex
      )
    }
  }
  const handleClose = (): void => {
    setIsExiting(false)
    closeFlow()
    if (onComplete != null) onComplete()
  }

  const { deleteMaintenanceRun } = useDeleteMaintenanceRunMutation({
    onSuccess: () => {
      handleClose()
    },
    onError: () => {
      handleClose()
    },
  })

  const handleCleanUpAndClose = (): void => {
    setIsExiting(true)
    if (maintenanceRunData?.data.id == null) handleClose()
    else {
      chainRunCommands(
        maintenanceRunData?.data.id as string,
        [{ commandType: 'home' as const, params: {} }],
        false
      )
        .then(() => {
          deleteMaintenanceRun(maintenanceRunData?.data.id)
        })
        .catch(error => {
          console.error(error.message)
          handleClose()
        })
    }
  }

  const [isRobotMoving, setIsRobotMoving] = useState<boolean>(false)

  useEffect(() => {
    if (isCommandMutationLoading || isExiting) {
      setIsRobotMoving(true)
    } else {
      setIsRobotMoving(false)
    }
  }, [isCommandMutationLoading, isExiting])

  let chainMaintenanceRunCommands

  if (maintenanceRunData?.data.id != null) {
    chainMaintenanceRunCommands = (
      commands: CreateCommand[],
      continuePastCommandFailure: boolean
    ): Promise<CommandData[]> =>
      chainRunCommands(
        maintenanceRunData?.data.id as string,
        commands,
        continuePastCommandFailure
      )
  }

  const maintenanceRunId =
    maintenanceRunData?.data.id != null &&
    maintenanceRunData?.data.id === createdMaintenanceRunId
      ? createdMaintenanceRunId
      : undefined
  const calibrateBaseProps = {
    attachedPipette,
    chainRunCommands: chainMaintenanceRunCommands,
    isRobotMoving,
    proceed,
    maintenanceRunId,
    goBack,
    setErrorMessage,
    errorMessage,
    isOnDevice,
    attachedModule,
    isExiting,
  }

  const buildFlowForSelectedModule = (attachedModule: AttachedModule): void => {
    setModuleCalibrationSteps(
      getModuleCalibrationSteps(attachedModule.moduleType)
    )
    if (createdMaintenanceRunId == null) {
      createTargetedMaintenanceRun({})
    }
    // run prep steps here
    // redux store for attached module & step information
    setCurrentStepIndex(0)

    console.log('HI SETTING CURRENT STEP', currentStep)
    console.log('HI HERE ARE THE NEW STEPS', moduleCalibrationSteps)
    console.log('HI SETTING CURRENT STEP', currentStep)
  }

  return {
    showModuleWizard: true,
    currentStep: currentStep,
    currentStepIndex: currentStepIndex,
    totalStepCount: totalStepCount,
    handleCleanUpAndClose: handleCleanUpAndClose,
    wizardFlowBaseProps: calibrateBaseProps,
    deckConfig: deckConfig,
    buildFlowForSelectedModule,
  }
}
