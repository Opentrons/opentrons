import { useSelector } from 'react-redux'

import { LabwareRender } from '@opentrons/components'
import * as wellContentsSelectors from '@opentrons/step-generation'

import { selectors } from '../../../labware-ingred/selectors'
import * as highlightSelectors from '../../../top-selectors/substep-highlight'
import * as tipContentsSelectors from '../../../top-selectors/tip-contents'
import { getAllWellContentsForActiveItem } from '../../../top-selectors/well-contents'

import type { TipType } from '@opentrons/components'
import type { LabwareOnDeck as LabwareOnDeckType } from '/protocol-designer/step-forms'

interface LabwareOnDeckProps {
  labwareOnDeck: LabwareOnDeckType
  x: number
  y: number
  highlight?: boolean
  showHighlightedWells?: boolean
  handleClickWell?: (wellName: string) => void
  tipStatusByWellName?: Record<string, TipType>
  selectedTips?: string[]
  onMouseEnterWell?: (wellName: string) => void
  onMouseLeaveWell?: () => void
}

export function LabwareOnDeck(props: LabwareOnDeckProps): JSX.Element {
  const {
    labwareOnDeck,
    x,
    y,
    highlight = false,
    showHighlightedWells = true,
    tipStatusByWellName,
    handleClickWell,
    selectedTips,
    onMouseEnterWell,
    onMouseLeaveWell,
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

  return (
    <g transform={`translate(${x}, ${y})`}>
      <LabwareRender
        definition={labwareOnDeck.def}
        positioningMode="offsetInSlot"
        wellFill={wellContentsSelectors.wellFillFromWellContents(
          wellContents,
          liquidDisplayColors
        )}
        handleClickWell={handleClickWell}
        {...(showHighlightedWells ? { highlightedWells } : {})}
        missingTips={missingTips}
        highlight={highlight}
        tipStatusByWellName={tipStatusByWellName}
        selectedTips={selectedTips}
        onMouseEnterWell={onMouseEnterWell}
        onMouseLeaveWell={onMouseLeaveWell}
      />
    </g>
  )
}
