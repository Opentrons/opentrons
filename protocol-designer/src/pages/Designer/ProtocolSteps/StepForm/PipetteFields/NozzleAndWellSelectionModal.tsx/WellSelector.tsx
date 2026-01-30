import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  Box,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  SPACING,
  StyledText,
  WELL,
} from '@opentrons/components'
import { getDeckDefFromRobotType } from '@opentrons/shared-data'

import { BaseDeckTipSelection } from '../TipSelectionWizard/BaseDeckTipSelection'
import { SelectionLegend } from '../TipSelectionWizard/SelectionLegend'
import { getViewboxFromSelectedLabware } from '../TipSelectionWizard/utils'

import type {
  NozzleConfigurationStyle,
  RobotType,
} from '@opentrons/shared-data'
import type { AllTemporalPropertiesForTimelineFrame } from '/protocol-designer/step-forms'
import type { FieldPropsByName } from '../../types'

interface WellSelectorProps {
  nozzleConfiguration: NozzleConfigurationStyle
  deckSetup: AllTemporalPropertiesForTimelineFrame
  propsForFields: FieldPropsByName
  stepType: string
  robotType: RobotType
}
export function WellSelector(props: WellSelectorProps): JSX.Element {
  const { t } = useTranslation('protocol_steps')
  const { deckSetup, propsForFields, stepType, robotType } = props
  const isAspirate = stepType === 'aspirate'
  const isDispense = stepType === 'dispense'
  const isMix = stepType === 'mix'
  let labwareId: string

  switch (stepType) {
    case 'aspirate':
      labwareId = propsForFields.aspirate_labware.value as string
      break
    case 'dispense':
      labwareId = propsForFields.dispense_labware.value as string
      break
    case 'mix':
      labwareId = propsForFields.labware.value as string
      break
    default:
      labwareId = ''
  }

  const controls: JSX.Element = <></>
  const labware = deckSetup.labware[labwareId]

  const displayName = labware.def.metadata.displayName
  const deckDef = getDeckDefFromRobotType(robotType)

  const viewBox = getViewboxFromSelectedLabware(labwareId, deckSetup, deckDef)

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <Flex padding={SPACING.spacing20}>
        {isMix ? (
          <StyledText desktopStyle={'headingMediumBold'}>
            {t('select_wells_to_mix_liquid_in', {
              labware: displayName,
            })}
          </StyledText>
        ) : null}
        {isAspirate ? (
          <StyledText desktopStyle={'headingMediumBold'}>
            {t('select_wells_to_aspirate_liquid_from', {
              labware: displayName,
            })}
          </StyledText>
        ) : null}

        {isDispense ? (
          <StyledText desktopStyle={'headingMediumBold'}>
            {t('select_wells_to_dispense_liquid_into', {
              labware: displayName,
            })}
          </StyledText>
        ) : null}
      </Flex>

      <Flex
        flexDirection={DIRECTION_ROW}
        alignItems={ALIGN_CENTER}
        padding={SPACING.spacing20}
      >
        <BaseDeckTipSelection controls={controls} viewBox={viewBox} />
        <Box width={'160px'}>
          <SelectionLegend selectionType={WELL} />
        </Box>
      </Flex>
    </Flex>
  )
}
