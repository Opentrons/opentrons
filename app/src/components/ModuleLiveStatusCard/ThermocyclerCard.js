// @flow
import * as React from 'react'
import { LabeledValue } from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'

import type { ThermocyclerModule } from '../../robot-api'
import StatusCard from './StatusCard'
import CardContentRow from './CardContentRow'
import StatusItem from './StatusItem'

type Props = {|
  module: ThermocyclerModule,
|}

const ThermocyclerCard = ({ module }: Props) => (
  <StatusCard title={getModuleDisplayName(module.name)}>
    <CardContentRow>
      <StatusItem status={module.status} />
    </CardContentRow>
    <CardContentRow>
      <LabeledValue
        label="Current Temp"
        value={`${module.data.currentTemp} °C`}
      />
      <LabeledValue
        label="Target Temp"
        value={module.data.targetTemp ? `${module.data.targetTemp} °C` : 'None'}
      />
      <LabeledValue
        label="Current Lid Temp"
        value={`${module.data.lidTemp} °C`}
      />
      <LabeledValue
        label="Target Lid Temp"
        value={module.data.targetTemp ? `${module.data.lidTarget} °C` : 'None'}
      />
    </CardContentRow>
    {module.data.totalCycleCount !== null && (
      <CardContentRow>
        <LabeledValue
          label="Cycle #"
          value={`${module.data.currentCycleIndex} / ${
            module.data.totalCycleCount
          }`}
        />
        <LabeledValue
          label="Step #"
          value={`${module.data.currentStepIndex} / ${
            module.data.totalStepCount
          }`}
        />
      </CardContentRow>
    )}
  </StatusCard>
)

export default ThermocyclerCard
