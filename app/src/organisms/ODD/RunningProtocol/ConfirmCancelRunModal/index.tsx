import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { COLORS, LegacyStyledText } from '@opentrons/components'
import {
  isDocumentedMutationError,
  useStopRunMutation,
} from '@opentrons/react-api-client'

import { SmallButton } from '/app/atoms/buttons'
import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { OddModal } from '/app/molecules/OddModal'
import { useTrackProtocolRunEvent } from '/app/redux-resources/analytics'
import { ANALYTICS_PROTOCOL_RUN_ACTION } from '/app/redux/analytics'
import { getLocalRobot } from '/app/redux/discovery'

import { CancelingRunModal } from '../CancelingRunModal'
import styles from './confirmcancelmodal.module.css'

import type { ReactNode } from 'react'
import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'

interface ConfirmCancelRunModalProps {
  runId: string
  setShowConfirmCancelRunModal: (showConfirmCancelRunModal: boolean) => void
  isActiveRun: boolean
}

export function ConfirmCancelRunModal({
  runId,
  setShowConfirmCancelRunModal,
  isActiveRun,
}: ConfirmCancelRunModalProps): ReactNode {
  const { t } = useTranslation(['run_details', 'shared'])
  const localRobot = useSelector(getLocalRobot)
  const robotName = localRobot?.name ?? ''
  const { trackProtocolRunEvent } = useTrackProtocolRunEvent(runId, robotName)
  const [isCanceling, setIsCanceling] = useState(false)

  const documentationState = useDocumentationState()
  const { stopRun } = useStopRunMutation(documentationState)

  const modalHeader: OddModalHeaderBaseProps = {
    title: t('cancel_run_modal_heading'),
    hasExitIcon: false,
    iconName: 'ot-alert',
    iconColor: COLORS.yellow50,
  }

  const handleCancelRun = (): void => {
    setIsCanceling(true)
    stopRun(runId, {
      onSuccess: () => {
        trackProtocolRunEvent({ name: ANALYTICS_PROTOCOL_RUN_ACTION.CANCEL })
      },
      onError: (error: unknown) => {
        if (isDocumentedMutationError(error)) {
          setIsCanceling(false)
        }
      },
    })
  }

  return isCanceling ? (
    <CancelingRunModal />
  ) : (
    <OddModal
      modalSize="medium"
      header={modalHeader}
      onOutsideClick={() => {
        setShowConfirmCancelRunModal(false)
      }}
    >
      <div className={styles.container}>
        <div
          className={`${styles.content} ${
            isActiveRun ? styles.active_run : styles.inactive_run
          }`}
        >
          <LegacyStyledText forwardedAs="p">
            {t('cancel_run_alert_info_flex')}
          </LegacyStyledText>
          <LegacyStyledText forwardedAs="p">
            {t('cancel_run_module_info')}
          </LegacyStyledText>
        </div>
        <div className={styles.button_row}>
          <SmallButton
            flex="1"
            buttonText={t('shared:go_back')}
            onClick={() => {
              setShowConfirmCancelRunModal(false)
            }}
          />
          <SmallButton
            flex="1"
            buttonType="alert"
            buttonText={t('cancel_run')}
            onClick={handleCancelRun}
          />
        </div>
      </div>
    </OddModal>
  )
}
