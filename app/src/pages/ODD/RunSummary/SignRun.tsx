import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import NiceModal, { useModal } from '@ebay/nice-modal-react'
import clsx from 'clsx'

import {
  ERROR_TOAST,
  Icon,
  StyledText,
  TouchInputField,
  TYPOGRAPHY,
} from '@opentrons/components'

import { AccordionKeyboard } from '/app/atoms/AccordionKeyboard'
import { FullKeyboard } from '/app/atoms/SoftwareKeyboard'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { showLoginModal } from '/app/organisms/ODD/OnDeviceLogin/LoginModal'
import { useToaster } from '/app/organisms/ToasterOven'
import { useLocalRobotName } from '/app/redux-resources/robots/hooks/useLocalRobotName'
import { useSignRunFlow } from '/app/resources/access-control/useSignRunFlow'
import { useCurrentRunId, useNotifyAllRunsQuery } from '/app/resources/runs'

import styles from './signrun.module.css'

import type { KeyboardReactInterface } from 'react-simple-keyboard'

// Above OnDeviceLogin overlay (z-index: 10001) so the toast is visible on login.
const TOAST_ABOVE_LOGIN_Z_INDEX = 10002

export function SignRun({
  runId,
  onSigned,
}: {
  runId: string
  onSigned?: () => void
}): JSX.Element {
  const { t, i18n } = useTranslation(['access_control', 'shared'])

  const [name, setName] = useState('')
  const [nameError, setNameError] = useState(false)
  const [keyboardExpanded, setKeyboardExpanded] = useState(true)

  const keyboardRef = useRef<KeyboardReactInterface | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const permissionToastIdRef = useRef<string | null>(null)

  const robotName = useLocalRobotName() ?? 'no name'
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
    async () => await showLoginModal(),
    popToast,
    eatToast,
    onSigned
  )

  const trimmedName = name.trim()

  const signDisabled =
    trimmedName === '' || isLoading || nameError || loginGate !== 'done'

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

  return (
    <>
      <div className={styles.container}>
        <ChildNavigation
          header={t('sign_protocol_run')}
          buttonText={t('sign')}
          onClickButton={handleSign}
          buttonIsDisabled={signDisabled}
        />
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
          <div
            className={clsx(styles.content_container, {
              [styles.content_container_keyboard_expanded]: keyboardExpanded,
              [styles.content_container_keyboard_collapsed]: !keyboardExpanded,
            })}
          >
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
                textAlign={TYPOGRAPHY.textAlignCenter}
                borderRadius="var(--border-radius-8)"
                onChange={event => {
                  handleNameChange(event.target.value)
                }}
              />
            </div>
          </div>
        )}
      </div>
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

const SignRunModalImpl = NiceModal.create((): JSX.Element | null => {
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
    <div className={styles.overlay}>
      <SignRun
        runId={runId}
        onSigned={() => {
          modal.resolve(true)
          modal.remove()
        }}
      />
    </div>
  )
})

/** Open the ODD sign-run modal and await whether the run was signed. */
export const showSignRunModal = (): Promise<boolean> =>
  NiceModal.show(SignRunModalImpl)
