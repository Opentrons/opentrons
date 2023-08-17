import * as React from 'react'
import isEqual from 'lodash/isEqual'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useConditionalConfirm } from '@opentrons/components'
import { LabwareOffsetCreateData } from '@opentrons/api-client'
import {
  useCreateLabwareOffsetMutation,
  useCreateMaintenanceCommandMutation,
} from '@opentrons/react-api-client'
import {
  CompletedProtocolAnalysis,
  Coordinates,
  FIXED_TRASH_ID,
} from '@opentrons/shared-data'
import { Portal } from '../../App/portal'
// import { useTrackEvent } from '../../redux/analytics'
import { IntroScreen } from './IntroScreen'
import { ExitConfirmation } from './ExitConfirmation'
import { CheckItem } from './CheckItem'
import { LegacyModalShell } from '../../molecules/LegacyModal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { getIsOnDevice, useFeatureFlag } from '../../redux/config'
import { AttachProbe } from './AttachProbe'
import { DetachProbe } from './DetachProbe'
import { PickUpTip } from './PickUpTip'
import { ReturnTip } from './ReturnTip'
import { ResultsSummary } from './ResultsSummary'
import { useChainMaintenanceCommands } from '../../resources/runs/hooks'
import { FatalErrorModal } from './FatalErrorModal'
import { RobotMotionLoader } from './RobotMotionLoader'
import { getLabwarePositionCheckSteps } from './getLabwarePositionCheckSteps'
import type { LabwareOffset } from '@opentrons/api-client'
import type { DropTipCreateCommand } from '@opentrons/shared-data/protocol/types/schemaV7/command/pipetting'
import type { Axis, Sign, StepSize } from '../../molecules/JogControls/types'
import type { RegisterPositionAction, WorkingOffset } from './types'
import { getGoldenCheckSteps } from './utils/getGoldenCheckSteps'

const JOG_COMMAND_TIMEOUT = 10000 // 10 seconds
interface LabwarePositionCheckModalProps {
  onCloseClick: () => unknown
  runId: string
  maintenanceRunId: string
  mostRecentAnalysis: CompletedProtocolAnalysis | null
  existingOffsets: LabwareOffset[]
  caughtError?: Error
}

