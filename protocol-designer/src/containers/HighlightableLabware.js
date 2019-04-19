// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import mapValues from 'lodash/mapValues'
import noop from 'lodash/noop'

import HighlightableLabware from '../components/HighlightableLabware'

import { selectors } from '../labware-ingred/selectors'
import { START_TERMINAL_ITEM_ID, END_TERMINAL_ITEM_ID } from '../steplist'
import { selectors as stepFormSelectors } from '../step-forms'
import { selectors as stepsSelectors } from '../ui/steps'
import * as highlightSelectors from '../top-selectors/substep-highlight'
import * as wellContentsSelectors from '../top-selectors/well-contents'
import * as tipContentsSelectors from '../top-selectors/tip-contents'
import wellSelectionSelectors from '../well-selection/selectors'

import type { WellContents, ContentsByWell } from '../labware-ingred/types'
import type { BaseState } from '../types'

type Props = React.ElementProps<typeof HighlightableLabware>

type OP = {
  containerId?: string,
}

type SP = $Diff<$Exact<Props>, OP>

function mapStateToProps(state: BaseState, ownProps: OP): SP {
  const selectedContainerId = selectors.getSelectedLabwareId(state)
  const containerId = ownProps.containerId || selectedContainerId

  if (containerId == null) {
    console.error(
      'HighlightableLabware: No container is selected, and no containerId was given to Connected HighlightableLabware'
    )
    return {
      containerId: '',
      wellContents: {},
      containerType: '',
    }
  }

  const labwareType = stepFormSelectors.getLabwareTypesById(state)[containerId]
  const allWellContentsForSteps = wellContentsSelectors.getAllWellContentsForSteps(
    state
  )
  const wellSelectionModeForLabware = selectedContainerId === containerId
  let wellContents: ContentsByWell = {}

  const activeItem = stepsSelectors.getActiveItem(state)
  if (!activeItem.isStep && activeItem.id === START_TERMINAL_ITEM_ID) {
    // selection for deck setup: shows initial state of liquids
    wellContents = wellContentsSelectors.getWellContentsAllLabware(state)[
      containerId
    ]
  } else if (!activeItem.isStep && activeItem.id === END_TERMINAL_ITEM_ID) {
    // "end" terminal
    wellContents = wellContentsSelectors.getLastValidWellContents(state)[
      containerId
    ]
  } else if (!activeItem.isStep) {
    console.warn(
      `HighlightableLabware got unhandled terminal id: "${activeItem.id}"`
    )
  } else {
    const stepId = activeItem.id
    // TODO: Ian 2018-07-31 replace with util function, "findIndexOrNull"?
    const orderedStepIds = stepFormSelectors.getOrderedStepIds(state)
    const timelineIdx = orderedStepIds.includes(stepId)
      ? orderedStepIds.findIndex(id => id === stepId)
      : null

    // shows liquids the current step in timeline
    const selectedWells = wellSelectionSelectors.getSelectedWells(state)
    let wellContentsWithoutHighlight = null
    let highlightedWells

    if (timelineIdx != null) {
      wellContentsWithoutHighlight = allWellContentsForSteps[timelineIdx]
        ? // Valid non-end step
          allWellContentsForSteps[timelineIdx][containerId]
        : // Erroring step: show last valid well contents in timeline
          wellContentsSelectors.getLastValidWellContents(state)[containerId]
    }

    if (wellSelectionModeForLabware) {
      // we're in the well selection modal, highlight hovered/selected wells
      highlightedWells = wellSelectionSelectors.getHighlightedWells(state)
    } else {
      // wells are highlighted for steps / substep hover

      // TODO Ian 2018-05-02: Should wellHighlightsForSteps return well highlights
      // even when prev step isn't processed (due to encountering an upstream error
      // in the timeline reduce op)
      const highlightedWellsByLabware = highlightSelectors.wellHighlightsByLabwareId(
        state
      )
      highlightedWells = highlightedWellsByLabware[containerId] || {}
    }

    // TODO: Ian 2018-07-31 some sets of wells are {[wellName]: true},
    // others {[wellName]: wellName}. Use Set instead!
    // TODO: Ian 2018-08-16 pass getWellProps instead of wellContents,
    // and make getWellProps a plain old selector (move that logic out of this STP)
    wellContents = (mapValues(
      wellContentsWithoutHighlight,
      (wellContentsForWell: WellContents, well: string): WellContents => ({
        ...wellContentsForWell,
        highlighted: Boolean(highlightedWells[well]),
        selected: Boolean(selectedWells[well]),
      })
    ): ContentsByWell)
  }

  const getTipProps = tipContentsSelectors.getTipsForCurrentStep(state, {
    labwareId: containerId,
  })

  return {
    wellContents,
    getTipProps: getTipProps || noop,
    containerType: labwareType || 'missing labware',
  }
}

export default connect<Props, OP, SP, _, _, _>(mapStateToProps)(
  HighlightableLabware
)
