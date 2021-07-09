import * as React from 'react'
import { Switch, Route } from 'react-router-dom'

import { LEFT, RIGHT } from '../../../redux/pipettes'
import { AttachedPipettesCard } from './AttachedPipettesCard'
import { CardContainer, CardRow } from '../../../atoms/layout'
import { ChangePipette } from '../../../organisms/ChangePipette'
import { ConfigurePipette } from '../../../organisms/ConfigurePipette'
import { Page } from '../../../atoms/Page'

export interface InstrumentSettingsProps {
  robotName: string
  robotDisplayName: string
  url: string
  path: string
  pathname: string
}

// used to guarantee mount param in route is left or right
const RE_MOUNT = `(${LEFT}|${RIGHT})`

export function InstrumentSettings(
  props: InstrumentSettingsProps
): JSX.Element {
  const { robotName, robotDisplayName, url, path, pathname } = props
  const titleBarProps = { title: robotDisplayName }

  return (
    <>
      <Page titleBarProps={titleBarProps}>
        <CardContainer>
          <CardRow>
            <AttachedPipettesCard
              robotName={robotName}
              makeChangeUrl={mnt => `${url}/change-pipette/${mnt}`}
              makeConfigureUrl={mnt => `${url}/configure-pipette/${mnt}`}
              isChangingOrConfiguringPipette={pathname !== url}
            />
          </CardRow>
        </CardContainer>
      </Page>
      <Switch>
        <Route
          path={`${path}/change-pipette/:mount${RE_MOUNT}`}
          render={routeProps => (
            <ChangePipette
              robotName={robotName}
              // @ts-expect-error not a valid Mount type
              mount={routeProps.match.params.mount}
              closeModal={routeProps.history.goBack}
            />
          )}
        />
        <Route
          path={`${path}/configure-pipette/:mount${RE_MOUNT}`}
          render={routeProps => (
            <ConfigurePipette
              robotName={robotName}
              // @ts-expect-error not a valid Mount type
              mount={routeProps.match.params.mount}
              closeModal={routeProps.history.goBack}
            />
          )}
        />
      </Switch>
    </>
  )
}