export const LabwarePositionCheckComponent = (
  props: LabwarePositionCheckModalProps
): JSX.Element | null => {
  const {
    mostRecentAnalysis,
    onCloseClick,
    existingOffsets,
    runId,
    maintenanceRunId,
  } = props
  const { t } = useTranslation(['labware_position_check', 'shared'])
  const isOnDevice = useSelector(getIsOnDevice)
  const protocolData = mostRecentAnalysis
  const [fatalError, setFatalError] = React.useState<string | null>(null)
  const [
    { workingOffsets, tipPickUpOffset },
    registerPosition,
  ] = React.useReducer(
    (
      state: {
        workingOffsets: WorkingOffset[]
        tipPickUpOffset: Coordinates | null
      },
      action: RegisterPositionAction
    ) => {
      if (action.type === 'tipPickUpOffset') {
        return { ...state, tipPickUpOffset: action.offset }
      }

      if (
        action.type === 'initialPosition' ||
        action.type === 'finalPosition'
      ) {
        const { labwareId, location, position } = action
        const existingRecordIndex = state.workingOffsets.findIndex(
          record =>
            record.labwareId === labwareId && isEqual(record.location, location)
        )
        if (existingRecordIndex >= 0) {
          if (action.type === 'initialPosition') {
            return {
              ...state,
              workingOffsets: [
                ...state.workingOffsets.slice(0, existingRecordIndex),
                {
                  ...state.workingOffsets[existingRecordIndex],
                  initialPosition: position,
                  finalPosition: null,
                },
                ...state.workingOffsets.slice(existingRecordIndex + 1),
              ],
            }
          } else if (action.type === 'finalPosition') {
            return {
              ...state,
              workingOffsets: [
                ...state.workingOffsets.slice(0, existingRecordIndex),
                {
                  ...state.workingOffsets[existingRecordIndex],
                  finalPosition: position,
                },
                ...state.workingOffsets.slice(existingRecordIndex + 1),
              ],
            }
          }
        }
        return {
          ...state,
          workingOffsets: [
            ...state.workingOffsets,
            {
              labwareId,
              location,
              initialPosition:
                action.type === 'initialPosition' ? position : null,
              finalPosition: action.type === 'finalPosition' ? position : null,
            },
          ],
        }
      } else {
        return state
      }
    },
    { workingOffsets: [], tipPickUpOffset: null }
  )
  const [isExiting, setIsExiting] = React.useState(false)
  const {
    createMaintenanceCommand: createSilentCommand,
  } = useCreateMaintenanceCommandMutation(maintenanceRunId)
  const {
    chainRunCommands,
    isCommandMutationLoading: isCommandChainLoading,
  } = useChainMaintenanceCommands(maintenanceRunId)

  const goldenLPC = useFeatureFlag('lpcWithProbe')
  const { createLabwareOffset } = useCreateLabwareOffsetMutation()
  const [currentStepIndex, setCurrentStepIndex] = React.useState<number>(0)
  const handleCleanUpAndClose = (): void => {
    setIsExiting(true)
    const dropTipToBeSafeCommands: DropTipCreateCommand[] = (
      protocolData?.pipettes ?? []
    ).map(pip => ({
      commandType: 'dropTip' as const,
      params: {
        pipetteId: pip.id,
        labwareId: FIXED_TRASH_ID,
        wellName: 'A1',
        wellLocation: { origin: 'top' as const },
      },
    }))
    chainRunCommands(
      [
        ...dropTipToBeSafeCommands,
        { commandType: 'home' as const, params: {} },
      ],
      true
    )
      .then(() => props.onCloseClick())
      .catch(() => props.onCloseClick())
  }
  const {
    confirm: confirmExitLPC,
    showConfirmation,
    cancel: cancelExitLPC,
  } = useConditionalConfirm(handleCleanUpAndClose, true)

  const proceed = (): void => {
    setCurrentStepIndex(
      currentStepIndex !== LPCSteps.length - 1
        ? currentStepIndex + 1
        : currentStepIndex
    )
  }
  if (protocolData == null) return null
  const LPCSteps = goldenLPC
    ? getGoldenCheckSteps(protocolData)
    : getLabwarePositionCheckSteps(protocolData)
  const totalStepCount = LPCSteps.length - 1
  const currentStep = LPCSteps?.[currentStepIndex]
  if (currentStep == null) return null

  const handleJog = (
    axis: Axis,
    dir: Sign,
    step: StepSize,
    onSuccess?: (position: Coordinates | null) => void
  ): void => {
    const pipetteId = 'pipetteId' in currentStep ? currentStep.pipetteId : null
    if (pipetteId != null) {
      createSilentCommand({
        command: {
          commandType: 'moveRelative',
          params: { pipetteId: pipetteId, distance: step * dir, axis },
        },
        waitUntilComplete: true,
        timeout: JOG_COMMAND_TIMEOUT,
      })
        .then(data => {
          onSuccess?.(data?.data?.result?.position ?? null)
        })
        .catch((e: Error) => {
          setFatalError(`error issuing jog command: ${e.message}`)
        })
    } else {
      setFatalError(`could not find pipette to jog with id: ${pipetteId ?? ''}`)
    }
  }
  const movementStepProps = {
    proceed,
    protocolData,
    chainRunCommands,
    setFatalError,
    registerPosition,
    handleJog,
    isRobotMoving: isCommandChainLoading,
    workingOffsets,
    existingOffsets,
  }

  const handleApplyOffsets = (offsets: LabwareOffsetCreateData[]): void => {
    Promise.all(offsets.map(data => createLabwareOffset({ runId, data })))
      .then(() => {
        onCloseClick()
      })
      .catch((e: Error) => {
        setFatalError(`error applying labware offsets: ${e.message}`)
      })
  }

  let modalContent: JSX.Element = <div>UNASSIGNED STEP</div>
  if (isExiting) {
    modalContent = (
      <RobotMotionLoader header={t('shared:stand_back_robot_is_in_motion')} />
    )
  } else if (fatalError != null) {
    modalContent = (
      <FatalErrorModal
        errorMessage={fatalError}
        onClose={handleCleanUpAndClose}
      />
    )
  } else if (showConfirmation) {
    modalContent = (
      <ExitConfirmation
        onGoBack={cancelExitLPC}
        onConfirmExit={confirmExitLPC}
      />
    )
  } else if (currentStep.section === 'BEFORE_BEGINNING') {
    modalContent = <IntroScreen {...movementStepProps} />
  } else if (
    currentStep.section === 'CHECK_POSITIONS' ||
    currentStep.section === 'CHECK_TIP_RACKS' ||
    currentStep.section === 'CHECK_LABWARE'
  ) {
    modalContent = <CheckItem {...currentStep} {...movementStepProps} />
  } else if (currentStep.section === 'ATTACH_PROBE') {
    modalContent = <AttachProbe {...currentStep} {...movementStepProps} />
  } else if (currentStep.section === 'DETACH_PROBE') {
    modalContent = <DetachProbe {...currentStep} {...movementStepProps} />
  } else if (currentStep.section === 'PICK_UP_TIP') {
    modalContent = <PickUpTip {...currentStep} {...movementStepProps} />
  } else if (currentStep.section === 'RETURN_TIP') {
    modalContent = (
      <ReturnTip
        {...currentStep}
        {...movementStepProps}
        {...{ tipPickUpOffset }}
      />
    )
  } else if (currentStep.section === 'RESULTS_SUMMARY') {
    modalContent = (
      <ResultsSummary
        {...currentStep}
        protocolData={protocolData}
        {...{ workingOffsets, existingOffsets, handleApplyOffsets }}
      />
    )
  }
  const wizardHeader = (
    <WizardHeader
      title={t('labware_position_check_title')}
      currentStep={currentStepIndex}
      totalSteps={totalStepCount}
      onExit={
        showConfirmation || isExiting
          ? undefined
          : () => {
              if (fatalError != null) {
                handleCleanUpAndClose()
              } else {
                confirmExitLPC()
              }
            }
      }
    />
  )
  return (
    <Portal level="top">
      {isOnDevice ? (
        <LegacyModalShell fullPage>
          {wizardHeader}
          {modalContent}
        </LegacyModalShell>
      ) : (
        <LegacyModalShell width="47rem" header={wizardHeader}>
          {modalContent}
        </LegacyModalShell>
      )}
    </Portal>
  )
}
