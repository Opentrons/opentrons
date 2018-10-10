// @flow
import * as React from 'react'
import {Switch, Route} from 'react-router'

import InstrumentSettings from '../../components/InstrumentSettings'
import ChangePipette from '../../components/ChangePipette'
import Page from '../../components/Page'

import type {Match} from 'react-router'
import type {Robot} from '../../discovery'

type Props = {
  robot: Robot,
  match: Match,
}

export default function InstrumentSettingsPage (props: Props) {
  const {
    robot,
    match: {path, url},
  } = props
  const titleBarProps = {title: robot.name}

  return (
    <React.Fragment>
    <Page titleBarProps={titleBarProps}>
      <InstrumentSettings {...robot} />
    </Page>
    <Switch>
      <Route path={`${path}/pipettes`} render={(props) => (
        <ChangePipette {...props} robot={robot} parentUrl={url} />
      )} />
    </Switch>
    </React.Fragment>
  )
}
