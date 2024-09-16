import * as React from 'react'
import { useSelector } from 'react-redux'
import { Trans, useTranslation } from 'react-i18next'

import { COLORS, StyledText } from '@opentrons/components'

import { getIsOnDevice } from '../../redux/config'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { DropTipFooterButtons } from './shared'

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
      <DropTipFooterButtons
        primaryBtnOnClick={handleExit}
        secondaryBtnOnClick={handleGoBack}
        primaryBtnTextOverride={t('exit_and_home_pipette')}
        primaryBtnStyle="alertStyle"
      />
    </SimpleWizardBody>
  )
}
