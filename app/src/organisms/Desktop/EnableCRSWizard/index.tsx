import { useCallback, useId, useState } from 'react'
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

import { useHandleRobotCertImport } from '../RobotCertImport/useHandleRobotCertImport'
import styles from './enablecrswizard.module.css'
import { generatePassword } from './generatePassword'
import { useEnableCRSMutation } from './useEnableCRSMutation'

import type { ComponentType, FormEvent, ReactNode } from 'react'

/**
 * The fields collected by the react-hook-form portion of the wizard.
 *
 * Note that the robot encryption key is deliberately NOT part of this form:
 * the "verify robot encryption key" step is its own asynchronous submission
 * (see `useHandleRobotCertImport`), which owns that value, its error, and its
 * loading state.
 */
interface CRSWizardFormValues {
  servicePIN: string
  adminUsername: string
  adminLegalName: string
  password: string
  confirmPassword: string
}

const CRS_WIZARD_STEPS = [
  'enterServicePIN',
  'verifyRobotEncryptionKey',
  'createServiceAccount',
  'createAdminAccount',
  'createPassword',
  'recoveryAccountDetails',
] as const

type CrsWizardStep = (typeof CRS_WIZARD_STEPS)[number]

/**
 * Props shared by every step page. Each page renders its own `ModalShell` so
 * that a step which needs to coordinate its body and footer (e.g. the
 * encryption-key submission step) can do so from a single component.
 */
interface CrsWizardPageProps {
  formId: string
  header: ReactNode
  onBack: () => void
  onNext: () => void
  serviceAccountPassword: string
  recoveryAccountPassword: string
}

/**
 * The react-hook-form fields that must be valid before advancing past each
 * step. Steps with no react-hook-form inputs (review-only pages, or the
 * self-validating encryption-key step) map to an empty list.
 */
const STEP_FIELDS: Record<CrsWizardStep, Array<keyof CRSWizardFormValues>> = {
  enterServicePIN: ['servicePIN'],
  verifyRobotEncryptionKey: [],
  createServiceAccount: [],
  createAdminAccount: ['adminUsername', 'adminLegalName'],
  createPassword: ['password', 'confirmPassword'],
  recoveryAccountDetails: [],
}

const WIZARD_MODAL_WIDTH = '31.25rem'
const SERVICE_ACCOUNT_USERNAME = 'service'
const SERVICE_ACCOUNT_FULL_NAME = 'Service Account (created by system)'
const RECOVERY_ACCOUNT_USERNAME = 'recovery'
const RECOVERY_ACCOUNT_FULL_NAME = 'Recovery Account (created by system)'

export interface EnableCRSWizardProps {
  robotName: string
}

export const handleEnableCRSWizard = (props: EnableCRSWizardProps): void => {
  void NiceModal.show(EnableCRSWizard, props)
}

const STEP_PAGES: Record<CrsWizardStep, ComponentType<CrsWizardPageProps>> = {
  enterServicePIN: EnterServicePINPage,
  verifyRobotEncryptionKey: VerifyRobotEncryptionKeyPage,
  createServiceAccount: CreateServiceAccountPage,
  createAdminAccount: CreateAdminAccountPage,
  createPassword: AdminPasswordPage,
  recoveryAccountDetails: RecoveryAccountDetailsPage,
}

