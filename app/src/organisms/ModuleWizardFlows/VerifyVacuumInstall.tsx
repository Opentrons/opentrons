import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  AnimationVideo,
  COLORS,
  DIRECTION_ROW,
  Flex,
  InlineNotification,
  JUSTIFY_FLEX_END,
  PrimaryButton,
  RESPONSIVENESS,
  SecondaryButton,
  SPACING,
  StyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { FLEX_SINGLE_SLOT_BY_CUTOUT_ID } from '@opentrons/shared-data'

import CheckCollar from '/app/assets/videos/error-recovery/Vacuum_CheckCollar.webm'
import CheckConnections from '/app/assets/videos/error-recovery/Vacuum_CheckConnections.webm'
import { SmallButton } from '/app/atoms/buttons'
import { GenericWizardTile } from '/app/molecules/GenericWizardTile'
import {
  SimpleWizardBody,
  SimpleWizardInProgressBody,
} from '/app/molecules/SimpleWizardBody'

import {
  getVacuumCleanupCommands,
  getVerifyVacuumCommands,
} from './getVerifyVacuumCommands'

import type { DeckConfiguration } from '@opentrons/shared-data'
import type { ModuleSetupWizardMaybePipetteStepProps } from './types'

type VacuumVerifyScreen = 'checkTubes' | 'checkCollar' | 'inProgress' | 'failed'

interface VerifyVacuumInstallProps extends ModuleSetupWizardMaybePipetteStepProps {
  deckConfig: DeckConfiguration
}

export function VerifyVacuumInstall(
  props: VerifyVacuumInstallProps
): JSX.Element {
  const {
    proceed,
    goBack,
    attachedModule,
    chainRunCommands,
    setErrorMessage,
    isOnDevice,
    deckConfig,
    setExitCleanupCommands,
  } = props
  const { t } = useTranslation(['module_wizard_flows', 'shared'])
  const [screen, setScreen] = useState<VacuumVerifyScreen>('checkTubes')
  const verificationAttempt = useRef(0)
  const startedVerification = useRef(false)

  const cutoutId = deckConfig.find(
    cc => cc.opentronsModuleSerialNumber === attachedModule.serialNumber
  )?.cutoutId
  const slotName =
    cutoutId != null ? FLEX_SINGLE_SLOT_BY_CUTOUT_ID[cutoutId] : null
  const moduleId: string = attachedModule.id

  useEffect(() => {
    setExitCleanupCommands(getVacuumCleanupCommands(moduleId))
    return () => {
      setExitCleanupCommands([])
    }
  }, [moduleId, setExitCleanupCommands])

  const stopVacuum = (): Promise<unknown> => {
    if (chainRunCommands == null) {
      return Promise.resolve()
    }
    return chainRunCommands(getVacuumCleanupCommands(moduleId), true).catch(
      () => undefined
    )
  }

  const runVerification = (): void => {
    if (chainRunCommands == null) {
      setErrorMessage('Cannot verify vacuum module: no maintenance run')
      return
    }
    if (slotName == null) {
      setErrorMessage(
        `could not load module ${attachedModule.moduleModel} into location ${slotName}`
      )
      return
    }

    verificationAttempt.current += 1
    startedVerification.current = true
    const taskId = `vacuum-setup-verify-${verificationAttempt.current}`
    const runCommands = chainRunCommands

    runCommands(
      getVerifyVacuumCommands({
        moduleId,
        moduleModel: attachedModule.moduleModel,
        slotName,
        taskId,
      }),
      false
    )
      .then(results => {
        if (!verificationCommandsSucceeded(results)) {
          throw new Error('Vacuum verification did not succeed')
        }
        return stopVacuum()
      })
      .then(() => {
        startedVerification.current = false
        proceed()
      })
      .catch(() => {
        return stopVacuum().then(() => {
          setScreen('failed')
        })
      })
  }

  const handleStartVerification = (): void => {
    setScreen('inProgress')
    runVerification()
  }

  const handleRetry = (): void => {
    setScreen('checkTubes')
  }

  if (screen === 'inProgress') {
    return (
      <SimpleWizardInProgressBody description={t('verifying_vacuum_seal')} />
    )
  }

  if (screen === 'failed') {
    return (
      <VacuumVerificationFailed
        isOnDevice={isOnDevice}
        onRetry={handleRetry}
        onContinueAnyway={() => {
          startedVerification.current = false
          proceed()
        }}
      />
    )
  }

  if (screen === 'checkCollar') {
    return (
      <VacuumCheckCollarScreen
        onBack={() => {
          setScreen('checkTubes')
        }}
        onContinue={handleStartVerification}
      />
    )
  }

  return (
    <VacuumCheckTubeConnectionsScreen
      onBack={goBack}
      onContinue={() => {
        setScreen('checkCollar')
      }}
    />
  )
}

