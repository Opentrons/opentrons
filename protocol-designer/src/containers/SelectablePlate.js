// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import type {Dispatch} from 'redux'
import SelectablePlate from '../components/SelectablePlate.js'
import { selectors } from '../labware-ingred/reducers'
import {selectors as steplistSelectors} from '../steplist/reducers'
import {selectors as fileSelectors} from '../file-data'
import { preselectWells, selectWells } from '../labware-ingred/actions'
import type {BaseState} from '../types'
import {END_STEP} from '../steplist/types'

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
    throw new Error('SelectablePlate: No container is selected, and no containerId was given to Connected SelectablePlate')
  }

  const labware = selectors.getLabware(state)[containerId]
  const stepId = steplistSelectors.hoveredOrSelectedStepId(state)
  const allWellContentsForSteps = fileSelectors.allWellContentsForSteps(state)

  let prevStepId: number = 0 // initial liquid state if stepId is null
  if (stepId === END_STEP) {
    // last liquid state
    prevStepId = allWellContentsForSteps.length - 1
  }
  if (typeof stepId === 'number') {
    prevStepId = Math.max(stepId - 1, 0)
  }

  const wellContents = (steplistSelectors.deckSetupMode(state))
    // selection for deck setup
    ? selectors.wellContentsAllLabware(state)[containerId]
    // well contents for step, not deck setup mode
    : allWellContentsForSteps[prevStepId] ? allWellContentsForSteps[prevStepId][containerId] : {}

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
