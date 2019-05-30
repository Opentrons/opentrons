// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { LabwareRender } from '@opentrons/components'

import * as wellContentsSelectors from '../../top-selectors/well-contents'
import * as highlightSelectors from '../../top-selectors/substep-highlight'
import * as tipContentsSelectors from '../../top-selectors/tip-contents'
import { selectors as stepsSelectors } from '../../ui/steps'
import { type LabwareOnDeck as LabwareOnDeckType } from '../../step-forms'
import type { ContentsByWell } from '../../labware-ingred/types'
import type { BaseState } from '../../types'
import { HighlightedBorder } from './LabwareOverlays'
import { wellFillFromWellContents } from '../labware/utils'

type OP = {|
  labwareOnDeck: LabwareOnDeckType,
  x: number,
  y: number,
|}

type SP = {|
  wellContents: ContentsByWell,
  highlighted: boolean,
  highlightedWells: { [string]: null },
|}

type Props = {| ...OP, ...SP |}

const LabwareOnDeck = (props: Props) => (
  <g transform={`translate(${props.x}, ${props.y})`}>
    {props.highlighted && (
      <HighlightedBorder definition={props.labwareOnDeck.def} />
    )}
    <LabwareRender
      definition={props.labwareOnDeck.def}
      wellFill={wellFillFromWellContents(props.wellContents)}
      highlightedWells={props.highlightedWells}
      missingTips={props.missingTips}
    />
  </g>
)

const mapStateToProps = (state: BaseState, ownProps: OP): SP => {
  const { labwareOnDeck } = ownProps

  return {
    wellContents: wellContentsSelectors.getAllWellContentsForActiveItem(state)[
      labwareOnDeck.id
    ],
    highlightedWells: highlightSelectors.wellHighlightsByLabwareId(state)[
      labwareOnDeck.id
    ],
    missingTips: tipContentsSelectors.getMissingTipsByLabwareId(state)[
      labwareOnDeck.id
    ],
    highlighted: stepsSelectors
      .getHoveredStepLabware(state)
      .includes(labwareOnDeck.id),
  }
}

export default connect<Props, OP, SP, _, _, _>(mapStateToProps)(LabwareOnDeck)
