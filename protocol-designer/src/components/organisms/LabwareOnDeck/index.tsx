import { useSelector } from 'react-redux'

import {
  CenterLabwareInSlot,
  INACCESSIBLE,
  LabwareRender,
  SELECTED_ERROR,
} from '@opentrons/components'
import { getIsLid } from '@opentrons/shared-data'
import * as wellContentsSelectors from '@opentrons/step-generation'

import { selectors } from '../../../labware-ingred/selectors'
import * as highlightSelectors from '../../../top-selectors/substep-highlight'
import * as tipContentsSelectors from '../../../top-selectors/tip-contents'
import { getAllWellContentsForActiveItem } from '../../../top-selectors/well-contents'

import type { CSSProperties } from 'react'
import type {
  TipType,
  WellGroup,
  WellLabelOption,
  WellMouseEvent,
  WellType,
} from '@opentrons/components'
import type { LabwareOnDeck as LabwareOnDeckType } from '/protocol-designer/step-forms'

interface LabwareOnDeckProps {
  labwareOnDeck: LabwareOnDeckType
  x: number
  y: number
  highlight?: boolean
  showHighlightedWells?: boolean
  handleClickWell?: (wellName: string) => void
  statusByWellName?: Record<string, TipType | WellType>
  onMouseEnterWell?: (e: WellMouseEvent) => void
  onMouseLeaveWell?: (e: WellMouseEvent) => void
  selectedTipsByIndex?: Record<string, number>
  fill?: CSSProperties['fill']
  borderStroke?: CSSProperties['stroke']
  ignoreMissingTips?: boolean
  wellLabelOptions?: WellLabelOption
  centerInSlot?: boolean
}

export function LabwareOnDeck(props: LabwareOnDeckProps): JSX.Element {
  const {
    labwareOnDeck,
    x,
    y,
    highlight = false,
    showHighlightedWells = true,
    statusByWellName,
    handleClickWell,
    onMouseEnterWell,
    onMouseLeaveWell,
    selectedTipsByIndex,
    fill,
    borderStroke,
    ignoreMissingTips = false,
    wellLabelOptions,
    centerInSlot = false,
  } = props
  const missingAndUsedTipsByLabwareId = useSelector(
    tipContentsSelectors.getMissingAndUsedTipsByLabwareId
  )
  const allWellContentsForActiveItem = useSelector(
    getAllWellContentsForActiveItem
  )
  const allHighlightedWells = useSelector(
    highlightSelectors.wellHighlightsByLabwareId
  )
  const liquidDisplayColors = useSelector(selectors.getLiquidDisplayColors)
  const wellContents = allWellContentsForActiveItem
    ? allWellContentsForActiveItem[labwareOnDeck.id]
    : null
  const selectedWells: WellGroup = Object.entries(statusByWellName ?? {})
    .filter(([, status]) => status === 'selected')
    .reduce<WellGroup>((acc, [wellName]) => {
      acc[wellName] = null
      return acc
    }, {})
  const highlightedWells = statusByWellName
    ? selectedWells
    : allHighlightedWells[labwareOnDeck.id]
  const labwareTipInfo =
    missingAndUsedTipsByLabwareId != null
      ? missingAndUsedTipsByLabwareId[labwareOnDeck.id]
      : null
  const { missingTips } = labwareTipInfo ?? {}
  const isLid = getIsLid(labwareOnDeck.def)
  const shouldCenter = isLid || centerInSlot
  const wellFill = wellContentsSelectors.wellFillFromWellContents(
    wellContents,
    liquidDisplayColors
  )

  const newWellFill = statusByWellName
    ? Object.fromEntries(
        Object.entries(wellFill).filter(
          ([wellName]) =>
            statusByWellName[wellName] !== INACCESSIBLE &&
            statusByWellName[wellName] !== SELECTED_ERROR
        )
      )
    : wellFill

  const labwareRenderComponent = (
    <LabwareRender
      definition={labwareOnDeck.def}
      positioningMode={shouldCenter ? 'passThrough' : 'offsetInSlot'}
      wellFill={newWellFill}
      handleClickWell={handleClickWell}
      {...(showHighlightedWells ? { highlightedWells } : {})}
      {...(ignoreMissingTips ? {} : { missingTips })}
      highlight={highlight}
      statusByWellName={statusByWellName}
      onMouseEnterWell={onMouseEnterWell}
      onMouseLeaveWell={onMouseLeaveWell}
      selectedTipsByIndex={selectedTipsByIndex}
      fill={fill}
      labwareStroke={borderStroke}
      wellLabelOption={wellLabelOptions}
    />
  )
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* TODO (ND, 01/06/2026): Center all labware including non-lids in the slot. Requires a larger audit of LabwareOnDeck implementation. */}
      {shouldCenter ? (
        <CenterLabwareInSlot definition={labwareOnDeck.def}>
          {labwareRenderComponent}
        </CenterLabwareInSlot>
      ) : (
        labwareRenderComponent
      )}
    </g>
  )
}
