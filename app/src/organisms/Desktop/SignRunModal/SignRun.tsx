import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import NiceModal, { useModal } from '@ebay/nice-modal-react'
import clsx from 'clsx'

import {
  BasicButton,
  Icon,
  Modal,
  PrimaryButton,
  StyledText,
  WARNING_TOAST,
} from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import { ApiHostProvider } from '/app/local-resources/api-host-provider/ApiHostProvider'
import { showLoginModal } from '/app/organisms/Desktop/LoginModal'
import { useToaster } from '/app/organisms/ToasterOven'
import { useCurrentRobotName } from '/app/redux/robot-auth'
import { useSignRunFlow } from '/app/resources/access-control/useSignRunFlow'
import { useCurrentRunId, useNotifyAllRunsQuery } from '/app/resources/runs'

import styles from './signrunmodal.module.css'

import type { DocumentationState } from '@opentrons/react-api-client'

// Above typical desktop modal overlays so the toast remains visible on login.
const TOAST_ABOVE_LOGIN_Z_INDEX = 10002

export interface SignRunModalProps {
  runId: string
  robotName: string
  documentationState: DocumentationState
  onSigned?: () => void
}

export function SignRunModal({
  runId,
  robotName,
  documentationState,
  onSigned,
}: SignRunModalProps): JSX.Element {
  const { t, i18n } = useTranslation(['access_control', 'shared'])

  const permissionToastIdRef = useRef<string | null>(null)

  const [signed, setSigned] = useState(false)
  const [signError, setSignError] = useState(false)

  const { makeToast, eatToast: eatToasterToast } = useToaster()

  const popToast = (): void => {
    permissionToastIdRef.current = makeToast(
      '' + t('sign_protocol_run_permission_required_description'),
      WARNING_TOAST,
      {
        closeButton: true,
        buttonText: i18n.format(t('shared:close'), 'capitalize'),
        disableTimeout: true,
        heading: '' + t('sign_protocol_run_permission_required'),
        zIndex: TOAST_ABOVE_LOGIN_Z_INDEX,
      }
    )
  }

  const eatToast = (): void => {
    if (permissionToastIdRef.current != null) {
      eatToasterToast(permissionToastIdRef.current)
      permissionToastIdRef.current = null
    }
  }

  const { signRun, isLoading, loginGate, name, logout } = useSignRunFlow(
    runId,
    robotName,
    showLoginModal,
    popToast,
    eatToast,
    documentationState,
    false,
    onSigned
  )

  const handleSign = (): void => {
    if (!signed) {
      setSignError(true)
      return
    }

    setSignError(false)
    signRun()
  }

  useEffect(() => {
    if (signed && loginGate !== 'done') {
      setSigned(false)
    }
  }, [loginGate, signed])

  const footer = (
    <div className={styles.modal_footer_container}>
      <BasicButton
        type="button"
        underLine
        onClick={() => {
          setSigned(false)
          setSignError(false)
          logout()
        }}
      >
        {t('log_out')}
      </BasicButton>
      <PrimaryButton onClick={handleSign}>{t('submit')}</PrimaryButton>
    </div>
  )

  return createPortal(
    <Modal
      title={t('sign_protocol_run')}
      closeOnOutsideClick={false}
      zIndexOverlay={1000}
      childrenPadding="var(--spacing-24)"
      footer={isLoading ? null : footer}
    >
      {isLoading ? (
        <div className={styles.loading_container}>
          <Icon
            name="ot-spinner"
            className={styles.spinner}
            aria-label="spinner"
            spin
          />
        </div>
      ) : (
        <div className={styles.content_container}>
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('sign_protocol_run_description')}
          </StyledText>
          <div className={styles.signature_field_container}>
            <div
              className={clsx(styles.signature_field, {
                [styles.signature_field_error]: signError,
              })}
            >
              <button
                type="button"
                className={styles.signature_input_wrap}
                aria-label={t('legal_name')}
                aria-invalid={signError}
                onClick={() => {
                  if (loginGate === 'done') {
                    setSigned(true)
                    setSignError(false)
                  }
                }}
              >
                <span
                  className={clsx(styles.signature_text, {
                    [styles.signature_text_signed]: signed,
                  })}
                >
                  {signed ? name : t('click_to_sign')}
                </span>
              </button>
              <span className={styles.signature_name}>{name}</span>
            </div>
            {signError ? (
              <span className={styles.signature_error_text} role="alert">
                {t('signature_required')}
              </span>
            ) : null}
          </div>
        </div>
      )}
    </Modal>,
    getTopPortalEl()
  )
}

const SignRunModalImpl = NiceModal.create(
  ({
    documentationState,
  }: {
    documentationState: DocumentationState
  }): JSX.Element | null => {
    const modal = useModal()
    const robotName = useCurrentRobotName()

    useEffect(() => {
      if (robotName == null) {
        modal.resolve(false)
        modal.remove()
      }
    }, [modal, robotName])

    if (robotName == null) {
      return null
    }

    return (
      <ApiHostProvider robotName={robotName}>
        <SignRunModalCurrentRun
          robotName={robotName}
          onSigned={() => {
            modal.resolve(true)
            modal.remove()
          }}
          documentationState={documentationState}
        />
      </ApiHostProvider>
    )
  }
)

function SignRunModalCurrentRun({
  robotName,
  onSigned,
  documentationState,
}: {
  robotName: string
  onSigned: () => void
  documentationState: DocumentationState
}): JSX.Element | null {
  const modal = useModal()
  const runId = useCurrentRunId()
  const { isFetched } = useNotifyAllRunsQuery({ pageLength: 0 })

  useEffect(() => {
    if (isFetched && runId == null) {
      modal.resolve(false)
      modal.remove()
    }
  }, [isFetched, modal, runId])

  if (runId == null) {
    return null
  }

  return (
    <SignRunModal
      runId={runId}
      robotName={robotName}
      documentationState={documentationState}
      onSigned={onSigned}
    />
  )
}

/** Open the desktop sign-run modal and await whether the run was signed. */
export const showSignRunModal = (
  documentationState: DocumentationState
): Promise<boolean> => NiceModal.show(SignRunModalImpl, { documentationState })
