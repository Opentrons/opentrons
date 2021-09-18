import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  getLabwareDisplayName,
  LabwareDefinition2,
} from '@opentrons/shared-data'
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
  FONT_SIZE_TINY,
} from '@opentrons/components'
interface LabwareInfoProps {
  displayName: string
}

const FAKE_OFFSET_DATA = { x: 1.2, y: 2.3, z: 4.4 } // TODO IMMEDIATELY: replace with real data when available
// Also, if offset data does not exist for a piece of labware, the offseet data should not be rendered at all
const LabwareInfo = (props: LabwareInfoProps): JSX.Element => {
  const { displayName } = props
  const { t } = useTranslation('protocol_setup')
  return (
    <Box
      flexDirection={'column'}
      backgroundColor={OVERLAY_BLACK_90}
      borderRadius={`0 0 0.4rem 0.4rem`}
      fontSize={FONT_SIZE_TINY}
      color={C_WHITE}
    >
      <Text margin={SPACING_1} >{displayName}</Text>
      <Text
        marginX={SPACING_1}
        fontWeight={FONT_WEIGHT_SEMIBOLD}
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
          {FAKE_OFFSET_DATA.x.toFixed(1)}
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
          {FAKE_OFFSET_DATA.y.toFixed(1)}
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
          {FAKE_OFFSET_DATA.z.toFixed(1)}
        </Text>
      </Box>
    </Box>
  )
}

interface LabwareInfoOverlayProps {
  definition: LabwareDefinition2
}
export const LabwareInfoOverlay = (
  props: LabwareInfoOverlayProps
): JSX.Element => {
  const { definition } = props
  const width = definition.dimensions.xDimension
  const height = definition.dimensions.yDimension
  return (
    <RobotCoordsForeignDiv
      x={0}
      y={0}
      {...{width, height }}
      innerDivProps={{
        display: DISPLAY_FLEX,
        flexDirection: DIRECTION_COLUMN,
        justifyContent: JUSTIFY_FLEX_END,
      }}
    >
      <LabwareInfo displayName={getLabwareDisplayName(definition)} />
    </RobotCoordsForeignDiv>
  )
}
