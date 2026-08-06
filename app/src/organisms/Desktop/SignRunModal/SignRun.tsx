import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import NiceModal, { useModal } from '@ebay/nice-modal-react'
import clsx from 'clsx'

import {
  ERROR_TOAST,
  Icon,
  Modal,
  PrimaryButton,
  StyledText,
} from '@opentrons/components'

import { getTopPortalEl } from '/app/App/portal'
import { ApiHostProvider } from '/app/local-resources/api-host-provider/ApiHostProvider'
import { showLoginModal } from '/app/organisms/Desktop/LoginModal'
import { useToaster } from '/app/organisms/ToasterOven'
import { useCurrentRobotName } from '/app/redux/robot-auth'
import { useSignRunFlow } from '/app/resources/access-control/useSignRunFlow'
import { useCurrentRunId, useNotifyAllRunsQuery } from '/app/resources/runs'

import styles from './signrunmodal.module.css'

// Above typical desktop modal overlays so the toast remains visible on login.
const TOAST_ABOVE_LOGIN_Z_INDEX = 10002

export interface SignRunModalProps {
  runId: string
  robotName: string
  onSigned?: () => void
}

export function SignRunModal({
  runId,
  robotName,
  onSigned,
}: SignRunModalProps): JSX.Element {
  const { t, i18n } = useTranslation(['access_control', 'shared'])

  const [name, setName] = useState('')
  const [nameError, setNameError] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const permissionToastIdRef = useRef<string | null>(null)

  const { makeToast, eatToast: eatToasterToast } = useToaster()

  const popToast = (): void => {
    permissionToastIdRef.current = makeToast(
      '' + t('sign_protocol_run_permission_required'),
      ERROR_TOAST,
      {
        closeButton: true,
        buttonText: i18n.format(t('shared:close'), 'capitalize'),
        disableTimeout: true,
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

  const { signRun, isLoading, loginGate, correctName } = useSignRunFlow(
    runId,
    robotName,
    showLoginModal,
    popToast,
    eatToast,
    onSigned
  )

  const trimmedName = name.trim()

  // Focus only once login is settled — not while Login is layered above and
  // would lose keystrokes to this input.
  useEffect(() => {
    if (!isLoading && loginGate === 'done' && inputRef.current != null) {
      inputRef.current.focus()
    }
  }, [isLoading, loginGate])

  const handleNameChange = (value: string): void => {
    setName(value)
    setNameError(false)
  }

  const handleSign = (): void => {
    if (trimmedName === '') {
      return
    }

    if (trimmedName !== correctName) {
      setNameError(true)
      return
    }

    setNameError(false)
    signRun(trimmedName)
  }

  const footer = (
    <div className={styles.modal_footer_container}>
      <PrimaryButton
        onClick={handleSign}
        disabled={
          trimmedName === '' || isLoading || nameError || loginGate !== 'done'
        }
      >
        {t('sign')}
      </PrimaryButton>
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
                [styles.signature_field_error]: nameError,
              })}
            >
              <div className={styles.signature_input_wrap}>
                <input
                  ref={inputRef}
                  className={styles.signature_input}
                  type="text"
                  value={name}
                  placeholder={t('tap_to_sign')}
                  aria-label={t('legal_name')}
                  aria-invalid={nameError}
                  onChange={event => {
                    handleNameChange(event.target.value)
                  }}
                  onKeyDown={event => {
                    if (event.key === 'Enter') {
                      handleSign()
                    }
                  }}
                />
              </div>
            </div>
            {nameError ? (
              <span className={styles.signature_error_text} role="alert">
                {t('sign_protocol_run_name_mismatch')}
              </span>
            ) : null}
          </div>
        </div>
      )}
    </Modal>,
    getTopPortalEl()
  )
}

const SignRunModalImpl = NiceModal.create((): JSX.Element | null => {
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
      />
    </ApiHostProvider>
  )
})

function SignRunModalCurrentRun({
  robotName,
  onSigned,
}: {
  robotName: string
  onSigned: () => void
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
    <SignRunModal runId={runId} robotName={robotName} onSigned={onSigned} />
  )
}

/** Open the desktop sign-run modal and await whether the run was signed. */
export const showSignRunModal = (): Promise<boolean> =>
  NiceModal.show(SignRunModalImpl)
