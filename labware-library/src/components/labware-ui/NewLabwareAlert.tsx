import * as React from 'react'
import { Box, LegacyAlertItem } from '@opentrons/components'
import { NEW_LABWARE_MESSAGE } from '../../localization'

export function NewLabwareAlert(): JSX.Element {
  // Note: Box is redudant but used here to wrap older alert item that only accepts className for styling
  return (
    <Box marginTop="1px">
      <LegacyAlertItem type="info" title={NEW_LABWARE_MESSAGE} />
    </Box>
  )
}
