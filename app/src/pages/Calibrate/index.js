// @flow
// calibrate page routes
import * as React from 'react'
import {connect} from 'react-redux'
import {Switch, Route, Redirect, type Match} from 'react-router'

import type {State} from '../../types'
import type {Instrument, Labware} from '../../robot'

import {selectors as robotSelectors} from '../../robot'
import CalibratePipettes from './Pipettes'
import CalibrateLabware from './Labware'

type SP = {
  nextInstrument: Instrument,
  labware: Array<Labware>,
  nextLabware: Labware,
  isTipsProbed: boolean
}

type Props = SP & {
  match: Match
}

export default connect(mapStateToProps)(Calibrate)

function Calibrate (props: Props) {
  const {match: {path}} = props

  return (
    <Switch>
      <Redirect exact from={path} to={getRedirectUrl(props)} />
      <Route
        path={`${path}/pipettes/:mount?`}
        component={CalibratePipettes}
      />
      <Route
        path={`${path}/labware/:slot`}
        component={CalibrateLabware}
      />
    </Switch>
  )
}

function mapStateToProps (state: State): SP {
  return {
    nextInstrument: robotSelectors.getNextInstrument(state),
    labware: robotSelectors.getNotTipracks(state),
    nextLabware: robotSelectors.getNextLabware(state),
    isTipsProbed: robotSelectors.getInstrumentsCalibrated(state)
  }
}

function getRedirectUrl (props: Props) {
  const {
    nextInstrument,
    labware,
    nextLabware,
    isTipsProbed
  } = props

  if (!isTipsProbed && nextInstrument) {
    return `/calibrate/pipettes/${nextInstrument.mount}`
  }
  if (nextLabware) return `/calibrate/labware/${nextLabware.slot}`
  if (labware[0]) return `/calibrate/labware/${labware[0].slot}`

  return '/calibrate/pipettes'
}
