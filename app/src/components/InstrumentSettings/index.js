// @flow
// robot status panel with connect button
import * as React from 'react'

import type {Robot} from '../../robot'

import AttachedPipettesCard from './AttachedPipettesCard'
import AttachedModulesCard from './AttachedModulesCard'
import {CardContainer, CardRow} from '../layout'

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
