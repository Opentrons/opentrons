import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { RUN_STATUS_SUCCEEDED } from '@opentrons/api-client'
import { LegacyStyledText } from '@opentrons/components'
import { useStopRunMutation } from '@opentrons/react-api-client'

import { SmallButton } from '/app/atoms/buttons'
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
  const { stopRun } = useStopRunMutation()
  const [isCanceling, setIsCanceling] = useState(false)

  if (
    (errors == null || errors.length === 0) &&
    (commandErrorList == null || commandErrorList.data.length === 0)
  ) {
    return null
  }
  const getModalTitle = (): string => {
    if (commandErrorList == null || commandErrorList?.data.length === 0) {
      return t('run_failed_modal_title')
    }
    if (runStatus === RUN_STATUS_SUCCEEDED) {
      return t('warning_details')
    }
    return t('error_details')
  }
  const modalHeader: OddModalHeaderBaseProps = {
    title: getModalTitle(),
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
            errors={(() => {
              if (highestPriorityError) {
                return [highestPriorityError]
              }
              if (commandErrorList?.data && commandErrorList?.data.length > 0) {
                return commandErrorList?.data
              }
              return []
            })()}
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
