// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import type {Dispatch} from 'redux'
import mapValues from 'lodash/mapValues'

import SelectablePlate from '../components/SelectablePlate.js'

import {getCollidingWells} from '../utils'
import {getWellSetForMultichannel} from '../well-selection/utils'
import {END_STEP} from '../steplist/types'
import {selectors} from '../labware-ingred/reducers'
import {selectors as steplistSelectors, utils as steplistUtils} from '../steplist'
import * as highlightSelectors from '../top-selectors/substep-highlight'
import * as wellContentsSelectors from '../top-selectors/well-contents'

import {
  highlightWells,
  selectWells,
  deselectWells
} from '../well-selection/actions'
import wellSelectionSelectors from '../well-selection/selectors'

import {SELECTABLE_WELL_CLASS} from '../constants'
import type {GenericRect} from '../collision-types'

import type {WellContents, Wells} from '../labware-ingred/types'
import type {BaseState} from '../types'

type Props = React.ElementProps<typeof SelectablePlate>

type OP = {
  containerId?: string,
  pipetteChannels?: $PropertyType<Props, 'pipetteChannels'>,
  selectable?: $PropertyType<Props, 'selectable'>,
  cssFillParent?: boolean
}

type DP = {
  dispatch: Dispatch<*>
}

type MP = {
  onSelectionMove: $PropertyType<Props, 'onSelectionMove'>,
  onSelectionDone: $PropertyType<Props, 'onSelectionDone'>,
  handleMouseOverWell: $PropertyType<Props, 'handleMouseOverWell'>,
  handleMouseExitWell: $PropertyType<Props, 'handleMouseExitWell'>
}

type SP = $Diff<Props, MP>

function mapStateToProps (state: BaseState, ownProps: OP): SP {
  const selectedContainerId = selectors.getSelectedContainerId(state)
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
  const orderedSteps = steplistSelectors.orderedSteps(state)
  const allWellContentsForSteps = wellContentsSelectors.allWellContentsForSteps(state)

  const wellSelectionMode = true
  const wellSelectionModeForLabware = wellSelectionMode && selectedContainerId === containerId

  const prevStepId = steplistUtils.getPrevStepId(orderedSteps, stepId)

  let wellContents = {}
  if (steplistUtils.isDeckSetupId(stepId)) {
    // selection for deck setup: shows initial state of liquids
    wellContents = wellContentsSelectors.wellContentsAllLabware(state)[containerId]
  } else {
    // well contents for step, not inital state.
    // shows liquids the current step in timeline
    const wellContentsWithoutHighlight = (stepId === END_STEP || !allWellContentsForSteps[prevStepId])
      // End step, or erroring step: show last valid well contents in timeline
      ? wellContentsSelectors.lastValidWellContents(state)[containerId]
      // Valid non-end step
      : allWellContentsForSteps[prevStepId][containerId]

    let highlightedWells = {}
    const selectedWells = wellSelectionSelectors.getSelectedWells(state)

    if (wellSelectionModeForLabware) {
      // wells are highlighted for well selection hover
      highlightedWells = wellSelectionSelectors.getHighlightedWells(state)
    } else {
      // wells are highlighted for steps / substep hover

      // TODO Ian 2018-05-02: Should wellHighlightsForSteps return well highlights
      // even when prev step isn't processed (due to encountering an upstream error
      // in the timeline reduce op)
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

function mergeProps (stateProps: SP, dispatchProps: DP, ownProps: OP): Props {
  const {dispatch} = dispatchProps
  const {pipetteChannels} = ownProps

  const _wellsFromSelected = (selectedWells: Wells): Wells => {
    // Returns PRIMARY WELLS from the selection.
    if (pipetteChannels === 8) {
      // for the wells that have been highlighted,
      // get all 8-well well sets and merge them
      const primaryWells: Wells = Object.keys(selectedWells).reduce((acc: Wells, well: string): Wells => {
        const wellSet = getWellSetForMultichannel(stateProps.containerType, well)
        if (!wellSet) {
          return acc
        }

        const primaryWell = wellSet[0]

        return {
          ...acc,
          [primaryWell]: primaryWell
        }
      },
      {})

      return primaryWells
    }

    // single-channel or ingred selection mode
    return selectedWells
  }

  const _getWellsFromRect = (rect: GenericRect): * => {
    const selectedWells = getCollidingWells(rect, SELECTABLE_WELL_CLASS)
    return _wellsFromSelected(selectedWells)
  }

  return {
    ...stateProps,
    ...ownProps,

    onSelectionMove: (e, rect) => {
      const wells = _getWellsFromRect(rect)
      if (!e.shiftKey) {
        dispatch(highlightWells(wells))
      }
    },

    onSelectionDone: (e, rect) => {
      const wells = _getWellsFromRect(rect)
      if (e.shiftKey) {
        dispatch(deselectWells(wells))
      } else {
        dispatch(selectWells(wells))
      }
    },

    handleMouseOverWell: (well: string) => (e: SyntheticMouseEvent<*>) => {
      if (!e.shiftKey) {
        const hoveredWell = {[well]: well}
        dispatch(highlightWells(_wellsFromSelected(hoveredWell)))
      }
    },
    handleMouseExitWell: () => dispatch(
      highlightWells(_wellsFromSelected({})) // TODO more convenient way to de-highlight
    )
  }
}

export default connect(mapStateToProps, null, mergeProps)(SelectablePlate)
