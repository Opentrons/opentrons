// @flow
import * as React from 'react'
import { LabeledValue } from '@opentrons/components'

import type { TempDeckModule } from '../../robot-api'
import StatusCard from './StatusCard'
import CardContentRow from './CardContentRow'
import StatusItem from './StatusItem'

type Props = {|
  module: TempDeckModule,
|}

const TempDeckCard = ({ module }: Props) => (
  <StatusCard title={module.displayName}>
    <CardContentRow>
      <StatusItem status={status} />
    </CardContentRow>
    <CardContentRow>
      <LabeledValue label="Current Temp" value={`${module.currentTemp} °C`} />
      <LabeledValue
        label="Target Temp"
        value={module.targetTemp ? `${module.targetTemp} °C` : 'None'}
      />
    </CardContentRow>
  </StatusCard>
)

export default TempDeckCard
