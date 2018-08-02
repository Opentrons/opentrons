// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import type {Dispatch} from 'redux'
import mapValues from 'lodash/mapValues'

import SelectablePlate from '../components/SelectablePlate.js'

import {getCollidingWells} from '../utils'
import {getWellSetForMultichannel} from '../well-selection/utils'
import {selectors} from '../labware-ingred/reducers'
import {
  selectors as steplistSelectors,
  START_TERMINAL_ITEM_ID,
  END_TERMINAL_ITEM_ID
} from '../steplist'
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

import type {WellContents, Wells, ContentsByWell} from '../labware-ingred/types'
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
  const allWellContentsForSteps = wellContentsSelectors.allWellContentsForSteps(state)
  const wellSelectionModeForLabware = selectedContainerId === containerId
  let wellContents: ContentsByWell = {}

  const activeItem = steplistSelectors.getActiveItem(state)
  if (
    !activeItem.isStep && activeItem.id === START_TERMINAL_ITEM_ID
  ) {
    // selection for deck setup: shows initial state of liquids
    wellContents = wellContentsSelectors.wellContentsAllLabware(state)[containerId]
  } else if (
    !activeItem.isStep && activeItem.id === END_TERMINAL_ITEM_ID
  ) {
    // "end" terminal
    wellContents = wellContentsSelectors.lastValidWellContents(state)[containerId]
  } else if (!activeItem.isStep) {
    console.warn(`SelectablePlate got unhandled terminal id: "${activeItem.id}"`)
  } else {
    const stepId = activeItem.id
    // TODO: Ian 2018-07-31 replace with util function, "findIndexOrNull"?
    const orderedSteps = steplistSelectors.orderedSteps(state)
    const timelineIdx = orderedSteps.includes(stepId)
      ? orderedSteps.findIndex(id => id === stepId)
      : null

    // shows liquids the current step in timeline
    const selectedWells = wellSelectionSelectors.getSelectedWells(state)
    let wellContentsWithoutHighlight = null
    let highlightedWells

    if ((timelineIdx != null)) {
      wellContentsWithoutHighlight = (allWellContentsForSteps[timelineIdx])
        // Valid non-end step
        ? allWellContentsForSteps[timelineIdx][containerId]
        // Erroring step: show last valid well contents in timeline
        : wellContentsSelectors.lastValidWellContents(state)[containerId]
    }

    if (wellSelectionModeForLabware) {
      // we're in the well selection modal, highlight hovered/selected wells
      highlightedWells = wellSelectionSelectors.getHighlightedWells(state)
    } else {
      // wells are highlighted for steps / substep hover

      // TODO Ian 2018-05-02: Should wellHighlightsForSteps return well highlights
      // even when prev step isn't processed (due to encountering an upstream error
      // in the timeline reduce op)
      const highlightedWellsForSteps = highlightSelectors.wellHighlightsForSteps(state)
      highlightedWells = (
        timelineIdx != null &&
        highlightedWellsForSteps &&
        highlightedWellsForSteps[timelineIdx] &&
        highlightedWellsForSteps[timelineIdx][containerId]
      ) || {}
    }

    // TODO: Ian 2018-07-31 some sets of wells are {[wellName]: true},
    // others {[wellName]: wellName}. Use Set instead!
    wellContents = (mapValues(
      wellContentsWithoutHighlight,
      (wellContentsForWell: WellContents, well: string): WellContents => ({
        ...wellContentsForWell,
        highlighted: Boolean(highlightedWells[well]),
        selected: Boolean(selectedWells[well])
      })
    ): ContentsByWell)
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
