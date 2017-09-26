import React from 'react'
import {Switch, Route} from 'react-router'

import Nav from '../containers/Nav'

import Run from '../pages/Run'
import SetupInstruments from '../pages/SetupInstruments'
import SetupDeck from '../pages/SetupDeck'

import grid from './Grid.css'

export default function App () {
  return (
    <div className={grid.wrapper}>
      <Nav />
      <Switch>
        <Route path='/run' component={Run} />
        <Route path='/setup-instruments/:side?' component={SetupInstruments} />
        <Route path='/setup-deck' component={SetupDeck} />
      </Switch>
    </div>
  )
}
