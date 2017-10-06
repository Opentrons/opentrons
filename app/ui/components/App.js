import React from 'react'
import {Switch, Route} from 'react-router'
import Nav from '../containers/Nav'

import Home from '../pages/Home'
import Run from '../pages/Run'
import SetupInstruments from '../pages/SetupInstruments'
import SetupDeck from '../pages/SetupDeck'

import styles from './App.css'

export default function App () {
  return (
    <div className={styles.wrapper}>
      <Nav />
      <Switch>
        <Route exact path='/' component={Home} />
        <Route path='/run' component={Run} />
        <Route path='/setup-instruments' component={SetupInstruments} />
        <Route path='/setup-deck' component={SetupDeck} />
      </Switch>
    </div>
  )
}
