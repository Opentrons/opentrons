import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { RUN_STATUS_SUCCEEDED } from '@opentrons/api-client'
import { LegacyStyledText } from '@opentrons/components'
import { useStopRunMutation } from '@opentrons/react-api-client'

import { SmallButton } from '/app/atoms/buttons'
import { useGuardedAction } from '/app/local-resources/access-control/useGuardedAction'
import { OddModal } from '/app/molecules/OddModal'
import { getHighestPriorityError } from '/app/transformations/runs'

import { ErrorContent } from './ErrorContent'
import styles from './runfailedmodal.module.css'

import type {
  RunCommandErrors,
  RunError,
  RunStatus,
} from '@opentrons/api-client'
import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'

interface RunFailedModalProps {
  runId: string
  setShowRunFailedModal: (showRunFailedModal: boolean) => void
  errors?: RunError[]
  commandErrorList?: RunCommandErrors
  runStatus: RunStatus | null
}

export function RunFailedModal({
  runId,
  setShowRunFailedModal,
  errors,
  commandErrorList,
  runStatus,
}: RunFailedModalProps): JSX.Element | null {
  const { t, i18n } = useTranslation(['run_details', 'shared', 'branded'])
  const navigate = useNavigate()
  const documentationState = useGuardedAction()
  const { stopRun } = useStopRunMutation(documentationState)
  const [isCanceling, setIsCanceling] = useState(false)

  if (
    (errors == null || errors.length === 0) &&
    (commandErrorList == null || commandErrorList.data.length === 0)
  ) {
    return null
  }
  const modalHeader: OddModalHeaderBaseProps = {
    title:
      commandErrorList == null || commandErrorList?.data.length === 0
        ? t('run_failed_modal_title')
        : runStatus === RUN_STATUS_SUCCEEDED
          ? t('warning_details')
          : t('error_details'),
  }

  const highestPriorityError = getHighestPriorityError(errors ?? [])

  const handleClose = (): void => {
    setIsCanceling(true)
    setShowRunFailedModal(false)
    stopRun(runId, {
      onSuccess: () => {
        // ToDo do we need to track this event?
        // If need, runCancel or runFailure something
        // trackProtocolRunEvent({ name: 'runCancel' })
        navigate('/dashboard')
      },
      onError: () => {
        setIsCanceling(false)
      },
    })
  }

  return (
    <OddModal
      header={modalHeader}
      onOutsideClick={() => {
        setShowRunFailedModal(false)
      }}
    >
      <div className={styles.container}>
        <div className={styles.error_content}>
          <ErrorContent
            errors={
              highestPriorityError
                ? [highestPriorityError]
                : commandErrorList?.data && commandErrorList?.data.length > 0
                  ? commandErrorList?.data
                  : []
            }
            isSingleError={!!highestPriorityError}
            runStatus={runStatus}
          />
        </div>
        <LegacyStyledText forwardedAs="p" className={styles.contact_text}>
          {t('branded:contact_information')}
        </LegacyStyledText>
        <SmallButton
          width="100%"
          buttonType="alert"
          buttonText={i18n.format(t('shared:close'), 'capitalize')}
          onClick={handleClose}
          disabled={isCanceling}
        />
      </div>
    </OddModal>
  )
}
