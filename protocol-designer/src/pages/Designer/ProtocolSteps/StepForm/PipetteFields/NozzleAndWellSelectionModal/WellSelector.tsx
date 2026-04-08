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
  PARTIAL_COLUMN,
  PARTIAL_NOZZLE_MAP,
} from '@opentrons/shared-data'
import { getSlotInLocationStack } from '@opentrons/step-generation'

import { LabwareOnDeck } from '/protocol-designer/components/organisms'
import { SelectionRect } from '/protocol-designer/components/organisms/Labware/SelectionRect'
import { getInvariantContext } from '/protocol-designer/step-forms/selectors'
import { getRobotStateAtActiveItem } from '/protocol-designer/top-selectors/labware-locations'
import { getCollidingWells } from '/protocol-designer/utils/index'

import { BaseDeckTipSelection } from '../TipSelectionWizard/BaseDeckTipSelection'
import { INACCESSIBLE_COLLISION } from '../TipSelectionWizard/constants'
import { PipetteShadow } from '../TipSelectionWizard/PipetteShadows/PipetteShadow'
import { SelectionLegend } from '../TipSelectionWizard/SelectionLegend'
import { getViewboxFromSelectedLabware } from '../TipSelectionWizard/utils'
import { INACCESSIBLE_PARTIAL_TIP } from './constants'
import { getAllWellsSafetyStatus } from './getAllWellsSafetyStatus'
import styles from './nozzleandwellwizard.module.css'
import {
  getEntireWellSelection,
  getInaccessibleWellsForPartialNozzleRowMap,
  getWellNameAtClientPoint,
} from './utils'

