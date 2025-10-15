import { useParams } from 'react-router-dom'

import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'

interface StepDetailViewerParams {
  protocolKey: string
}

export function StepDetailViewer(): JSX.Element {
  const { protocolKey } = useParams<
    keyof StepDetailViewerParams
  >() as StepDetailViewerParams

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing16}
      padding={SPACING.spacing16}
    >
      <StyledText as="h1">Step Detail Viewer</StyledText>
      <StyledText as="p">Protocol Key: {protocolKey}</StyledText>
    </Flex>
  )
}
