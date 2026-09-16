import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { COLORS, StyledText } from '@opentrons/components'
import { useRestartMutation } from '@opentrons/react-api-client'

import { SmallButton } from '/app/atoms/buttons'
import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { OddModal } from '/app/molecules/OddModal'

import styles from './protocolsetuploadingtimeoutmodal.module.css'

import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'

export const RUN_ERROR_TIMEOUT_DURATION_MS = 3 * 60 * 1000

interface ProtocolSetupLoadingTimeoutModalProps {
  onReturnToDashboard: () => void
  enabled?: boolean
}

export function ProtocolSetupLoadingTimeoutModal({
  onReturnToDashboard,
  enabled = true,
}: ProtocolSetupLoadingTimeoutModalProps): JSX.Element | null {
  const { t } = useTranslation(['protocol_setup', 'branded'])
  const documentationState = useDocumentationState()
  const { restart, isLoading: isRestarting } =
    useRestartMutation(documentationState)
  const [isTimedOut, setIsTimedOut] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setIsTimedOut(false)
      return
    }
    const timeout = setTimeout(() => {
      setIsTimedOut(true)
    }, RUN_ERROR_TIMEOUT_DURATION_MS)
    return () => {
      clearTimeout(timeout)
    }
  }, [enabled])

  if (!isTimedOut) {
    return null
  }

  const modalHeader: OddModalHeaderBaseProps = {
    title: t('error_starting_run'),
    iconName: 'information',
    iconColor: COLORS.yellow50,
    hasExitIcon: true,
  }

  return (
    <OddModal header={modalHeader} modalSize="medium">
      <div className={styles.container}>
        <StyledText oddStyle="bodyTextRegular">
          {`${t('error_starting_run_description')} ${t('branded:issue_persists_contact_support')}`}
        </StyledText>
        <div className={styles.button_row}>
          <SmallButton
            onClick={onReturnToDashboard}
            buttonType="primary"
            buttonText={t('return_to_dashboard')}
            className={styles.button}
          />
          <SmallButton
            onClick={() => {
              restart()
            }}
            buttonText={t('restart_robot')}
            buttonType="alert"
            iconName={isRestarting ? 'ot-spinner' : null}
            iconPlacement="startIcon"
            disabled={isRestarting}
            className={styles.button}
          />
        </div>
      </div>
    </OddModal>
  )
}
