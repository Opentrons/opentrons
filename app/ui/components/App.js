import React from 'react'
import {Route} from 'react-router'

import Nav from '../containers/Nav'
import ConnectedRunControl from '../containers/ConnectedRunControl'

import grid from './Grid.css'

export default function App () {
  return (
    <div className={grid.wrapper}>
      <Nav />
      <div className={grid.task}>
        <Route path='/run' component={ConnectedRunControl} />
      </div>
    </div>
  )
}
