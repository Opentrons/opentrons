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
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
interface LabwareInfoProps {
  displayName: string
  labwareId: string
  runId: string
  hover?: boolean
}

const labwareDisplayNameStyle = css`
  text-transform: none;
  overflow: hidden;
  white-space: initial;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`
const LabwareInfo = (props: LabwareInfoProps): JSX.Element | null => {
  const { displayName, labwareId, hover } = props

  return (
    <Box
      backgroundColor={hover ? COLORS.blue50 : '#000000B3'}
      borderRadius="0 0 0.4rem 0.4rem"
      fontSize={TYPOGRAPHY.fontSizeCaption}
      padding={SPACING.spacing4}
      color={COLORS.white}
      id={`LabwareInfoOverlay_slot_${labwareId}_offsetBox`}
    >
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_FLEX_START}
        gridGap={SPACING.spacing4}
      >
        <LegacyStyledText
          as="h6"
          css={labwareDisplayNameStyle}
          title={displayName}
        >
          {displayName}
        </LegacyStyledText>
      </Flex>
    </Box>
  )
}

interface LabwareInfoOverlayProps {
  definition: LabwareDefinition2
  labwareId: string
  displayName: string
  runId: string
  hover?: boolean
}
export const LabwareInfoOverlay = (
  props: LabwareInfoOverlayProps
): JSX.Element => {
  const { definition, labwareId, displayName, runId } = props

  const width = definition.dimensions.xDimension
  const height = definition.dimensions.yDimension
  return (
    <RobotCoordsForeignDiv
      x={definition.cornerOffsetFromSlot.x}
      y={definition.cornerOffsetFromSlot.y}
      {...{ width, height }}
      innerDivProps={{
        display: DISPLAY_FLEX,
        flexDirection: DIRECTION_COLUMN,
        justifyContent: JUSTIFY_FLEX_END,
      }}
    >
      <LabwareInfo
        displayName={displayName}
        labwareId={labwareId}
        runId={runId}
        hover={props.hover}
      />
    </RobotCoordsForeignDiv>
  )
}
