import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  SPACING_AUTO,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

import { TertiaryButton } from '/app/atoms/buttons'
import { changeAuditLogDirectory, getAuditLogDirectory } from '/app/redux/audit'

import type { ReactNode } from 'react'
import type { Dispatch } from '/app/redux/types'

export function LogFolder(): ReactNode {
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
        <StyledText
          forwardedAs="h3"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          paddingBottom={SPACING.spacing8}
        >
          {t('log_folder_title')}
        </StyledText>
        <StyledText forwardedAs="p" paddingBottom={SPACING.spacing8}>
          {t('log_folder_description')}
        </StyledText>
        <StyledText
          forwardedAs="h6"
          textTransform={TYPOGRAPHY.textTransformUppercase}
          color={COLORS.grey50}
          paddingBottom={SPACING.spacing4}
        >
          {t('log_folder_location')}
        </StyledText>

        <StyledText forwardedAs="p">
          {logDirectory ?? t('no_log_folder')}
        </StyledText>
      </Flex>

      <TertiaryButton
        marginLeft={SPACING_AUTO}
        onClick={() => {
          dispatch(changeAuditLogDirectory())
        }}
      >
        {logDirectory !== null
          ? t('change_log_folder_button')
          : t('add_log_folder_button')}
      </TertiaryButton>
    </Flex>
  )
}
