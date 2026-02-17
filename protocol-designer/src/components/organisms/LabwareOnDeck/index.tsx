import { useSelector } from 'react-redux'

import { CenterLabwareInSlot, LabwareRender } from '@opentrons/components'
import { getIsLid } from '@opentrons/shared-data'
import * as wellContentsSelectors from '@opentrons/step-generation'

import { selectors } from '../../../labware-ingred/selectors'
import * as highlightSelectors from '../../../top-selectors/substep-highlight'
import * as tipContentsSelectors from '../../../top-selectors/tip-contents'
import { getAllWellContentsForActiveItem } from '../../../top-selectors/well-contents'

import type { CSSProperties } from 'react'
import type {
  TipType,
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
  inWellSelectionModal?: boolean
  wellLabelOptions?: WellLabelOption
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
    inWellSelectionModal = false,
    wellLabelOptions,
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
  const highlightedWells = allHighlightedWells[labwareOnDeck.id]
  const labwareTipInfo =
    missingAndUsedTipsByLabwareId != null
      ? missingAndUsedTipsByLabwareId[labwareOnDeck.id]
      : null
  const { missingTips } = labwareTipInfo ?? {}
  const isLid = getIsLid(labwareOnDeck.def)
  const wellFill = inWellSelectionModal
    ? undefined
    : wellContentsSelectors.wellFillFromWellContents(
        wellContents,
        liquidDisplayColors
      )
  const labwareRenderComponent = (
    <LabwareRender
      definition={labwareOnDeck.def}
      positioningMode="offsetInSlot"
      wellFill={wellFill}
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
      {isLid ? (
        <CenterLabwareInSlot definition={labwareOnDeck.def}>
          {labwareRenderComponent}
        </CenterLabwareInSlot>
      ) : (
        labwareRenderComponent
      )}
    </g>
  )
}
