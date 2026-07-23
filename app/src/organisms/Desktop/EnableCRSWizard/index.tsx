import { useCallback, useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
} from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import NiceModal, { useModal } from '@ebay/nice-modal-react'

import {
  AlertPrimaryButton,
  Icon,
  InlineNotification,
  InputField,
  ModalShell,
  PrimaryButton,
  SecondaryButton,
  StyledText,
  WizardHeader,
} from '@opentrons/components'
import { useHost } from '@opentrons/react-api-client'

import { getTopPortalEl } from '/app/App/portal'
import { ApiHostProvider } from '/app/local-resources/api-host-provider/ApiHostProvider'
import { useRobot } from '/app/redux-resources/robots'
import { getRobotSerialNumber } from '/app/redux/discovery'
import { useUpdateClientDataEncryptionKeys } from '/app/resources/client_data/encryptionKeys'

import { useHandleRobotCertImport } from '../RobotCertImport/useHandleRobotCertImport'
import styles from './enablecrswizard.module.css'
import { generatePassword } from './generatePassword'
import { useEnableCRSMutation } from './useEnableCRSMutation'

import type { ReactNode } from 'react'

const WIZARD_MODAL_WIDTH = '31.25rem'
const SERVICE_ACCOUNT_USERNAME = 'service'
const SERVICE_ACCOUNT_FULL_NAME = 'Service Account (created by system)'
const RECOVERY_ACCOUNT_USERNAME = 'recovery'
const RECOVERY_ACCOUNT_FULL_NAME = 'Recovery Account (created by system)'

interface FormValues {
  servicePIN: string
  adminUsername: string
  adminLegalName: string
  password: string
  confirmPassword: string
}

interface CommonPageProps {
  header: ReactNode
  onBack: () => void
  onNext: () => void
  serviceAccountPassword: string
  recoveryAccountPassword: string
}

export interface EnableCRSWizardProps {
  robotName: string
}

export const handleEnableCRSWizard = (props: EnableCRSWizardProps): void => {
  void NiceModal.show(EnableCRSWizard, props)
}

const EnableCRSWizard = NiceModal.create(
  (props: EnableCRSWizardProps): JSX.Element => {
    const { robotName } = props
    const modal = useModal()
    const { t } = useTranslation('access_control')
    const [currentStepIndex, setCurrentStepIndex] = useState(0)

    // Generate passwords when the wizard opens and keep them static even when the user
    // navigates back and forth between pages.
    const [serviceAccountPassword] = useState(generatePassword)
    const [recoveryAccountPassword] = useState(generatePassword)

    const onClose = (): void => {
      modal.remove()
    }

    const formMethods = useForm<FormValues>({
      defaultValues: {
        servicePIN: '',
        adminUsername: '',
        adminLegalName: '',
        password: '',
        confirmPassword: '',
      },
      // The default mode onSubmit would only validate
      // at the very end of the entire wizard.
      mode: 'onBlur',
    })

    const handleNext = (): void => {
      if (currentStepIndex === STEP_PAGES.length - 1) {
        onClose()
      } else {
        setCurrentStepIndex(currentStepIndex + 1)
      }
    }

    const handleBack = (): void => {
      if (currentStepIndex === 0) {
        onClose()
      } else {
        setCurrentStepIndex(currentStepIndex - 1)
      }
    }

    const header = (
      <WizardHeader
        title={
          currentStepIndex === 0
            ? t('setup_wizard_enable_title')
            : t('setup_wizard_setup_title')
        }
        onExit={onClose}
        currentStep={currentStepIndex + 1}
        totalSteps={STEP_PAGES.length}
        hideStepText
      />
    )

    const pageProps: CommonPageProps = {
      recoveryAccountPassword,
      serviceAccountPassword,
      header,
      onBack: handleBack,
      onNext: handleNext,
    }

    const Page = STEP_PAGES[currentStepIndex]

    // todo(mm, 2026-07-22):
    // Each page renders as its own ModalShell, as opposed to swapping out the contents
    // inside one ModalShell. This is good because it gives each page control over its
    // own buttons in the ModalShell `footer`, but bad because it makes the progress
    // bar at the top of the modal not animate across pages it should. I don't know
    // how to fix this without intrusive ModalShell refactors or some portal BS.
    return createPortal(
      <ApiHostProvider robotName={robotName}>
        <FormProvider {...formMethods}>
          <Page {...pageProps} />
        </FormProvider>
      </ApiHostProvider>,
      getTopPortalEl()
    )
  }
)

