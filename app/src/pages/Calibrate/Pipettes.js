// @flow
// setup pipettes component
import * as React from 'react'
import { connect } from 'react-redux'
import { Redirect } from 'react-router-dom'

import { selectors as robotSelectors } from '../../robot'
import { fetchPipettes, getAttachedPipettes } from '../../pipettes'
import { getConnectedRobot } from '../../discovery'

import Page from '../../components/Page'
import TipProbe from '../../components/TipProbe'
import { PipetteTabs, Pipettes } from '../../components/calibrate-pipettes'
import SessionHeader from '../../components/SessionHeader'

import type { ContextRouter } from 'react-router-dom'
import type { State, Dispatch } from '../../types'
import type { Pipette, TiprackByMountMap } from '../../robot/types'
import type { AttachedPipettesByMount } from '../../pipettes/types'
import type { Robot } from '../../discovery/types'

type OP = ContextRouter

type SP = {|
  pipettes: Array<Pipette>,
  tipracksByMount: TiprackByMountMap,
  currentPipette: ?Pipette,
  actualPipettes: ?AttachedPipettesByMount,
  _robot: ?Robot,
|}

type DP = {| dispatch: Dispatch |}

type Props = {|
  ...OP,
  ...SP,
  fetchPipettes: () => mixed,
  changePipetteUrl: string,
|}

export default connect<Props, OP, SP, {||}, State, Dispatch>(
  mapStateToProps,
  null,
  mergeProps
)(CalibratePipettesPage)

function CalibratePipettesPage(props: Props) {
  const {
    pipettes,
    tipracksByMount,
    actualPipettes,
    currentPipette,
    fetchPipettes,
    match: { url, params },
    changePipetteUrl,
  } = props

  React.useEffect(() => {
    fetchPipettes()
  }, [fetchPipettes])

  // redirect back to mountless route if mount doesn't exist
  if (params.mount && !currentPipette) {
    return <Redirect to={url.replace(`/${params.mount}`, '')} />
  }

  return (
    <Page titleBarProps={{ title: <SessionHeader /> }}>
      <PipetteTabs {...{ pipettes, currentPipette }} />
      <Pipettes
        {...{
          pipettes,
          tipracksByMount,
          currentPipette,
          actualPipettes,
          changePipetteUrl,
        }}
      />
      {!!currentPipette && <TipProbe {...currentPipette} />}
    </Page>
  )
}

function mapStateToProps(state: State, ownProps: OP): SP {
  const { mount } = ownProps.match.params
  const _robot = getConnectedRobot(state)
  const pipettes = robotSelectors.getPipettes(state)
  const tipracksByMount = robotSelectors.getTipracksByMount(state)
  const currentPipette = pipettes.find(p => p.mount === mount)
  const actualPipettes = _robot && getAttachedPipettes(state, _robot.name)

  return {
    _robot,
    pipettes,
    tipracksByMount,
    actualPipettes,
    currentPipette,
  }
}

function mergeProps(stateProps: SP, dispatchProps: DP, ownProps: OP): Props {
  const { dispatch } = dispatchProps
  const { _robot } = stateProps
  const changePipetteUrl = _robot
    ? `/robots/${_robot.name}/instruments`
    : '/robots'

  return {
    ...ownProps,
    ...stateProps,
    changePipetteUrl,
    fetchPipettes: () => _robot && dispatch(fetchPipettes(_robot.name)),
  }
}
