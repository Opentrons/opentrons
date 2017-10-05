import React from 'react'
import {Switch, Route} from 'react-router'

import Nav from '../containers/Nav'

import Upload from '../pages/Upload'
import Run from '../pages/Run'
import SetupInstruments from '../pages/SetupInstruments'
import SetupDeck from '../pages/SetupDeck'

import styles from './App.css'

export default function App () {
  return (
    <div className={styles.wrapper}>
      <Nav />
      <Switch>
        <Route path='/run' component={Run} />
        <Route path='/upload' component={Upload} />
        <Route path='/setup-instruments/:side?' component={SetupInstruments} />
        <Route path='/setup-deck/:slot?' component={SetupDeck} />
      </Switch>
    </div>
  )
}
