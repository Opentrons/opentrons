import * as React from 'react'
import { Box, COLORS } from '@opentrons/components'

export function Line(): JSX.Element {
  return <Box borderBottom={`1px solid ${COLORS.grey30}`} />
}
