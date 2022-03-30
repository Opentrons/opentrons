import * as React from 'react'
import { Box, BORDERS } from '@opentrons/components'

type Props = React.ComponentProps<typeof Box>

export function Line(props: Props): JSX.Element {
  return <Box borderBottom={BORDERS.lineBorder} {...props} />
}
