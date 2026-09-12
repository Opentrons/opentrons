import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { COLORS, StyledText } from '@opentrons/components'
import { useRestartMutation } from '@opentrons/react-api-client'

import { SmallButton } from '/app/atoms/buttons'
import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { OddModal } from '/app/molecules/OddModal'
import { ProtocolSetupFullSkeleton } from '/app/organisms/ODD/ProtocolSetup'

import styles from './runloading.module.css'

import type { ReactNode } from 'react'
import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'

const RUN_ERROR_TIMEOUT_DURATION = 30000 // 5 minutes

function RunLoadingError(): ReactNode {
  const { t } = useTranslation('protocol_setup')
  const modalHeader: OddModalHeaderBaseProps = {
    title: t('error_starting_run'),
    iconName: 'information',
    iconColor: COLORS.black90,
    hasExitIcon: true,
  }
  const documentationState = useDocumentationState()
  const navigate = useNavigate()
  const { restart, isLoading } = useRestartMutation(documentationState)

  return (
    <OddModal header={modalHeader} modalSize="medium">
      <div className={styles.run_loading_error_container}>
        <StyledText oddStyle="bodyTextRegular">
          {t('error_starting_run_description')}
        </StyledText>
        <div className={styles.run_loading_error_button_row}>
          <SmallButton
            onClick={() => {
              navigate('/dashboard')
            }}
            buttonType="secondary"
            buttonText={t('return_to_dashboard')}
            className={styles.run_loading_error_button}
          />
          <SmallButton
            onClick={() => {
              restart()
            }}
            buttonText={t('restart_robot')}
            buttonType="alert"
            iconName={isLoading ? 'ot-spinner' : null}
            iconPlacement="startIcon"
            disabled={isLoading}
            className={styles.run_loading_error_button}
          />
        </div>
      </div>
    </OddModal>
  )
}

export function RunLoading(): ReactNode {
  const [isTimedOut, setIsTimedOut] = useState(false)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsTimedOut(true)
    }, RUN_ERROR_TIMEOUT_DURATION)
    return () => {
      clearTimeout(timeout)
    }
  }, [])

  return (
    <>
      {isTimedOut ? <RunLoadingError /> : null} <ProtocolSetupFullSkeleton />
    </>
  )
}
