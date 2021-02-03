// @flow
import * as React from 'react'
import { AttachedModulesCard } from './AttachedModulesCard'

import { CardContainer, CardRow } from '../layout'

type Props = {| robotName: string |}

export function ModuleSettings(props: Props): React.Node {
  const { robotName } = props

  return (
    <CardContainer>
      <CardRow>
        <AttachedModulesCard robotName={robotName} />
      </CardRow>
    </CardContainer>
  )
}
