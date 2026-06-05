import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  Chip,
  COLORS,
  Flex,
  INACCESSIBLE,
  JUSTIFY_SPACE_BETWEEN,
  NO,
  SELECTED,
  SELECTED_ERROR,
  SELECTED_USED,
  StyledText,
  TIP,
  USED,
} from '@opentrons/components'
import { getPositionFromSlotId } from '@opentrons/shared-data'
import { EMPTY, getSlotInLocationStack } from '@opentrons/step-generation'

import { LabwareOnDeck } from '/protocol-designer/components/organisms'
import { SelectionRect } from '/protocol-designer/components/organisms/Labware/SelectionRect'
import { getRobotType } from '/protocol-designer/file-data/selectors'
import { getRobotStateAtActiveItem } from '/protocol-designer/top-selectors/labware-locations'
import { getLabwareNicknamesById } from '/protocol-designer/ui/labware/selectors'
import { getCollidingWells } from '/protocol-designer/utils/index'

import {
  getEntireWellSelection,
  getWellNameAtClientPoint,
} from '../NozzleAndWellSelectionModal/utils'
import { BaseDeckTipSelection } from './BaseDeckTipSelection'
import {
  INACCESSIBLE_COLLISION,
  INACCESSIBLE_INCOMPLETE,
  TIP_STATE_TO_TIP_TYPE,
} from './constants'
import { DeckOverlay } from './DeckOverlay'
import { PipetteShadow } from './PipetteShadows/PipetteShadow'
import { SelectionLegend } from './SelectionLegend'
import styles from './tipselectionwizard.module.css'
import { getViewboxFromSelectedLabware } from './utils'

import type { Dispatch, SetStateAction } from 'react'
import type { TipType, WellMouseEvent } from '@opentrons/components'
import type {
  NozzleConfigurationStyle,
  PipetteV2Specs,
  PrimaryNozzleConfigurationStyle,
} from '@opentrons/shared-data'
import type { GenericRect } from '/protocol-designer/collision-types'
import type {
  AccessibilityStatus,
  InaccessibleReason,
  TipSelectionBaseProps,
} from './types'

