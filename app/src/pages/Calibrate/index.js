// @flow
// calibrate page routes
import * as React from 'react'
import { connect } from 'react-redux'
import { useRouteMatch, Switch, Route, Redirect } from 'react-router-dom'

import type { State, Dispatch } from '../../types'
import type { Pipette, Labware } from '../../robot'

import { selectors as robotSelectors } from '../../robot'
import { Pipettes as CalibratePipettes } from './Pipettes'
import { Labware as CalibrateLabware } from './Labware'

type OP = {||}

type SP = {|
  nextPipette: Pipette | null,
  labware: Array<Labware>,
  nextLabware: Labware | void,
  isTipsProbed: boolean,
|}

type Props = {| ...OP, ...SP, dispatch: Dispatch |}

export const Calibrate: React.AbstractComponent<OP> = connect<
  Props,
  OP,
  SP,
  _,
  _,
  _
>(mapStateToProps)(CalibrateComponent)

function CalibrateComponent(props: Props) {
  const { path } = useRouteMatch()

  return (
    <Switch>
      <Redirect exact from={path} to={getRedirectUrl(props)} />
      <Route path={`${path}/pipettes/:mount?`} component={CalibratePipettes} />
      <Route path={`${path}/labware/:slot`} component={CalibrateLabware} />
    </Switch>
  )
}

function mapStateToProps(state: State): SP {
  return {
    nextPipette: robotSelectors.getNextPipette(state),
    labware: robotSelectors.getNotTipracks(state),
    nextLabware: robotSelectors.getNextLabware(state),
    isTipsProbed: robotSelectors.getPipettesCalibrated(state),
  }
}

function getRedirectUrl(props: Props): string {
  const { nextPipette, labware, nextLabware, isTipsProbed } = props

  if (!isTipsProbed && nextPipette) {
    return `/calibrate/pipettes/${nextPipette.mount}`
  }
  if (nextLabware) return `/calibrate/labware/${nextLabware.slot}`
  if (labware[0]) return `/calibrate/labware/${labware[0].slot}`

  return '/calibrate/pipettes'
}
