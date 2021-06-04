import * as React from 'react'

import { Page } from '../../../atoms/Page'
import { CardContainer, CardRow } from '../../../atoms/layout'
import { AttachedModulesCard } from './AttachedModulesCard'

export interface ModuleSettingsProps {
  robotName: string
  robotDisplayName: string
}

export function ModuleSettings(props: ModuleSettingsProps): JSX.Element {
  const { robotName, robotDisplayName } = props
  const titleBarProps = { title: robotDisplayName }

  return (
    <Page titleBarProps={titleBarProps}>
      <CardContainer>
        <CardRow>
          <AttachedModulesCard robotName={robotName} />
        </CardRow>
      </CardContainer>
    </Page>
  )
}
