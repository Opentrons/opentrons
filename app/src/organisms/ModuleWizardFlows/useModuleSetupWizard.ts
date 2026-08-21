import { useEffect, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { VACUUM_MODULE_TYPE } from '@opentrons/shared-data'
import {
  useDeleteMaintenanceRunMutation,
  useUpdateDeckConfigurationMutation,
} from '@opentrons/react-api-client'

import { useMaintenanceRunDocumentation } from '/app/local-resources/access-control/useMaintenanceRunDocumentation'
import { getCalibratedPipetteForModuleSetup } from '/app/local-resources/instruments'
import { isMaintenanceDoorOpenError } from '/app/local-resources/maintenance_runs/utils/isDoorOpenError'
import { getIsOnDevice } from '/app/redux/config'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'
import { useAttachedPipettesFromInstrumentsQuery } from '/app/resources/instruments'
import {
  useChainMaintenanceCommands,
  useNotifyCurrentMaintenanceRun,
} from '/app/resources/maintenance_runs'
import { useCreateTargetedMaintenanceRunMutation } from '/app/resources/runs'

import { ACTIONS } from './constants'
import { getVacuumCleanupCommands } from './getVerifyVacuumCommands'
import { useSendIdentifyModule } from './hooks'
import { moduleSetupWizardReducer } from './moduleSetupWizardReducer'

import type { SetStateAction } from 'react'
import type { AttachedModule, CommandData } from '@opentrons/api-client'
import type { CreateMaintenanceRunType } from '@opentrons/react-api-client'
import type { CreateCommand, DeckConfiguration } from '@opentrons/shared-data'
import type { PipetteInformation } from '/app/resources/instruments/types'
import type { ModuleSetupWizardStep, SendIdentifyModule } from './types'

const RUN_REFETCH_INTERVAL = 5000

export interface UseModuleSetupWizardResult {
  showModuleWizard: boolean
  currentStep: ModuleSetupWizardStep | null
  currentStepIndex: number
  totalStepCount: number
  createMaintenanceRun: CreateMaintenanceRunType
  handleCleanUpAndClose: () => void
  wizardFlowBaseProps: {
    attachedPipette: PipetteInformation | null
    chainRunCommands?: (
      commands: CreateCommand[],
      continuePastCommandFailure: boolean
    ) => Promise<CommandData[]>
    isRobotMoving: boolean
    isModuleUpdating: boolean
    setIsModuleUpdating: (updating: boolean) => void
    proceed: () => void
    restartSetup: () => void
    maintenanceRunId: string | null
    goBack: () => void
    setErrorMessage: (message: string | null) => void
    errorMessage: string | null
    isDoorOpenError: boolean
    setIsDoorOpenError: (isDoorOpenError: boolean) => void
    dismissDoorOpenError: () => void
    isOnDevice: boolean
    attachedModule: AttachedModule | null
    isExiting: boolean
    sendIdentifyModule: SendIdentifyModule
    updateDeckConfiguration: (deckConfig: DeckConfiguration) => void
  }
  buildFlowForSelectedModule: (module: AttachedModule) => void
  patchModuleAfterUpdate: (module: AttachedModule) => void
  deckConfig: DeckConfiguration
}

export interface UseModuleSetupWizardParams {
  closeFlow: () => void
  attachedModuleOnLaunch?: AttachedModule
  onComplete?: () => void
}

export function useModuleSetupWizard(
  params: UseModuleSetupWizardParams
): UseModuleSetupWizardResult {
  const { closeFlow, attachedModuleOnLaunch, onComplete } = params
  const isOnDevice = useSelector(getIsOnDevice)
  const { t } = useTranslation('module_wizard_flows')

  const [state, dispatch] = useReducer(moduleSetupWizardReducer, {
    currentStepIndex: 0,
    currentStep: null,
    totalStepCount: 5,
    stepsInFlow: [],
    attachedModule: attachedModuleOnLaunch ?? null,
  })
  const { currentStepIndex, currentStep, totalStepCount, attachedModule } =
    state
  const attachedPipettes = useAttachedPipettesFromInstrumentsQuery()
  const attachedPipette = getCalibratedPipetteForModuleSetup(attachedPipettes)

  const deckConfig = useNotifyDeckConfigurationQuery().data ?? []

  const goBack = (): void => {
    dispatch({
      type: ACTIONS.GO_BACK,
    })
  }
  const [maintenanceRunId, setMaintenanceRunId] = useState<string | null>(null)

  const {
    commandDocState,
    deletionDocState,
    actionsToDocument,
    addActionToDocument,
  } = useMaintenanceRunDocumentation('add_module', closeFlow)

  const { chainRunCommands, isCommandMutationLoading } =
    useChainMaintenanceCommands(
      commandDocState,
      actionsToDocument,
      addActionToDocument
    )

  const sendIdentifyModule = useSendIdentifyModule(
    commandDocState,
    actionsToDocument,
    addActionToDocument
  )

  const { updateDeckConfiguration } = useUpdateDeckConfigurationMutation(
    commandDocState,
    {
      onSuccess: () => {
        addActionToDocument('update_deck_configuration')
      },
    }
  )

  const { createTargetedMaintenanceRun, isLoading: isCreateLoading } =
    useCreateTargetedMaintenanceRunMutation(
      commandDocState,
      actionsToDocument,
      {
        onSuccess: (response: {
          data: { id: SetStateAction<string | null> }
        }) => {
          setMaintenanceRunId(response.data.id)
        },
      }
    )

  useMonitorMaintenanceRunForDeletion({
    maintenanceRunId,
    setMaintenanceRunId,
    closeFlow,
  })

  const [errorMessage, setErrorMessage] = useState<null | string>(null)
  const [isDoorOpenError, setIsDoorOpenError] = useState<boolean>(false)
  const dismissDoorOpenError = (): void => {
    setErrorMessage(null)
    setIsDoorOpenError(false)
  }
  const [isExiting, setIsExiting] = useState<boolean>(false)
  const proceed = (): void => {
    if (!isCommandMutationLoading) {
      dispatch({
        type: ACTIONS.PROCEED,
      })
    }
  }
  const handleClose = (): void => {
    setIsExiting(false)
    closeFlow()
    if (onComplete != null) onComplete()
  }

  const { deleteMaintenanceRun } = useDeleteMaintenanceRunMutation(
    deletionDocState,
    [...actionsToDocument, 'end_module_setup'],
    {
      onSuccess: () => {
        setMaintenanceRunId(null)
      },
      onError: () => {
        setIsExiting(false)
      },
    }
  )

  const handleCleanUpAndClose = (): void => {
    setIsExiting(true)
    if (attachedModule != null) sendIdentifyModule(attachedModule, false)
    if (maintenanceRunId == null) {
      console.log(
        'closing module setup wizard: no maintenance run, not deleting'
      )
      handleClose()
    } else {
      console.log(
        'closing module setup wizard: homing and clearing maintenance run'
      )
      const vacuumCleanupCommands =
        attachedModule?.moduleType === VACUUM_MODULE_TYPE
          ? getVacuumCleanupCommands(String(attachedModule.id))
          : []
      chainRunCommands(
        maintenanceRunId,
        [
          ...vacuumCleanupCommands,
          { commandType: 'home' as const, params: {} },
        ],
        true
      )
        .then(() => {
          console.log(
            'closing module setup wizard: homed, clearing maintenance run'
          )
          deleteMaintenanceRun(maintenanceRunId, {
            onSuccess: () => {
              handleClose()
            },
          })
        })
        .catch(error => {
          if (isMaintenanceDoorOpenError(error)) {
            setIsExiting(false)
            setIsDoorOpenError(true)
            setErrorMessage(t('door_is_open') as string)
          } else {
            console.error(error.message)
            handleClose()
          }
        })
    }
  }

  const restartSetup = (): void => {
    if (maintenanceRunId != null) {
      deleteMaintenanceRun(maintenanceRunId)
    }
    dispatch({
      type: ACTIONS.RESTART_FLOW,
    })
  }

  const [isRobotMoving, setIsRobotMoving] = useState<boolean>(false)
  const [isModuleUpdating, setIsModuleUpdating] = useState<boolean>(false)

  useEffect(() => {
    if (isCommandMutationLoading || isExiting || isCreateLoading) {
      setIsRobotMoving(true)
    } else {
      setIsRobotMoving(false)
    }
  }, [isCommandMutationLoading, isExiting, isCreateLoading])

  let chainMaintenanceRunCommands

  if (maintenanceRunId != null) {
    chainMaintenanceRunCommands = (
      commands: CreateCommand[],
      continuePastCommandFailure: boolean
    ): Promise<CommandData[]> =>
      chainRunCommands(maintenanceRunId, commands, continuePastCommandFailure)
  }

  const calibrateBaseProps = {
    attachedPipette,
    chainRunCommands: chainMaintenanceRunCommands,
    isRobotMoving,
    isModuleUpdating,
    setIsModuleUpdating,
    proceed,
    maintenanceRunId,
    goBack,
    restartSetup,
    setErrorMessage,
    errorMessage,
    isDoorOpenError,
    setIsDoorOpenError,
    dismissDoorOpenError,
    isOnDevice,
    attachedModule,
    isExiting,
    sendIdentifyModule,
    updateDeckConfiguration,
  }

  const buildFlowForSelectedModule = (
    selectedModuleToBuildFlow: AttachedModule
  ): void => {
    addActionToDocument({
      module: selectedModuleToBuildFlow,
      type: 'attach_module',
      step: 'start',
    })
    dispatch({
      type: ACTIONS.BUILD_FLOW,
      attachedModule: selectedModuleToBuildFlow,
    })
  }

  const patchModuleAfterUpdate = (refreshedModule: AttachedModule): void => {
    dispatch({
      type: ACTIONS.PATCH_MODULE,
      attachedModule: refreshedModule,
    })
  }

  return {
    showModuleWizard: true,
    currentStep,
    currentStepIndex,
    totalStepCount,
    createMaintenanceRun: createTargetedMaintenanceRun,
    handleCleanUpAndClose,
    wizardFlowBaseProps: calibrateBaseProps,
    deckConfig,
    buildFlowForSelectedModule,
    patchModuleAfterUpdate,
  }
}

function useMonitorMaintenanceRunForDeletion({
  maintenanceRunId,
  setMaintenanceRunId,
  closeFlow,
}: {
  maintenanceRunId: string | null
  setMaintenanceRunId: (id: string | null) => void
  closeFlow: () => void
}): void {
  const [
    monitorMaintenanceRunForDeletion,
    setMonitorMaintenanceRunForDeletion,
  ] = useState<boolean>(false)

  // We should start checking for run deletion only after the maintenance run is created
  // and the useCurrentRun poll has returned that created id
  const { data: maintenanceRunData } = useNotifyCurrentMaintenanceRun({
    refetchInterval: RUN_REFETCH_INTERVAL,
    enabled: maintenanceRunId != null,
  })

  useEffect(() => {
    if (maintenanceRunId === null) {
      setMonitorMaintenanceRunForDeletion(false)
    } else if (
      maintenanceRunId !== null &&
      maintenanceRunData?.data.id === maintenanceRunId
    ) {
      setMonitorMaintenanceRunForDeletion(true)
    } else if (
      maintenanceRunData?.data.id !== maintenanceRunId &&
      monitorMaintenanceRunForDeletion
    ) {
      setMaintenanceRunId(null)
      closeFlow()
    }
  }, [
    maintenanceRunData?.data.id,
    maintenanceRunId,
    monitorMaintenanceRunForDeletion,
    setMaintenanceRunId,
    closeFlow,
  ])
}
