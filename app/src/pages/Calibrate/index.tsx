// calibrate page routes
import * as React from 'react'
import { connect } from 'react-redux'
import { useRouteMatch, Switch, Route, Redirect } from 'react-router-dom'

import type { State } from '../../redux/types'
import type {
  Pipette,
  Labware,
  NextTiprackPipetteInfo,
  SessionModule,
} from '../../redux/robot'

import { getConnectedRobot } from '../../redux/discovery'

import { selectors as robotSelectors } from '../../redux/robot'
import { getUncalibratedTipracksByMount } from '../../redux/pipettes/selectors'
import { Pipettes as CalibratePipettes } from './Pipettes'
import { Labware as CalibrateLabware } from './Labware'
import { Modules as ConnectModules } from './Modules'

interface SP {
  nextPipette: Pipette | null
  labware: Labware[]
  nextLabware: Labware | null | undefined
  isTipsProbed: boolean
  nextPipetteTiprack: NextTiprackPipetteInfo | null
  modules: SessionModule[]
}

type Props = SP

export const Calibrate = connect(mapStateToProps)(CalibrateComponent)

function CalibrateComponent(props: Props): JSX.Element {
  const { path } = useRouteMatch()

  return (
    <Switch>
      <Redirect exact from={path} to={getRedirectUrl(props)} />
      <Route
        path={`${path}/pipettes/:mount?/:definitionHash?`}
        component={CalibratePipettes}
      />
      <Route path={`${path}/labware/:slot`} component={CalibrateLabware} />
      <Route path={`${path}/modules`} component={ConnectModules} />
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
    modules: robotSelectors.getModules(state),
  }
}

function getRedirectUrl(props: Props): string {
  const { labware, nextLabware, nextPipetteTiprack, modules } = props

  if (nextPipetteTiprack && nextPipetteTiprack.tiprack.definitionHash) {
    return `/calibrate/pipettes/${nextPipetteTiprack.mount}/${nextPipetteTiprack.tiprack.definitionHash}`
  }

  if (modules.length) {
    return `calibrate/modules`
  }
  if (nextLabware) return `/calibrate/labware/${nextLabware.slot}`
  if (labware[0]) return `/calibrate/labware/${labware[0].slot}`

  return '/calibrate/pipettes'
}
