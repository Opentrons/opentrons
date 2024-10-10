import { useTranslation } from 'react-i18next'
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  PrimaryButton,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { Slideout } from '/app/atoms/Slideout'

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
  const { i18n, t } = useTranslation(['device_details', 'shared', 'branded'])

  return (
    <Slideout
      title={t('branded:about_flex_gripper')}
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
            <LegacyStyledText
              as="h6"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              color={COLORS.grey60}
            >
              {i18n.format(t('current_version'), 'upperCase')}
            </LegacyStyledText>
            <LegacyStyledText
              as="p"
              paddingTop={SPACING.spacing4}
              paddingBottom={SPACING.spacing16}
            >
              {firmwareVersion}
            </LegacyStyledText>
          </>
        )}
        <LegacyStyledText
          as="h6"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          color={COLORS.grey60}
        >
          {i18n.format(t('serial_number'), 'upperCase')}
        </LegacyStyledText>
        <LegacyStyledText as="p" paddingTop={SPACING.spacing4}>
          {serialNumber}
        </LegacyStyledText>
      </Flex>
    </Slideout>
  )
}
