import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  Chip,
  COLORS,
  DEFAULT_TIP_SIZE,
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
  SINGLE,
} from '@opentrons/shared-data'
import { EMPTY, getSlotInLocationStack } from '@opentrons/step-generation'

import { LabwareOnDeck } from '/protocol-designer/components/organisms'
import { getRobotType } from '/protocol-designer/file-data/selectors'
import { getRobotStateAtActiveItem } from '/protocol-designer/top-selectors/labware-locations'
import { getLabwareNicknamesById } from '/protocol-designer/ui/labware/selectors'

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
  getAffectedWells,
  getAllWellsInColumn,
  getViewboxFromSelectedLabware,
} from './utils'

import type { Dispatch, SetStateAction } from 'react'
import type { TipType, WellMouseEvent } from '@opentrons/components'
import type {
  NozzleConfigurationStyle,
  PipetteV2Specs,
  PrimaryNozzleConfigurationStyle,
} from '@opentrons/shared-data'
import type {
  AccessibilityStatus,
  InaccessibleReason,
  TipSelectionBaseProps,
} from './types'

const NINETY_SIX_ALL_TARGET_WELL = 'A1'

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
  const [hoveredWell, setHoveredWell] = useState<string | null>(null)
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const currentHoveredWellRef = useRef<string | null>(null)

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
  const viewBox =
    selectedTiprackId != null
      ? getViewboxFromSelectedLabware(
          selectedTiprackId,
          activeDeckSetup,
          deckDef
        )
      : null

  if (viewBox == null) {
    console.warn(`no viewbox for selected tiprack ${selectedTiprackId}`)
  }

  const robotState = useSelector(getRobotStateAtActiveItem)
  const tipState = robotState?.tipState.tipracks[selectedTiprackId ?? '']

  const labwareDef = activeDeckSetup.labware[selectedTiprackId ?? '']?.def
  const { channels } = pipetteSpecs

  const tipAccessibileStatusByWellName =
    selectedTiprackId != null
      ? (tipAccessibilityStatus[selectedTiprackId] ?? {})
      : {}

  const allWellsAffectedByHover = getAffectedWells({
    wellName: hoveredWell,
    labwareDef,
    channels,
    nozzles,
  })

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
    } else if (channels === 8 || (channels === 96 && nozzles === COLUMN)) {
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
    } else if (channels === 96) {
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
    let transformedWellName = wellName
    if (
      (channels === 8 && nozzles === ALL) ||
      (channels === 96 && nozzles === COLUMN)
    ) {
      const column = wellName.slice(1, wellName.length)
      transformedWellName = `A${column}`
    } else if (channels === 96 && nozzles === ALL) {
      transformedWellName = NINETY_SIX_ALL_TARGET_WELL
    }
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }
    setHoveredWell(transformedWellName)
    currentHoveredWellRef.current = transformedWellName
  }

  const handleLeaveWell = (_: WellMouseEvent): void => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current)
    }
    leaveTimeoutRef.current = setTimeout(() => {
      if (currentHoveredWellRef.current === hoveredWell) {
        setHoveredWell(null)
        currentHoveredWellRef.current = null
      }
      leaveTimeoutRef.current = null
    }, 300)
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
        {hoveredWell != null ? (
          <PipetteShadow
            robotType={robotType}
            pipetteSpec={pipetteSpecs}
            slotPosition={slotPosition}
            hoveredWell={hoveredWell}
            selectedLabwareId={selectedTiprackId}
            labwareState={activeDeckSetup.labware}
            isHoveredWellSelected={selectedTips
              .flat()
              .some(tip => tip === hoveredWell)}
            hasPickupsRemaining={hasPickupsRemaining}
            isAccessible={hoveredWellsInaccessibilityStatus == null}
            inaccessibleReason={hoveredWellsInaccessibilityStatus}
            primaryNozzle={primaryNozzle}
            enclosingViewbox={viewBox}
            nozzles={nozzles}
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
          <BaseDeckTipSelection
            viewBox={viewBox}
            showSlotLabels={false}
            controls={controls}
            labwareIdToHide={selectedTiprackId}
          />
        </div>
        <SelectionLegend selectionType={TIP} size={DEFAULT_TIP_SIZE} />
      </div>
    </div>
  )
}
