import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { RUN_STATUS_STOPPED } from '@opentrons/api-client'
import { COLORS, LegacyStyledText } from '@opentrons/components'
import {
  useDismissCurrentRunMutation,
  useStopRunMutation,
} from '@opentrons/react-api-client'

import { SmallButton } from '/app/atoms/buttons'
import { OddModal } from '/app/molecules/OddModal'
import { useTrackProtocolRunEvent } from '/app/redux-resources/analytics'
import { ANALYTICS_PROTOCOL_RUN_ACTION } from '/app/redux/analytics'
import { getLocalRobot } from '/app/redux/discovery'
import { useNotifyRunQuery } from '/app/resources/runs'

import { CancelingRunModal } from '../CancelingRunModal'
import styles from './confirmcancelmodal.module.css'

import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'

interface ConfirmCancelRunModalProps {
  runId: string
  setShowConfirmCancelRunModal: (showConfirmCancelRunModal: boolean) => void
  isActiveRun: boolean
  protocolId?: string | null
}

export function ConfirmCancelRunModal({
  runId,
  setShowConfirmCancelRunModal,
  isActiveRun,
  protocolId,
}: ConfirmCancelRunModalProps): JSX.Element {
  const { t } = useTranslation(['run_details', 'shared'])
  const { stopRun } = useStopRunMutation()
  const { dismissCurrentRun, isLoading: isDismissing } =
    useDismissCurrentRunMutation()
  const localRobot = useSelector(getLocalRobot)
  const { data, isError: isRunFetchError } = useNotifyRunQuery(runId)
  const runStatus = data?.data.status
  const robotName = localRobot?.name ?? ''
  const { trackProtocolRunEvent } = useTrackProtocolRunEvent(runId, robotName)
  const navigate = useNavigate()
  const [isCanceling, setIsCanceling] = useState(false)

  const modalHeader: OddModalHeaderBaseProps = {
    title: t('cancel_run_modal_heading'),
    hasExitIcon: false,
    iconName: 'ot-alert',
    iconColor: COLORS.yellow50,
  }

  const handleCancelRun = (): void => {
    setIsCanceling(true)
    stopRun(runId, {
      onError: () => {
        setIsCanceling(false)
      },
    })
  }

  useEffect(
    () => {
      if (runStatus === RUN_STATUS_STOPPED || isRunFetchError) {
        trackProtocolRunEvent({ name: ANALYTICS_PROTOCOL_RUN_ACTION.CANCEL })
        if (!isActiveRun) {
          dismissCurrentRun(runId)
          if (protocolId != null) {
            navigate(`/protocols/${protocolId}`)
          } else {
            navigate('/protocols')
          }
        }
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [runStatus]
  )

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
