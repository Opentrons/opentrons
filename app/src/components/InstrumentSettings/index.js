// @flow
// robot status panel with connect button
import * as React from 'react'

import AttachedPipettesCard from './AttachedPipettesCard'
import AttachedModulesCard from './AttachedModulesCard'
import { CardContainer, CardRow } from '../layout'

import type { Robot } from '../../discovery/types'

type Props = {| robot: Robot |}

export default function InstrumentSettings(props: Props) {
  return (
    <CardContainer>
      <CardRow>
        <AttachedPipettesCard robot={props.robot} />
      </CardRow>
      <CardRow>
        <AttachedModulesCard robot={props.robot} />
      </CardRow>
    </CardContainer>
  )
}
