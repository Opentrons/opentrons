import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { RUN_STATUS_STOPPED } from '@opentrons/api-client'
import { COLORS, LegacyStyledText } from '@opentrons/components'
import {
  isDocumentedMutationError,
  useDismissCurrentRunMutation,
  useStopRunMutation,
} from '@opentrons/react-api-client'

import { SmallButton } from '/app/atoms/buttons'
import { useLinkedDocumentationState } from '/app/local-resources/access-control/useLinkedDocumentationState'
import { OddModal } from '/app/molecules/OddModal'
import { useTrackProtocolRunEvent } from '/app/redux-resources/analytics'
import { ANALYTICS_PROTOCOL_RUN_ACTION } from '/app/redux/analytics'
import { getLocalRobot } from '/app/redux/discovery'
import { useNotifyRunQuery } from '/app/resources/runs'

import { CancelingRunModal } from '../CancelingRunModal'
import styles from './confirmcancelmodal.module.css'

import type { DocumentedAction } from '@opentrons/react-api-client'
import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'

interface ConfirmCancelRunModalProps {
  runId: string
  setShowConfirmCancelRunModal: (showConfirmCancelRunModal: boolean) => void
  isActiveRun: boolean
  protocolId?: string | null
}

const ACTIVE_RUN_CANCEL_ACTIONS: DocumentedAction[] = ['stop_run']
const INACTIVE_RUN_CANCEL_ACTIONS: DocumentedAction[] = [
  'stop_run',
  'dismiss_run',
]

export function ConfirmCancelRunModal({
  runId,
  setShowConfirmCancelRunModal,
  isActiveRun,
  protocolId,
}: ConfirmCancelRunModalProps): JSX.Element {
  const { t } = useTranslation(['run_details', 'shared'])
  const localRobot = useSelector(getLocalRobot)
  const { data, isError: isRunFetchError } = useNotifyRunQuery(runId)
  const { status: runStatus, current: isRunCurrent } = data?.data ?? {}
  const robotName = localRobot?.name ?? ''
  const { trackProtocolRunEvent } = useTrackProtocolRunEvent(runId, robotName)
  const navigate = useNavigate()
  const [isCanceling, setIsCanceling] = useState(false)
  const dismissStartedRef = useRef(false)

  const { documentationState, clearDocreport } = useLinkedDocumentationState(
    isActiveRun ? ACTIVE_RUN_CANCEL_ACTIONS : INACTIVE_RUN_CANCEL_ACTIONS
  )
  const { stopRun } = useStopRunMutation(documentationState)
  const { dismissCurrentRun, isLoading: isDismissing } =
    useDismissCurrentRunMutation(documentationState)

  const modalHeader: OddModalHeaderBaseProps = {
    title: t('cancel_run_modal_heading'),
    hasExitIcon: false,
    iconName: 'ot-alert',
    iconColor: COLORS.yellow50,
  }

  const navigateAway = useCallback((): void => {
    if (protocolId != null) {
      navigate(`/protocols/${protocolId}`)
    } else {
      navigate('/protocols')
    }
  }, [protocolId, navigate])

  const dismissAndNavigate = useCallback((): void => {
    if (isActiveRun || dismissStartedRef.current) {
      return
    }
    dismissStartedRef.current = true
    setIsCanceling(true)
    dismissCurrentRun(runId, {
      onSuccess: () => {
        navigateAway()
      },
      onError: (error: unknown) => {
        clearDocreport()
        dismissStartedRef.current = false
        if (isDocumentedMutationError(error)) {
          setIsCanceling(false)
        } else {
          navigateAway()
        }
      },
    })
  }, [isActiveRun, dismissCurrentRun, runId, navigateAway, clearDocreport])

  const handleCancelRun = (): void => {
    setIsCanceling(true)
    stopRun(runId, {
      onSuccess: () => {
        trackProtocolRunEvent({ name: ANALYTICS_PROTOCOL_RUN_ACTION.CANCEL })
        dismissAndNavigate()
      },
      onError: (error: unknown) => {
        clearDocreport()
        if (isDocumentedMutationError(error)) {
          setIsCanceling(false)
        } else {
          dismissAndNavigate()
        }
      },
    })
  }

  useEffect(() => {
    if (
      runStatus === RUN_STATUS_STOPPED ||
      isRunFetchError ||
      isRunCurrent === false
    ) {
      dismissAndNavigate()
    }
  }, [runStatus, isRunCurrent, isRunFetchError, dismissAndNavigate])

  return isCanceling || isDismissing ? (
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
