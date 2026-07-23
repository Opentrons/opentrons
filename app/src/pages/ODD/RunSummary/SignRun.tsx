import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from 'react-query'

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
  useSignRunMutation,
} from '@opentrons/react-api-client'

import { AccordionKeyboard } from '/app/atoms/AccordionKeyboard'
import { SmallButton } from '/app/atoms/buttons'
import { FullKeyboard } from '/app/atoms/SoftwareKeyboard'
import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
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

export function SignRun({ runId }: { runId: string }): JSX.Element {
  const { t, i18n } = useTranslation(['access_control', 'shared'])
  const [legalName, setLegalName] = useState('')
  const [hasNameMismatchError, setHasNameMismatchError] = useState(false)
  const [loginGate, setLoginGate] = useState<LoginGate>('idle')
  const [keyboardExpanded, setKeyboardExpanded] = useState(true)
  const keyboardRef = useRef<KeyboardReactInterface | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const host = useHost()

  const modalHeader: OddModalHeaderBaseProps = {
    title: t('sign_protocol_run'),
  }

  const documentationState = useDocumentationState()
  const { mutate: submitSignRun } = useSignRunMutation(documentationState)
  const { data: authSettings, isLoading: isAuthSettingsLoading } =
    useAuthSettingsQuery()
  const {
    data: self,
    isLoading: isSelfLoading,
    isFetching: isSelfFetching,
  } = useSelfQuery()
  const logout = useLogout()
  const { makeToast } = useToaster()

  const isLoading =
    isAuthSettingsLoading || isSelfLoading || documentationState.isLoading

  const isLoggedIn = !!self?.data?.username

  const requireAdmin =
    authSettings?.data.requireAdminCredsForSignoffProtocol === true
  const isAdmin = self?.data.accountType === 'admin'

  const canSignProtocol = !requireAdmin || isAdmin

  const trimmedLegalName = legalName.trim()

  useEffect(() => {
    if (inputRef.current != null) {
      inputRef.current.focus()
    }
    keyboardRef.current?.setInput(legalName)
  }, [legalName])

  const handleLegalNameChange = (value: string): void => {
    setLegalName(value)
    setHasNameMismatchError(false)
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
      if (host != null) {
        queryClient.removeQueries(getSelfQueryKey(host))
      }
      makeToast('' + t('sign_protocol_run_permission_required'), ERROR_TOAST, {
        closeButton: true,
        buttonText: i18n.format(t('shared:close'), 'capitalize'),
        disableTimeout: true,
        zIndex: TOAST_ABOVE_LOGIN_Z_INDEX,
      })
    }

    // if user is not signed in, prompt for login.
    // Do not overwrite 'done' — login success can seed /self and move the gate
    // to done before this finally runs.
    void showLoginModal().finally(() => {
      setLoginGate(current => (current === 'done' ? 'done' : 'querying'))
    })
    // Omit makeToast/t/i18n/logout: makeToast is recreated when toasts change,
    // which would re-run this effect when the permission toast is dismissed.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see above
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
    if (trimmedLegalName === '') {
      return
    }

    if (trimmedLegalName !== self?.data?.fullName) {
      setHasNameMismatchError(true)
      return
    }

    setHasNameMismatchError(false)
    submitSignRun({ runId, name: trimmedLegalName })
  }

  return (
    <>
      <OddModal header={modalHeader} className={styles.modal_container}>
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
                value={legalName}
                error={
                  hasNameMismatchError
                    ? t('sign_protocol_run_name_mismatch')
                    : null
                }
                borderRadius="var(--border-radius-8)"
                onBlur={event => {
                  event.target.focus()
                }}
                onChange={event => {
                  handleLegalNameChange(event.target.value)
                }}
              />
            </div>
            <div className={styles.button_row}>
              <SmallButton
                flex="1"
                buttonType="primary"
                buttonText={t('sign')}
                disabled={
                  trimmedLegalName === '' ||
                  isLoading ||
                  hasNameMismatchError ||
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
                handleLegalNameChange(input)
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