function EnterServicePINPage({
  header,
  onBack,
  onNext,
}: CommonPageProps): JSX.Element {
  const { t } = useTranslation(['access_control', 'shared'])
  const { control, trigger } = useFormContext<FormValues>()
  const formId = useId()

  const serialNumber = useSerialNumber()
  const validate = useCallback(
    (candidateServicePIN: string): string | true => {
      if (serialNumber == null) {
        return t('setup_wizard_service_pin_internal_error')
      } else if (!isCorrectServicePIN(candidateServicePIN, serialNumber)) {
        return t('setup_wizard_service_pin_incorrect')
      } else {
        return true
      }
    },
    [t, serialNumber]
  )

  return (
    <ModalShell
      width={WIZARD_MODAL_WIDTH}
      header={header}
      footer={
        <div className={styles.footer}>
          <SecondaryButton onClick={onBack}>
            {t('shared:cancel')}
          </SecondaryButton>
          <AlertPrimaryButton type="submit" form={formId}>
            {t('setup_wizard_confirm_enable')}
          </AlertPrimaryButton>
        </div>
      }
    >
      <form
        id={formId}
        onSubmit={event => {
          event.preventDefault()
          void trigger('servicePIN').then(isValid => {
            if (isValid) {
              onNext()
            }
          })
        }}
        className={styles.content}
      >
        <div className={styles.step_body}>
          <InlineNotification
            type="error"
            heading={t('setup_wizard_permanent_heading')}
            message={t('setup_wizard_permanent_message')}
          />
          <div className={styles.text_block}>
            <StyledText desktopStyle="headingSmallBold">
              {t('setup_wizard_service_pin_title')}
            </StyledText>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('branded:setup_wizard_service_pin_description')}
            </StyledText>
          </div>
          <Controller
            name="servicePIN"
            control={control}
            rules={{ validate }}
            render={({ field, fieldState }) => (
              <InputField
                type="password"
                title={t('setup_wizard_service_pin_field_label')}
                autoFocus
                error={fieldState.error?.message}
                {...field}
              />
            )}
          />
        </div>
      </form>
    </ModalShell>
  )
}

function VerifyRobotEncryptionKeyPage({
  header,
  onNext,
}: CommonPageProps): JSX.Element {
  const { t } = useTranslation(['access_control', 'device_settings', 'shared'])
  const formId = useId()

  // Ask the ODD to show the encryption key while this page is open.
  const { requestKeyDisplay, clearKeyDisplay } =
    useUpdateClientDataEncryptionKeys()
  useEffect(
    () => {
      const requestKey = requestKeyDisplay()
      return () => {
        clearKeyDisplay(requestKey)
      }
    },
    // Run on mount/unmount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const {
    passwordValue,
    setPasswordValue,
    passwordError,
    importInProgress,
    tryImport,
  } = useHandleRobotCertImport({
    onSuccessfulImport: onNext,
  })

  return (
    <ModalShell
      width={WIZARD_MODAL_WIDTH}
      header={header}
      footer={
        <div className={styles.footer}>
          <PrimaryButton
            type="submit"
            form={formId}
            disabled={importInProgress}
          >
            {t('shared:next')}
          </PrimaryButton>
        </div>
      }
    >
      <form
        id={formId}
        onSubmit={event => {
          event.preventDefault()
          tryImport()
        }}
        className={styles.content}
      >
        <div className={styles.step_body}>
          <div className={styles.text_block}>
            <StyledText desktopStyle="headingSmallBold">
              {t('setup_wizard_verify_encryption_key_title')}
            </StyledText>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('setup_wizard_verify_encryption_key_description')}
            </StyledText>
          </div>
          <InputField
            title={t('device_settings:robot_encryption_key')}
            autoFocus
            value={passwordValue}
            onChange={e => {
              setPasswordValue(e.target.value)
            }}
            error={
              passwordError != null
                ? t('device_settings:invalid_encryption_key_try_again')
                : null
            }
          />
        </div>
      </form>
    </ModalShell>
  )
}

const STEP_PAGES = [
  EnterServicePINPage,
  VerifyRobotEncryptionKeyPage,
  CreateServiceAccountPage,
  CreateAdminAccountPage,
  AdminPasswordPage,
  RecoveryAccountDetailsPage,
] as const