const EnableCRSWizard = NiceModal.create(
  (props: EnableCRSWizardProps): JSX.Element => {
    const { robotName } = props
    const modal = useModal()
    const { t } = useTranslation('access_control')
    const [currentStep, setCurrentStep] = useState<CrsWizardStep>(
      CRS_WIZARD_STEPS[0]
    )
    const currentStepIndex = CRS_WIZARD_STEPS.indexOf(currentStep)
    const isFirstStep = currentStepIndex === 0
    const isLastStep = currentStepIndex === CRS_WIZARD_STEPS.length - 1

    // Generate passwords when the wizard opens and keep them static even when the user
    // navigates back and forth between pages.
    const [serviceAccountPassword] = useState(generatePassword)
    const [recoveryAccountPassword] = useState(generatePassword)

    const onClose = (): void => {
      modal.remove()
    }

    const formMethods = useForm<CRSWizardFormValues>({
      defaultValues: {
        servicePIN: '',
        adminUsername: '',
        adminLegalName: '',
        password: '',
        confirmPassword: '',
      },
      mode: 'onBlur',
    })
    const { trigger } = formMethods

    const handleNext = (): void => {
      // TODO: Move triggering elsewhere.
      // Think carefully about isLastStep/return.
      void trigger(STEP_FIELDS[currentStep]).then(isValid => {
        if (!isValid) {
          return
        }
        if (isLastStep) {
          onClose()
          return
        }
        setCurrentStep(CRS_WIZARD_STEPS[currentStepIndex + 1])
      })
    }

    const handleBack = (): void => {
      if (isFirstStep) {
        onClose()
        return
      }
      setCurrentStep(CRS_WIZARD_STEPS[currentStepIndex - 1])
    }

    const formId = useId()

    const header = (
      <WizardHeader
        title={
          isFirstStep
            ? t('setup_wizard_enable_title')
            : t('setup_wizard_setup_title')
        }
        onExit={onClose}
        currentStep={currentStepIndex + 1}
        totalSteps={CRS_WIZARD_STEPS.length}
        hideStepText
      />
    )

    const pageProps: CrsWizardPageProps = {
      recoveryAccountPassword,
      serviceAccountPassword,
      formId,
      header,
      onBack: handleBack,
      onNext: handleNext,
    }

    const Page = STEP_PAGES[currentStep]

    // todo(mm, 2026-07-22):
    // Each page renders as its own ModalShell, as opposed to swapping out the contents
    // inside one ModalShell. This is good because it gives each page control over its
    // own buttons in the ModalShell `footer`, but bad because it makes the progress
    // bar at the top of the modal not animate across pages it should.
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
  formId,
  header,
  onBack,
  onNext,
}: CrsWizardPageProps): JSX.Element {
  const { t } = useTranslation(['access_control', 'shared'])
  const { control } = useFormContext<CRSWizardFormValues>()

  const serialNumber = useSerialNumber()
  const validate = useCallback(
    (candidateServicePIN: string): string | true => {
      if (serialNumber == null) {
        return t('setup_wizard_service_pin_internal_error')
      } else if (candidateServicePIN !== `${serialNumber}-0000`) {
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
          <AlertPrimaryButton onClick={onNext}>
            {t('setup_wizard_confirm_enable')}
          </AlertPrimaryButton>
        </div>
      }
    >
      <form
        id={formId}
        onSubmit={handleFormSubmit(onNext)}
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
              {t('setup_wizard_service_pin_description')}
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

/**
 * The encryption-key step is its own submission: `useHandleRobotCertImport`
 * verifies the entered key by attempting to install the robot's CA
 * certificates with it. Because this step owns its `ModalShell`, both the input
 * (body) and the verify button (footer) can share a single hook instance.
 */
function VerifyRobotEncryptionKeyPage({
  formId,
  header,
  onNext,
}: CrsWizardPageProps): JSX.Element {
  const { t } = useTranslation(['access_control', 'device_settings', 'shared'])

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
          <PrimaryButton onClick={tryImport} disabled={importInProgress}>
            {t('shared:next')}
          </PrimaryButton>
        </div>
      }
    >
      <form
        id={formId}
        onSubmit={handleFormSubmit(tryImport)}
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

function CreateServiceAccountPage({
  header,
  onBack,
  onNext,
  serviceAccountPassword,
}: CrsWizardPageProps): JSX.Element {
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
              {t('setup_wizard_create_service_account_description')}
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
  formId,
  header,
  onBack,
  onNext,
}: CrsWizardPageProps): JSX.Element {
  const { t } = useTranslation(['access_control', 'shared'])
  const { control } = useFormContext<CRSWizardFormValues>()

  return (
    <ModalShell
      width={WIZARD_MODAL_WIDTH}
      header={header}
      footer={
        <div className={styles.footer}>
          <SecondaryButton onClick={onBack}>{t('shared:back')}</SecondaryButton>
          <PrimaryButton onClick={onNext}>{t('shared:next')}</PrimaryButton>
        </div>
      }
    >
      <form
        id={formId}
        onSubmit={handleFormSubmit(onNext)}
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
              rules={{ required: t('setup_wizard_field_required') }}
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
  formId,
  header,
  onBack,
  onNext,
}: CrsWizardPageProps): JSX.Element {
  const { t } = useTranslation(['access_control', 'shared'])
  const { control, getValues } = useFormContext<CRSWizardFormValues>()

  return (
    <ModalShell
      width={WIZARD_MODAL_WIDTH}
      header={header}
      footer={
        <div className={styles.footer}>
          <SecondaryButton onClick={onBack}>{t('shared:back')}</SecondaryButton>
          <PrimaryButton onClick={onNext}>{t('shared:next')}</PrimaryButton>
        </div>
      }
    >
      <form
        id={formId}
        onSubmit={handleFormSubmit(onNext)}
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
              rules={{ required: t('setup_wizard_field_required') }}
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
}: CrsWizardPageProps): JSX.Element {
  const { t } = useTranslation(['access_control', 'shared'])
  const { getValues } = useFormContext<CRSWizardFormValues>()
  const enableCRSMutation = useEnableCRSMutation()
  const { isLoading, error: submissionError } = enableCRSMutation

  const handleCompleteSetup = async (): Promise<void> => {
    try {
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
    } catch {
      // Mutation errors are rendered below and the wizard remains open for retry.
    }
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
 * Prevents the browser's default full-page submit and delegates to the given
 * handler, so pressing Enter in a field behaves like clicking the footer's
 * primary button.
 */
function handleFormSubmit(
  onSubmit: () => void
): (event: FormEvent<HTMLFormElement>) => void {
  return event => {
    event.preventDefault()
    onSubmit()
  }
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
