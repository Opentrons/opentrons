import { useTranslation } from 'react-i18next'

import {
  AlertPrimaryButton,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_FLEX_END,
  JUSTIFY_SPACE_BETWEEN,
  Link,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

export interface ConfirmCrashRecoveryProps {
  back: () => unknown
  confirm: () => unknown
}

export function ConfirmCrashRecovery(
  props: ConfirmCrashRecoveryProps
): JSX.Element {
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
        <LegacyStyledText as="h1" marginBottom={SPACING.spacing16}>
          {t('start_over_question')}
        </LegacyStyledText>
        <LegacyStyledText as="p">
          {t('starting_over_loses_progress')}
        </LegacyStyledText>
        <LegacyStyledText as="p">
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
        <AlertPrimaryButton onClick={confirm}>
          {t('start_over')}
        </AlertPrimaryButton>
      </Flex>
    </Flex>
  )
}
