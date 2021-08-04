import * as React from 'react'
import { useTranslation } from 'react-i18next'
import cx from 'classnames'
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
} from '@opentrons/components'
import styles from './styles.css'

interface LabwareInfoProps {
  displayName: string
}

const FAKE_OFFSET_DATA = { x: 0.0, y: 0.0, z: 0.0 } // TODO IMMEDIATELY: replace with real data when available
const LabwareInfo = (props: LabwareInfoProps): JSX.Element => {
  const { displayName } = props
  const { t } = useTranslation('protocol_setup')
  return (
    <Box
      flexDirection={'column'}
      backgroundColor={OVERLAY_BLACK_90}
      fontSize={'0.5rem'}
      color={C_WHITE}
    >
      <Text margin={SPACING_1}>{displayName}</Text>
      <Text
        margin={SPACING_1}
        fontWeight={FONT_WEIGHT_SEMIBOLD}
        textTransform={'uppercase'}
      >
        {t('offset_data')}
      </Text>
      <Box margin={SPACING_1}>
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
          marginRight={'0.15rem'}
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
          marginRight={'0.15rem'}
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
          marginRight={'0.15rem'}
        >
          {FAKE_OFFSET_DATA.z.toFixed(1)}
        </Text>
      </Box>
    </Box>
  )
}

interface LabwareInfoOverlayProps {
  x: number
  y: number
  definition: LabwareDefinition2
}
export const LabwareInfoOverlay = (
  props: LabwareInfoOverlayProps
): JSX.Element => {
  const { x, y, definition } = props
  const width = definition.dimensions.xDimension
  const height = definition.dimensions.yDimension
  return (
    <RobotCoordsForeignDiv
      {...{ x, y, width, height }}
      innerDivProps={{
        className: cx(styles.labware_info_overlay),
      }}
    >
      <LabwareInfo displayName={getLabwareDisplayName(definition)} />
    </RobotCoordsForeignDiv>
  )
}
