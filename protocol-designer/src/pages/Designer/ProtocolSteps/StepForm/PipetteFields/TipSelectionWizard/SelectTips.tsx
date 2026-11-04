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
import {
  ALL,
  COLUMN,
  getPositionFromSlotId,
  PARTIAL_COLUMN,
  PARTIAL_NOZZLE_MAP,
  ROW,
  SINGLE,
} from '@opentrons/shared-data'
import { EMPTY, getSlotInLocationStack } from '@opentrons/step-generation'

import { LabwareOnDeck } from '/protocol-designer/components/organisms'
import { SelectionRect } from '/protocol-designer/components/organisms/Labware/SelectionRect'
import { getRobotType } from '/protocol-designer/file-data/selectors'
import { getRobotStateAtActiveItem } from '/protocol-designer/top-selectors/labware-locations'
import { getLabwareNicknamesById } from '/protocol-designer/ui/labware/selectors'
import { getCollidingWells } from '/protocol-designer/utils/index'

import {
  INACCESSIBLE_PARTIAL_TIP,
  INACCESSIBLE_WELL_SPACING_MISMATCH,
} from '../NozzleAndWellSelectionModal/constants'
import {
  getEntireWellSelection,
  getWellNameAtClientPoint,
} from '../NozzleAndWellSelectionModal/utils'
import { BaseDeckTipSelection } from './BaseDeckTipSelection'
import {
  INACCESSIBLE_COLLISION,
  INACCESSIBLE_INCOMPLETE,
  INACCESSIBLE_TOO_MANY_PICKUPS,
  TIP_STATE_TO_TIP_TYPE,
} from './constants'
import { DeckOverlay } from './DeckOverlay'
import { PipetteShadow } from './PipetteShadows/PipetteShadow'
import { SelectionLegend } from './SelectionLegend'
import styles from './tipselectionwizard.module.css'
import {
  getAllWellsInColumn,
  getAllWellsInRow,
  getViewboxFromSelectedLabware,
} from './utils'

