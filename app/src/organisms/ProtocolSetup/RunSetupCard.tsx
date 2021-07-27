import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import reduce from 'lodash/reduce'
import { Card, Text, SPACING_3, FONT_HEADER_DARK } from '@opentrons/components'
import {
  getModuleDef2,
  getModuleType,
  protocolHasModules,
} from '@opentrons/shared-data'

import { getLabwareDefBySlot, getProtocolData } from '../../redux/protocol'
import { Divider } from '../../atoms/structure'
import { CollapsibleStep } from './CollapsibleStep'
import { LabwareSetup } from './LabwareSetup'

import type { JsonProtocolFile } from '@opentrons/shared-data'
import type { State } from '../../redux/types'
import type { ModulesBySlot } from './LabwareSetup'

const ROBOT_CALIBRATION_STEP_KEY = 'robot_calibration_step' as const
const MODULE_SETUP_KEY = 'module_setup_step' as const
const LABWARE_SETUP_KEY = 'labware_setup_step' as const

type StepKey =
  | typeof ROBOT_CALIBRATION_STEP_KEY
  | typeof MODULE_SETUP_KEY
  | typeof LABWARE_SETUP_KEY

const getModulesBySlot = (
  protocolData: ReturnType<typeof getProtocolData>
): ModulesBySlot => {
  if (protocolData != null && 'modules' in protocolData) {
    const res = reduce(
      protocolData.modules,
      (acc, module, moduleId) => {
        const slotNumber = module.slot
        const model = module.model
        const type = getModuleType(model)
        const labwareOffset = getModuleDef2(model).labwareOffset
        return {
          ...acc,
          [slotNumber]: {
            moduleId,
            model,
            labwareOffset,
            type,
          },
        }
      },
      {}
    )
    return res
  }
  return {}
}

export function RunSetupCard(): JSX.Element | null {
  const { t } = useTranslation('protocol_setup')
  const [expandedStepKey, setExpandedStepKey] = React.useState<StepKey | null>(
    ROBOT_CALIBRATION_STEP_KEY
  )
  const protocolData = useSelector((state: State) => getProtocolData(state))
  const labwareDefBySlot = useSelector(getLabwareDefBySlot) // NOTE: this assumes only one piece of labware per slot
  const modulesBySlot = getModulesBySlot(protocolData)

  if (
    protocolData == null ||
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

  const StepComponentMap: Record<StepKey, JSX.Element> = {
    [ROBOT_CALIBRATION_STEP_KEY]: (
      <Text marginTop={SPACING_3}>TODO: robot calibration step contents</Text>
    ),
    [MODULE_SETUP_KEY]: (
      <Text marginTop={SPACING_3}>TODO: module setup step contents</Text>
    ),
    [LABWARE_SETUP_KEY]: (
      <LabwareSetup
        modulesBySlot={modulesBySlot}
        labwareDefBySlot={labwareDefBySlot}
      />
    ),
  }

  return (
    <Card width="100%" marginTop={SPACING_3} paddingY={SPACING_3}>
      <Text as="h3" paddingX={SPACING_3} css={FONT_HEADER_DARK}>
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
