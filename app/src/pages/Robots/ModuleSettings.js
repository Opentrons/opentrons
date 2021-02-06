// @flow
import * as React from 'react'

import { ModuleSettings as SettingsContent } from '../../components/ModuleSettings'
import { Page } from '../../components/Page'

export type ModuleSettingsProps = {|
  robotName: string,
  robotDisplayName: string,
|}

export function ModuleSettings(props: ModuleSettingsProps): React.Node {
  const { robotName, robotDisplayName } = props
  const titleBarProps = { title: robotDisplayName }

  return (
    <>
      <Page titleBarProps={titleBarProps}>
        <SettingsContent robotName={robotName} />
      </Page>
    </>
  )
}
