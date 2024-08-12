import * as React from 'react'
import { useSelector } from 'react-redux'
import { Trans, useTranslation } from 'react-i18next'

import {
  Flex,
  COLORS,
  SPACING,
  AlertPrimaryButton,
  JUSTIFY_FLEX_END,
  StyledText,
  PrimaryButton,
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
  const { handleGoBack, handleExit, mount } = props
  const { t } = useTranslation(['drop_tip_wizard', 'shared'])

  const isOnDevice = useSelector(getIsOnDevice)

  return (
    <SimpleWizardBody
      iconColor={COLORS.red50}
      header={t('remove_any_attached_tips')}
      isSuccess={false}
      subHeader={
        <StyledText
          desktopStyle="bodyDefaultRegular"
          oddStyle="level4HeaderRegular"
        >
          <Trans
            t={t}
            i18nKey="liquid_damages_this_pipette"
            values={{
              mount,
            }}
            components={{
              mount: <strong />,
            }}
          />
        </StyledText>
      }
      marginTop={isOnDevice ? '-2rem' : undefined}
    >
      {isOnDevice ? (
        <Flex
          width="100%"
          justifyContent={JUSTIFY_FLEX_END}
          gridGap={SPACING.spacing8}
        >
          <SmallButton
            buttonText={t('shared:go_back')}
            onClick={handleGoBack}
          />
          <SmallButton
            buttonType="alert"
            buttonText={t('exit_and_home_pipette')}
            onClick={handleExit}
            marginRight={SPACING.spacing4}
          />
        </Flex>
      ) : (
        <Flex
          width="100%"
          justifyContent={JUSTIFY_FLEX_END}
          gridGap={SPACING.spacing8}
        >
          <PrimaryButton onClick={handleGoBack} marginRight={SPACING.spacing4}>
            {t('shared:go_back')}
          </PrimaryButton>
          <AlertPrimaryButton onClick={handleExit}>
            {t('exit_and_home_pipette')}
          </AlertPrimaryButton>
        </Flex>
      )}
    </SimpleWizardBody>
  )
}
