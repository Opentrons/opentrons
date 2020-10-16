// @flow
// calibrate page routes
import * as React from 'react'
import { connect } from 'react-redux'
import { useRouteMatch, Switch, Route, Redirect } from 'react-router-dom'

import type { State, Dispatch } from '../../types'
import type { Pipette, Labware, NextTiprackPipetteInfo } from '../../robot'

import { getConnectedRobot } from '../../discovery'

import { selectors as robotSelectors } from '../../robot'
import { getUncalibratedTipracksByMount } from '../../pipettes/selectors'
import { Pipettes as CalibratePipettes } from './Pipettes'
import { Labware as CalibrateLabware } from './Labware'

type OP = {||}

type SP = {|
  nextPipette: Pipette | null,
  labware: Array<Labware>,
  nextLabware: Labware | void,
  isTipsProbed: boolean,
  nextPipetteTiprack: NextTiprackPipetteInfo | null,
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
      <Route
        path={`${path}/pipettes/:mount?/:definitionHash?`}
        component={CalibratePipettes}
      />
      <Route path={`${path}/labware/:slot`} component={CalibrateLabware} />
    </Switch>
  )
}

function mapStateToProps(state: State): SP {
  const robotName = getConnectedRobot(state)?.name
  return {
    nextPipette: robotSelectors.getNextPipette(state),
    labware: robotSelectors.getNotTipracks(state),
    nextLabware: robotSelectors.getNextLabware(state),
    isTipsProbed: robotSelectors.getPipettesCalibrated(state),
    nextPipetteTiprack: robotName
      ? robotSelectors.getNextTiprackPipette(
          getUncalibratedTipracksByMount(state, robotName)
        )
      : null,
  }
}

function getRedirectUrl(props: Props): string {
  const { labware, nextLabware, nextPipetteTiprack } = props

  if (nextPipetteTiprack && nextPipetteTiprack.tiprack.definitionHash) {
    return `/calibrate/pipettes/${nextPipetteTiprack.mount}/${nextPipetteTiprack.tiprack.definitionHash}`
  }

  if (nextLabware) return `/calibrate/labware/${nextLabware.slot}`
  if (labware[0]) return `/calibrate/labware/${labware[0].slot}`

  return '/calibrate/pipettes'
}
