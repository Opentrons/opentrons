import * as React from 'react'
import uniqBy from 'lodash/uniqBy'
import isEqual from 'lodash/isEqual'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import { getLabwareDisplayName, IDENTITY_VECTOR } from '@opentrons/shared-data'
import {
  Box,
  RobotCoordsForeignDiv,
  Text,
  FONT_WEIGHT_REGULAR,
  FONT_WEIGHT_SEMIBOLD,
  SPACING_1,
  C_WHITE,
  OVERLAY_BLACK_90,
  DISPLAY_FLEX,
  DIRECTION_COLUMN,
  JUSTIFY_FLEX_END,
  FONT_SIZE_CAPTION,
} from '@opentrons/components'
import { useCurrentProtocolRun } from '../../../ProtocolUpload/hooks'
import { getLabwareLocation } from '../../utils/getLabwareLocation'
import { useProtocolDetails } from '../../../RunDetails/hooks'
import { getLabwareDefinitionUri } from '../../utils/getLabwareDefinitionUri'

import type { LabwareOffset } from '@opentrons/api-client'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
interface LabwareInfoProps {
  displayName: string
  labwareId: string
}

const labwareDisplayNameStyle = css`
  overflow: hidden;
  white-space: initial;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`
const LabwareInfo = (props: LabwareInfoProps): JSX.Element => {
  const { displayName, labwareId } = props
  const { t } = useTranslation('protocol_setup')
  const { protocolData } = useProtocolDetails()
  const labwareDefinitionUri = getLabwareDefinitionUri(
    labwareId,
    protocolData?.labware
  )
  const { runRecord } = useCurrentProtocolRun()
  const labwareLocation = getLabwareLocation(
    labwareId,
    protocolData?.commands ?? []
  )

  const labwareOffsets = runRecord?.data.labwareOffsets ?? []
  const mostRecentLabwareOffsets = uniqBy<LabwareOffset>(
    labwareOffsets.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
    offset => {
      const locationKey =
        'slotName' in offset.location
          ? offset.location?.slotName
          : offset.location.moduleId
      return `${offset.definitionUri}_${locationKey}`
    }
  )
  const vector = mostRecentLabwareOffsets?.find(
    offsetRecord =>
      offsetRecord.definitionUri === labwareDefinitionUri &&
      'slotName' in offsetRecord.location &&
      'slotName' in labwareLocation &&
      offsetRecord.location?.slotName === labwareLocation?.slotName &&
      isEqual(offsetRecord.location, labwareLocation) &&
      !isEqual(offsetRecord.vector, IDENTITY_VECTOR)
  )?.vector

  return (
    <Box
      flexDirection={'column'}
      backgroundColor={OVERLAY_BLACK_90}
      borderRadius={`0 0 0.4rem 0.4rem`}
      fontSize={FONT_SIZE_CAPTION}
      color={C_WHITE}
    >
      <Text margin={SPACING_1} css={labwareDisplayNameStyle}>
        {displayName}
      </Text>
      {vector != null && (
        <>
          <Text
            marginX={SPACING_1}
            fontWeight={FONT_WEIGHT_SEMIBOLD}
            fontSize="8px"
            textTransform={'uppercase'}
          >
            {t('offset_title')}
          </Text>
          <Box marginX={SPACING_1} marginBottom={SPACING_1}>
            <Text
              as={'span'}
              fontWeight={FONT_WEIGHT_SEMIBOLD}
              marginRight={'0.15rem'}
            >
              X
            </Text>
            <Text
              as={'span'}
              fontWeight={FONT_WEIGHT_REGULAR}
              marginRight={'0.35rem'}
            >
              {vector.x.toFixed(1)}
            </Text>
            <Text
              as={'span'}
              fontWeight={FONT_WEIGHT_SEMIBOLD}
              marginRight={'0.15rem'}
            >
              Y
            </Text>
            <Text
              as={'span'}
              fontWeight={FONT_WEIGHT_REGULAR}
              marginRight={'0.35rem'}
            >
              {vector.y.toFixed(1)}
            </Text>
            <Text
              as={'span'}
              fontWeight={FONT_WEIGHT_SEMIBOLD}
              marginRight={'0.15rem'}
            >
              Z
            </Text>
            <Text
              as={'span'}
              fontWeight={FONT_WEIGHT_REGULAR}
              marginRight={'0.35rem'}
            >
              {vector.z.toFixed(1)}
            </Text>
          </Box>
        </>
      )}
    </Box>
  )
}

interface LabwareInfoOverlayProps {
  definition: LabwareDefinition2
  labwareId: string
}
export const LabwareInfoOverlay = (
  props: LabwareInfoOverlayProps
): JSX.Element => {
  const { definition, labwareId } = props
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
        displayName={getLabwareDisplayName(definition)}
        labwareId={labwareId}
      />
    </RobotCoordsForeignDiv>
  )
}
