import * as React from 'react'
import { Box, SPACING_3 } from '@opentrons/components'
import { getModuleDisplayName, getModuleType } from '@opentrons/shared-data'

import { StatusCard } from './StatusCard'
import { MagnetData, MagnetControl } from '../../../../molecules/ModuleControls'
// import { StatusItem } from './StatusItem'

import type {
  MagneticModule,
  ModuleCommand,
} from '../../../../redux/modules/types'

interface Props {
  module: MagneticModule
  slot: string
  isCardExpanded: boolean
  toggleCard: () => unknown
  sendModuleCommand: (
    moduleId: string,
    command: ModuleCommand,
    args?: unknown[]
  ) => unknown
  controlDisabledReason: string | null
}

export const MagDeckCard = ({
  module,
  isCardExpanded,
  toggleCard,
  sendModuleCommand,
  controlDisabledReason,
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
      <MagnetData module={module} />
      <MagnetControl
        module={module}
        sendModuleCommand={sendModuleCommand}
        disabledReason={controlDisabledReason}
      />
    </Box>
  </StatusCard>
)
