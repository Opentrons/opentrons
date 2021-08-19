import { Box, Flex, Text, SPACING_2 } from '@opentrons/components'
import * as React from 'react'
import { ModuleItem } from '../../../pages/Robots/ModuleSettings/ModuleItem'

import type { AttachedModule } from '../../../redux/modules/types'

interface Props {
  hub: string
  modules: AttachedModule[]
  controlDisabledReason: string | null
}

export function UsbHubInfo(props: Props): JSX.Element {
  const { hub, modules, controlDisabledReason } = props

  return (
    <Box>
      <Flex>
        <Text marginRight={SPACING_2}>{`USB Port ${hub}:`}</Text>
      </Flex>
      {modules.map(mod => (
        <Box key={mod.serial}>
          <ModuleItem
            key={mod.serial}
            module={mod}
            hubPort={String(mod.usbPort.port)}
            controlDisabledReason={controlDisabledReason}
          />
        </Box>
      ))}
    </Box>
  )
}
