import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  Card,
  Text,
  Flex,
  Icon,
  SPACING_2,
  SPACING_3,
  SPACING_7,
  SIZE_1,
  DIRECTION_ROW,
  ALIGN_START,
  FONT_WEIGHT_SEMIBOLD,
  FONT_SIZE_BODY_1,
  C_WHITE,
  COLOR_SUCCESS,
  COLOR_WARNING,
} from '@opentrons/components'
import { protocolHasModules } from '@opentrons/shared-data'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'
import { getProtocolData } from '../../../redux/protocol'
import { Divider } from '../../../atoms/structure'
import { CollapsibleStep } from './CollapsibleStep'
import { LabwareSetup } from './LabwareSetup'
import { ModuleSetup } from './ModuleSetup'
import { getModuleRenderCoords } from '../utils/getModuleRenderCoords'
import { getLabwareRenderCoords } from '../utils/getLabwareRenderCoords'
import { RobotCalibration } from './RobotCalibration'
import type { JsonProtocolFile } from '@opentrons/shared-data'
import type { State } from '../../../redux/types'
import { getConnectedRobot } from '../../../redux/discovery/selectors'
import { getProtocolCalibrationComplete } from '../../../redux/calibration/selectors'

const ROBOT_CALIBRATION_STEP_KEY = 'robot_calibration_step' as const
const MODULE_SETUP_KEY = 'module_setup_step' as const
const LABWARE_SETUP_KEY = 'labware_setup_step' as const

export type StepKey =
  | typeof ROBOT_CALIBRATION_STEP_KEY
  | typeof MODULE_SETUP_KEY
  | typeof LABWARE_SETUP_KEY

export function RunSetupCard(): JSX.Element | null {
  const { t } = useTranslation('protocol_setup')
  const protocolData = useSelector((state: State) => getProtocolData(state))
  const moduleRenderCoords = getModuleRenderCoords(
    protocolData,
    standardDeckDef as any
  )
  const labwareRenderCoords = getLabwareRenderCoords(
    protocolData,
    standardDeckDef as any
  )
  const robot = useSelector((state: State) => getConnectedRobot(state))
  const robotName = robot?.name != null ? robot?.name : ''
  const calibrationStatus = useSelector((state: State) => {
    return getProtocolCalibrationComplete(state, robotName)
  })

  const [expandedStepKey, setExpandedStepKey] = React.useState<StepKey | null>(
    ROBOT_CALIBRATION_STEP_KEY
  )
  if (
    protocolData == null ||
    robot == null ||
    ('metadata' in protocolData && Object.keys(protocolData).length === 1)
  )
    return null

  let stepsKeysInOrder: StepKey[] = [ROBOT_CALIBRATION_STEP_KEY]
  if (protocolHasModules(protocolData as JsonProtocolFile)) {
    stepsKeysInOrder = [
      ...stepsKeysInOrder,
      MODULE_SETUP_KEY,
      LABWARE_SETUP_KEY,
    ]
  } else {
    stepsKeysInOrder = [...stepsKeysInOrder, LABWARE_SETUP_KEY]
  }

  const StepDetailMap: Record<
    StepKey,
    { stepInternals: JSX.Element; description: string }
  > = {
    [ROBOT_CALIBRATION_STEP_KEY]: {
      stepInternals: (
        <RobotCalibration
          robot={robot}
          nextStep={stepsKeysInOrder[1]}
          expandStep={nextStep => setExpandedStepKey(nextStep)}
          calibrationStatus={calibrationStatus}
        />
      ),
      description: t(`${ROBOT_CALIBRATION_STEP_KEY}_description`),
    },
    [MODULE_SETUP_KEY]: {
      stepInternals: (
        <ModuleSetup
          moduleRenderCoords={moduleRenderCoords}
          expandLabwareSetupStep={() => setExpandedStepKey(LABWARE_SETUP_KEY)}
          robotName={robot.name}
        />
      ),
      description: t(`${MODULE_SETUP_KEY}_description`, {
        count:
          'modules' in protocolData
            ? Object.keys(protocolData.modules).length
            : 0,
      }),
    },
    [LABWARE_SETUP_KEY]: {
      stepInternals: (
        <LabwareSetup
          moduleRenderCoords={moduleRenderCoords}
          labwareRenderCoords={labwareRenderCoords}
        />
      ),
      description: t(`${LABWARE_SETUP_KEY}_description`),
    },
  }
  return (
    <Card
      width="100%"
      marginTop={SPACING_3}
      paddingY={SPACING_3}
      backgroundColor={C_WHITE}
    >
      <Text as="h2" paddingX={SPACING_3} fontWeight={FONT_WEIGHT_SEMIBOLD}>
        {t('setup_for_run')}
      </Text>
      {stepsKeysInOrder.map((stepKey, index) => (
        <React.Fragment key={stepKey}>
          <Divider marginY={SPACING_3} />
          <CollapsibleStep
            expanded={stepKey === expandedStepKey}
            label={t('step', { index: index + 1 })}
            title={t(`${stepKey}_title`)}
            description={StepDetailMap[stepKey].description}
            toggleExpanded={() =>
              stepKey === expandedStepKey
                ? setExpandedStepKey(null)
                : setExpandedStepKey(stepKey)
            }
            rightAlignedNode={
              stepKey === ROBOT_CALIBRATION_STEP_KEY ? (
                <Flex
                  flexDirection={DIRECTION_ROW}
                  alignItems={ALIGN_START}
                  marginLeft={SPACING_7}
                >
                  <Icon
                    size={SIZE_1}
                    color={
                      calibrationStatus.complete ? COLOR_SUCCESS : COLOR_WARNING
                    }
                    marginRight={SPACING_2}
                    name={
                      calibrationStatus.complete
                        ? 'check-circle'
                        : 'alert-circle'
                    }
                  />
                  <Text fontSize={FONT_SIZE_BODY_1}>
                    {calibrationStatus.complete
                      ? t('calibration_ready')
                      : t('calibration_needed')}
                  </Text>
                </Flex>
              ) : null
            }
          >
            {StepDetailMap[stepKey].stepInternals}
          </CollapsibleStep>
        </React.Fragment>
      ))}
    </Card>
  )
}
