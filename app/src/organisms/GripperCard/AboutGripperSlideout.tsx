import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  DIRECTION_COLUMN,
  SPACING,
  PrimaryButton,
  TYPOGRAPHY,
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
  const { t } = useTranslation(['device_details', 'shared'])

  return (
    <Slideout
      title={t('about_flex_gripper')}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      footer={
        <PrimaryButton
          onClick={onCloseClick}
          width="100%"
          textTransform={TYPOGRAPHY.textTransformCapitalize}
          data-testid="AboutPipette_slideout_close"
        >
          {t('shared:close')}
        </PrimaryButton>
      }
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        {firmwareVersion != null && (
          <>
            <StyledText
              as="h6"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              color={COLORS.darkGreyEnabled}
              textTransform={TYPOGRAPHY.textTransformUppercase}
            >
              {t('current_version')}
            </StyledText>
            <StyledText
              as="p"
              paddingTop={SPACING.spacing4}
              paddingBottom={SPACING.spacing12}
            >
              {firmwareVersion}
            </StyledText>
          </>
        )}
        <StyledText
          as="h6"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          color={COLORS.darkGreyEnabled}
          textTransform={TYPOGRAPHY.textTransformUppercase}
        >
          {t('serial_number')}
        </StyledText>
        <StyledText as="p" paddingTop={SPACING.spacing4}>
          {serialNumber}
        </StyledText>
      </Flex>
    </Slideout>
  )
}
