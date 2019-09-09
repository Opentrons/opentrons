// @flow
import * as React from 'react'
import { LabeledValue } from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'

import type { TempDeckModule, ModuleCommandRequest } from '../../robot-api'
import StatusCard from './StatusCard'
import CardContentRow from './CardContentRow'
import StatusItem from './StatusItem'
import TemperatureControl from './TemperatureControl'

type Props = {|
  module: TempDeckModule,
  sendModuleCommand: (serial: string, request: ModuleCommandRequest) => mixed,
  isProtocolActive: boolean,
  __tempdeckControlsEnabled: boolean,
|}

const TempDeckCard = ({
  module,
  sendModuleCommand,
  isProtocolActive,
  __tempdeckControlsEnabled,
}: Props) => (
  <StatusCard title={getModuleDisplayName(module.name)}>
    <CardContentRow>
      <StatusItem status={module.status} />
      {__tempdeckControlsEnabled && !isProtocolActive && (
        <TemperatureControl
          module={module}
          sendModuleCommand={sendModuleCommand}
        />
      )}
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
    </CardContentRow>
  </StatusCard>
)

export default TempDeckCard
