// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {selectors} from '../navigation'

import ConnectedStepList from './ConnectedStepList'
import IngredientsList from './IngredientsList'

import type {BaseState} from '../types'
import type {Page} from '../navigation'

type Props = {
  page: Page
}

function Sidebar (props: Props) {
  switch (props.page) {
    case 'steplist':
      return <ConnectedStepList />
    case 'ingredient-detail':
      return <IngredientsList />
    case 'file':
      return <div>TODO: File Sidebar</div>
  }
  return null
}

function mapStateToProps (state: BaseState): Props {
  const page = selectors.currentPage(state)

  return {
    page
  }
}

export default connect(mapStateToProps)(Sidebar)
