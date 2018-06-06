// @flow
import * as React from 'react'
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'

import {TitleBar, humanizeLabwareType} from '@opentrons/components'

import {selectors as labwareIngredSelectors} from '../labware-ingred/reducers'
import {selectors as steplistSelectors} from '../steplist/reducers'
import {closeIngredientSelector} from '../labware-ingred/actions'

import {selectors, type Page} from '../navigation'
import type {BaseState} from '../types'

type Props = React.ElementProps<typeof TitleBar>

type DP = { onBackClick: $PropertyType<Props, 'onBackClick'> }

type SP = $Diff<Props, DP> & {_page: Page}

function mapStateToProps (state: BaseState): SP {
  const _page = selectors.currentPage(state)
  // TODO: Ian 2018-02-22 fileName from file
  const fileName = 'Protocol Name'

  switch (_page) {
    case 'file-splash':
      return { _page, title: 'Opentrons Protocol Designer' }
    case 'file-detail':
      return {_page, title: fileName, subtitle: 'FILE DETAILS'}
    case 'ingredient-detail': {
      const labware = labwareIngredSelectors.getSelectedContainer(state)
      const labwareNames = labwareIngredSelectors.getLabwareNames(state)
      const labwareId = labware && labware.id
      return {
        _page,
        title: labwareId && labwareNames[labwareId],
        subtitle: labware && humanizeLabwareType(labware.type),
        backButtonLabel: 'Deck'
      }
    }
    case 'well-selection-modal':
      // TODO: Ian 2018-02-23 well selection modal's title bar
      return { _page, title: 'TODO: Well selection modal' }
    case 'steplist':
    default: {
      // NOTE: this default case error should never be reached, it's just a sanity check
      if (_page !== 'steplist') console.error('ConnectedTitleBar got an unsupported page, returning steplist instead')
      const selectedStep = steplistSelectors.selectedStep(state)
      // TODO: Ian 2018-02-22 add in icon, you need to make it inline and of the correct height
      // <Icon name={stepIconsByType[selectedStep]} /> */
      let subtitle
      if (selectedStep) {
        subtitle = selectedStep.stepType === 'deck-setup'
          ? `DECK SETUP - LABWARE & INGREDIENTS`
          : selectedStep.title
      }
      return { _page: 'steplist', title: fileName, subtitle }
    }
  }
}

function mergeProps (stateProps: SP, dispatchProps: {dispatch: Dispatch<*>}): Props {
  const {_page, ...props} = stateProps
  const {dispatch} = dispatchProps

  let onBackClick

  if (_page === 'ingredient-detail') {
    onBackClick = () => dispatch(closeIngredientSelector())
  }

  if (_page === 'well-selection-modal') {
    onBackClick = () => console.warn('TODO: leave well selection modal') // TODO: LATER Ian 2018-02-22
  }

  return {
    ...props,
    onBackClick
  }
}

export default connect(mapStateToProps, null, mergeProps)(TitleBar)
