import { useEffect, useMemo, useRef, useState } from 'react'
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
  getDeckDefFromRobotType,
  getPositionFromSlotId,
  PARTIAL,
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
import { INACCESSIBLE_PARTIAL_TIP } from './constants'
import styles from './nozzleandwellwizard.module.css'
import {
  getEntireWellSelection,
  getInaccessibleWellsForPartialNozzleRowMap,
  partialNozzleMap,
} from './utils'

import type { WellMouseEvent, WellType } from '@opentrons/components'
import type {
  NozzleConfigurationStyle,
  PartialPrimaryNozzles,
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

  const nozzleConfiguration = propsForFields.nozzles
    .value as NozzleConfigurationStyle
  const primaryNozzle = propsForFields.primaryNozzle
    .value as PrimaryNozzleConfigurationStyle
  const pipetteId = propsForFields.pipette.value as string
  const isPartialNozzle = nozzleConfiguration === PARTIAL

  const robotState = useSelector(getRobotStateAtActiveItem)
  const invariantContext = useSelector(getInvariantContext)

  const { channels } = pipetteSpecs

  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
  const allWells = labwareDef.ordering.flat()
  const displayName = labwareDef.metadata.displayName

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

  const getSelectedWells = (): string[][] => {
    const wellsField = getWellsField()
    const wells = (wellsField?.value as string[]) || []

    return wells.map(well =>
      getEntireWellSelection(
        well,
        labwareDef.ordering,
        nozzleConfiguration,
        primaryNozzle,
        channels
      )
    )
  }

  const [selectedWells, setSelectedWells] =
    useState<string[][]>(getSelectedWells())

  const [hoveredWells, setHoveredWells] = useState<string[] | null>(null)

  useEffect(() => {
    setSelectedWells(getSelectedWells())
    setHoveredWells(null)
  }, [stepType])

  const flatSelectedWells = useMemo(() => selectedWells.flat(), [selectedWells])
  const allWellsWithStatus = allWells.reduce<Record<string, number>>(
    (acc, wellName) => {
      const safe = robotState
        ? getIsSafePipetteMovement({
            robotState,
            invariantContext,
            pipetteId,
            labwareId,
            wellTargetName: wellName,
            primaryNozzle,
            nozzleConfiguration,
          })
        : true

      acc[wellName] = safe ? 0 : 1
      return acc
    },
    {}
  )

  const allWellsWithState = allWells.reduce<Record<string, WellType>>(
    (acc, wellName) => {
      const accessible = allWellsWithStatus[wellName] === 0

      if (hoveredWells?.includes(wellName) && !accessible) {
        acc[wellName] = SELECTED_ERROR
      } else if (!accessible) {
        acc[wellName] = INACCESSIBLE
      } else if (
        flatSelectedWells.includes(wellName) ||
        hoveredWells?.includes(wellName)
      ) {
        acc[wellName] = SELECTED
      } else {
        acc[wellName] = UNSELECTED
      }
      return acc
    },
    {}
  )
  const inaccessiblePartialWells = useMemo(() => {
    if (!isPartialNozzle || selectedWells.length === 0) return []

    return getInaccessibleWellsForPartialNozzleRowMap(
      selectedWells,
      labwareDef.ordering,
      allWellsWithState,
      partialNozzleMap[primaryNozzle as PartialPrimaryNozzles]
    )
  }, [selectedWells, isPartialNozzle, primaryNozzle, labwareDef.ordering])

  const deckDef = getDeckDefFromRobotType(robotType)
  const slot = getSlotInLocationStack(labware.stack)
  const slotPosition = getPositionFromSlotId(slot, deckDef)

  const viewBox = getViewboxFromSelectedLabware(labwareId, deckSetup, deckDef)

  const handleClickWell = (wellName: string): void => {
    const wellsToToggle = getEntireWellSelection(
      wellName,
      labwareDef.ordering,
      nozzleConfiguration,
      primaryNozzle,
      channels
    )

    const hasInaccessibleWell = wellsToToggle.some(well => {
      const isSafe = robotState
        ? getIsSafePipetteMovement({
            robotState,
            invariantContext,
            pipetteId,
            labwareId,
            wellTargetName: well,
            primaryNozzle,
            nozzleConfiguration,
          })
        : true

      const isPartialBlocked = inaccessiblePartialWells.includes(well)

      return !isSafe || isPartialBlocked
    })

    if (hasInaccessibleWell) return

    const wellsField = getWellsField()

    setSelectedWells(prev => {
      const next = prev.filter(
        group => !group.some(well => wellsToToggle.includes(well))
      )

      const hadOverlap = next.length !== prev.length

      if (!hadOverlap) {
        next.push(wellsToToggle)
      }

      if (wellsField != null) {
        wellsField.updateValue(next.map(group => group[0]))
      }

      return next
    })
  }

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
        return (
          <StyledText desktopStyle="headingMediumBold">
            {displayName}
          </StyledText>
        )
    }
  }
  const handleHoverWell = (e: WellMouseEvent): void => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }

    const hovered = getEntireWellSelection(
      e.wellName,
      labwareDef.ordering,
      nozzleConfiguration,
      primaryNozzle,
      channels
    )

    setHoveredWells(hovered)
  }

  let controls: JSX.Element = <></>

  if (slotPosition && labware && robotState) {
    inaccessiblePartialWells.forEach(well => {
      if (!flatSelectedWells.includes(well)) {
        if (hoveredWells?.includes(well)) {
          allWellsWithState[well] = SELECTED_ERROR
        } else {
          allWellsWithState[well] = INACCESSIBLE
        }
      }
    })
    const hoveredIsSelected = hoveredWells
      ? hoveredWells.some(w => flatSelectedWells.includes(w))
      : false
    const isAccessible = hoveredWells
      ? hoveredWells.every(w => {
          return allWellsWithState[w] !== SELECTED_ERROR
        })
      : true

    const inaccessibleReason =
      inaccessiblePartialWells.filter(well => hoveredWells?.includes(well))
        .length > 0
        ? INACCESSIBLE_PARTIAL_TIP
        : INACCESSIBLE_COLLISION
    controls = (
      <>
        <DeckOverlay deckDef={deckDef} />
        <LabwareOnDeck
          labwareOnDeck={labware}
          x={slotPosition[0]}
          y={slotPosition[1]}
          handleClickWell={handleClickWell}
          onMouseEnterWell={handleHoverWell}
          selectedTipsByIndex={allWellsWithStatus}
          statusByWellName={allWellsWithState}
          fill={COLORS.white}
          inWellSelectionModal
          ignoreMissingTips
          wellLabelOptions="SHOW_LABEL_INSIDE"
        />
        {hoveredWells?.[0] && (
          <PipetteShadow
            robotType={robotType}
            pipetteSpec={pipetteSpecs}
            slotPosition={slotPosition}
            hoveredWell={hoveredWells[0]}
            selectedLabwareId={labwareId}
            labwareState={deckSetup.labware}
            hasPickupsRemaining={null}
            isHoveredWellSelected={hoveredIsSelected}
            isAccessible={isAccessible}
            inaccessibleReason={inaccessibleReason}
            primaryNozzle={primaryNozzle}
            enclosingViewbox={viewBox}
            nozzles={nozzleConfiguration}
          />
        )}
      </>
    )
  }

  return (
    <>
      <div className={styles.header_text_wrapper}>{getWellSelectionText()}</div>
      <div className={styles.select_well_alignment}>
        <BaseDeckTipSelection controls={controls} viewBox={viewBox} />
        <div className={styles.well_legend_box}>
          <SelectionLegend selectionType={WELL} size={DEFAULT_TIP_SIZE} />
        </div>
      </div>
    </>
  )
}
