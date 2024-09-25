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

import type { AttachedPipette } from '/app/redux/pipettes/types'
import type { PipetteModelSpecs } from '@opentrons/shared-data'

interface AboutPipetteSlideoutProps {
  pipetteId: AttachedPipette['id']
  pipetteName: PipetteModelSpecs['displayName']
  firmwareVersion?: string
  onCloseClick: () => unknown
  isExpanded: boolean
}

export const AboutPipetteSlideout = (
  props: AboutPipetteSlideoutProps
): JSX.Element | null => {
  const {
    pipetteId,
    pipetteName,
    isExpanded,
    firmwareVersion,
    onCloseClick,
  } = props
  const { i18n, t } = useTranslation(['device_details', 'shared'])

  return (
    <Slideout
      title={t('about_pipette_name', { name: pipetteName })}
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
          data-testid={`AboutPipetteSlideout_serial_number_text_${pipetteId}`}
        >
          {i18n.format(t('serial_number'), 'upperCase')}
        </LegacyStyledText>
        <LegacyStyledText
          as="p"
          paddingTop={SPACING.spacing4}
          data-testid={`AboutPipetteSlideout_serial_${pipetteId}`}
        >
          {pipetteId}
        </LegacyStyledText>
      </Flex>
    </Slideout>
  )
}
