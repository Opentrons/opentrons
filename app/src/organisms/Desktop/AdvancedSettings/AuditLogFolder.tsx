import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  SPACING,
  SPACING_AUTO,
  TYPOGRAPHY,
} from '@opentrons/components'

import { TertiaryButton } from '/app/atoms/buttons'
import {
  changeAuditLogDirectory,
  getAuditLogDirectory,
} from '/app/redux/log-location'

import type { Dispatch } from '/app/redux/types'

export function AuditLogFolder(): JSX.Element {
  const { t } = useTranslation('app_settings')
  const dispatch = useDispatch<Dispatch>()
  const logDirectory = useSelector(getAuditLogDirectory)

  return (
    <Flex
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      gridGap={SPACING.spacing40}
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <LegacyStyledText
          css={TYPOGRAPHY.h3SemiBold}
          paddingBottom={SPACING.spacing8}
        >
          {t('audit_log_folder_title')}
        </LegacyStyledText>
        <LegacyStyledText forwardedAs="p" paddingBottom={SPACING.spacing8}>
          {t('audit_log_folder_description')}
        </LegacyStyledText>
        <LegacyStyledText
          forwardedAs="h6"
          textTransform={TYPOGRAPHY.textTransformUppercase}
          color={COLORS.grey50}
          paddingBottom={SPACING.spacing4}
        >
          {t('audit_log_folder_location')}
        </LegacyStyledText>

        <LegacyStyledText forwardedAs="p">
          {logDirectory ?? t('no_audit_log_folder')}
        </LegacyStyledText>
      </Flex>

      <TertiaryButton
        marginLeft={SPACING_AUTO}
        onClick={() => {
          dispatch(changeAuditLogDirectory())
        }}
      >
        {logDirectory !== null
          ? t('change_audit_log_folder_button')
          : t('add_audit_log_folder_button')}
      </TertiaryButton>
    </Flex>
  )
}
