import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_FLEX_END,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  Link,
  PrimaryButton,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import type { ReactNode } from 'react'

export interface ConfirmCrashRecoveryProps {
  back: () => unknown
  confirm: () => unknown
}

export function ConfirmCrashRecovery(
  props: ConfirmCrashRecoveryProps
): ReactNode {
  const { back, confirm } = props
  const { t } = useTranslation(['robot_calibration', 'shared'])

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING.spacing32}
      minHeight="25rem"
    >
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
        <LegacyStyledText forwardedAs="h1" marginBottom={SPACING.spacing16}>
          {t('start_over_question')}
        </LegacyStyledText>
        <LegacyStyledText forwardedAs="p">
          {t('starting_over_loses_progress')}
        </LegacyStyledText>
        <LegacyStyledText forwardedAs="p">
          {t('if_tip_bent_replace_it')}
        </LegacyStyledText>
      </Flex>
      <Flex
        width="100%"
        marginTop={SPACING.spacing16}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_FLEX_END}
        gridGap={SPACING.spacing16}
      >
        <Link
          role="button"
          css={TYPOGRAPHY.darkLinkH4SemiBold}
          textTransform={TYPOGRAPHY.textTransformCapitalize}
          onClick={back}
        >
          {t('shared:resume')}
        </Link>
        <PrimaryButton variant="warning" onClick={confirm}>
          {t('start_over')}
        </PrimaryButton>
      </Flex>
    </Flex>
  )
}
