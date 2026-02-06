import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  COLORS,
  DEFAULT_TIP_SIZE,
  INACCESSIBLE,
  SELECTED,
  SELECTED_ERROR,
  StyledText,
  UNSELECTED,
} from '@opentrons/components'
import {
  ALL,
  COLUMN,
  getDeckDefFromRobotType,
  getPositionFromSlotId,
} from '@opentrons/shared-data'
import {
  getIsSafePipetteMovement,
  getSlotInLocationStack,
} from '@opentrons/step-generation'

import { LabwareOnDeck } from '/protocol-designer/components/organisms'
import { getInvariantContext } from '/protocol-designer/step-forms/selectors'
import { getRobotStateAtActiveItem } from '/protocol-designer/top-selectors/labware-locations'

import { BaseDeckTipSelection } from '../TipSelectionWizard/BaseDeckTipSelection'
import { INACCESSIBLE_COLLISION } from '../TipSelectionWizard/constants'
import { DeckOverlay } from '../TipSelectionWizard/DeckOverlay'
import { PipetteShadow } from '../TipSelectionWizard/PipetteShadows/PipetteShadow'
import { SelectionLegend } from '../TipSelectionWizard/SelectionLegend'
import { getViewboxFromSelectedLabware } from '../TipSelectionWizard/utils'
import styles from './nozzleandwellwizard.module.css'
import { getEntireWellSelection } from './utils'

import type { RobotType } from '@opentrons/shared-data'
import type { AllTemporalPropertiesForTimelineFrame } from '/protocol-designer/step-forms'
import type { FieldPropsByName } from '../../types'

interface WellSelectorProps {
  deckSetup: AllTemporalPropertiesForTimelineFrame
  propsForFields: FieldPropsByName
  stepType: string
  pipetteSpecs: PipetteV2Specs
  robotType: RobotType
}
export function WellSelector(props: WellSelectorProps): JSX.Element {
  const { t } = useTranslation('protocol_steps')
  const { deckSetup, propsForFields, stepType, robotType, pipetteSpecs } = props
  const robotState = useSelector(getRobotStateAtActiveItem)
  const invariantContext = useSelector(getInvariantContext)
  const { channels } = pipetteSpecs
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const currentHoveredWellRef = useRef<string | null>(null)

  const [selectedWells, setSelectedWells] = useState<Set<string>>(
    () => new Set()
  )
  const [hoveredWells, setHoveredWells] = useState<Set<string>>(() => new Set())
  const pipetteId = propsForFields.pipette.value as string
  const nozzleConfiguration = propsForFields.nozzles
    .value as NozzleConfigurationStyle

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
  const getSelectedWells = (stepType: string): Set<string> => {
    switch (stepType) {
      case 'aspirate':
        const aspWells = propsForFields.aspirate_wells.value as string[]
        return new Set(aspWells)
      case 'dispense':
        const dspWells = propsForFields.dispense_wells.value as string[]
        return new Set(dspWells)
      case 'mix':
        const mixWells = propsForFields.wells.value as string[]
        return new Set(mixWells)
      default:
        return new Set()
    }
  }
  const labwareId = getLabwareId()
  const labware = deckSetup.labware[labwareId]
  const displayName = labware.def.metadata.displayName
  const deckDef = getDeckDefFromRobotType(robotType)
  const viewBox = getViewboxFromSelectedLabware(labwareId, deckSetup, deckDef)
  const getWellsField = (): FieldProps | null => {
    switch (stepType) {
      case 'mix':
        return propsForFields.wells
      case 'aspirate':
        return propsForFields.aspirate_wells
      case 'dispense':
        return propsForFields.dispense_wells
      default:
        return null
    }
  }

  const handleClickWell = (wellName: string): void => {
    const wellsToToggle = getEntireWellSelection(
      wellName,
      labwareDef,
      nozzleConfiguration,
      primaryNozzle
    )
    setSelectedWells(prev => {
      const next = new Set(prev)
      const allSelected = wellsToToggle.every(well => next.has(well))
      wellsToToggle.forEach(well => {
        if (allSelected) {
          next.delete(well)
        } else {
          next.add(well)
        }
      })

      const wellsField = getWellsField()
      if (wellsField != null) {
        wellsField.updateValue(Array.from(next))
      }

      return next
    })
  }

  const primaryNozzle = propsForFields.primaryNozzle
    .value as PrimaryNozzleConfigurationStyle
  const getWellSelectionText = (): JSX.Element => {
    switch (stepType) {
      case 'mix':
        return (
          <StyledText desktopStyle="headingMediumBold">
            {t('select_wells_to_mix_liquid_in', { labware: displayName })}
          </StyledText>
        )

      case 'aspirate':
        return (
          <StyledText desktopStyle="headingMediumBold">
            {t('select_wells_to_aspirate_liquid_from', {
              labware: displayName,
            })}
          </StyledText>
        )

      case 'dispense':
        return (
          <StyledText desktopStyle="headingMediumBold">
            {t('select_wells_to_dispense_liquid_into', {
              labware: displayName,
            })}
          </StyledText>
        )

      default:
        console.warn(`Unhandled step type ${stepType} for ${displayName}`)
        return (
          <StyledText desktopStyle="headingMediumBold">
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
          <SelectionLegend selectionType={'well'} size={DEFAULT_TIP_SIZE} />
        </div>
      </div>
    </div>
  )
}
