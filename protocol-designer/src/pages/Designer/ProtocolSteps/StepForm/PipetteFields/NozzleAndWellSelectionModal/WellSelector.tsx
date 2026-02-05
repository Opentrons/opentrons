import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  COLORS,
  DEFAULT_TIP_SIZE,
  INACCESSIBLE,
  SELECTED,
  StyledText,
  UNSELECTED,
} from '@opentrons/components'
import {
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
import { DeckOverlay } from '../TipSelectionWizard/DeckOverlay'
import { SelectionLegend } from '../TipSelectionWizard/SelectionLegend'
import { getViewboxFromSelectedLabware } from '../TipSelectionWizard/utils'
import styles from './nozzleandwellwizard.module.css'

import type { WellType } from '@opentrons/components'
import type {
  NozzleConfigurationStyle,
  PrimaryNozzleConfigurationStyle,
  RobotType,
} from '@opentrons/shared-data'
import type { FieldProps } from '/protocol-designer/pages/Designer/ProtocolSteps/StepForm/types'
import type { AllTemporalPropertiesForTimelineFrame } from '/protocol-designer/step-forms'
import type { FieldPropsByName } from '../../types'

interface WellSelectorProps {
  deckSetup: AllTemporalPropertiesForTimelineFrame
  propsForFields: FieldPropsByName
  stepType: string
  robotType: RobotType
}
export function WellSelector(props: WellSelectorProps): JSX.Element {
  const { t } = useTranslation('protocol_steps')
  const { deckSetup, propsForFields, stepType, robotType } = props
  const robotState = useSelector(getRobotStateAtActiveItem)
  const invariantContext = useSelector(getInvariantContext)

  const [selectedWells, setSelectedWells] = useState<Set<string>>(
    () => new Set()
  )

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

  const labwareId = getLabwareId()
  const labware = deckSetup.labware[labwareId]
  const labwareDef = labware.def
  const displayName = labwareDef.metadata.displayName

  const deckDef = getDeckDefFromRobotType(robotType)
  const slot = getSlotInLocationStack(labware.stack)
  const slotPosition = getPositionFromSlotId(slot, deckDef)

  const allWells = labwareDef.ordering.flat()
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
    setSelectedWells(prev => {
      const next = new Set(prev)

      if (next.has(wellName)) {
        next.delete(wellName)
      } else {
        next.add(wellName)
      }

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

  let controls: JSX.Element = <></>

  if (slotPosition == null || labwareId == null || labware == null) {
    console.warn(`no slot position for selected tiprack ${labwareId}`)
  } else if (robotState === null) {
    console.warn('no robot state so unable to determine well accessibility')
  } else {
    const allWellsWithStatus = allWells.reduce<Record<string, number>>(
      (acc, key) => {
        acc[key] = getIsSafePipetteMovement({
          robotState,
          invariantContext,
          pipetteId,
          labwareId,
          wellTargetName: key,
          primaryNozzle,
          nozzleConfiguration,
        })
          ? 0
          : 1
        return acc
      },
      {}
    )

    const allWellsWithState = allWells.reduce<Record<string, WellType>>(
      (acc, wellName) => {
        const isAccessible = getIsSafePipetteMovement({
          robotState,
          invariantContext,
          pipetteId,
          labwareId,
          wellTargetName: wellName,
          primaryNozzle,
          nozzleConfiguration,
        })
        if (!isAccessible) {
          acc[wellName] = INACCESSIBLE
        } else if (selectedWells.has(wellName)) {
          acc[wellName] = SELECTED
        } else {
          acc[wellName] = UNSELECTED
        }
        return acc
      },
      {}
    )

    controls = (
      <>
        <DeckOverlay deckDef={deckDef} />
        <LabwareOnDeck
          labwareOnDeck={labware}
          x={slotPosition[0]}
          y={slotPosition[1]}
          showHighlightedWells={false}
          handleClickWell={handleClickWell}
          selectedTipsByIndex={allWellsWithStatus}
          {...{ statusByWellName: allWellsWithState }}
          fill={COLORS.white}
          ignoreMissingTips
        />
      </>
    )
  }

  return (
    <div className={styles.column_wrapper}>
      <div className={styles.header_text_wrapper}>{getWellSelectionText()}</div>
      <div className={styles.select_well_alignment}>
        <BaseDeckTipSelection controls={controls} viewBox={viewBox} />
        <div className={styles.well_legend_box}>
          <SelectionLegend
            labwareDefinition={labwareDef}
            size={DEFAULT_TIP_SIZE}
          />
        </div>
      </div>
    </div>
  )
}