export function SelectTips(
  props: TipSelectionBaseProps & {
    pipetteSpecs: PipetteV2Specs
    nozzles: NozzleConfigurationStyle
    numTotalPickups: number
    selectedTips: string[][]
    setSelectedTips: Dispatch<SetStateAction<string[][]>>
    setShowErrorBanner: Dispatch<SetStateAction<boolean>>
    primaryNozzle: PrimaryNozzleConfigurationStyle
    tipAccessibilityStatus: Record<string, Record<string, AccessibilityStatus>>
  }
): JSX.Element {
  const { t } = useTranslation('tip_selection')
  const labwareNicknamesById = useSelector(getLabwareNicknamesById)
  const robotType = useSelector(getRobotType)
  const [hoveredWells, setHoveredWells] = useState<string[] | null>(null)
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const currentHoveredWellRef = useRef<string[] | null>(null)

  const {
    pipetteSpecs,
    selectedTiprackId,
    activeDeckSetup,
    deckDef,
    selectedTips,
    setSelectedTips,
    numTotalPickups,
    setShowErrorBanner,
    tipAccessibilityStatus,
    nozzles,
    primaryNozzle,
  } = props
  const labwareName = labwareNicknamesById[selectedTiprackId ?? '']
  const robotState = useSelector(getRobotStateAtActiveItem)
  const [wellShadow, setWellShadow] = useState<string | null>(null)
  const viewBox =
    selectedTiprackId != null
      ? getViewboxFromSelectedLabware(
          selectedTiprackId,
          robotState,
          activeDeckSetup,
          deckDef
        )
      : null

  if (viewBox == null) {
    console.warn(`no viewbox for selected tiprack ${selectedTiprackId}`)
  }

  const tipState = robotState?.tipState.tipracks[selectedTiprackId ?? '']

  const labwareDef = activeDeckSetup.labware[selectedTiprackId ?? '']?.def
  const { channels } = pipetteSpecs

  const tipAccessibileStatusByWellName =
    selectedTiprackId != null
      ? (tipAccessibilityStatus[selectedTiprackId] ?? {})
      : {}
  // Flat lookup: well mapped to status of the primary or primaries covering it.
  // Accessible primaries take precedence so cascading members of an accessible
  // group are not incorrectly shown as inaccessible.
  const wellToPrimaryStatus = Object.entries(
    tipAccessibileStatusByWellName
  ).reduce<Record<string, AccessibilityStatus>>((acc, [, status]) => {
    status.affectedWells.forEach(well => {
      const existing = acc[well]
      if (existing == null || (!existing.isAccessible && status.isAccessible)) {
        acc[well] = status
      }
    })
    return acc
  }, {})

  const allWellsAffectedByHover = hoveredWells ?? []
  // The primary (first) well is where the primary nozzle lands. Cascading wells
  // should not be used as the basis for accessibility since their individual isSafe
  // checks would incorrectly flag them as blocked by the primary well's tip.
  const primaryHoveredWell = allWellsAffectedByHover[0] ?? null
  const primaryHoveredWellStatus =
    primaryHoveredWell != null
      ? tipAccessibileStatusByWellName[primaryHoveredWell]
      : null

  const allGroupWellsHaveTips = allWellsAffectedByHover.every(
    well => tipState?.[well] !== EMPTY
  )

  const isHoveringSelectedGroup =
    primaryHoveredWell != null &&
    selectedTips.some(group => group[0] === primaryHoveredWell)

  const areAllHoveredWellsAccessibleAndOccupied =
    isHoveringSelectedGroup ||
    ((primaryHoveredWellStatus?.isAccessible ?? false) && allGroupWellsHaveTips)

  const hoveredWellsInaccessibilityStatus: InaccessibleReason | null = (() => {
    if (isHoveringSelectedGroup) {
      return null
    }
    // A null status means the well isn't a registered primary tip.
    if (primaryHoveredWellStatus == null) {
      return INACCESSIBLE_INCOMPLETE
    }
    if (!primaryHoveredWellStatus.isAccessible) {
      return primaryHoveredWellStatus.inaccessibleReason
    }
    if (!allGroupWellsHaveTips) {
      return INACCESSIBLE_INCOMPLETE
    }
    return null
  })()

  const numPickupsRemaining = numTotalPickups - selectedTips.length
  const hasPickupsRemaining = numPickupsRemaining > 0

  // Flat set of all wells currently selected (primary + cascading for each group).
  const flatSelected = new Set(selectedTips.flat())

  const selectedWellToPrimary: Record<string, string> = selectedTips.reduce<
    Record<string, string>
  >((acc, group) => {
    const primary = group[0]
    group.forEach(tip => {
      acc[tip] = primary
    })
    return acc
  }, {})

  const _getWellsFromRect: (rect: GenericRect) => string[][] = rect => {
    const wellsInRect = getCollidingWells(rect)
    const highlightedWells: string[][] = []
    for (const well in wellsInRect) {
      const wellSelection = getEntireWellSelection(
        well,
        labwareDef.ordering,
        nozzles,
        primaryNozzle,
        channels
      )
      highlightedWells.push(wellSelection)
    }
    return highlightedWells
  }

  const handleClickWell = (wellName: string): void => {
    // If this well belongs to an already-selected group, deselect that group.
    const owningPrimary = selectedWellToPrimary[wellName]
    if (owningPrimary != null) {
      setShowErrorBanner(false)
      const groupIndex = selectedTips.findIndex(g => g[0] === owningPrimary)
      setSelectedTips(selectedTips.slice(0, groupIndex))
      return
    }

    // for new selections, lookup primary first
    // fall back to the covering-primary map for cascading (non-primary) wells.
    const status =
      tipAccessibileStatusByWellName[wellName] ?? wellToPrimaryStatus[wellName]

    if (!(status?.isAccessible === true)) {
      return
    }
    const affectedWells = [...status.affectedWells]
    if (affectedWells.some(w => tipState?.[w] === EMPTY)) {
      return
    }
    if (!hasPickupsRemaining) {
      return
    }

    setShowErrorBanner(false)
    setSelectedTips([...selectedTips, affectedWells])
  }

  const handleHoverWell = (e: WellMouseEvent): void => {
    const { wellName } = e

    // determine hover group using pre-computed data:
    // 1. If the well is part of a selected group, show that group (deselect).
    // 2. If the well is a valid primary, use its pre-computed affectedWells from
    // useEMemoizedTipAccessibilityByTipraackIdByWellName.
    // 3. If the well is a cascading member of some primary whose shadow would fall
    // outside the current selection, use that primary's group.
    // 4. Fall back to the single well (renders as INACCESSIBLE_INCOMPLETE via null status).
    const owningPrimary = selectedWellToPrimary[wellName] ?? null
    let allHoveredWells: string[]

    if (owningPrimary != null) {
      allHoveredWells = selectedTips.find(
        group => group[0] === owningPrimary
      ) ?? [wellName]
    } else {
      const directStatus = tipAccessibileStatusByWellName[wellName]
      if (directStatus != null) {
        allHoveredWells = directStatus.affectedWells
      } else {
        const coveringAccessibilityStatus = wellToPrimaryStatus[wellName]
        const coveringFirst = coveringAccessibilityStatus?.affectedWells[0]
        allHoveredWells =
          coveringAccessibilityStatus != null &&
          !flatSelected.has(coveringFirst)
            ? coveringAccessibilityStatus.affectedWells
            : [wellName]
      }
    }

    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }
    setHoveredWells(allHoveredWells)
    setWellShadow(allHoveredWells[0])
  }

  const handleLeaveWell = (_: WellMouseEvent): void => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
    }
    leaveTimeoutRef.current = setTimeout(() => {
      setWellShadow(null)
      setHoveredWells(null)
      currentHoveredWellRef.current = null

      leaveTimeoutRef.current = null
    }, 300)
  }

  const selectedWellsByIndex = selectedTips.reduce<Record<string, number>>(
    (acc, group, index) => ({
      ...acc,
      ...Object.fromEntries(group.map(w => [w, index])),
    }),
    {}
  )

  const handleSelectionMove = (e: MouseEvent, rect: GenericRect): void => {
    if (!e.shiftKey) {
      const wellsUnderRect = _getWellsFromRect(rect)
      const flat = [...new Set(wellsUnderRect.flat())]
      setHoveredWells(flat)
      const wellUnderMouse = getWellNameAtClientPoint(e.clientX, e.clientY)
      if (wellUnderMouse) {
        setWellShadow(wellUnderMouse)
      }
    }
  }

  const handleSelectionDone = (e: MouseEvent, rect: GenericRect): void => {
    if (!e.shiftKey) {
      const wellsUnderRect = _getWellsFromRect(rect)

      // single clicks call handleClickWell directly.
      if (rect.x0 === rect.x1 && rect.y0 === rect.y1) {
        const actualClickedWell =
          Object.keys(getCollidingWells(rect))[0] ?? null
        if (actualClickedWell != null) {
          handleClickWell(actualClickedWell)
        }
        return
      }

      // For drag selections, filter to accessible primaries only.
      const filteredWellsUnderRect = wellsUnderRect.filter(wellGroup => {
        const primaryWell = wellGroup[0]
        return (
          (tipAccessibileStatusByWellName[primaryWell]?.isAccessible ??
            false) &&
          hasPickupsRemaining
        )
      })
      const primaryWellsInRect = filteredWellsUnderRect.map(group => group[0])
      const selectedPrimarySet = new Set(selectedTips.map(group => group[0]))

      const allAlreadySelected =
        primaryWellsInRect.length > 0 &&
        primaryWellsInRect.every(p => selectedPrimarySet.has(p))

      setSelectedTips(prev => {
        const prevPrimaries = prev.map(g => g[0])
        let newPrimaries: string[]

        if (allAlreadySelected) {
          const toRemove = new Set(primaryWellsInRect)
          newPrimaries = prevPrimaries.filter(primary => !toRemove.has(primary))
        } else {
          const toAdd = primaryWellsInRect.filter(
            primary => !selectedPrimarySet.has(primary)
          )
          newPrimaries = [...prevPrimaries, ...toAdd]
        }

        return newPrimaries.map(primary => {
          const aff = tipAccessibileStatusByWellName[primary]?.affectedWells
          return aff != null ? [...aff] : [primary]
        })
      })

      setHoveredWells(null)
    }
  }

  let controls: JSX.Element = <></>
  const labware = activeDeckSetup.labware[selectedTiprackId ?? '']
  const slot = getSlotInLocationStack(labware.stack)
  const slotPosition = getPositionFromSlotId(slot, deckDef)

  if (slotPosition == null || selectedTiprackId == null || labware == null) {
    console.warn(`no slot position for selected tiprack ${selectedTiprackId}`)
    controls = <></>
  } else {
    const tipState = robotState?.tipState.tipracks[selectedTiprackId ?? '']

    const is96Channel = channels === 96
    const tipStatusByWellName =
      tipState != null
        ? Object.entries(tipState).reduce<Record<string, TipType>>(
            (acc, [tipName, state]) => {
              const rawState = TIP_STATE_TO_TIP_TYPE[state]
              const primaryStatus = wellToPrimaryStatus[tipName]
              let status = rawState

              if (!primaryStatus?.isAccessible) {
                status = rawState === NO ? NO : INACCESSIBLE
              }

              if (flatSelected.has(tipName)) {
                // Find the primary of the group this selected well belongs to.
                const groupContainingWell = selectedTips.find(group =>
                  group.includes(tipName)
                )
                const primaryOfGroup = groupContainingWell?.[0] ?? tipName
                const primaryStatus =
                  tipAccessibileStatusByWellName[primaryOfGroup]
                // Use physical tip state to account for tipsToIgnore
                const affectedWells = primaryStatus?.affectedWells ??
                  groupContainingWell ?? [tipName]
                const hasPhysicallyEmptyWell = affectedWells.some(
                  w => tipState?.[w] === EMPTY
                )
                const isGroupInError =
                  (primaryStatus != null &&
                    !primaryStatus.isAccessible &&
                    primaryStatus.inaccessibleReason ===
                      INACCESSIBLE_COLLISION) ||
                  hasPhysicallyEmptyWell
                status = isGroupInError
                  ? SELECTED_ERROR
                  : rawState === USED
                    ? SELECTED_USED
                    : SELECTED
              } else if (allWellsAffectedByHover.includes(tipName)) {
                status =
                  areAllHoveredWellsAccessibleAndOccupied && hasPickupsRemaining
                    ? rawState === USED
                      ? SELECTED_USED
                      : SELECTED
                    : SELECTED_ERROR
              }

              return { ...acc, [tipName]: status }
            },
            {}
          )
        : {}

    controls = (
      <>
        <DeckOverlay deckDef={deckDef} />
        <LabwareOnDeck
          labwareOnDeck={labware}
          x={slotPosition[0]}
          y={slotPosition[1]}
          showHighlightedWells={false}
          onMouseEnterWell={handleHoverWell}
          onMouseLeaveWell={handleLeaveWell}
          selectedTipsByIndex={selectedWellsByIndex}
          {...(tipState != null
            ? {
                statusByWellName: tipStatusByWellName,
              }
            : {})}
          fill={COLORS.white}
          borderStroke={COLORS.yellow40}
          ignoreMissingTips
        />
        {wellShadow ? (
          <PipetteShadow
            robotType={robotType}
            pipetteSpec={pipetteSpecs}
            slotPosition={slotPosition}
            hoveredWell={wellShadow ?? ''}
            selectedLabwareId={selectedTiprackId}
            labwareState={activeDeckSetup.labware}
            isHoveredWellSelected={flatSelected.has(wellShadow)}
            hasPickupsRemaining={hasPickupsRemaining}
            isAccessible={hoveredWellsInaccessibilityStatus == null}
            inaccessibleReason={hoveredWellsInaccessibilityStatus ?? null}
            primaryNozzle={primaryNozzle}
            enclosingViewbox={viewBox}
            nozzles={nozzles}
            rotate={is96Channel}
          />
        ) : null}
      </>
    )
  }
  return (
    <div className={styles.modal_body}>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} alignItems={ALIGN_CENTER}>
        <StyledText desktopStyle="headingSmallBold">
          {t('click_to_select', { labwareName })}
        </StyledText>
        <Chip
          {...(hasPickupsRemaining
            ? {
                text: t('pickups_remaining', { count: numPickupsRemaining }),
                type: 'info',
              }
            : { text: t('all_tips_selected'), type: 'success' })}
          hasIcon={false}
        />
      </Flex>
      <div className={styles.modal_body_select_tips}>
        <div className={styles.select_tips_deck_container}>
          <SelectionRect
            onSelectionMove={handleSelectionMove}
            onSelectionDone={handleSelectionDone}
            customWidth={45}
          >
            <BaseDeckTipSelection
              viewBox={viewBox}
              showSlotLabels={false}
              controls={controls}
              labwareIdToHide={selectedTiprackId}
            />
          </SelectionRect>
        </div>
        <div className={styles.legend_box}>
          <SelectionLegend selectionType={TIP} />
        </div>
      </div>
    </div>
  )
}
