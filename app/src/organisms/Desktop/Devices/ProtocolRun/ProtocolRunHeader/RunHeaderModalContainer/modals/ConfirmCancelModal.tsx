import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_FLEX_END,
  LegacyStyledText,
  Link,
  Modal,
  PrimaryButton,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useStopRunMutation } from '@opentrons/react-api-client'

import { getTopPortalEl } from '/app/App/portal'
import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { isStoppingOrStopped } from '/app/local-resources/runs/utils'
import { useTrackProtocolRunEvent } from '/app/redux-resources/analytics'
import { useIsFlex } from '/app/redux-resources/robots'
import { ANALYTICS_PROTOCOL_RUN_ACTION } from '/app/redux/analytics'

import type { MouseEventHandler, ReactNode } from 'react'
import type { RunStatus } from '@opentrons/api-client'

export interface UseConfirmCancelModalResult {
  showModal: boolean
  toggleModal: () => void
}

export function useConfirmCancelModal(): UseConfirmCancelModalResult {
  const [showModal, setShowModal] = useState(false)

  const toggleModal = (): void => {
    setShowModal(!showModal)
  }

  return { showModal, toggleModal }
}

export interface ConfirmCancelModalProps {
  onClose: () => unknown
  runId: string
  robotName: string
  runStatus: RunStatus | null
}

export function ConfirmCancelModal(props: ConfirmCancelModalProps): ReactNode {
  const { onClose, runId, robotName, runStatus } = props
  const documentationState = useDocumentationState()
  const { stopRun } = useStopRunMutation(documentationState)
  const isFlex = useIsFlex(robotName)
  const { trackProtocolRunEvent } = useTrackProtocolRunEvent(runId, robotName)
  const [isCanceling, setIsCanceling] = useState(false)
  const { t } = useTranslation('run_details')

  const cancelRunAlertInfo = isFlex
    ? t('cancel_run_alert_info_flex')
    : t('cancel_run_alert_info_ot2')

  const cancelRun: MouseEventHandler<HTMLButtonElement> = (e): void => {
    e.preventDefault()
    e.stopPropagation()
    setIsCanceling(true)
    stopRun(runId, {
      onSuccess: () => {
        trackProtocolRunEvent({ name: ANALYTICS_PROTOCOL_RUN_ACTION.CANCEL })
      },
      onError: () => {
        setIsCanceling(false)
      },
    })
  }

  useEffect(() => {
    if (isStoppingOrStopped(runStatus)) {
      onClose()
    }
  }, [runStatus, onClose])

  return createPortal(
    <Modal
      type="warning"
      onClose={isCanceling ? undefined : onClose}
      title={t('cancel_run_modal_heading')}
    >
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
        <LegacyStyledText forwardedAs="p">
          {cancelRunAlertInfo}
        </LegacyStyledText>
        <LegacyStyledText forwardedAs="p" marginBottom={SPACING.spacing24}>
          {t('cancel_run_module_info')}
        </LegacyStyledText>
        <Flex justifyContent={JUSTIFY_FLEX_END} alignItems={ALIGN_CENTER}>
          {isCanceling ? null : (
            <Link
              role="button"
              onClick={onClose}
              marginRight={SPACING.spacing24}
              css={TYPOGRAPHY.linkPSemiBold}
            >
              {t('cancel_run_modal_back')}
            </Link>
          )}
          <PrimaryButton
            variant="warning"
            onClick={cancelRun}
            disabled={isCanceling}
            minWidth="8rem"
          >
            {isCanceling ? (
              <Icon size={TYPOGRAPHY.fontSizeP} spin name="ot-spinner" />
            ) : (
              t('cancel_run_modal_confirm')
            )}
          </PrimaryButton>
        </Flex>
      </Flex>
    </Modal>,
    getTopPortalEl()
  )
}
