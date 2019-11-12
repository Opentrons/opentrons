// @flow
import * as React from 'react'
import { LabeledValue } from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'

import StatusCard from './StatusCard'
import StatusItem from './StatusItem'
import TemperatureControl from '../ModuleControls/TemperatureControl'
import styles from './styles.css'

import type {
  TempDeckModule,
  ModuleCommandRequest,
} from '../../robot-api/types'

type Props = {|
  module: TempDeckModule,
  sendModuleCommand: (serial: string, request: ModuleCommandRequest) => mixed,
  isProtocolActive: boolean,
  isCardExpanded: boolean,
  toggleCard: boolean => mixed,
|}

const TempDeckCard = ({
  module,
  sendModuleCommand,
  isProtocolActive,
  isCardExpanded,
  toggleCard,
}: Props) => (
  <StatusCard
    title={getModuleDisplayName(module.name)}
    isCardExpanded={isCardExpanded}
    toggleCard={toggleCard}
  >
    <div className={styles.card_row}>
      <StatusItem status={module.status} />
      {!isProtocolActive && (
        <TemperatureControl
          module={module}
          sendModuleCommand={sendModuleCommand}
        />
      )}
    </div>
    <div className={styles.card_row}>
      <LabeledValue
        label="Current Temp"
        className={styles.temp_data_item}
        value={`${module.data.currentTemp} °C`}
      />
      <LabeledValue
        label="Target Temp"
        className={styles.temp_data_item}
        value={module.data.targetTemp ? `${module.data.targetTemp} °C` : 'None'}
      />
    </div>
  </StatusCard>
)

export default TempDeckCard
