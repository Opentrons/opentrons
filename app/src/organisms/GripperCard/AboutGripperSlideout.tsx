import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  DIRECTION_COLUMN,
  SPACING,
  PrimaryButton,
  TYPOGRAPHY,
  LEGACY_COLORS,
  COLORS,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { Slideout } from '../../atoms/Slideout'

interface AboutGripperSlideoutProps {
  serialNumber: string
  firmwareVersion?: string
  onCloseClick: () => unknown
  isExpanded: boolean
}

export const AboutGripperSlideout = (
  props: AboutGripperSlideoutProps
): JSX.Element | null => {
  const { serialNumber, firmwareVersion, isExpanded, onCloseClick } = props
  const { i18n, t } = useTranslation(['device_details', 'shared'])

  return (
    <Slideout
      title={t('about_flex_gripper')}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      footer={
        <PrimaryButton
          onClick={onCloseClick}
          width="100%"
          data-testid="AboutPipette_slideout_close"
        >
          {i18n.format(t('shared:close'), 'capitalize')}
        </PrimaryButton>
      }
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        {firmwareVersion != null && (
          <>
            <StyledText
              as="h6"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              color={LEGACY_COLORS.darkGreyEnabled}
            >
              {i18n.format(t('current_version'), 'upperCase')}
            </StyledText>
            <StyledText
              as="p"
              paddingTop={SPACING.spacing4}
              paddingBottom={SPACING.spacing16}
            >
              {firmwareVersion}
            </StyledText>
          </>
        )}
        <StyledText
          as="h6"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          color={LEGACY_COLORS.darkGreyEnabled}
        >
          {i18n.format(t('serial_number'), 'upperCase')}
        </StyledText>
        <StyledText as="p" paddingTop={SPACING.spacing4}>
          {serialNumber}
        </StyledText>
      </Flex>
    </Slideout>
  )
}
