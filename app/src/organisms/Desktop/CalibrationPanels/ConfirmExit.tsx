import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { NeedHelpLink } from '/app/molecules/OT2CalibrationNeedHelpLink'

import type { ReactNode } from 'react'

interface ConfirmExitProps {
  back: () => void
  exit: () => void
  heading?: string
  body?: string
}

export function ConfirmExit(props: ConfirmExitProps): ReactNode {
  const { t } = useTranslation('shared')
  const { back, exit, heading, body } = props
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING.spacing32}
      minHeight="27rem"
    >
      <Flex
        flex="1"
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
      >
        <Icon
          name="ot-alert"
          size="2.5rem"
          color={COLORS.yellow50}
          marginBottom={SPACING.spacing24}
        />
        {heading != null ? (
          <LegacyStyledText forwardedAs="h1" marginBottom={SPACING.spacing8}>
            {heading}
          </LegacyStyledText>
        ) : null}
        {body != null ? (
          <LegacyStyledText forwardedAs="p">{body}</LegacyStyledText>
        ) : null}
      </Flex>
      <Flex
        flex="0"
        width="100%"
        marginTop={SPACING.spacing16}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
      >
        <NeedHelpLink />
        <Flex gridGap={SPACING.spacing8}>
          <SecondaryButton onClick={back}>{t('go_back')}</SecondaryButton>
          <PrimaryButton
            variant="warning"
            onClick={exit}
            textTransform={TYPOGRAPHY.textTransformCapitalize}
          >
            {t('exit')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </Flex>
  )
}
