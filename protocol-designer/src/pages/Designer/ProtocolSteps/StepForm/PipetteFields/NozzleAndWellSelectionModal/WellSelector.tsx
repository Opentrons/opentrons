import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  COLORS,
  INACCESSIBLE,
  Module,
  SELECTED,
  SELECTED_ERROR,
  StyledText,
  UNSELECTED,
  WELL,
} from '@opentrons/components'
import {
  getDeckDefFromRobotType,
  getModuleDef,
  getPositionFromSlotId,
  inferModuleOrientationFromXCoordinate,
  PARTIAL_COLUMN,
  PARTIAL_NOZZLE_MAP,
} from '@opentrons/shared-data'
import {
  getPipetteMovementSafetyStatus,
  getSlotInLocationStack,
} from '@opentrons/step-generation'

import { LabwareOnDeck } from '/protocol-designer/components/organisms'
import { SelectionRect } from '/protocol-designer/components/organisms/Labware/SelectionRect'
import { getInvariantContext } from '/protocol-designer/step-forms/selectors'
import { getRobotStateAtActiveItem } from '/protocol-designer/top-selectors/labware-locations'
import { getCollidingWells } from '/protocol-designer/utils/index'

import { canPipetteUseLabware } from '../../../../../../utils'
import { BaseDeckTipSelection } from '../TipSelectionWizard/BaseDeckTipSelection'
import { INACCESSIBLE_COLLISION } from '../TipSelectionWizard/constants'
import { getWellsToCheck } from '../TipSelectionWizard/hooks/useMemoizedTipAccessibilityByTiprackIdByWellName'
import { PipetteShadow } from '../TipSelectionWizard/PipetteShadows/PipetteShadow'
import { SelectionLegend } from '../TipSelectionWizard/SelectionLegend'
import { getViewboxFromSelectedLabware } from '../TipSelectionWizard/utils'
import {
  INACCESSIBLE_PARTIAL_TIP,
  INACCESSIBLE_WELL_SPACING_MISMATCH,
} from './constants'
import { getAllWellsSafetyStatus } from './getAllWellsSafetyStatus'
import styles from './nozzleandwellwizard.module.css'
import {
  getEntireWellSelection,
  getInaccessibleWellsForPartialNozzleRowMap,
  getWellNameAtClientPoint,
} from './utils'

import type { ReactNode } from 'react'
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
import type { InaccessibleReason } from '../../PipetteFields/TipSelectionWizard/types'
import type { FieldPropsByName } from '../../types'

interface WellSelectorProps {
  deckSetup: AllTemporalPropertiesForTimelineFrame
  propsForFields: FieldPropsByName
  stepType: string
  pipetteSpecs: PipetteV2Specs
  robotType: RobotType
}

