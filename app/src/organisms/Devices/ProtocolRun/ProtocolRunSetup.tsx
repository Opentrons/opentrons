import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { Flex, DIRECTION_COLUMN, SPACING } from '@opentrons/components'
import { protocolHasModules } from '@opentrons/shared-data'

import { Line } from '../../../atoms/structure'
import { InfoMessage } from '../../../molecules/InfoMessage'
import {
  useDeckCalibrationData,
  useProtocolDetailsForRun,
  useRobot,
  useRunCalibrationStatus,
  useRunHasStarted,
} from '../hooks'
import { SetupLabware } from './SetupLabware'
import { SetupRobotCalibration } from './SetupRobotCalibration'
import { SetupModules } from './SetupModules'
import { SetupStep } from './SetupStep'

const ROBOT_CALIBRATION_STEP_KEY = 'robot_calibration_step' as const
const MODULE_SETUP_KEY = 'module_setup_step' as const
const LABWARE_SETUP_KEY = 'labware_setup_step' as const

export type StepKey =
  | typeof ROBOT_CALIBRATION_STEP_KEY
  | typeof MODULE_SETUP_KEY
  | typeof LABWARE_SETUP_KEY

interface ProtocolRunSetupProps {
  protocolRunHeaderRef: React.RefObject<HTMLDivElement> | null
  robotName: string
  runId: string
}

export function ProtocolRunSetup({
  protocolRunHeaderRef,
  robotName,
  runId,
}: ProtocolRunSetupProps): JSX.Element | null {
  const { t } = useTranslation('protocol_setup')
  const { protocolData } = useProtocolDetailsForRun(runId)
  const robot = useRobot(robotName)
  const calibrationStatus = useRunCalibrationStatus(robotName, runId)
  const { isDeckCalibrated } = useDeckCalibrationData(robotName)
  const runHasStarted = useRunHasStarted(runId)

  const [expandedStepKey, setExpandedStepKey] = React.useState<StepKey | null>(
    null
  )
  const [stepsKeysInOrder, setStepKeysInOrder] = React.useState<StepKey[]>([
    ROBOT_CALIBRATION_STEP_KEY,
    LABWARE_SETUP_KEY,
  ])

  React.useEffect(() => {
    let nextStepKeysInOrder = stepsKeysInOrder
    if (protocolData != null && protocolHasModules(protocolData)) {
      nextStepKeysInOrder = [
        ROBOT_CALIBRATION_STEP_KEY,
        MODULE_SETUP_KEY,
        LABWARE_SETUP_KEY,
      ]
    }
    setStepKeysInOrder(nextStepKeysInOrder)
  }, [Boolean(protocolData), protocolData?.commands])

  if (robot == null) return null

  const StepDetailMap: Record<
    StepKey,
    { stepInternals: JSX.Element; description: string }
  > = {
    [ROBOT_CALIBRATION_STEP_KEY]: {
      stepInternals: (
        <SetupRobotCalibration
          robotName={robotName}
          runId={runId}
          nextStep={
            stepsKeysInOrder[
              stepsKeysInOrder.findIndex(
                v => v === ROBOT_CALIBRATION_STEP_KEY
              ) + 1
            ]
          }
          expandStep={nextStep => setExpandedStepKey(nextStep)}
          calibrationStatus={calibrationStatus}
        />
      ),
      description: t(`${ROBOT_CALIBRATION_STEP_KEY}_description`),
    },
    [MODULE_SETUP_KEY]: {
      stepInternals: (
        <SetupModules
          expandLabwareSetupStep={() => setExpandedStepKey(LABWARE_SETUP_KEY)}
          robotName={robotName}
          runId={runId}
        />
      ),
      description: t(`${MODULE_SETUP_KEY}_description`, {
        count:
          protocolData != null && 'modules' in protocolData
            ? Object.keys(protocolData.modules).length
            : 0,
      }),
    },
    [LABWARE_SETUP_KEY]: {
      stepInternals: (
        <SetupLabware
          protocolRunHeaderRef={protocolRunHeaderRef}
          robotName={robotName}
          runId={runId}
        />
      ),
      description: t(`${LABWARE_SETUP_KEY}_description`),
    },
  }

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing4}
      margin={SPACING.spacing4}
    >
      {runHasStarted ? <InfoMessage title={t('setup_is_view_only')} /> : null}
      {stepsKeysInOrder.map((stepKey, index) => (
        <Flex flexDirection={DIRECTION_COLUMN} key={stepKey}>
          <SetupStep
            expanded={stepKey === expandedStepKey}
            label={t('step', { index: index + 1 })}
            title={t(`${stepKey}_title`)}
            description={StepDetailMap[stepKey].description}
            toggleExpanded={() =>
              stepKey === expandedStepKey
                ? setExpandedStepKey(null)
                : setExpandedStepKey(stepKey)
            }
            calibrationStatusComplete={
              stepKey === ROBOT_CALIBRATION_STEP_KEY && !runHasStarted
                ? calibrationStatus.complete && isDeckCalibrated
                : null
            }
          >
            {StepDetailMap[stepKey].stepInternals}
          </SetupStep>
          {index !== stepsKeysInOrder.length - 1 ? (
            <Line marginTop={SPACING.spacing5} />
          ) : null}
        </Flex>
      ))}
    </Flex>
  )
}
