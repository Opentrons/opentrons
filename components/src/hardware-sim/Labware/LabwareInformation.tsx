import * as React from 'react'
import { css } from 'styled-components'

import { getLabwareDisplayName } from '@opentrons/shared-data'

import { Icon } from '../../icons'
import { Box, Flex, Text } from '../../primitives'
import {
  ALIGN_FLEX_START,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  DISPLAY_FLEX,
  JUSTIFY_FLEX_END,
  JUSTIFY_SPACE_BETWEEN,
  OVERFLOW_HIDDEN,
  TEXT_TRANSFORM_NONE,
  TEXT_TRANSFORM_UPPERCASE,
} from '../../styles'
import { SPACING, COLORS, TYPOGRAPHY } from '../../ui-style-constants'
import { RobotCoordsForeignDiv } from '../Deck'
import { LabwareOffsetVector } from './LabwareOffsetVector'

import type { LabwareDefinition2, VectorOffset } from '@opentrons/shared-data'

const labwareDisplayNameStyle = css`
  text-transform: ${TEXT_TRANSFORM_NONE};
  overflow: ${OVERFLOW_HIDDEN};
  white-space: initial;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  ${TYPOGRAPHY.h6Default}
`

interface LabwareInformationProps {
  definition: LabwareDefinition2
  labwareId: string | null
  displayName: string | null
  hover?: boolean
  labwareHasLiquid?: boolean
  // prop to replace the localized "Offset Data" label
  offsetLabel?: string
  offsetVector?: VectorOffset
}
export const LabwareInformation = (
  props: LabwareInformationProps
): JSX.Element => {
  const {
    definition,
    displayName,
    labwareId,
    offsetVector,
    hover = false,
    labwareHasLiquid = false,
    offsetLabel = 'Offset Data',
  } = props

  const width = definition.dimensions.xDimension
  const height = definition.dimensions.yDimension

  const definitionDisplayName = getLabwareDisplayName(definition)

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
      <Box
        backgroundColor={hover ? COLORS.blueEnabled : '#000000B3'}
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
          <Text css={labwareDisplayNameStyle} title={definitionDisplayName}>
            {displayName ?? definitionDisplayName}
          </Text>
          {labwareHasLiquid ? (
            <Icon name="water" color={COLORS.white} width="0" minWidth="1rem" />
          ) : null}
        </Flex>
        {offsetVector != null && (
          <>
            <Text
              css={TYPOGRAPHY.h6Default}
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              textTransform={TEXT_TRANSFORM_UPPERCASE}
            >
              {offsetLabel}
            </Text>
            <LabwareOffsetVector {...offsetVector} />
          </>
        )}
      </Box>
    </RobotCoordsForeignDiv>
  )
}
