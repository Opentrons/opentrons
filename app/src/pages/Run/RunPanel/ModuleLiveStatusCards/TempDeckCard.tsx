import * as React from 'react'
import { Box, SPACING_3 } from '@opentrons/components'
import { getModuleDisplayName, getModuleType } from '@opentrons/shared-data'

import {
  TemperatureControl,
  TemperatureData,
} from '../../../../molecules/ModuleControls'
import { StatusCard } from './StatusCard'

import type {
  TemperatureModule,
  ModuleCommand,
} from '../../../../redux/modules/types'

interface Props {
  module: TemperatureModule
  sendModuleCommand: (
    moduleId: string,
    command: ModuleCommand,
    args?: unknown[]
  ) => unknown
  controlDisabledReason: string | null
  isCardExpanded: boolean
  toggleCard: () => unknown
  slot: string
}

export const TempDeckCard = ({
  module,
  sendModuleCommand,
  controlDisabledReason,
  isCardExpanded,
  toggleCard,
  slot,
}: Props): JSX.Element => (
  <StatusCard
    moduleType={getModuleType(module.model)}
    header={slot}
    title={getModuleDisplayName(module.model)}
    isCardExpanded={isCardExpanded}
    toggleCard={toggleCard}
  >
    <Box padding={SPACING_3}>
      <TemperatureData
        status={module.status}
        current={module.data.currentTemp}
        target={module.data.targetTemp}
        title={null}
      />
      <TemperatureControl
        module={module}
        isSecondaryTemp={false}
        sendModuleCommand={sendModuleCommand}
        disabledReason={controlDisabledReason}
      />
    </Box>
  </StatusCard>
)
