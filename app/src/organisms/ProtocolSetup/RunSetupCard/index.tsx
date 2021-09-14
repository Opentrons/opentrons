import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  Card,
  Text,
  SPACING_3,
  FONT_WEIGHT_SEMIBOLD,
} from '@opentrons/components'
import { protocolHasModules } from '@opentrons/shared-data'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'
import { getProtocolData } from '../../../redux/protocol'
import { Divider } from '../../../atoms/structure'
import { CollapsibleStep } from './CollapsibleStep'
import { LabwareSetup } from './LabwareSetup'
import { ModuleSetup } from './ModuleSetup'
import { useModuleRenderInfoById, useLabwareRenderInfoById } from '../hooks'
import { RobotCalibration } from './RobotCalibration'
import type { JsonProtocolFile } from '@opentrons/shared-data'
import type { State } from '../../../redux/types'
import { getConnectedRobot } from '../../../redux/discovery/selectors'

export function RunSetupCard(): JSX.Element | null {
  const { t } = useTranslation('protocol_setup')
  const protocolData = useSelector((state: State) => getProtocolData(state))
  const moduleRenderCoords = useModuleRenderInfoById()
  const labwareRenderCoords = useLabwareRenderInfoById()
  const robot = useSelector((state: State) => getConnectedRobot(state))

  const ROBOT_CALIBRATION_STEP_KEY = 'robot_calibration_step' as const
  const LABWARE_SETUP_KEY = 'labware_setup_step' as const
  const MODULE_SETUP_KEY = 'module_setup_step' as const

  type StepKey =
    | typeof ROBOT_CALIBRATION_STEP_KEY
    | typeof MODULE_SETUP_KEY
    | typeof LABWARE_SETUP_KEY

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
      stepInternals: <RobotCalibration robot={robot} />,
      description: t(`${ROBOT_CALIBRATION_STEP_KEY}_description`),
    },
    [MODULE_SETUP_KEY]: {
      stepInternals: (
        <ModuleSetup
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
      stepInternals: <LabwareSetup />,
      description: t(`${LABWARE_SETUP_KEY}_description`),
    },
  }
  return (
    <Card width="100%" marginTop={SPACING_3} paddingY={SPACING_3}>
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
          >
            {StepDetailMap[stepKey].stepInternals}
          </CollapsibleStep>
        </React.Fragment>
      ))}
    </Card>
  )
}