import type { Dispatch, SetStateAction } from 'react'
import type { TipType, WellMouseEvent } from '@opentrons/components'
import type {
  NozzleConfigurationStyle,
  PartialPrimaryNozzles,
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

  const allWellsAffectedByHover = hoveredWells ?? []

  const areAllHoveredWellsAccessibleAndOccupied = allWellsAffectedByHover.every(
    well =>
      tipAccessibileStatusByWellName[well].isAccessible &&
      tipState?.[well] !== EMPTY
  )

  // lower index means higher priority
  const inaccessibilityPriority = [
    INACCESSIBLE_COLLISION,
    INACCESSIBLE_INCOMPLETE,
    INACCESSIBLE_TOO_MANY_PICKUPS,
    INACCESSIBLE_PARTIAL_TIP,
    INACCESSIBLE_WELL_SPACING_MISMATCH,
  ]

  const hoveredWellsInaccessibilityStatus =
    allWellsAffectedByHover.reduce<InaccessibleReason | null>((acc, well) => {
      const { isAccessible, inaccessibleReason } =
        tipAccessibileStatusByWellName[well]
      if (isAccessible || inaccessibleReason == null) {
        return acc
      }
      if (acc == null) {
        return inaccessibleReason
      }
      return inaccessibilityPriority.indexOf(inaccessibleReason) <
        inaccessibilityPriority.indexOf(acc)
        ? inaccessibleReason
        : acc
    }, null)
  const numPickupsRemaining = numTotalPickups - selectedTips.length
  const hasPickupsRemaining = numPickupsRemaining > 0

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

  const handleUnselectWell = (unselectIndex: number): void => {
    setSelectedTips(selectedTips.slice(0, unselectIndex))
  }

  const handleClickWell = (wellName: string): void => {
    const prevSelectedTipsByIndex = selectedTips.reduce<Record<string, number>>(
      (acc, tipList, index) => {
        const innerAcc = tipList.reduce((acc, tip) => {
          return { ...acc, [tip]: index }
        }, {})
        return { ...acc, ...innerAcc }
      },
      {}
    )
    if (
      // always allow tip unselection
      !(wellName in prevSelectedTipsByIndex) &&
      (tipState?.[wellName] === 'EMPTY' ||
        !tipAccessibileStatusByWellName[wellName].isAccessible ||
        (allWellsAffectedByHover.includes(wellName) &&
          !areAllHoveredWellsAccessibleAndOccupied))
    ) {
      return
    }
    setShowErrorBanner(false)

    if (channels === 1 || nozzles === SINGLE) {
      if (wellName in prevSelectedTipsByIndex) {
        const indexToUnselect = prevSelectedTipsByIndex[wellName]
        handleUnselectWell(indexToUnselect)
      } else if (hasPickupsRemaining) {
        setSelectedTips(prevTips => [...prevTips, [wellName]])
      }
    } else if (nozzles === PARTIAL_COLUMN) {
      if (wellName in prevSelectedTipsByIndex) {
        const indexToUnselect = prevSelectedTipsByIndex[wellName]
        handleUnselectWell(indexToUnselect)
      } else if (hasPickupsRemaining) {
        const totalTipSelection =
          PARTIAL_NOZZLE_MAP[primaryNozzle as PartialPrimaryNozzles] ?? 0
        const allWellsinColumn = getAllWellsInColumn(wellName, labwareDef)
        const lengthOfColumn = allWellsinColumn.length
        const allWellsInPartialColumn = allWellsinColumn.slice(
          0,
          lengthOfColumn - totalTipSelection
        )
        setSelectedTips(prevTips => [...prevTips, allWellsInPartialColumn])
      }
    } else if (
      (channels === 8 && nozzles === ALL) ||
      (channels === 96 && nozzles === COLUMN)
    ) {
      if (wellName in prevSelectedTipsByIndex) {
        const indexToUnselect = prevSelectedTipsByIndex[wellName]
        handleUnselectWell(indexToUnselect)
      } else if (hasPickupsRemaining) {
        const allWellsInColumn = getAllWellsInColumn(wellName, labwareDef)
        setSelectedTips(prevTips => {
          const newTips = [...prevTips]
          newTips.push(allWellsInColumn)
          return newTips
        })
      }
    } else if (channels === 96 && nozzles === ROW) {
      if (wellName in prevSelectedTipsByIndex) {
        const indexToUnselect = prevSelectedTipsByIndex[wellName]
        handleUnselectWell(indexToUnselect)
      } else if (hasPickupsRemaining) {
        const allWellsInRow = getAllWellsInRow(wellName, labwareDef)
        setSelectedTips(prevTips => {
          const newTips = [...prevTips]
          newTips.push(allWellsInRow)
          return newTips
        })
      }
    } else if (channels === 96 && nozzles === ALL) {
      const allWells = Object.keys(labwareDef.wells)
      if (wellName in prevSelectedTipsByIndex) {
        const indexToUnselect = prevSelectedTipsByIndex[wellName]
        handleUnselectWell(indexToUnselect)
      } else if (hasPickupsRemaining) {
        setSelectedTips(prevTips => [...prevTips, allWells])
      }
    }
  }

  const handleHoverWell = (e: WellMouseEvent): void => {
    const { wellName } = e
    const allHoveredWells = getEntireWellSelection(
      wellName,
      labwareDef.ordering,
      nozzles,
      primaryNozzle,
      channels
    )

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
    (acc, tipList, index) => {
      const innerAcc = tipList.reduce<Record<string, number>>(
        (acc, tip) => ({ ...acc, [tip]: index }),
        {}
      )
      return { ...acc, ...innerAcc }
    },
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
      const filteredWellsUnderRect = wellsUnderRect.filter(wellGroup =>
        wellGroup.every(
          wellName =>
            tipAccessibileStatusByWellName[wellName].isAccessible &&
            hasPickupsRemaining
        )
      )
      setSelectedTips(prev => {
        const next = [...prev]
        const selectedFlat = new Set(prev.flat())
        const allAlreadySelected = filteredWellsUnderRect.every(group =>
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
            if (!exists && selectedWellsByIndex[primaryWellInGroup] !== 1) {
              updated.push(wellGroup)
            }
          })
        }
        return updated
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
            (acc, [wellName, state]) => {
              const rawState = TIP_STATE_TO_TIP_TYPE[state]
              let status = rawState
              if (!tipAccessibileStatusByWellName[wellName].isAccessible) {
                status = rawState === NO ? NO : INACCESSIBLE
              }
              if (selectedTips.flat().some(tip => tip === wellName)) {
                const isAccessible =
                  tipAccessibileStatusByWellName[wellName].isAccessible
                if (!isAccessible) {
                  status = SELECTED_ERROR
                } else {
                  status = rawState === USED ? SELECTED_USED : SELECTED
                }
              } else if (allWellsAffectedByHover.includes(wellName)) {
                if (
                  areAllHoveredWellsAccessibleAndOccupied &&
                  hasPickupsRemaining
                ) {
                  status = rawState === USED ? SELECTED_USED : SELECTED
                } else {
                  status = SELECTED_ERROR
                }
              }
              return { ...acc, [wellName]: status }
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
          handleClickWell={handleClickWell}
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
            isHoveredWellSelected={selectedTips
              .flat()
              .some(tip => tip === wellShadow)}
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
