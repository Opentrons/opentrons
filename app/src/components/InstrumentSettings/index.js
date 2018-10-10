// @flow
// robot status panel with connect button
import * as React from 'react'

import AttachedPipettesCard from './AttachedPipettesCard'
import AttachedModulesCard from './AttachedModulesCard'
import {CardContainer, CardRow} from '../layout'

import type {Robot} from '../../discovery'

type Props = Robot

export default function InstrumentSettings (props: Props) {
  return (
    <CardContainer>
      <CardRow>
        <AttachedPipettesCard {...props} />
      </CardRow>
      <CardRow>
        <AttachedModulesCard {...props} />
      </CardRow>
    </CardContainer>
  )
}
