import { css } from 'styled-components'

import {
  ALIGN_FLEX_START,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  DISPLAY_FLEX,
  Flex,
  JUSTIFY_FLEX_END,
  JUSTIFY_SPACE_BETWEEN,
  RobotCoordsForeignDiv,
  SPACING,
  Text,
  TYPOGRAPHY,
} from '@opentrons/components'
import { getSchema2Dimensions } from '@opentrons/shared-data'

import type { ReactNode } from 'react'
import type { LabwareDefinition } from '@opentrons/shared-data'

const labwareDisplayNameStyle = css`
  ${TYPOGRAPHY.labelSemiBold}
  overflow: hidden;
  white-space: initial;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`
export function LabwareInfo(props: {
  def: LabwareDefinition
  children: ReactNode
}): JSX.Element {
  const { xDimension: width, yDimension: height } = getSchema2Dimensions(
    props.def
  )
  return (
    <RobotCoordsForeignDiv
      x={0}
      y={0}
      {...{ width, height }}
      innerDivProps={{
        display: DISPLAY_FLEX,
        flexDirection: DIRECTION_COLUMN,
        justifyContent: JUSTIFY_FLEX_END,
      }}
    >
      <Box
        backgroundColor="#000000B3"
        borderRadius="0 0 0.4rem 0.4rem"
        fontSize={TYPOGRAPHY.fontSizeCaption}
        padding={SPACING.spacing4}
        color={COLORS.white}
      >
        <Flex
          flexDirection={DIRECTION_ROW}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          alignItems={ALIGN_FLEX_START}
          gridGap={SPACING.spacing4}
        >
          <Text
            as="h6"
            lineHeight={TYPOGRAPHY.fontSizeCaption}
            css={labwareDisplayNameStyle}
          >
            {props.children}
          </Text>
        </Flex>
      </Box>
    </RobotCoordsForeignDiv>
  )
}
