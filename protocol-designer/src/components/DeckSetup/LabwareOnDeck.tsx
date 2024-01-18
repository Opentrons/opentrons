import * as React from 'react'
import { useSelector } from 'react-redux'
import { LabwareRender } from '@opentrons/components'

import { selectors } from '../../labware-ingred/selectors'
import * as wellContentsSelectors from '../../top-selectors/well-contents'
import * as highlightSelectors from '../../top-selectors/substep-highlight'
import * as tipContentsSelectors from '../../top-selectors/tip-contents'
import { LabwareOnDeck as LabwareOnDeckType } from '../../step-forms'
import { wellFillFromWellContents } from '../labware/utils'

interface Props {
  className?: string
  labwareOnDeck: LabwareOnDeckType
  x: number
  y: number
}

export const LabwareOnDeck = (props: Props): JSX.Element => {
  const { labwareOnDeck, x, y, className } = props
  const missingTipsByLabwareId = useSelector(
    tipContentsSelectors.getMissingTipsByLabwareId
  )
  const allWellContentsForActiveItem = useSelector(
    wellContentsSelectors.getAllWellContentsForActiveItem
  )
  const allHighlightedWells = useSelector(
    highlightSelectors.wellHighlightsByLabwareId
  )
  const liquidDisplayColors = useSelector(selectors.getLiquidDisplayColors)
  const wellContents = allWellContentsForActiveItem
    ? allWellContentsForActiveItem[labwareOnDeck.id]
    : null
  const highlightedWells = allHighlightedWells[labwareOnDeck.id]
  const missingTips = missingTipsByLabwareId
    ? missingTipsByLabwareId[labwareOnDeck.id]
    : null
  return (
    <g transform={`translate(${x}, ${y})`} className={className}>
      <LabwareRender
        definition={labwareOnDeck.def}
        wellFill={wellFillFromWellContents(wellContents, liquidDisplayColors)}
        highlightedWells={highlightedWells}
        missingTips={missingTips}
      />
    </g>
  )
}
