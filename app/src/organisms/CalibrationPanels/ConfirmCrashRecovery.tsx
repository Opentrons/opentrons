import * as React from 'react'

import {
  Flex,
  Link,
  SPACING,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_FLEX_END,
  TYPOGRAPHY,
  ALIGN_CENTER,
  TEXT_TRANSFORM_CAPITALIZE,
} from '@opentrons/components'
import { useTranslation } from 'react-i18next'
import { AlertPrimaryButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'

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
      padding={SPACING.spacing6}
      minHeight="25rem"
    >
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
        <StyledText as="h1" marginBottom={SPACING.spacing4}>
          {t('start_over_question')}
        </StyledText>
        <StyledText as="p">{t('starting_over_loses_progress')}</StyledText>
        <StyledText as="p">{t('if_tip_bent_replace_it')}</StyledText>
      </Flex>
      <Flex
        width="100%"
        marginTop={SPACING.spacing4}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_FLEX_END}
        gridGap={SPACING.spacing4}
      >
        <Link
          role="button"
          css={TYPOGRAPHY.darkLinkH4SemiBold}
          textTransform={TEXT_TRANSFORM_CAPITALIZE}
          onClick={back}>
          {t('shared:resume')}
        </Link >
        <AlertPrimaryButton onClick={confirm}>
          {t('start_over')}
        </AlertPrimaryButton>
      </Flex>
    </Flex>

  )
}
