import { useTranslation } from 'react-i18next'

import { StyledText, WELL } from '@opentrons/components'
import { getDeckDefFromRobotType } from '@opentrons/shared-data'

import { BaseDeckTipSelection } from '../TipSelectionWizard/BaseDeckTipSelection'
import { SelectionLegend } from '../TipSelectionWizard/SelectionLegend'
import { getViewboxFromSelectedLabware } from '../TipSelectionWizard/utils'
import styles from './nozzleandwellwizard.module.css'

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

  const getLabwareId = (): string => {
    switch (stepType) {
      case 'aspirate':
        return propsForFields.aspirate_labware.value as string
      case 'dispense':
        return propsForFields.dispense_labware.value as string
      case 'mix':
        return propsForFields.labware.value as string
      default:
        return ''
    }
  }

  const labwareId = getLabwareId()
  const controls: JSX.Element = <></>
  const labware = deckSetup.labware[labwareId]

  const displayName = labware.def.metadata.displayName
  const deckDef = getDeckDefFromRobotType(robotType)

  const viewBox = getViewboxFromSelectedLabware(labwareId, deckSetup, deckDef)

  const getWellSelectionText = (): JSX.Element => {
    switch (stepType) {
      case 'mix':
        return (
          <>
            <StyledText desktopStyle={'headingMediumBold'}>
              {t('select_wells_to_mix_liquid_in', {
                labware: displayName,
              })}
            </StyledText>
          </>
        )

      case 'aspirate':
        return (
          <StyledText desktopStyle={'headingMediumBold'}>
            {t('select_wells_to_aspirate_liquid_from', {
              labware: displayName,
            })}
          </StyledText>
        )
      case 'dispense':
        return (
          <StyledText desktopStyle={'headingMediumBold'}>
            {t('select_wells_to_dispense_liquid_into', {
              labware: displayName,
            })}
          </StyledText>
        )
      default:
        console.warn(`Unhandled step type ${stepType} for ${displayName}`)
        return (
          <StyledText desktopStyle={'headingMediumBold'}>
            {displayName}
          </StyledText>
        )
    }
  }
  return (
    <div className={styles.column_wrapper}>
      <div className={styles.header_text_wrapper}>{getWellSelectionText()}</div>

      <div className={styles.select_well_alignment}>
        <BaseDeckTipSelection controls={controls} viewBox={viewBox} />
        <div className={styles.well_legend_box}>
          <SelectionLegend selectionType={WELL} />
        </div>
      </div>
    </div>
  )
}
