import { Box, BORDERS } from '@opentrons/components'
import * as React from 'react'

type Props = React.ComponentProps<typeof Box>

export function Line(props: Props): JSX.Element {
  return <Box borderBottom={BORDERS.lineBorder} {...props} data-testid="line" />
}
