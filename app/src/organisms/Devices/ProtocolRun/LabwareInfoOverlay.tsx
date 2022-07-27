import * as React from 'react'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import { getLabwareDisplayName } from '@opentrons/shared-data'
import {
  Box,
  Flex,
  RobotCoordsForeignDiv,
  SPACING,
  COLORS,
  TYPOGRAPHY,
  OVERLAY_BLACK_80,
  DISPLAY_FLEX,
  DIRECTION_COLUMN,
  JUSTIFY_FLEX_END,
  FONT_SIZE_CAPTION,
  Icon,
  DIRECTION_ROW,
  ALIGN_FLEX_START,
  JUSTIFY_SPACE_BETWEEN,
} from '@opentrons/components'
import { StyledText } from '../../../atoms/text'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import { useLabwareOffsetForLabware } from '../../LabwarePositionCheck/hooks/useLabwareOffsetForLabware'
import { OffsetVector } from '../../../molecules/OffsetVector'
interface LabwareInfoProps {
  displayName: string | null
  definitionDisplayName: string
  labwareId: string
  runId: string
  labwareHasLiquid?: boolean
  hover?: boolean
}

const labwareDisplayNameStyle = css`
  overflow: hidden;
  white-space: initial;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`
const LabwareInfo = (props: LabwareInfoProps): JSX.Element | null => {
  const { displayName, definitionDisplayName, labwareId, runId, hover } = props
  const { t } = useTranslation('protocol_setup')
  const vector = useLabwareOffsetForLabware(runId, labwareId)?.vector

  return (
    <Box
      backgroundColor={hover ? COLORS.blueEnabled : OVERLAY_BLACK_80}
      borderRadius={`0 0 0.4rem 0.4rem`}
      fontSize={FONT_SIZE_CAPTION}
      padding={SPACING.spacing2}
      color={COLORS.white}
      id={`LabwareInfoOverlay_slot_${labwareId}_offsetBox`}
    >
      <Flex
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_FLEX_START}
        gridGap={SPACING.spacing2}
      >
        <StyledText
          as="h6"
          lineHeight={TYPOGRAPHY.fontSizeCaption}
          css={labwareDisplayNameStyle}
          title={definitionDisplayName}
        >
          {displayName ?? definitionDisplayName}
        </StyledText>
        {props.labwareHasLiquid && (
          <Icon name="water" color={COLORS.white} width={'0'} minWidth="1rem" />
        )}
      </Flex>
      {vector != null && (
        <>
          <StyledText
            as="h6"
            lineHeight={TYPOGRAPHY.fontSizeCaption}
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            textTransform={'uppercase'}
          >
            {t('offset_data')}
          </StyledText>
          <OffsetVector {...vector} />
        </>
      )}
    </Box>
  )
}

interface LabwareInfoOverlayProps {
  definition: LabwareDefinition2
  labwareId: string
  displayName: string | null
  runId: string
  hover?: boolean
  labwareHasLiquid?: boolean
}
export const LabwareInfoOverlay = (
  props: LabwareInfoOverlayProps
): JSX.Element => {
  const { definition, labwareId, displayName, runId } = props
  const width = definition.dimensions.xDimension
  const height = definition.dimensions.yDimension
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
      <LabwareInfo
        displayName={displayName}
        definitionDisplayName={getLabwareDisplayName(definition)}
        labwareId={labwareId}
        runId={runId}
        hover={props.hover}
        labwareHasLiquid={props.labwareHasLiquid}
      />
    </RobotCoordsForeignDiv>
  )
}
