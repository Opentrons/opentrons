// @flow
// calibrate page routes
import * as React from 'react'
import {Switch, Route, type ContextRouter} from 'react-router'

import SetupInstruments from '../pages/SetupInstruments'
import SetupDeck from '../pages/SetupDeck'

export default function Calibrate (props: ContextRouter) {
  const {match: {path}} = props

  return (
    <Switch>
      <Route
        path={`${path}/instruments/:mount?`}
        component={SetupInstruments}
      />
      <Route
        path={`${path}/labware/:slot`}
        component={SetupDeck}
      />
    </Switch>
  )
}
