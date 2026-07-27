import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from 'react-query'
import clsx from 'clsx'

import {
  ERROR_TOAST,
  Icon,
  Modal,
  PrimaryButton,
  StyledText,
} from '@opentrons/components'
import {
  getSelfQueryKey,
  useAuthSettingsQuery,
  useHost,
  useSelfQuery,
} from '@opentrons/react-api-client'

import { getTopPortalEl } from '/app/App/portal'
import { showLoginModal } from '/app/organisms/Desktop/LoginModal'
import { useToaster } from '/app/organisms/ToasterOven'
import { useLogout } from '/app/redux/robot-auth'

import styles from './signrunmodal.module.css'

// Above typical desktop modal overlays so the toast remains visible on login.
const TOAST_ABOVE_LOGIN_Z_INDEX = 10002

// login gate states to control login prompting
// idle: not prompting for login
// prompting: login prompting in flight
// querying: waiting for login to finish and self to settle
// done: login finished and self settled, and this account can sign
type LoginGate = 'idle' | 'prompting' | 'querying' | 'done'

export interface SignRunModalProps {
  runId: string
  robotName: string
  /** Called after client-side validation succeeds. Temporary until the sign endpoint ships. */
  onSigned: () => void
}

export function SignRunModal({
  runId: _runId,
  robotName,
  onSigned,
}: SignRunModalProps): JSX.Element {
  const { t, i18n } = useTranslation(['access_control', 'shared'])
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState(false)
  const [loginGate, setLoginGate] = useState<LoginGate>('idle')
  const inputRef = useRef<HTMLInputElement>(null)
  const permissionToastIdRef = useRef<string | null>(null)
  const queryClient = useQueryClient()
  const host = useHost()

  const { data: authSettings, isLoading: isAuthSettingsLoading } =
    useAuthSettingsQuery()
  const {
    data: self,
    isLoading: isSelfLoading,
    isFetching: isSelfFetching,
  } = useSelfQuery()
  const logout = useLogout()
  const { makeToast, eatToast } = useToaster()

  const isLoading = isAuthSettingsLoading || isSelfLoading

  const isLoggedIn = self?.data?.username != null && self.data.username !== ''

  const requireAdmin =
    authSettings?.data.requireAdminCredsForSignoffProtocol === true
  const isAdmin = self?.data.accountType === 'admin'

  const canSignProtocol = !requireAdmin || isAdmin

  const trimmedName = name.trim()

  useEffect(() => {
    if (!isLoading && inputRef.current != null) {
      inputRef.current.focus()
    }
  }, [isLoading])

  const handleNameChange = (value: string): void => {
    setName(value)
    setNameError(false)
  }

  useEffect(() => {
    // The self query key omits the access token, so after login the previous
    // user can remain cached until refetch finishes. Wait for that settle
    // before deciding to prompt again — otherwise we log the new admin out.
    if (isLoading || isSelfFetching) {
      return
    }

    // if logged in and can sign, set login gate to done and return
    if (isLoggedIn && canSignProtocol) {
      if (permissionToastIdRef.current != null) {
        eatToast(permissionToastIdRef.current)
        permissionToastIdRef.current = null
      }
      if (loginGate !== 'done') {
        setLoginGate('done')
      }
      return
    }

    // if prompting is in flight, or login is done, return
    if (loginGate === 'prompting' || loginGate === 'done') {
      return
    }

    // if querying has settled, check if user is all set
    // if user is signed in and can sign, set login gate to done
    // if user is signed in and cannot sign, set login gate to idle
    if (loginGate === 'querying') {
      setLoginGate(isLoggedIn && !canSignProtocol ? 'idle' : 'done')
      return
    }

    const shouldShowPermissionToast = isLoggedIn && !canSignProtocol

    setLoginGate('prompting')
    // if user is signed in and cannot sign, show permission toast and log out
    if (shouldShowPermissionToast) {
      logout()
      // clear cached self query data to push through logout
      if (host != null) {
        queryClient.removeQueries(getSelfQueryKey(host))
      }
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

    // if user is not signed in, prompt for login.
    // Do not overwrite 'done' — login success can seed /self and move the gate
    // to done before this finally runs.
    void showLoginModal({ robotName }).finally(() => {
      setLoginGate(current => (current === 'done' ? 'done' : 'querying'))
    })
    // Omit makeToast/eatToast/t/i18n/logout: toaster fns are recreated when
    // toasts change, which would re-run this effect when the toast is dismissed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isLoading,
    isSelfFetching,
    isLoggedIn,
    canSignProtocol,
    loginGate,
    host,
    queryClient,
    robotName,
  ])

  const handleSign = (): void => {
    if (trimmedName === '') {
      return
    }

    if (trimmedName !== self?.data?.fullName) {
      setNameError(true)
      return
    }

    setNameError(false)
    // TODO(jj, 2026-07-27): Restore submitSignRun({ runId, name: trimmedName })
    // with onSuccess: onSigned once POST /runs/{id}/sign is implemented.
    // Dismiss after FE validation only so the desktop post-run flow can be tested.
    onSigned()
  }

  const footer = (
    <div className={styles.modal_footer_container}>
      <PrimaryButton
        onClick={handleSign}
        disabled={
          trimmedName === '' ||
          isLoading ||
          nameError ||
          loginGate === 'prompting' ||
          !canSignProtocol
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
                  autoFocus
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
