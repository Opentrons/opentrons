import * as React from 'react'
import { connect } from 'react-redux'
import { LabwareRender, WellGroup } from '@opentrons/components'

import * as wellContentsSelectors from '../../top-selectors/well-contents'
import * as highlightSelectors from '../../top-selectors/substep-highlight'
import * as tipContentsSelectors from '../../top-selectors/tip-contents'
import { LabwareOnDeck as LabwareOnDeckType } from '../../step-forms'
import { ContentsByWell } from '../../labware-ingred/types'
import { BaseState } from '../../types'
import { wellFillFromWellContents } from '../labware/utils'

interface OP {
  className?: string
  labwareOnDeck: LabwareOnDeckType
  x: number
  y: number
}

interface SP {
  wellContents: ContentsByWell
  missingTips?: WellGroup | null
  highlightedWells?: WellGroup | null
}

type Props = OP & SP

const LabwareOnDeckComponent = (props: Props): JSX.Element => (
  <g
    transform={`translate(${props.x}, ${props.y})`}
    className={props.className}
  >
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

  const missingTipsByLabwareId = tipContentsSelectors.getMissingTipsByLabwareId(
    state
  )

  const allWellContentsForActiveItem = wellContentsSelectors.getAllWellContentsForActiveItem(
    state
  )

  return {
    wellContents: allWellContentsForActiveItem
      ? allWellContentsForActiveItem[labwareOnDeck.id]
      : null,
    highlightedWells: highlightSelectors.wellHighlightsByLabwareId(state)[
      labwareOnDeck.id
    ],
    missingTips: missingTipsByLabwareId
      ? missingTipsByLabwareId[labwareOnDeck.id]
      : null,
  }
}

export const LabwareOnDeck = connect(mapStateToProps)(LabwareOnDeckComponent)