import type { WellMouseEvent, WellType } from '@opentrons/components'
import type {
  NozzleConfigurationStyle,
  PartialPrimaryNozzles,
  PipetteV2Specs,
  PrimaryNozzleConfigurationStyle,
  RobotType,
} from '@opentrons/shared-data'
import type { GenericRect } from '/protocol-designer/collision-types'
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
  const isPartialNozzle = nozzleConfiguration === PARTIAL_COLUMN

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
  const allWells = labwareDef.ordering
  const hasMoreThanOneWell = allWells.length > 1
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
    if (!hasMoreThanOneWell) {
      return allWells
    }
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
  const currentHoveredWellRef = useRef<string[] | null>(null)

  useEffect(
    () => {
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current)
        leaveTimeoutRef.current = null
      }
      currentHoveredWellRef.current = null
      setSelectedWells(getSelectedWells())
      setHoveredWells(null)
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stepType]
  )
  const [wellShadow, setWellShadow] = useState<string | null>(null)
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
    setWellShadow(hovered[0])
  }

  const allWellsWithStatus = useMemo(
    () =>
      getAllWellsSafetyStatus({
        allWells,
        robotState,
        invariantContext,
        pipetteId,
        labwareId,
        primaryNozzle,
        nozzleConfiguration,
      }),
    [
      allWells,
      primaryNozzle,
      nozzleConfiguration,
      pipetteId,
      labwareId,
      robotState,
      invariantContext,
    ]
  )
  const allWellsWithState = allWells
    .flat()
    .reduce<Record<string, WellType>>((acc, wellName) => {
      const accessible = allWellsWithStatus[wellName] === 0

      if (hoveredWells?.includes(wellName) && !accessible) {
        acc[wellName] = SELECTED_ERROR
      } else if (!accessible) {
        acc[wellName] = INACCESSIBLE
      } else if (
        selectedWells.flat().includes(wellName) ||
        hoveredWells?.includes(wellName)
      ) {
        acc[wellName] = SELECTED
      } else {
        acc[wellName] = UNSELECTED
      }
      return acc
    }, {})
  const inaccessiblePartialWells = useMemo(
    () => {
      if (!isPartialNozzle || selectedWells.length === 0) return []

      return getInaccessibleWellsForPartialNozzleRowMap(
        selectedWells,
        labwareDef.ordering,
        allWellsWithState,
        PARTIAL_NOZZLE_MAP[primaryNozzle as PartialPrimaryNozzles]
      )
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedWells, isPartialNozzle, primaryNozzle, labwareDef.ordering]
  )

  const deckDef = getDeckDefFromRobotType(robotType)
  const slot = getSlotInLocationStack(labware.stack)
  const slotPosition = getPositionFromSlotId(slot, deckDef)

  const viewBox = getViewboxFromSelectedLabware(labwareId, deckSetup, deckDef)

  const handleClickWell = (wellName: string): void => {
    const wellsField = getWellsField()

    const wellIsSelected = selectedWells.flat().includes(wellName)
    let wellsToToggle: string[] = []
    if (wellIsSelected) {
      const primaryWells = wellsField?.value as string[]
      for (const primaryWell of primaryWells) {
        const group = getEntireWellSelection(
          primaryWell,
          labwareDef.ordering,
          nozzleConfiguration,
          primaryNozzle,
          channels
        )
        if (group.includes(wellName)) {
          wellsToToggle = group
          break
        }
      }
    } else {
      wellsToToggle = getEntireWellSelection(
        wellName,
        labwareDef.ordering,
        nozzleConfiguration,
        primaryNozzle,
        channels
      )
    }
    const allWellsWithStatus = getAllWellsSafetyStatus({
      allWells,
      robotState,
      invariantContext,
      pipetteId,
      labwareId,
      primaryNozzle,
      nozzleConfiguration,
    })

    if (allWellsWithStatus[wellName] === 1) {
      return
    }

    setSelectedWells(prev => {
      const next = prev.filter(group => group[0] !== wellsToToggle[0])
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

  const _getWellsFromRect: (rect: GenericRect) => string[][] = rect => {
    const wellsInRect = getCollidingWells(rect)
    const highlightedWells: string[][] = []
    for (const well in wellsInRect) {
      const wellSelection = getEntireWellSelection(
        well,
        labwareDef.ordering,
        nozzleConfiguration,
        primaryNozzle,
        channels
      )
      const noOverlapInList = highlightedWells
        .flat()
        .some(well => wellSelection.includes(well))
      if (!noOverlapInList) {
        highlightedWells.push(wellSelection)
      }
    }
    return highlightedWells
  }

  const handleSelectionMove: (e: MouseEvent, rect: GenericRect) => void = (
    e,
    rect
  ) => {
    if (!e.shiftKey) {
      const wellsUnderRect = _getWellsFromRect(rect)
      const flatWellList = wellsUnderRect.flat()
      setHoveredWells(flatWellList)
      const wellUnderMouse = getWellNameAtClientPoint(e.clientX, e.clientY)
      if (wellUnderMouse) {
        setWellShadow(wellUnderMouse)
      }
    }
  }

  const handleSelectionDone = (e: MouseEvent, rect: GenericRect): void => {
    if (!e.shiftKey) {
      const wellsUnderRect = _getWellsFromRect(rect)
      setSelectedWells(prev => {
        const next = [...prev]
        const selectedFlat = new Set(prev.flat())
        const allAlreadySelected = wellsUnderRect.every(group =>
          group.every(well => selectedFlat.has(well))
        )

        let updated: string[][]
        // Remove all wells if the entire selection is already selected
        if (allAlreadySelected) {
          const keysToRemove = new Set(wellsUnderRect.map(g => g[0]))
          updated = next.filter(group => !keysToRemove.has(group[0]))
        } else {
          // Add additional selected wells if there is a mixture of selected and unselected
          updated = [...next]
          wellsUnderRect.forEach(wellGroup => {
            const primaryWellInGroup = wellGroup[0]
            const exists = updated.some(
              wellGroup => wellGroup[0] === primaryWellInGroup
            )
            // Add to update list if the well does not currently exist in the list and is accessible
            if (!exists && allWellsWithStatus[primaryWellInGroup] !== 1) {
              updated.push(wellGroup)
            }
          })
        }
        const wellsField = getWellsField()
        if (wellsField != null) {
          wellsField.updateValue(updated.map(wellGroup => wellGroup[0]))
        }
        return updated
      })
      setHoveredWells(null)
    }
  }

  const getWellSelectionText = (): JSX.Element => {
    switch (stepType) {
      case 'mix':
        return (
          <StyledText desktopStyle="headingSmallBold">
            {t('select_wells_to_mix_liquid_in', { labware: displayName })}
          </StyledText>
        )

      case 'aspirate':
        return (
          <StyledText desktopStyle="headingSmallBold">
            {t('select_wells_to_aspirate_liquid_from', {
              labware: displayName,
            })}
          </StyledText>
        )

      case 'dispense':
        return (
          <StyledText desktopStyle="headingSmallBold">
            {t('select_wells_to_dispense_liquid_into', {
              labware: displayName,
            })}
          </StyledText>
        )

      default:
        return (
          <StyledText desktopStyle="headingSmallBold">{displayName}</StyledText>
        )
    }
  }

  let controls: JSX.Element = <></>

  if (slotPosition && labware && robotState) {
    inaccessiblePartialWells.forEach(well => {
      if (!selectedWells.flat().includes(well)) {
        if (hoveredWells?.includes(well)) {
          allWellsWithState[well] = SELECTED_ERROR
        } else {
          allWellsWithState[well] = INACCESSIBLE
        }
      }
    })
    const hoveredIsSelected = hoveredWells
      ? hoveredWells.every(w => selectedWells.flat().includes(w))
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
    const is96Channel = channels === 96
    controls = (
      <>
        <LabwareOnDeck
          labwareOnDeck={labware}
          x={slotPosition[0]}
          y={slotPosition[1]}
          handleClickWell={handleClickWell}
          onMouseEnterWell={handleHoverWell}
          onMouseLeaveWell={handleLeaveWell}
          selectedTipsByIndex={allWellsWithStatus}
          statusByWellName={allWellsWithState}
          fill={COLORS.white}
          ignoreMissingTips
          wellLabelOptions="SHOW_LABEL_INSIDE"
        />
        {hasMoreThanOneWell ? (
          <PipetteShadow
            robotType={robotType}
            pipetteSpec={pipetteSpecs}
            slotPosition={slotPosition}
            hoveredWell={wellShadow ?? ''}
            selectedLabwareId={labwareId}
            labwareState={deckSetup.labware}
            hasPickupsRemaining={null}
            isHoveredWellSelected={hoveredIsSelected}
            isAccessible={isAccessible}
            inaccessibleReason={inaccessibleReason}
            primaryNozzle={primaryNozzle}
            enclosingViewbox={viewBox}
            nozzles={nozzleConfiguration}
            rotate={is96Channel}
          />
        ) : null}
      </>
    )
  }
  return (
    <>
      <div className={styles.header_text_wrapper}>{getWellSelectionText()}</div>
      <div className={styles.select_well_alignment}>
        <SelectionRect
          onSelectionMove={handleSelectionMove}
          onSelectionDone={handleSelectionDone}
          customWidth={45}
        >
          <BaseDeckTipSelection controls={controls} viewBox={viewBox} />
        </SelectionRect>
        <div className={styles.well_legend_box}>
          <SelectionLegend selectionType={WELL} size={DEFAULT_TIP_SIZE} />
        </div>
      </div>
    </>
  )
}
