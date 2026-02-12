import { useEffect, useRef, useState } from 'react'
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
  WELL,
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

import type { WellMouseEvent, WellType } from '@opentrons/components'
import type {
  NozzleConfigurationStyle,
  PipetteV2Specs,
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
  const [selectedWells, setSelectedWells] = useState<Set<string>>(
    getSelectedWells(stepType)
  )

  const [hoveredWells, setHoveredWells] = useState<Set<string>>()
  useEffect(() => {
    setSelectedWells(getSelectedWells(stepType))
    setHoveredWells(new Set())
  }, [stepType])
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
    const wellsToToggle = getEntireWellSelection(
      wellName,
      labwareDef,
      nozzleConfiguration,
      primaryNozzle,
      channels
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
  const handleHoverWell = (e: WellMouseEvent): void => {
    const { wellName } = e
    let transformedWellName = wellName
    if (
      (channels === 8 && nozzleConfiguration === ALL) ||
      (channels === 96 && nozzleConfiguration === COLUMN)
    ) {
      const column = wellName.slice(1, wellName.length)
      transformedWellName = `A${column}`
    } else if (channels === 96 && nozzleConfiguration === ALL) {
      transformedWellName = 'A1'
    }
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }
    const transformedWellNames: Set<string> = new Set(
      getEntireWellSelection(
        wellName,
        labwareDef,
        nozzleConfiguration,
        primaryNozzle,
        channels
      )
    )
    setHoveredWells(transformedWellNames)
    currentHoveredWellRef.current = transformedWellName
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
        const wellsToUpdate = getEntireWellSelection(
          wellName,
          labwareDef,
          nozzleConfiguration,
          primaryNozzle,
          channels
        )
        const isGroupAccessible = wellsToUpdate.every(
          w => allWellsWithStatus[w] === 0
        )
        wellsToUpdate.forEach(w => {
          if (hoveredWells?.has(w) && !isGroupAccessible) {
            acc[w] = SELECTED_ERROR
          } else if (!isGroupAccessible) {
            acc[w] = INACCESSIBLE
          } else if (selectedWells?.has(w) || hoveredWells?.has(w)) {
            acc[w] = SELECTED
          } else {
            acc[w] = UNSELECTED
          }
        })

        return acc
      },
      {}
    )

    const selectedWellNames = getSelectedWells(stepType)
    const hoveredIsSelected = hoveredWells
      ? [...hoveredWells].every(w => selectedWellNames.has(w))
      : false

    controls = (
      <>
        <DeckOverlay deckDef={deckDef} />
        <LabwareOnDeck
          labwareOnDeck={labware}
          x={slotPosition[0]}
          y={slotPosition[1]}
          showHighlightedWells={false}
          handleClickWell={handleClickWell}
          onMouseEnterWell={handleHoverWell}
          selectedTipsByIndex={allWellsWithStatus}
          {...{ statusByWellName: allWellsWithState }}
          fill={COLORS.white}
          inWellSelectionModal={true}
          ignoreMissingTips
          wellLabelOptions={'SHOW_LABEL_INSIDE'}
        />
        {hoveredWells && [...hoveredWells][0] != null ? (
          <PipetteShadow
            robotType={robotType}
            pipetteSpec={pipetteSpecs}
            slotPosition={slotPosition}
            hoveredWell={[...hoveredWells][0]}
            selectedLabwareId={labwareId}
            labwareState={deckSetup.labware}
            hasPickupsRemaining={null}
            isHoveredWellSelected={hoveredIsSelected}
            isAccessible={
              allWellsWithState[[...hoveredWells][0]] !== INACCESSIBLE &&
              allWellsWithState[[...hoveredWells][0]] !== SELECTED_ERROR
            }
            inaccessibleReason={INACCESSIBLE_COLLISION}
            primaryNozzle={primaryNozzle}
            enclosingViewbox={viewBox}
            nozzles={nozzleConfiguration}
          />
        ) : null}
      </>
    )
  }

  return (
    <div className={styles.column_wrapper}>
      <div className={styles.header_text_wrapper}>{getWellSelectionText()}</div>
      <div className={styles.select_well_alignment}>
        <BaseDeckTipSelection controls={controls} viewBox={viewBox} />
        <div className={styles.well_legend_box}>
          <SelectionLegend selectionType={WELL} size={DEFAULT_TIP_SIZE} />
        </div>
      </div>
    </div>
  )
}
