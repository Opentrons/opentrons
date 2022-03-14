import * as React from 'react'
import { Box, AlertItem } from '@opentrons/components'
import { NEW_LABWARE_MESSAGE } from '../../localization'

export function NewLabwareAlert(): JSX.Element {
  return (
    <Box marginTop="1px">
      <AlertItem type="info" title={NEW_LABWARE_MESSAGE} />
    </Box>
  )
}