export function WellSelector(props: WellSelectorProps): ReactNode {
  const { t } = useTranslation('protocol_steps')
  const { deckSetup, propsForFields, stepType, robotType, pipetteSpecs } = props

  const nozzleConfiguration = propsForFields.nozzles
    .value as NozzleConfigurationStyle
  const primaryNozzle = propsForFields.primaryNozzle
    .value as PrimaryNozzleConfigurationStyle
  const pipetteId = propsForFields.pipette.value as string
  const isPartialNozzle = nozzleConfiguration === PARTIAL_COLUMN
  const tiprackLabwareDefURI = propsForFields.tipRack.value as string
  const tiprackId = Object.values(deckSetup.labware).find(
    labware => labware.labwareDefURI === tiprackLabwareDefURI
  )?.id
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
  const hasMoreThanOneWell = allWells.flat().length > 1
  const displayName = labwareDef.metadata.displayName

  const wellsField = ((): FieldProps | null => {
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
  })()

  const computedSelectedWells = useMemo((): string[][] => {
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
  }, [
    wellsField,
    hasMoreThanOneWell,
    allWells,
    labwareDef.ordering,
    nozzleConfiguration,
    primaryNozzle,
    channels,
  ])

  const [selectedWells, setSelectedWells] = useState<string[][]>(
    computedSelectedWells
  )
  const [hoveredWells, setHoveredWells] = useState<string[] | null>(null)
  const currentHoveredWellRef = useRef<string[] | null>(null)

  useEffect(() => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }

    currentHoveredWellRef.current = null
    setSelectedWells(computedSelectedWells)
    setHoveredWells(null)
  }, [stepType, computedSelectedWells])

  const handleLeaveWell = (): void => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
    }

    leaveTimeoutRef.current = setTimeout(() => {
      setHoveredWells(null)
      setWellShadow(null)
      currentHoveredWellRef.current = null
      leaveTimeoutRef.current = null
    }, 350)
  }
  const [wellShadow, setWellShadow] = useState<string | null>(null)
  const handleHoverWell = (e: WellMouseEvent): void => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }

    const { wellName } = e
    // If the well is a primary, use its pre-computed affectedWells.
    // If it's a cascading member, redirect to its covering primary's group so
    // that hover highlights the correct set and reflects the right accessibility.
    const directStatus = primaryWellAccessibilityByWellName[wellName]
    let hovered: string[]
    if (directStatus != null) {
      hovered = directStatus.affectedWells
    } else {
      const coveringStatus = wellToPrimaryStatus[wellName]
      hovered =
        coveringStatus != null
          ? coveringStatus.affectedWells
          : getEntireWellSelection(
              wellName,
              labwareDef.ordering,
              nozzleConfiguration,
              primaryNozzle,
              channels
            )
    }

    setHoveredWells(hovered)
    setWellShadow(hovered[0])
  }

  const allWellsWithStatus = useMemo(() => {
    return getAllWellsSafetyStatus({
      allWells,
      robotState,
      invariantContext,
      pipetteId,
      labwareId,
      primaryNozzle,
      nozzleConfiguration,
      tiprackId,
    })
  }, [
    allWells,
    primaryNozzle,
    nozzleConfiguration,
    pipetteId,
    labwareId,
    robotState,
    invariantContext,
    tiprackId,
  ])

  // primary well name only to mirror the tip selection hook's approach
  // cascading wells are represented through `affectedWells` on their primary entry
  // to not inappropriately show that cascading wells are inaccessible when their
  // primary is accessible
  const primaryWellAccessibilityByWellName = useMemo(() => {
    const pipetteCanUseLabware = canPipetteUseLabware(
      pipetteSpecs,
      nozzleConfiguration,
      labwareDef
    )

    // getWellsToCheck is designed for tipracks (96-well format). For labware like
    // 384-well plates, skipEveryOtherWell means A1's cascading wells only covers odd rows
    // Add gaps to primaries so wellToPrimaryStatus has an entry for every well in the labware.
    const initialPrimaries = getWellsToCheck(
      nozzleConfiguration,
      labwareDef.ordering,
      channels,
      primaryNozzle
    )
    const coveredByInitialPrimaries = new Set<string>()
    initialPrimaries.forEach(well => {
      getEntireWellSelection(
        well,
        labwareDef.ordering,
        nozzleConfiguration,
        primaryNozzle,
        channels
      ).forEach(well => coveredByInitialPrimaries.add(well))
    })
    const primaryWells = [
      ...initialPrimaries,
      ...allWells.flat().filter(w => !coveredByInitialPrimaries.has(w)),
    ]
    return primaryWells.reduce<
      Record<string, { isAccessible: boolean; affectedWells: string[] }>
    >((acc, wellName) => {
      const isSafe =
        pipetteCanUseLabware &&
        (robotState == null ||
          getPipetteMovementSafetyStatus({
            robotState,
            invariantContext,
            pipetteId,
            labwareId,
            wellTargetName: wellName,
            primaryNozzle,
            nozzleConfiguration,
            tiprackId,
          }).isSafe)
      const affectedWells = getEntireWellSelection(
        wellName,
        labwareDef.ordering,
        nozzleConfiguration,
        primaryNozzle,
        channels
      )
      acc[wellName] = { isAccessible: isSafe, affectedWells }
      return acc
    }, {})
  }, [
    pipetteSpecs,
    nozzleConfiguration,
    labwareDef,
    channels,
    primaryNozzle,
    robotState,
    invariantContext,
    pipetteId,
    labwareId,
    tiprackId,
    allWells,
  ])

  // propogate each primary's status to all its cascading wells
  // accessible primaries take precedence so a cascading well covered by both
  // an accessible and an inaccessible primary is shown as accessible
  const wellToPrimaryStatus = Object.entries(
    primaryWellAccessibilityByWellName
  ).reduce<Record<string, { isAccessible: boolean; affectedWells: string[] }>>(
    (acc, [, status]) => {
      status.affectedWells.forEach(well => {
        const existing = acc[well]
        if (
          existing == null ||
          (!existing.isAccessible && status.isAccessible)
        ) {
          acc[well] = status
        }
      })
      return acc
    },
    {}
  )

  const allWellsWithState = allWells
    .flat()
    .reduce<Record<string, WellType>>((acc, wellName) => {
      const accessible = wellToPrimaryStatus[wellName]?.isAccessible ?? false

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
  const inaccessiblePartialWells = useMemo(() => {
    if (!isPartialNozzle || selectedWells.length === 0) {
      return []
    }

    return getInaccessibleWellsForPartialNozzleRowMap(
      selectedWells,
      labwareDef.ordering,
      allWellsWithState,
      PARTIAL_NOZZLE_MAP[primaryNozzle as PartialPrimaryNozzles]
    )
  }, [
    selectedWells,
    isPartialNozzle,
    primaryNozzle,
    labwareDef.ordering,
    allWellsWithState,
  ])

  const deckDef = getDeckDefFromRobotType(robotType)
  const viewBox = getViewboxFromSelectedLabware(
    labwareId,
    robotState,
    deckSetup,
    deckDef
  )

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
      const noOverlapInInaccessibleWells = inaccessiblePartialWells
        .flat()
        .some(well => wellSelection.includes(well))
      const noOverlapInAlreadySelected = highlightedWells
        .flat()
        .some(well => wellSelection.includes(well))
      if (!noOverlapInAlreadySelected && !noOverlapInInaccessibleWells) {
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
            if (
              !exists &&
              (primaryWellAccessibilityByWellName[primaryWellInGroup]
                ?.isAccessible ??
                false)
            ) {
              updated.push(wellGroup)
            }
          })
        }
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
  const modulesOnDeck = deckSetup.modules
  const moduleIds = new Set(Object.keys(modulesOnDeck))

  const defaultSlotPosition: [number, number, number] = [0, 0, 0]

  if (labware && robotState) {
    const activeLabware = robotState.labware[labwareId]
    const moduleLocation =
      activeLabware.stack.find(loc => moduleIds.has(loc)) ?? null
    const isLabwareOnModule = moduleLocation !== null
    const moduleDef = moduleLocation
      ? getModuleDef(modulesOnDeck[moduleLocation].model)
      : null
    const slot = getSlotInLocationStack(activeLabware.stack)
    const slotPosition =
      getPositionFromSlotId(slot, deckDef) ?? defaultSlotPosition
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
    let inaccessibleReason: InaccessibleReason
    if (
      inaccessiblePartialWells.filter(well => hoveredWells?.includes(well))
        .length > 0
    ) {
      inaccessibleReason = INACCESSIBLE_PARTIAL_TIP
    } else if (
      !canPipetteUseLabware(pipetteSpecs, nozzleConfiguration, labwareDef)
    ) {
      inaccessibleReason = INACCESSIBLE_WELL_SPACING_MISMATCH
    } else {
      inaccessibleReason = INACCESSIBLE_COLLISION
    }

    const is96Channel = channels === 96

    const labwarePositionProps = isLabwareOnModule
      ? {
          x: 0,
          y: 0,
        }
      : {
          x: slotPosition[0],
          y: slotPosition[1],
        }
    const labwarePipetteContent = (
      <>
        <LabwareOnDeck
          labwareOnDeck={labware}
          {...labwarePositionProps}
          onMouseEnterWell={handleHoverWell}
          onMouseLeaveWell={handleLeaveWell}
          selectedTipsByIndex={allWellsWithStatus}
          statusByWellName={allWellsWithState}
          fill={COLORS.white}
          ignoreMissingTips
          wellLabelOptions="SHOW_LABEL_INSIDE"
        />
        {hasMoreThanOneWell && wellShadow !== null ? (
          <PipetteShadow
            robotType={robotType}
            pipetteSpec={pipetteSpecs}
            slotPosition={
              isLabwareOnModule ? defaultSlotPosition : slotPosition
            }
            hoveredWell={wellShadow}
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
    controls = (
      <Fragment>
        {moduleDef ? (
          <Module
            key={slot}
            x={slotPosition[0]}
            y={slotPosition[1]}
            def={moduleDef}
            orientation={inferModuleOrientationFromXCoordinate(slotPosition[0])}
            innerProps={{ lidMotorState: 'open' }}
            targetSlotId={slot}
            targetDeckId={deckDef.otId}
            childrenPositioningMode={'offsetToSlot'}
          >
            {labwarePipetteContent}
          </Module>
        ) : (
          <>{labwarePipetteContent}</>
        )}
      </Fragment>
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
          <div className={styles.base_deck_tip_selection}>
            <BaseDeckTipSelection controls={controls} viewBox={viewBox} />
          </div>
        </SelectionRect>
        <div className={styles.well_legend_box}>
          <SelectionLegend selectionType={WELL} />
        </div>
      </div>
    </>
  )
}
