// @flow
import * as React from 'react'
import { Switch, Route } from 'react-router-dom'

import InstrumentSettings from '../../components/InstrumentSettings'
import ChangePipette from '../../components/ChangePipette'
import { ConfigurePipette } from '../../components/ConfigurePipette'
import Page from '../../components/Page'

import type { Match } from 'react-router-dom'
import type { Robot } from '../../discovery/types'

type Props = {|
  robot: Robot,
  match: Match,
|}

// used to guarantee mount param in route is left or right
const RE_MOUNT = '(left|right)'

export default function InstrumentSettingsPage(props: Props) {
  const {
    robot,
    match: { path, url },
  } = props
  const titleBarProps = { title: robot.displayName }
  return (
    <React.Fragment>
      <Page titleBarProps={titleBarProps}>
        <InstrumentSettings robot={robot} />
      </Page>
      <Switch>
        <Route
          path={`${path}/pipettes/change`}
          render={props => (
            <ChangePipette {...props} robot={robot} parentUrl={url} />
          )}
        />
        <Route
          path={`${path}/pipettes/config/:mount${RE_MOUNT}`}
          render={routeProps => (
            <ConfigurePipette
              mount={(routeProps.match.params.mount: any)}
              robotName={robot.name}
              closeModal={routeProps.history.goBack}
            />
          )}
        />
      </Switch>
    </React.Fragment>
  )
}
