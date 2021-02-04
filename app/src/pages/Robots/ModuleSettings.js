// @flow
import * as React from 'react'

import { ModuleSettings as SettingsContent } from '../../chunks/ModuleSettings'
import { Page } from '../../atoms/Page'

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
