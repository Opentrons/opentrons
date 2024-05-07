import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { RecoveryFooterButtons } from './shared'

import type { RecoveryContentProps } from '../types'

export function ResumeRun({
  isOnDevice,
  onComplete,
  routeUpdateActions,
  chainRunCommands,
}: RecoveryContentProps): JSX.Element | null {
  const { t } = useTranslation('error_recovery')
  const { goBackPrevStep } = routeUpdateActions

  React.useEffect(() => {
    chainRunCommands(
      [
        {
          commandType: 'home' as const,
          params: {},
        },
      ],
      false
    )
  }, [])

  if (isOnDevice) {
    return (
      <Flex
        padding={SPACING.spacing32}
        gridGap={SPACING.spacing24}
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
        height="100%"
      >
        <Flex
          flexDirection={DIRECTION_COLUMN}
          alignItems={ALIGN_CENTER}
          gridGap={SPACING.spacing24}
          height="100%"
          width="848px"
        >
          <Icon name="ot-alert" size="3.75rem" marginTop={SPACING.spacing24} />
          <StyledText as="h3Bold">
            {t('are_you_sure_you_want_to_resume')}
          </StyledText>
          <StyledText as="h4" textAlign={ALIGN_CENTER}>
            {t('run_will_resume')}
          </StyledText>
        </Flex>
        <RecoveryFooterButtons
          isOnDevice={isOnDevice}
          primaryBtnOnClick={onComplete}
          secondaryBtnOnClick={goBackPrevStep}
          primaryBtnTextOverride={t('confirm')}
        />
      </Flex>
    )
  } else {
    return null
  }
}
