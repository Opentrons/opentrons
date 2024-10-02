import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { getTopPortalEl } from '/app/App/portal'
import { OddModal } from '/app/molecules/OddModal'

export function OpenDoorAlertModal(): JSX.Element {
  const { t } = useTranslation('run_details')
  return createPortal(
    <OddModal>
      <Flex
        backgroundColor={COLORS.grey35}
        borderRadius={BORDERS.borderRadius12}
        flexDirection={DIRECTION_COLUMN}
        padding={SPACING.spacing24}
        alignItems={ALIGN_CENTER}
        gridGap={SPACING.spacing16}
        width="100%"
        justifyContent={JUSTIFY_CENTER}
      >
        <Icon name="ot-alert" size="2.5rem" />
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing4}
          alignItems={ALIGN_CENTER}
          width="100%"
        >
          <LegacyStyledText as="h4" fontWeight={TYPOGRAPHY.fontWeightBold}>
            {t('door_is_open')}
          </LegacyStyledText>
          <LegacyStyledText
            as="p"
            textAlign={TYPOGRAPHY.textAlignCenter}
            color={COLORS.grey60}
          >
            {t('close_door_to_resume_run')}
          </LegacyStyledText>
        </Flex>
      </Flex>
    </OddModal>,
    getTopPortalEl()
  )
}
