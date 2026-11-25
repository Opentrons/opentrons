import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import {
  COLORS,
  DIRECTION_COLUMN,
  Divider,
  Flex,
  ListItem,
  ListItemDescriptor,
  RobotInfoLabel,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { getRobotType } from '/protocol-designer/file-data/selectors'

import type { ReactNode } from 'react'

export function CameraTools(): ReactNode {
  const { t, i18n } = useTranslation('protocol_overview')
  const robotType = useSelector(getRobotType)
  const isFlex = robotType === FLEX_ROBOT_TYPE
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing8}
      padding={SPACING.spacing16}
    >
      <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
        {i18n.format(t('camera'), 'capitalize')}
      </StyledText>

      <ListItem type="default" backgroundColor={COLORS.grey20}>
        <ListItemDescriptor
          type="large"
          description={
            <RobotInfoLabel
              deckLabel={i18n.format(t('on_deck'), 'upperCase')}
            />
          }
          content={
            <StyledText desktopStyle="bodyDefaultRegular">
              {isFlex ? t('flex_camera') : t('ot2_camera')}
            </StyledText>
          }
        />
      </ListItem>

      <Divider marginY="0" />

      <StyledText desktopStyle="bodyDefaultSemiBold">
        {i18n.format(t('camera_controls'))}
      </StyledText>

      <ListItem type="default" backgroundColor={COLORS.blue50}>
        <ListItemDescriptor
          type="large"
          description={<div />}
          content={
            <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.white}>
              {t('protocol_steps:camera.capture_image')}
            </StyledText>
          }
        />
      </ListItem>
    </Flex>
  )
}