function CreateServiceAccountPage({
  header,
  onBack,
  onNext,
  serviceAccountPassword,
}: CommonPageProps): JSX.Element {
  const { t } = useTranslation(['access_control', 'shared'])

  return (
    <ModalShell
      width={WIZARD_MODAL_WIDTH}
      header={header}
      footer={
        <div className={styles.footer}>
          <SecondaryButton onClick={onBack}>{t('shared:back')}</SecondaryButton>
          <PrimaryButton autoFocus onClick={onNext}>
            {t('shared:next')}
          </PrimaryButton>
        </div>
      }
    >
      <div className={styles.content}>
        <div className={styles.step_body}>
          <div className={styles.text_block}>
            <StyledText desktopStyle="headingSmallBold">
              {t('setup_wizard_create_service_account_title')}
            </StyledText>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('branded:setup_wizard_create_service_account_description')}
            </StyledText>
          </div>
          <div className={styles.detail_list}>
            <div className={styles.detail_row}>
              <StyledText desktopStyle="bodyDefaultSemiBold">
                {t('username')}
              </StyledText>
              <StyledText desktopStyle="bodyDefaultRegular">
                {SERVICE_ACCOUNT_USERNAME}
              </StyledText>
            </div>
            <div className={styles.detail_row}>
              <StyledText desktopStyle="bodyDefaultSemiBold">
                {t('login_form_password_field')}
              </StyledText>
              <StyledText desktopStyle="bodyDefaultRegular">
                {serviceAccountPassword}
              </StyledText>
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  )
}

function CreateAdminAccountPage({
  header,
  onBack,
  onNext,
}: CommonPageProps): JSX.Element {
  const { t } = useTranslation(['access_control', 'shared'])
  const { control, trigger } = useFormContext<FormValues>()
  const formId = useId()

  return (
    <ModalShell
      width={WIZARD_MODAL_WIDTH}
      header={header}
      footer={
        <div className={styles.footer}>
          <SecondaryButton onClick={onBack}>{t('shared:back')}</SecondaryButton>
          <PrimaryButton type="submit" form={formId}>
            {t('shared:next')}
          </PrimaryButton>
        </div>
      }
    >
      <form
        id={formId}
        onSubmit={event => {
          event.preventDefault()
          void trigger(['adminUsername', 'adminLegalName']).then(isValid => {
            if (isValid) {
              onNext()
            }
          })
        }}
        className={styles.content}
      >
        <div className={styles.step_body}>
          <div className={styles.text_block}>
            <StyledText desktopStyle="headingSmallBold">
              {t('setup_wizard_create_admin_account_title')}
            </StyledText>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('setup_wizard_create_admin_account_description')}
            </StyledText>
          </div>
          <div className={styles.fields}>
            <Controller
              name="adminUsername"
              control={control}
              rules={{
                required: t('setup_wizard_field_required'),
                validate: value => {
                  const isReserved = [
                    SERVICE_ACCOUNT_USERNAME,
                    RECOVERY_ACCOUNT_USERNAME,
                  ].includes(value)
                  return isReserved ? t('setup_wizard_username_reserved') : true
                },
              }}
              render={({ field, fieldState }) => (
                <InputField
                  title={t('username')}
                  autoFocus
                  error={fieldState.error?.message}
                  {...field}
                />
              )}
            />
            <Controller
              name="adminLegalName"
              control={control}
              rules={{ required: t('setup_wizard_field_required') }}
              render={({ field, fieldState }) => (
                <InputField
                  title={t('setup_wizard_legal_name')}
                  error={fieldState.error?.message}
                  {...field}
                />
              )}
            />
          </div>
        </div>
      </form>
    </ModalShell>
  )
}

function AdminPasswordPage({
  header,
  onBack,
  onNext,
}: CommonPageProps): JSX.Element {
  const { t } = useTranslation(['access_control', 'shared'])
  const { control, getValues, trigger } = useFormContext<FormValues>()
  const formId = useId()

  return (
    <ModalShell
      width={WIZARD_MODAL_WIDTH}
      header={header}
      footer={
        <div className={styles.footer}>
          <SecondaryButton onClick={onBack}>{t('shared:back')}</SecondaryButton>
          <PrimaryButton type="submit" form={formId}>
            {t('shared:next')}
          </PrimaryButton>
        </div>
      }
    >
      <form
        id={formId}
        onSubmit={event => {
          event.preventDefault()
          void trigger(['password', 'confirmPassword']).then(isValid => {
            if (isValid) {
              onNext()
            }
          })
        }}
        className={styles.content}
      >
        <div className={styles.step_body}>
          <div className={styles.text_block}>
            <StyledText desktopStyle="headingSmallBold">
              {t('setup_wizard_create_password_title')}
            </StyledText>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('setup_wizard_create_password_description')}
            </StyledText>
          </div>
          <div className={styles.fields}>
            <Controller
              name="password"
              control={control}
              rules={{
                required: t('setup_wizard_field_required'),
                minLength: {
                  // Theoretically, the minimum password length is configurable on the server side,
                  // but in practice, until Compliance Ready Software has been enabled,
                  // there's no user-facing way to adjust it from the default of 8.
                  value: 8,
                  message: t('setup_wizard_password_too_short'),
                },
              }}
              render={({ field, fieldState }) => (
                <InputField
                  title={t('login_form_password_field')}
                  type="password"
                  autoFocus
                  error={fieldState.error?.message}
                  {...field}
                />
              )}
            />
            <Controller
              name="confirmPassword"
              control={control}
              rules={{
                required: t('setup_wizard_field_required'),
                validate: value =>
                  value === getValues('password') ||
                  t('setup_wizard_password_mismatch'),
              }}
              render={({ field, fieldState }) => (
                <InputField
                  title={t('setup_wizard_confirm_password')}
                  type="password"
                  error={fieldState.error?.message}
                  {...field}
                />
              )}
            />
          </div>
        </div>
      </form>
    </ModalShell>
  )
}

