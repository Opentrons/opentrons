import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Card, Text, SPACING_3, FONT_HEADER_DARK } from '@opentrons/components'
import { Divider } from '../../atoms/structure'
import {CollapsibleStep} from './CollapsibleStep'

const ROBOT_CALIBRATION_STEP_KEY = 'robot_calibration_step' as const
const MODULE_SETUP_KEY = 'module_setup_step' as const
const LABWARE_SETUP_KEY = 'labware_setup_step' as const

type StepKey =
 | typeof ROBOT_CALIBRATION_STEP_KEY
 | typeof MODULE_SETUP_KEY
 | typeof LABWARE_SETUP_KEY

export function RunSetupCard(): JSX.Element {
  const { t } = useTranslation('protocol_info')
  const [expandedStepKey, setExpandedStepKey] = React.useState<StepKey | null>(ROBOT_CALIBRATION_STEP_KEY)

  // TODO: Add module step key at index 1 if modules are present in protocol
  const stepsKeysInOrder = [ROBOT_CALIBRATION_STEP_KEY, LABWARE_SETUP_KEY]

  return (
    <Card width="100%" marginTop={SPACING_3} paddingY={SPACING_3}>
      <Text as="h3" paddingX={SPACING_3} css={FONT_HEADER_DARK}>{t('setup_for_run')}</Text>
      <Divider marginY={SPACING_3}/>
      {stepsKeysInOrder.map((stepKey, index) =>
        <CollapsibleStep
          key={stepKey}
          expanded={stepKey === expandedStepKey}
          label={t('step', {index})}
          title={t(`${stepKey}_title`)}
          description={t(`${stepKey}_description`)}
          />
      )}
    </Card>
  )
}
