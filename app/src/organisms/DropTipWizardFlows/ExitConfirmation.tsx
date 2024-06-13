import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  COLORS,
  SPACING,
  AlertPrimaryButton,
  SecondaryButton,
  JUSTIFY_FLEX_END,
} from '@opentrons/components'

import { getIsOnDevice } from '../../redux/config'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { SmallButton } from '../../atoms/buttons'

import type { DropTipWizardContainerProps } from './types'

type ExitConfirmationProps = DropTipWizardContainerProps & {
  handleExit: () => void
  handleGoBack: () => void
}

export function ExitConfirmation(props: ExitConfirmationProps): JSX.Element {
  const { handleGoBack, handleExit } = props
  const { i18n, t } = useTranslation(['drop_tip_wizard', 'shared'])

  const flowTitle = t('drop_tips')
  const isOnDevice = useSelector(getIsOnDevice)

  return (
    <SimpleWizardBody
      iconColor={COLORS.yellow50}
      header={t('exit_screen_title', { flow: flowTitle })}
      isSuccess={false}
    >
      {isOnDevice ? (
        <Flex
          width="100%"
          justifyContent={JUSTIFY_FLEX_END}
          gridGap={SPACING.spacing4}
        >
          <SmallButton
            buttonType="alert"
            buttonText={i18n.format(t('shared:exit'), 'capitalize')}
            onClick={handleExit}
            marginRight={SPACING.spacing4}
          />
          <SmallButton
            buttonText={t('shared:go_back')}
            onClick={handleGoBack}
          />
        </Flex>
      ) : (
        <>
          <SecondaryButton
            onClick={handleGoBack}
            marginRight={SPACING.spacing4}
          >
            {t('shared:go_back')}
          </SecondaryButton>
          <AlertPrimaryButton onClick={handleExit}>
            {i18n.format(t('shared:exit'), 'capitalize')}
          </AlertPrimaryButton>
        </>
      )}
    </SimpleWizardBody>
  )
}
