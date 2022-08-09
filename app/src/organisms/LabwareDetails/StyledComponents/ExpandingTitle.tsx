import * as React from 'react'
import {
  Flex,
  Icon,
  Link,
  Box,
  DIRECTION_ROW,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
  TYPOGRAPHY,
  SIZE_1,
} from '@opentrons/components'
import { StyledText } from '../../../atoms/text'
import { Divider } from '../../../atoms/structure'

interface ExpandingTitleProps {
  label: React.ReactNode
  diagram?: React.ReactNode
}

export function ExpandingTitle(props: ExpandingTitleProps): JSX.Element {
  const [diagramVisible, setDiagramVisible] = React.useState<boolean>(false)
  const toggleDiagramVisible = (): void => setDiagramVisible(!diagramVisible)
  const { label, diagram } = props

  return (
    <>
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
      >
        <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {label}
        </StyledText>
        {diagram != null && (
          <Link role="button" onClick={toggleDiagramVisible}>
            <Icon
              name={diagramVisible ? 'chevron-up' : 'chevron-down'}
              size={SIZE_1}
            />
          </Link>
        )}
      </Flex>
      {diagramVisible && (
        <Box data-testid="expanding_title_diagram">{diagram}</Box>
      )}
      <Divider />
    </>
  )
}
