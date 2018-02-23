// @flow
import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'

import {TitleBar} from '@opentrons/components'

import {selectors as labwareIngredSelectors} from '../labware-ingred/reducers'
import {selectors as steplistSelectors} from '../steplist/reducers'
import {closeIngredientSelector} from '../labware-ingred/actions'

import {selectors, type Page} from '../navigation'
import type {BaseState} from '../types'

type Props = React.ElementProps<typeof TitleBar>

type DispatchProps = {
    onBackClick: $PropertyType<Props, 'onBackClick'>
}

type StateProps = $Diff<Props, DispatchProps>

function mapStateToProps (state: BaseState): BaseState {
  return state
}

function mapDispatchToProps (dispatch: Dispatch<*>) {
  return {dispatch}
}

function getStateProps (state: BaseState): StateProps {
  const page: Page = selectors.currentPage(state) // TODO why is this type cast necessary to exclude 'string'?
  // TODO Ian 2018-02-22 fileName & stepName
  const fileName = 'Protocol Name'

  const selectedStep = steplistSelectors.selectedStep(state)
  const stepName = selectedStep && selectedStep.title

  if (page === 'file') {
    return {
      title: fileName,
      subtitle: 'FILE DETAILS'
    }
  }

  if (page === 'steplist') {
    return {
      title: fileName,
      subtitle: (
        <span>
          {/* TODO Ian 2018-02-22 add in icon, you need to make it inline and of the correct height */}
          {/* <Icon name='pause' /> */}
          {stepName}
        </span>
      )
    }
  }

  if (page === 'ingredient-detail') {
    const labware = labwareIngredSelectors.selectedContainer(state)
    return {
      title: labware && labware.name,
      subtitle: labware && labware.type,
      backButtonLabel: 'Deck'
    }
  }

  return {title: '???'}
}

function mergeProps (state, dispatchObj: {dispatch: Dispatch<*>}): Props {
  const stateProps = getStateProps(state)
  const page = selectors.currentPage(state)
  const {dispatch} = dispatchObj

  let onBackClick

  if (page === 'ingredient-detail') {
    onBackClick = () => dispatch(closeIngredientSelector())
  }

  if (page === 'well-selection-modal') {
    onBackClick = () => console.warn('TODO: leave well selection modal') // TODO LATER Ian 2018-02-22
  }

  return {
    ...stateProps,
    onBackClick
  }
}

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(TitleBar)
