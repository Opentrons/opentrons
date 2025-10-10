import { Dispatch, SetStateAction, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  Chip,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  NEW,
  NO,
  StyledText,
  TipType,
  USED,
} from '@opentrons/components'
import { getPositionFromSlotId } from '@opentrons/shared-data'
import {
  getSlotInLocationStack,
  getTipColumn,
  TipState,
} from '@opentrons/step-generation'

import { LabwareOnDeck } from '/protocol-designer/components/organisms'
import { getInvariantContext } from '/protocol-designer/step-forms/selectors'
import { getRobotStateAtActiveItem } from '/protocol-designer/top-selectors/labware-locations'
import { getLabwareNicknamesById } from '/protocol-designer/ui/labware/selectors'

import { BaseDeckTipSelection } from './BaseDeckTipSelection'
import { PipetteShadow } from './PipetteShadows/PipetteFlexShadow'
import { TipLegend } from './TipLegend'
import styles from './tipselectionwizard.module.css'
import { getViewboxFromSelectedLabware } from './utils'

import type { TipSelectionBaseProps } from './types'

export function SelectTips(
  props: TipSelectionBaseProps & {
    pipetteId: string
    numTotalPickups: number
    selectedTips: string[]
    setSelectedTips: Dispatch<SetStateAction<string[]>>
    setShowPickupsRequiredBanner: Dispatch<SetStateAction<boolean>>
  }
): JSX.Element {
  const { pipetteId } = props

  const { t } = useTranslation('tip_selection')
  const invariantContext = useSelector(getInvariantContext)
  const labwareNicknamesById = useSelector(getLabwareNicknamesById)
  const [hoveredWell, setHoveredWell] = useState<string | null>(null)

  const { pipetteEntities } = invariantContext
  const { spec } = pipetteEntities[pipetteId]
  const { backLeftCorner, frontRightCorner } = spec.pipetteBoundingBoxOffsets
  const shadowWidth = frontRightCorner[0] - backLeftCorner[0]
  const shadowHeight = backLeftCorner[1] - frontRightCorner[1]
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

  const numPickupsRemaining = numTotalPickups - selectedTips.length

  const robotState = useSelector(getRobotStateAtActiveItem)
  const tipState = robotState?.tipState.tipracks[selectedTiprackId ?? '']

  const handleClickWell = (wellName: string) => {
    if (tipState?.[wellName] === 'EMPTY') {
      return
    }
    setShowPickupsRequiredBanner(false)
    setSelectedTips(prevTips => {
      const newTips = [...prevTips]
      if (newTips.includes(wellName)) {
        newTips.splice(newTips.indexOf(wellName), 1)
      } else if (numPickupsRemaining > 0) {
        newTips.push(wellName)
      }
      return newTips
    })
  }
  const { channels } = spec

  const handleHoverWell = (wellName: string) => {
    let transformedWellName = wellName
    if (channels === 8) {
      const column = wellName.slice(1, wellName.length)
      transformedWellName = `A${column}`
    } else if (channels === 96) {
      transformedWellName = 'A1'
    }
    setHoveredWell(transformedWellName)
  }

  const handleLeaveWell = () => {
    setHoveredWell(null)
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
    const tipStatusByWellName =
      tipState != null
        ? Object.entries(tipState).reduce(
            (acc, [wellName, state]) => ({
              ...acc,
              [wellName]: selectedTips.includes(wellName)
                ? 'selected'
                : tipStateToTipType[state],
            }),
            {}
          )
        : {}

    controls = (
      <>
        <LabwareOnDeck
          labwareOnDeck={labware}
          x={slotPosition[0]}
          y={slotPosition[1]}
          showHighlightedWells={false}
          handleClickWell={handleClickWell}
          onMouseEnterWell={handleHoverWell}
          onMouseLeaveWell={handleLeaveWell}
          selectedTips={selectedTips}
          {...(tipState != null
            ? {
                tipStatusByWellName,
              }
            : {})}
        />
        {hoveredWell != null ? (
          <PipetteShadow
            pipetteSpec={spec}
            slotPosition={slotPosition}
            hoveredWell={hoveredWell}
            selectedTiprackId={selectedTiprackId}
            labwareState={activeDeckSetup.labware}
          />
        ) : null}
      </>
    )
  }

  // TODO: add controls for selecting tips
  return (
    <div className={styles.modal_body}>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} alignItems={ALIGN_CENTER}>
        <StyledText desktopStyle="headingSmallBold">
          {t('click_and_drag', { labwareName })}
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

const tipStateToTipType: Record<TipState, TipType> = {
  CLEAN: NEW,
  DIRTY: USED,
  EMPTY: NO,
}

type SelectedTipData = Array<{
  [selectedTip: string]: {
    wells: string[]
    index: number
  }
}>
