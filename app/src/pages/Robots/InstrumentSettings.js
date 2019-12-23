// @flow
import * as React from 'react'
import { Switch, Route } from 'react-router-dom'

import { LEFT, RIGHT } from '../../pipettes'
import { InstrumentSettings as SettingsContent } from '../../components/InstrumentSettings'
import { ChangePipette } from '../../components/ChangePipette'
import { ConfigurePipette } from '../../components/ConfigurePipette'
import Page from '../../components/Page'

type Props = {|
  robotName: string,
  robotDisplayName: string,
  url: string,
  path: string,
|}

// used to guarantee mount param in route is left or right
const RE_MOUNT = `(${LEFT}|${RIGHT})`

export function InstrumentSettings(props: Props) {
  const { robotName, robotDisplayName, url, path } = props
  const titleBarProps = { title: robotDisplayName }

  return (
    <>
      <Page titleBarProps={titleBarProps}>
        <SettingsContent
          robotName={robotName}
          makeChangePipetteUrl={mnt => `${url}/change-pipette/${mnt}`}
          makeConfigurePipetteUrl={mnt => `${url}/configure-pipette/${mnt}`}
        />
      </Page>
      <Switch>
        <Route
          path={`${path}/change-pipette/:mount${RE_MOUNT}`}
          render={routeProps => (
            <ChangePipette
              robotName={robotName}
              mount={(routeProps.match.params.mount: any)}
              closeModal={routeProps.history.goBack}
            />
          )}
        />
        <Route
          path={`${path}/configure-pipette/:mount${RE_MOUNT}`}
          render={routeProps => (
            <ConfigurePipette
              robotName={robotName}
              mount={(routeProps.match.params.mount: any)}
              closeModal={routeProps.history.goBack}
            />
          )}
        />
      </Switch>
    </>
  )
}