function verificationCommandsSucceeded(results: unknown): boolean {
  if (!Array.isArray(results) || results.length === 0) {
    return false
  }
  return results.every(result => {
    if (typeof result !== 'object' || result == null || !('data' in result)) {
      return false
    }
    const { data } = result as { data?: { status?: string } }
    return data?.status === 'succeeded'
  })
}

const BODY_STYLE = css`
  ${TYPOGRAPHY.pRegular};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: 1.275rem;
    line-height: 1.75rem;
  }
`

interface VacuumInstructionScreenProps {
  onBack: () => void
  onContinue: () => void
}

function VacuumCheckTubeConnectionsScreen({
  onBack,
  onContinue,
}: VacuumInstructionScreenProps): JSX.Element {
  const { t, i18n } = useTranslation(['module_wizard_flows', 'shared'])

  return (
    <GenericWizardTile
      header={t('check_tube_connections')}
      rightHandBody={
        <AnimationVideo width="100%">
          <source src={CheckConnections} />
        </AnimationVideo>
      }
      bodyText={
        <>
          <StyledText css={BODY_STYLE}>{t('tubes_must_be_secured')}</StyledText>
          <InlineNotification type="alert" heading={t('push_tube')} />
        </>
      }
      back={onBack}
      proceed={onContinue}
      proceedButtonText={i18n.format(t('shared:continue'), 'capitalize')}
    />
  )
}

function VacuumCheckCollarScreen({
  onBack,
  onContinue,
}: VacuumInstructionScreenProps): JSX.Element {
  const { t, i18n } = useTranslation(['module_wizard_flows', 'shared'])

  return (
    <GenericWizardTile
      header={t('install_collar_and_block')}
      rightHandBody={
        <AnimationVideo width="100%">
          <source src={CheckCollar} />
        </AnimationVideo>
      }
      bodyText={
        <StyledText css={BODY_STYLE}>
          {t('collar_block_description')}
        </StyledText>
      }
      back={onBack}
      proceed={onContinue}
      proceedButtonText={i18n.format(t('shared:continue'), 'capitalize')}
    />
  )
}

interface VacuumVerificationFailedProps {
  isOnDevice: boolean
  onRetry: () => void
  onContinueAnyway: () => void
}

function VacuumVerificationFailed({
  isOnDevice,
  onRetry,
  onContinueAnyway,
}: VacuumVerificationFailedProps): JSX.Element {
  const { t, i18n } = useTranslation(['module_wizard_flows', 'shared'])

  return (
    <SimpleWizardBody
      justifyContentForOddButton={JUSTIFY_FLEX_END}
      isSuccess={false}
      iconColor={COLORS.red50}
      header={t('vacuum_verification_failed')}
      subHeader={t('vacuum_verification_failed_description')}
    >
      <Flex
        width="100%"
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_FLEX_END}
        gridGap={SPACING.spacing8}
      >
        {isOnDevice ? (
          <>
            <SmallButton
              buttonType="secondary"
              onClick={onContinueAnyway}
              buttonText={t('continue_anyway')}
            />
            <SmallButton
              buttonType="primary"
              onClick={onRetry}
              buttonText={i18n.format(t('try_again'), 'capitalize')}
            />
          </>
        ) : (
          <>
            <SecondaryButton onClick={onContinueAnyway}>
              {t('continue_anyway')}
            </SecondaryButton>
            <PrimaryButton onClick={onRetry}>
              {i18n.format(t('try_again'), 'capitalize')}
            </PrimaryButton>
          </>
        )}
      </Flex>
    </SimpleWizardBody>
  )
}
