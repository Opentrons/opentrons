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
import { useCurrentRun } from '../../../ProtocolUpload/hooks'
import { getLabwareOffsetLocation } from '../../utils/getLabwareOffsetLocation'
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
const LabwareInfo = (props: LabwareInfoProps): JSX.Element | null => {
  const { displayName, labwareId } = props
  const { t } = useTranslation('protocol_setup')
  const { protocolData } = useProtocolDetails()
  const runRecord = useCurrentRun()
  // protocolData should never be null as we don't render the `ProtocolSetup` unless we have an analysis
  // but we're experiencing a zombie children issue, see https://github.com/Opentrons/opentrons/pull/9091
  if (protocolData == null) {
    return null
  }

  const labwareDefinitionUri = getLabwareDefinitionUri(
    labwareId,
    protocolData.labware,
    protocolData.labwareDefinitions
  )
  const labwareLocation = getLabwareOffsetLocation(
    labwareId,
    protocolData?.commands ?? [],
    protocolData.modules
  )

  const labwareOffsets = runRecord?.data?.labwareOffsets ?? []
  const mostRecentLabwareOffsets = uniqBy<LabwareOffset>(
    labwareOffsets.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
    offset => {
      const locationKey =
        offset.location.moduleModel != null
          ? `${offset.location.moduleModel}_${offset.location.slotName}`
          : offset.location.slotName
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
      id="LabwareInfoOverlay_offset_box"
    >
      <Text
        margin={SPACING_1}
        css={labwareDisplayNameStyle}
        id="LabwareInfoOverlay_displayName"
      >
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
              id="LabwareInfoOverlay_X"
            >
              X
            </Text>
            <Text
              as={'span'}
              fontWeight={FONT_WEIGHT_REGULAR}
              marginRight={'0.35rem'}
              id="LabwareInfoOverlay_X_value"
            >
              {vector.x.toFixed(1)}
            </Text>
            <Text
              as={'span'}
              fontWeight={FONT_WEIGHT_SEMIBOLD}
              marginRight={'0.15rem'}
              id="LabwareInfoOverlay_Y"
            >
              Y
            </Text>
            <Text
              as={'span'}
              fontWeight={FONT_WEIGHT_REGULAR}
              marginRight={'0.35rem'}
              id="LabwareInfoOverlay_Y_value"
            >
              {vector.y.toFixed(1)}
            </Text>
            <Text
              as={'span'}
              fontWeight={FONT_WEIGHT_SEMIBOLD}
              marginRight={'0.15rem'}
              id="LabwareInfoOverlay_Z"
            >
              Z
            </Text>
            <Text
              as={'span'}
              fontWeight={FONT_WEIGHT_REGULAR}
              marginRight={'0.35rem'}
              id="LabwareInfoOverlay_Z_value"
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
