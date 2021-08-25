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
import { getModuleRenderCoords } from '../utils/getModuleRenderCoords'
import { getLabwareRenderCoords } from '../utils/getLabwareRenderCoords'
import { RobotCalibration } from './RobotCalibration'
import type { JsonProtocolFile } from '@opentrons/shared-data'
import type { State } from '../../../redux/types'
import { getConnectedRobot } from '../../../redux/discovery/selectors'

export function RunSetupCard(): JSX.Element | null {
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

  if (
    protocolData == null ||
    robot == null ||
    ('metadata' in protocolData && Object.keys(protocolData).length === 1)
  )
    return null

  if (Object.values(moduleRenderCoords).length > 1) {
    var MODULE_SETUP_KEY = 'modules_setup_step'
  } else {
    var MODULE_SETUP_KEY = 'module_setup_step'
  }
  const ROBOT_CALIBRATION_STEP_KEY = 'robot_calibration_step' as const
  const LABWARE_SETUP_KEY = 'labware_setup_step' as const

  type StepKey =
    | typeof ROBOT_CALIBRATION_STEP_KEY
    | typeof MODULE_SETUP_KEY
    | typeof LABWARE_SETUP_KEY

  const { t } = useTranslation('protocol_setup')
  const [expandedStepKey, setExpandedStepKey] = React.useState<StepKey | null>(
    ROBOT_CALIBRATION_STEP_KEY
  )


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

  const StepComponentMap: Record<StepKey, JSX.Element> = {
    [ROBOT_CALIBRATION_STEP_KEY]: <RobotCalibration robot={robot} />,
    [MODULE_SETUP_KEY]: (
      <ModuleSetup
        moduleRenderCoords={moduleRenderCoords}
        expandLabwareSetupStep={() => setExpandedStepKey(LABWARE_SETUP_KEY)}
        robotName={'opentrons-dev'} //  TODO: immediately import robot name
      />
    ),
    [LABWARE_SETUP_KEY]: (
      <LabwareSetup
        moduleRenderCoords={moduleRenderCoords}
        labwareRenderCoords={labwareRenderCoords}
      />
    ),
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
            description={t(`${stepKey}_description`)}
            toggleExpanded={() =>
              stepKey === expandedStepKey
                ? setExpandedStepKey(null)
                : setExpandedStepKey(stepKey)
            }
          >
            {StepComponentMap[stepKey]}
          </CollapsibleStep>
        </React.Fragment>
      ))}
    </Card>
  )
}
