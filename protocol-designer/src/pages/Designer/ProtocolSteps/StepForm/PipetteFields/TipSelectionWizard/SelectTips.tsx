import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  Chip,
  COLORS,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SELECTED,
  SELECTED_ERROR,
  SELECTED_USED,
  StyledText,
  USED,
} from '@opentrons/components'
import {
  ALL,
  COLUMN,
  getPositionFromSlotId,
  SINGLE,
} from '@opentrons/shared-data'
import {
  EMPTY,
  getDefaultPrimaryNozzle,
  getSlotInLocationStack,
} from '@opentrons/step-generation'

import { LabwareOnDeck } from '/protocol-designer/components/organisms'
import { getRobotStateAtActiveItem } from '/protocol-designer/top-selectors/labware-locations'
import { getLabwareNicknamesById } from '/protocol-designer/ui/labware/selectors'

import { BaseDeckTipSelection } from './BaseDeckTipSelection'
import { TIP_STATE_TO_TIP_TYPE } from './constants'
import { DeckOverlay } from './DeckOverlay'
import { useMemoizedTipAccessibileStatusByWellName } from './hooks'
import { PipetteShadow } from './PipetteShadows/PipetteFlexShadow'
import { TipLegend } from './TipLegend'
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
} from '@opentrons/shared-data'
import type { TipSelectionBaseProps } from './types'

const NINETY_SIX_ALL_TARGET_WELL = 'A1'

export function SelectTips(
  props: TipSelectionBaseProps & {
    pipetteSpecs: PipetteV2Specs
    nozzles: NozzleConfigurationStyle
    numTotalPickups: number
    selectedTips: string[][]
    setSelectedTips: Dispatch<SetStateAction<string[][]>>
    setShowPickupsRequiredBanner: Dispatch<SetStateAction<boolean>>
  }
): JSX.Element {
  const { pipetteSpecs, nozzles, pipetteId } = props

  const { t } = useTranslation('tip_selection')
  const labwareNicknamesById = useSelector(getLabwareNicknamesById)
  const [hoveredWell, setHoveredWell] = useState<string | null>(null)
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const currentHoveredWellRef = useRef<string | null>(null)

  const {
    selectedTiprackId,
    activeDeckSetup,
    deckDef,
    selectedTips,
    setSelectedTips,
    numTotalPickups,
    setShowPickupsRequiredBanner,
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

  const primaryNozzle = getDefaultPrimaryNozzle({
    nozzles,
    channels,
  })

  const tipAccessibileStatusByWellName = useMemoizedTipAccessibileStatusByWellName(
    {
      selectedTiprackId: selectedTiprackId ?? '',
      nozzles,
      pipetteSpecs,
      selectedTips,
      primaryNozzle,
      pipetteId,
    }
  )

  const allWellsAffectedByHover = getAffectedWells({
    wellName: hoveredWell,
    labwareDef,
    channels,
    nozzles,
  })

  const areAllHoveredWellsAccessibleAndOccupied = allWellsAffectedByHover.every(
    well => tipAccessibileStatusByWellName[well] && tipState?.[well] !== EMPTY
  )

  const numPickupsRemaining = numTotalPickups - selectedTips.length

  const handleUnselectWell = (unselectIndex: number): void => {
    setSelectedTips(selectedTips.slice(0, unselectIndex))
  }

  const handleClickWell = (wellName: string): void => {
    if (
      tipState?.[wellName] === 'EMPTY' ||
      !tipAccessibileStatusByWellName[wellName] ||
      (allWellsAffectedByHover.includes(wellName) &&
        !areAllHoveredWellsAccessibleAndOccupied)
    ) {
      return
    }
    setShowPickupsRequiredBanner(false)

    const prevSelectedTipsByIndex = selectedTips.reduce<Record<string, number>>(
      (acc, tipList, index) => {
        const innerAcc = tipList.reduce((acc, tip) => {
          return { ...acc, [tip]: index }
        }, {})
        return { ...acc, ...innerAcc }
      },
      {}
    )

    if (channels === 1 || nozzles === SINGLE) {
      if (wellName in prevSelectedTipsByIndex) {
        const indexToUnselect = prevSelectedTipsByIndex[wellName]
        handleUnselectWell(indexToUnselect)
      } else if (numPickupsRemaining > 0) {
        setSelectedTips(prevTips => [...prevTips, [wellName]])
      }
    } else if (channels === 8 || (channels === 96 && nozzles === COLUMN)) {
      if (wellName in prevSelectedTipsByIndex) {
        const indexToUnselect = prevSelectedTipsByIndex[wellName]
        handleUnselectWell(indexToUnselect)
      } else if (numPickupsRemaining > 0) {
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
      } else if (numPickupsRemaining > 0) {
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
        const innerAcc = tipList.reduce<Record<string, number>>((acc, tip) => {
          return { ...acc, [tip]: index }
        }, {})
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
              if (selectedTips.some(tipSet => tipSet.includes(wellName))) {
                status = rawState === USED ? SELECTED_USED : SELECTED
              } else if (allWellsAffectedByHover.includes(wellName)) {
                status = areAllHoveredWellsAccessibleAndOccupied
                  ? rawState === USED
                    ? SELECTED_USED
                    : SELECTED
                  : SELECTED_ERROR
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
                tipStatusByWellName,
              }
            : {})}
          fill={COLORS.white}
          borderStroke={COLORS.yellow40}
          ignoreMissingTips
        />
        {hoveredWell != null ? (
          <PipetteShadow
            pipetteSpec={pipetteSpecs}
            slotPosition={slotPosition}
            hoveredWell={hoveredWell}
            selectedTiprackId={selectedTiprackId}
            labwareState={activeDeckSetup.labware}
            isAccessible={areAllHoveredWellsAccessibleAndOccupied}
            primaryNozzle={primaryNozzle}
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
        {numPickupsRemaining > 0 ? (
          <Chip
            text={t('pickups_remaining', { count: numPickupsRemaining })}
            type="info"
            hasIcon={false}
          />
        ) : null}
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
        <TipLegend />
      </div>
    </div>
  )
}