function RecoveryAccountDetailsPage({
  header,
  onBack,
  onNext,
  recoveryAccountPassword,
  serviceAccountPassword,
}: CommonPageProps): JSX.Element {
  const { t } = useTranslation(['access_control', 'shared'])
  const { getValues } = useFormContext<FormValues>()
  const enableCRSMutation = useEnableCRSMutation()
  const { isLoading, error: submissionError } = enableCRSMutation

  const handleCompleteSetup = async (): Promise<void> => {
    const { adminUsername, adminLegalName, password } = getValues()
    await enableCRSMutation.mutateAsync({
      adminAccount: {
        username: adminUsername,
        password,
        fullName: adminLegalName,
      },
      recoveryAccount: {
        username: RECOVERY_ACCOUNT_USERNAME,
        password: recoveryAccountPassword,
        fullName: RECOVERY_ACCOUNT_FULL_NAME,
      },
      serviceAccount: {
        username: SERVICE_ACCOUNT_USERNAME,
        password: serviceAccountPassword,
        fullName: SERVICE_ACCOUNT_FULL_NAME,
      },
    })
    onNext()
  }

  return (
    <ModalShell
      width={WIZARD_MODAL_WIDTH}
      header={header}
      footer={
        <div className={styles.footer}>
          <SecondaryButton
            // Unlike other pages, the "next" button is destructive here,
            // so autofocus the "Back" button instead.
            autoFocus
            onClick={onBack}
          >
            {t('shared:back')}
          </SecondaryButton>
          <PrimaryButton
            disabled={isLoading}
            onClick={() => {
              void handleCompleteSetup()
            }}
          >
            {t('setup_wizard_complete_setup')}
          </PrimaryButton>
        </div>
      }
    >
      <div className={styles.content}>
        <div className={styles.recovery_content}>
          <Icon name="error" className={styles.recovery_icon} />
          <div className={styles.recovery_text}>
            <StyledText desktopStyle="headingSmallBold">
              {t('setup_wizard_recovery_account_details_title')}
            </StyledText>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('setup_wizard_recovery_account_details_description')}
            </StyledText>
          </div>
          {submissionError != null ? (
            <InlineNotification
              type="error"
              heading={t('setup_wizard_submission_error')}
            />
          ) : null}
          <div className={styles.recovery_list}>
            <div className={styles.detail_row}>
              <StyledText desktopStyle="bodyDefaultSemiBold">
                {t('username')}
              </StyledText>
              <StyledText desktopStyle="bodyDefaultRegular">
                {RECOVERY_ACCOUNT_USERNAME}
              </StyledText>
            </div>
            <div className={styles.detail_row}>
              <StyledText desktopStyle="bodyDefaultSemiBold">
                {t('login_form_password_field')}
              </StyledText>
              <StyledText desktopStyle="bodyDefaultRegular">
                {recoveryAccountPassword}
              </StyledText>
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  )
}

/**
 * Returns the serial number of the current robot (designated by the nearest
 * ApiHostProvider), or null if we haven't loaded it yet.
 */
function useSerialNumber(): string | null {
  const robotName = useHost()?.robotName ?? null
  const robot = useRobot(robotName)
  const serialNumber = robot != null ? getRobotSerialNumber(robot) : null
  return serialNumber
}

function isCorrectServicePIN(
  candidateServicePIN: string,
  serialNumber: string
): boolean {
  // Security through obscurity.
  // This is sufficient to prevent people from enabling CRS accidentally or out of curiosity.
  //
  // This is insufficient to force users to pay us before enabling CRS.
  // But, as long as we're open-source and the robots ship with open SSH access,
  // that's an impossible goal to achieve, anyway.
  return candidateServicePIN === `${serialNumber}-0000`
}
