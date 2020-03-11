// @flow
import * as React from 'react'
import { LabeledValue } from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'

import { StatusCard } from './StatusCard'
import { StatusItem } from './StatusItem'
import { TemperatureControl } from '../ModuleControls'
import styles from './styles.css'

import type { TemperatureModule, ModuleCommand } from '../../modules/types'

type Props = {|
  module: TemperatureModule,
  sendModuleCommand: (
    moduleId: string,
    command: ModuleCommand,
    args?: Array<mixed>
  ) => mixed,
  allowInteraction: boolean,
  isCardExpanded: boolean,
  toggleCard: boolean => mixed,
|}

export const TempDeckCard = ({
  module,
  sendModuleCommand,
  allowInteraction,
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
      {allowInteraction && (
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
