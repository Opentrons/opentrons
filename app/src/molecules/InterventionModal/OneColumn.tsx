import * as React from 'react'

import { Box } from '@opentrons/components'

export interface OneColumnProps {
  children: React.ReactNode
}

export function OneColumn({ children }: OneColumnProps): JSX.Element {
  return <Box width="100%">{children}</Box>
}
