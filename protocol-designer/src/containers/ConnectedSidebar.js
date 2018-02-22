// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {selectors} from '../labware-ingred/reducers'

import ConnectedStepList from './ConnectedStepList'
import IngredientsList from './IngredientsList'

import type {BaseState} from '../types'

type SidebarTypes = 'steplist' | 'ingredientslist' | 'filesidebar'

type Props = {
  sidebar: SidebarTypes
}

function Sidebar (props: Props) {
  switch (props.sidebar) {
    case 'steplist':
      return <ConnectedStepList />
    case 'ingredientslist':
      return <IngredientsList />
    case 'filesidebar':
      return <div>TODO: File Sidebar</div>
  }
  return null
}

function mapStateToProps (state: BaseState): Props {
  // TODO Ian 2018-02-22 these selectors should maybe go in navigation eventually?
  const ingredients = selectors.ingredientsForContainer(state)

  return {
    sidebar: ingredients ? 'ingredientslist' : 'steplist'
  }
}

export default connect(mapStateToProps)(Sidebar)
