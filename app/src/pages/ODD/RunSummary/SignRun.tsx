import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from 'react-query'
import cx from 'classnames'

import {
  ERROR_TOAST,
  Icon,
  StyledText,
  TouchInputField,
} from '@opentrons/components'
import {
  getSelfQueryKey,
  useAuthSettingsQuery,
  useHost,
  useSelfQuery,
} from '@opentrons/react-api-client'

import { AccordionKeyboard } from '/app/atoms/AccordionKeyboard'
import { SmallButton } from '/app/atoms/buttons'
import { FullKeyboard } from '/app/atoms/SoftwareKeyboard'
import { OddModal } from '/app/molecules/OddModal'
import { showLoginModal } from '/app/organisms/ODD/OnDeviceLogin/LoginModal'
import { useToaster } from '/app/organisms/ToasterOven'
import { useLogout } from '/app/redux/robot-auth'

import styles from './signrun.module.css'

import type { KeyboardReactInterface } from 'react-simple-keyboard'
import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'

// Above OnDeviceLogin overlay (z-index: 10001) so the toast is visible on login.
const TOAST_ABOVE_LOGIN_Z_INDEX = 10002

// login gate states to control login prompting
// idle: not prompting for login
// prompting: login prompting in flight
// querying: waiting for login to finish and self to settle
// done: login finished and self settled, and this account can sign
type LoginGate = 'idle' | 'prompting' | 'querying' | 'done'

export function SignRun({
  runId: _runId,
  onSigned,
}: {
  runId: string
  /** Called after client-side validation succeeds. Temporary until the sign endpoint ships. */
  onSigned: () => void
}): JSX.Element {
  const { t, i18n } = useTranslation(['access_control', 'shared'])

  const [name, setName] = useState('')
  const [nameError, setNameError] = useState(false)
  const [loginGate, setLoginGate] = useState<LoginGate>('idle')
  const [keyboardExpanded, setKeyboardExpanded] = useState(true)

  const keyboardRef = useRef<KeyboardReactInterface | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const permissionToastIdRef = useRef<string | null>(null)

  const queryClient = useQueryClient()
  const host = useHost()

  const modalHeader: OddModalHeaderBaseProps = {
    title: t('sign_protocol_run'),
  }

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

  const isLoggedIn = !!self?.data?.username

  const requireAdmin =
    authSettings?.data.requireAdminCredsForSignoffProtocol === true
  const isAdmin = self?.data.accountType === 'admin'

  const canSignProtocol = !requireAdmin || isAdmin

  const trimmedName = name.trim()

  useEffect(() => {
    if (inputRef.current != null) {
      inputRef.current.focus()
    }
    keyboardRef.current?.setInput(name)
  }, [name])

  const handleNameChange = (value: string): void => {
    setName(value)
    setNameError(false)
  }

  const handleKeyboardToggle = (): void => {
    setKeyboardExpanded(prev => !prev)
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
    // if user is not signed in and cannot sign, show permission toast and log out
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
    void showLoginModal().finally(() => {
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
    // Dismiss after FE validation only so the ODD post-run flow can be tested.
    onSigned()
  }

  return (
    <>
      <OddModal
        header={modalHeader}
        className={styles.modal_content}
        modalClassName={cx(styles.modal_container, {
          [styles.modal_container_keyboard_expanded]: keyboardExpanded,
        })}
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
          <>
            <div className={styles.form_section}>
              <StyledText oddStyle="bodyTextRegular">
                {t('sign_protocol_run_description')}
              </StyledText>
              <TouchInputField
                ref={inputRef}
                autoFocus
                type="text"
                label={t('legal_name')}
                value={name}
                error={nameError ? t('sign_protocol_run_name_mismatch') : null}
                borderRadius="var(--border-radius-8)"
                onChange={event => {
                  handleNameChange(event.target.value)
                }}
              />
            </div>
            <div className={styles.button_row}>
              <SmallButton
                flex="1"
                buttonType="primary"
                buttonText={t('sign')}
                disabled={
                  trimmedName === '' ||
                  isLoading ||
                  nameError ||
                  loginGate === 'prompting' ||
                  !canSignProtocol
                }
                onClick={handleSign}
              />
            </div>
          </>
        )}
      </OddModal>
      {!isLoading ? (
        <div className={styles.keyboard_container}>
          <AccordionKeyboard
            isOpen={keyboardExpanded}
            onToggle={handleKeyboardToggle}
          >
            <FullKeyboard
              onChange={(input: string) => {
                handleNameChange(input)
                inputRef.current?.focus()
              }}
              keyboardRef={keyboardRef}
            />
          </AccordionKeyboard>
        </div>
      ) : null}
    </>
  )
}
