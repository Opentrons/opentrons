// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import type {BaseState} from '../types'

import ConnectedStepList from './ConnectedStepList'
import IngredientsList from './IngredientsList'

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
  return {
    sidebar: 'ingredientslist' // TODO IMMEDIATELY Ian 2018-02-21 connect to state
  }
}

export default connect(mapStateToProps)(Sidebar)
