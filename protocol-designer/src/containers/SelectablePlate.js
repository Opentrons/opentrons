// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import type {Dispatch} from 'redux'
import mapValues from 'lodash/mapValues'
import SelectablePlate from '../components/SelectablePlate.js'
import {selectors} from '../labware-ingred/reducers'
import {selectors as steplistSelectors} from '../steplist/reducers'
import * as highlightSelectors from '../top-selectors/substep-highlight'
import * as wellContentsSelectors from '../top-selectors/well-contents'
import {preselectWells, selectWells} from '../labware-ingred/actions'

import {END_STEP} from '../steplist/types'

import type {WellContents} from '../labware-ingred/types'
import type {BaseState} from '../types'

type OwnProps = {
  containerId?: string,
  selectable?: boolean,
  cssFillParent?: boolean
}

type Props = React.ElementProps<typeof SelectablePlate>

type DispatchProps = {
  onSelectionMove: $PropertyType<Props, 'onSelectionMove'>,
  onSelectionDone: $PropertyType<Props, 'onSelectionDone'>
}

type StateProps = $Diff<Props, DispatchProps>

function mapStateToProps (state: BaseState, ownProps: OwnProps): StateProps {
  const selectedContainer = selectors.selectedContainer(state)
  const selectedContainerId = selectedContainer && selectedContainer.containerId
  const containerId = ownProps.containerId || selectedContainerId

  if (containerId === null) {
    console.error('SelectablePlate: No container is selected, and no containerId was given to Connected SelectablePlate')
    return {
      containerId: '',
      wellContents: {},
      containerType: '',
      selectable: ownProps.selectable
    }
  }

  const labware = selectors.getLabware(state)[containerId]
  const stepId = steplistSelectors.hoveredOrSelectedStepId(state)
  const allWellContentsForSteps = wellContentsSelectors.allWellContentsForSteps(state)

  const deckSetupMode = steplistSelectors.deckSetupMode(state)
  // TODO
  const wellSelectionMode = true
  const wellSelectionModeForContainer = wellSelectionMode && selectedContainerId === containerId

  let prevStepId: number = 0 // initial liquid state if stepId is null
  if (stepId === END_STEP) {
    // last liquid state
    prevStepId = allWellContentsForSteps.length - 1
  }
  if (typeof stepId === 'number') {
    prevStepId = Math.max(stepId - 1, 0)
  }

  const highlightedWells = deckSetupMode ? {} : highlightSelectors.wellHighlightsForSteps(state)[prevStepId]

  let wellContents = {}
  if (deckSetupMode || wellSelectionModeForContainer) {
    // selection for deck setup
    wellContents = wellContentsSelectors.wellContentsAllLabware(state)[containerId]
  } else {
    // well contents for step, not deck setup mode
    const wellContentsWithoutHighlight = (allWellContentsForSteps[prevStepId])
      ? allWellContentsForSteps[prevStepId][containerId]
      : {}
    // TODO Ian 2018-04-11 separate out selected/highlighted state from wellContents props of Plate,
    // so you don't have to do this merge
    wellContents = mapValues(
      wellContentsWithoutHighlight,
      (wellContents: WellContents, well: string) => ({
        ...wellContents,
        selected: highlightedWells && highlightedWells[containerId] && highlightedWells[containerId][well]
      })
    )
  }

  return {
    containerId,
    wellContents,
    containerType: labware.type,
    selectable: ownProps.selectable
  }
}

function mapDispatchToProps (dispatch: Dispatch<*>): DispatchProps {
  return {
    onSelectionMove: (e, rect) => dispatch(preselectWells(e, rect)),
    onSelectionDone: (e, rect) => dispatch(selectWells(e, rect))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(SelectablePlate)
