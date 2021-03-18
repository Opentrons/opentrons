// @flow
import * as React from 'react'
import { LabeledValue } from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'

import { TemperatureControl, TemperatureData } from '../../../../molecules/ModuleControls'
import { StatusCard } from './StatusCard'
import { StatusItem } from './StatusItem'
import styles from './styles.css'

import type {
  TemperatureModule,
  ModuleCommand,
} from '../../../../redux/modules/types'

type Props = {|
  module: TemperatureModule,
  sendModuleCommand: (
    moduleId: string,
    command: ModuleCommand,
    args?: Array<mixed>
  ) => mixed,
  controlDisabledReason: string | null,
  isCardExpanded: boolean,
  toggleCard: boolean => mixed,
|}

export const TempDeckCard = ({
  module,
  sendModuleCommand,
  controlDisabledReason,
  isCardExpanded,
  toggleCard,
}: Props): React.Node => (
  <StatusCard
    title={getModuleDisplayName(module.model)}
    isCardExpanded={isCardExpanded}
    toggleCard={toggleCard}
  >
    <div className={styles.card_row}>
      <TemperatureData
        status={module.status}
        current={module.data.currentTemp}
        target={module.data.targetTemp}
        title={null}
      />
      <TemperatureControl
        module={module}
        sendModuleCommand={sendModuleCommand}
        disabledReason={controlDisabledReason}
        btnWidth="9rem"
      />
    </div>
  </StatusCard>
)
