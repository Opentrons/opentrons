import * as React from 'react'
import {
  ALIGN_CENTER,
  Box,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  Link,
  SIZE_1,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { Divider } from '/app/atoms/structure'

interface ExpandingTitleProps {
  label: React.ReactNode
  diagram?: React.ReactNode
}

export function ExpandingTitle(props: ExpandingTitleProps): JSX.Element {
  const [diagramVisible, setDiagramVisible] = React.useState<boolean>(false)
  const toggleDiagramVisible = (): void => {
    setDiagramVisible(currentDiagramVisible => !currentDiagramVisible)
  }
  const { label, diagram } = props

  return (
    <>
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
      >
        <LegacyStyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {label}
        </LegacyStyledText>
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
