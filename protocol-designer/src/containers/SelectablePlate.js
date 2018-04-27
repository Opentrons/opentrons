// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import type {Dispatch} from 'redux'
import mapValues from 'lodash/mapValues'

import SelectablePlate from '../components/SelectablePlate.js'

import {getCollidingWells} from '../utils'
import {SELECTABLE_WELL_CLASS} from '../constants'
import {END_STEP} from '../steplist/types'

import {selectors} from '../labware-ingred/reducers'
import {selectors as steplistSelectors} from '../steplist/reducers'
import * as highlightSelectors from '../top-selectors/substep-highlight'
import * as wellContentsSelectors from '../top-selectors/well-contents'

import {highlightWells, selectWells, deselectWells} from '../well-selection/actions'
import wellSelectionSelectors from '../well-selection/selectors'

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
  onSelectionDone: $PropertyType<Props, 'onSelectionDone'>,
  handleMouseOverWell: $PropertyType<Props, 'handleMouseOverWell'>,
  handleMouseExitWell: $PropertyType<Props, 'handleMouseExitWell'>
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

  const wellSelectionMode = true
  const wellSelectionModeForLabware = wellSelectionMode && selectedContainerId === containerId

  let prevStepId: number = 0 // initial liquid state if stepId is null
  if (stepId === END_STEP) {
    // last liquid state
    prevStepId = allWellContentsForSteps.length - 1
  }
  if (typeof stepId === 'number') {
    prevStepId = Math.max(stepId - 1, 0)
  }

  let wellContents = {}
  if (deckSetupMode) {
    // selection for deck setup: shows initial state of liquids
    wellContents = wellContentsSelectors.wellContentsAllLabware(state)[containerId]
  } else {
    // well contents for step, not inital state.
    // shows liquids the current step in timeline
    const wellContentsWithoutHighlight = (allWellContentsForSteps[prevStepId])
      ? allWellContentsForSteps[prevStepId][containerId]
      : {}

    let highlightedWells = {}
    const selectedWells = wellSelectionSelectors.getSelectedWells(state)

    if (wellSelectionModeForLabware) {
      // wells are highlighted for well selection hover
      highlightedWells = wellSelectionSelectors.getHighlightedWells(state)
    } else {
      // wells are highlighted for steps / substep hover
      const highlightedWellsAllLabware = highlightSelectors.wellHighlightsForSteps(state)[prevStepId]
      highlightedWells = (highlightedWellsAllLabware && highlightedWellsAllLabware[containerId]) || {}
    }

    wellContents = mapValues(
      wellContentsWithoutHighlight,
      (wellContentsForWell: WellContents, well: string) => ({
        ...wellContentsForWell,
        highlighted: highlightedWells[well],
        selected: selectedWells[well]
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
  const labwareType = 'TODO NEXT PR' // TODO Ian 2018-04-25
  const pipetteChannels = 1 // TODO Ian 2018-04-25

  return {
    onSelectionMove: (e, rect) => dispatch(highlightWells({
      wells: getCollidingWells(rect, SELECTABLE_WELL_CLASS),
      labwareType,
      pipetteChannels
    })),

    onSelectionDone: (e, rect) => {
      const wells = getCollidingWells(rect, SELECTABLE_WELL_CLASS)
      if (e.shiftKey) {
        dispatch(deselectWells({wells, labwareType, pipetteChannels}))
      } else {
        dispatch(selectWells({wells, labwareType, pipetteChannels}))
      }
    },

    handleMouseOverWell: (well: string) => () => dispatch(
      highlightWells({wells: {[well]: well}, labwareType, pipetteChannels})
    ),
    handleMouseExitWell: () => dispatch(
      highlightWells({wells: {}, labwareType, pipetteChannels})
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(SelectablePlate)
