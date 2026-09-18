import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import NiceModal, { useModal } from '@ebay/nice-modal-react'
import clsx from 'clsx'

import { StyledText, WARNING_TOAST } from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'
import { OddModal } from '/app/molecules/OddModal'
import { showLoginModal } from '/app/organisms/ODD/OnDeviceLogin/LoginModal'
import { useToaster } from '/app/organisms/ToasterOven'
import { useLocalRobotName } from '/app/redux-resources/robots/hooks/useLocalRobotName'
import { useSignRunFlow } from '/app/resources/access-control/useSignRunFlow'
import { useCurrentRunId, useNotifyAllRunsQuery } from '/app/resources/runs'

import styles from './signrun.module.css'

import type { DocumentationState } from '@opentrons/react-api-client'

// Above OnDeviceLogin overlay (z-index: 10001) so the toast is visible on login.
const TOAST_ABOVE_LOGIN_Z_INDEX = 10002

// Below the login (10001) and documentation (1002) modals, which layer above this one.
const MODAL_Z_INDEX = 1000

export function SignRun({
  runId,
  documentationState,
  onSigned,
}: {
  runId: string
  documentationState: DocumentationState
  onSigned?: () => void
}): JSX.Element {
  const { t, i18n } = useTranslation(['access_control', 'shared'])

  const permissionToastIdRef = useRef<string | null>(null)

  const robotName = useLocalRobotName() ?? 'no name'
  const { makeToast, eatToast: eatToasterToast } = useToaster()

  const [signed, setSigned] = useState(false)
  const [signError, setSignError] = useState(false)

  const popToast = (): void => {
    permissionToastIdRef.current = makeToast(
      '' + t('sign_protocol_run_permission_required_description'),
      WARNING_TOAST,
      {
        closeButton: true,
        buttonText: i18n.format(t('shared:close'), 'capitalize'),
        disableTimeout: true,
        heading: '' + t('sign_protocol_run_permission_required') + '.',
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

  const { signRun, isSigned, isLoading, loginGate, name } = useSignRunFlow(
    runId,
    robotName,
    // use a random key to rerender modal on logout and log back in
    showLoginModal,
    popToast,
    eatToast,
    documentationState,
    true,
    onSigned
  )

  useEffect(() => {
    if (isSigned) {
      onSigned?.()
    }
  }, [isSigned, onSigned])

  useEffect(() => {
    if (signed && loginGate !== 'done') {
      setSigned(false)
    }
  }, [loginGate, signed])

  const handleSign = (): void => {
    if (!signed) {
      setSignError(true)
      return
    }

    setSignError(false)
    signRun()
  }

  return (
    <OddModal
      header={{ title: t('sign_protocol_run') }}
      modalZIndex={MODAL_Z_INDEX}
      key={name}
    >
      <div className={styles.content_container}>
        <div className={styles.form_section}>
          <StyledText oddStyle="bodyTextRegular">
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
                  {signed ? name : t('tap_to_sign')}
                </span>
              </button>
              <span className={styles.signature_name}>{name ?? '  '}</span>
            </div>
            {signError ? (
              <span className={styles.signature_error_text} role="alert">
                {t('signature_required')}
              </span>
            ) : null}
          </div>
        </div>
        <SmallButton
          buttonText={t('submit')}
          onClick={handleSign}
          width="100%"
          iconName={isLoading ? 'ot-spinner' : undefined}
          iconPlacement={isLoading ? 'endIcon' : undefined}
          disabled={isLoading}
        />
      </div>
    </OddModal>
  )
}

const SignRunModalImpl = NiceModal.create(
  ({
    documentationState,
  }: {
    documentationState: DocumentationState
  }): JSX.Element | null => {
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
      <SignRun
        runId={runId}
        documentationState={documentationState}
        onSigned={() => {
          modal.resolve(true)
          modal.remove()
        }}
      />
    )
  }
)

/** Open the ODD sign-run modal and await whether the run was signed. */
export const showSignRunModal = (
  documentationState: DocumentationState
): Promise<boolean> => NiceModal.show(SignRunModalImpl, { documentationState })
