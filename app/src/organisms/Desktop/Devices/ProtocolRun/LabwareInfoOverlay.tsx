import { css } from 'styled-components'

import {
  ALIGN_FLEX_START,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  DISPLAY_FLEX,
  Flex,
  Icon,
  JUSTIFY_FLEX_END,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  RobotCoordsForeignDiv,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  getSchema2CornerOffsetFromSlot,
  getSchema2Dimensions,
} from '@opentrons/shared-data'

import type { LabwareDefinition } from '@opentrons/shared-data'

interface LabwareInfoProps {
  displayName: string
  labwareId: string
  runId: string
  labwareHasLiquid?: boolean
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
        {props.labwareHasLiquid && (
          <Icon name="water" color={COLORS.white} width="0" minWidth="1rem" />
        )}
      </Flex>
    </Box>
  )
}

interface LabwareInfoOverlayProps {
  definition: LabwareDefinition
  labwareId: string
  displayName: string
  runId: string
  labwareHasLiquid?: boolean
  hover?: boolean
  xOffset?: number
  yOffset?: number
}
export const LabwareInfoOverlay = (
  props: LabwareInfoOverlayProps
): JSX.Element => {
  const {
    definition,
    labwareId,
    displayName,
    runId,
    labwareHasLiquid,
    xOffset,
    yOffset,
  } = props

  const cornerOffsetFromSlot = getSchema2CornerOffsetFromSlot(definition)
  const dimensions = getSchema2Dimensions(definition)

  return (
    <RobotCoordsForeignDiv
      x={cornerOffsetFromSlot.x + (xOffset ?? 0)}
      y={cornerOffsetFromSlot.y + (yOffset ?? 0)}
      width={dimensions.xDimension}
      height={dimensions.yDimension}
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
        labwareHasLiquid={labwareHasLiquid}
      />
    </RobotCoordsForeignDiv>
  )
}
