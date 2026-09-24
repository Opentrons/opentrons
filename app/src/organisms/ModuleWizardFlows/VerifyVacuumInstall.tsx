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
import {
  FLEX_SINGLE_SLOT_BY_CUTOUT_ID,
  VACUUM_MODULE_TYPE,
} from '@opentrons/shared-data'

import CheckCollar from '/app/assets/videos/error-recovery/Vacuum_CheckCollar.webm'
import CheckConnections from '/app/assets/videos/error-recovery/Vacuum_CheckConnections.webm'
import { SmallButton } from '/app/atoms/buttons'
import { GenericWizardTile } from '/app/molecules/GenericWizardTile'
import {
  SimpleWizardBody,
  SimpleWizardInProgressBody,
} from '/app/molecules/SimpleWizardBody'

import { VERIFY_VACUUM_GAUGE_PRESSURE_MBAR } from './constants'
import {
  getVacuumCleanupCommands,
  getVerifyVacuumCommands,
} from './getVerifyVacuumCommands'

import type { AttachedModule, VacuumModuleData } from '@opentrons/api-client'
import type { DeckConfiguration } from '@opentrons/shared-data'
import type { ModuleSetupWizardMaybePipetteStepProps } from './types'

type VacuumVerifyScreen =
  'checkTubes' | 'checkCollar' | 'inProgress' | 'failed' | 'success'

interface VerifyVacuumInstallProps extends ModuleSetupWizardMaybePipetteStepProps {
  deckConfig: DeckConfiguration
  attachedModules: AttachedModule[]
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
    isRobotMoving,
    deckConfig,
    attachedModules,
    setExitCleanupCommands,
  } = props
  const { t } = useTranslation(['module_wizard_flows', 'shared'])
  const [screen, setScreen] = useState<VacuumVerifyScreen>('checkTubes')
  const [failurePressures, setFailurePressures] = useState<{
    current: number | null
    target: number
  } | null>(null)
  const verificationAttempt = useRef(0)
  const startedVerification = useRef(false)
  const attachedModulesRef = useRef(attachedModules)
  attachedModulesRef.current = attachedModules

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
        setScreen('success')
      })
      .catch(() => {
        setFailurePressures(
          getVacuumLivePressures(attachedModulesRef.current, attachedModule)
        )
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
        currentPressure={failurePressures?.current ?? null}
        targetPressure={
          failurePressures?.target ?? VERIFY_VACUUM_GAUGE_PRESSURE_MBAR
        }
        onRetry={handleRetry}
        onContinueAnyway={() => {
          startedVerification.current = false
          proceed()
        }}
      />
    )
  }

  if (screen === 'success') {
    return (
      <VacuumVerificationSuccess
        isOnDevice={isOnDevice}
        isRobotMoving={isRobotMoving}
        onContinue={proceed}
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

function getVacuumLivePressures(
  modules: AttachedModule[],
  attachedModule: AttachedModule
): { current: number | null; target: number } {
  const liveModule = modules.find(
    module =>
      module.moduleType === VACUUM_MODULE_TYPE &&
      module.serialNumber === attachedModule.serialNumber
  )
  let data: VacuumModuleData | null = null
  if (liveModule != null && liveModule.moduleType === VACUUM_MODULE_TYPE) {
    data = liveModule.data
  } else if (attachedModule.moduleType === VACUUM_MODULE_TYPE) {
    data = attachedModule.data
  }

  return {
    current: data?.currentPressure ?? null,
    target: data?.targetPressure ?? VERIFY_VACUUM_GAUGE_PRESSURE_MBAR,
  }
}

function formatGaugePressureMbar(pressureMbar: number | null): string {
  if (pressureMbar == null) {
    return 'N/A'
  }
  return String(Math.round(pressureMbar * 10) / 10)
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
      header={t('prepare_to_test_vacuum_pressure')}
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

interface VacuumVerificationSuccessProps {
  isOnDevice: boolean
  isRobotMoving: boolean
  onContinue: () => void
}

function VacuumVerificationSuccess({
  isOnDevice,
  isRobotMoving,
  onContinue,
}: VacuumVerificationSuccessProps): JSX.Element {
  const { t, i18n } = useTranslation(['module_wizard_flows', 'shared'])
  const continueText = i18n.format(t('shared:continue'), 'capitalize')

  return (
    <SimpleWizardBody
      justifyContentForOddButton={JUSTIFY_FLEX_END}
      isSuccess={true}
      iconColor={COLORS.red50}
      header={t('target_vacuum_pressure_reached')}
    >
      <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing8}>
        {isOnDevice ? (
          <SmallButton
            buttonType="primary"
            onClick={onContinue}
            buttonText={continueText}
          />
        ) : (
          <PrimaryButton disabled={isRobotMoving} onClick={onContinue}>
            {continueText}
          </PrimaryButton>
        )}
      </Flex>
    </SimpleWizardBody>
  )
}

interface VacuumVerificationFailedProps {
  isOnDevice: boolean
  currentPressure: number | null
  targetPressure: number
  onRetry: () => void
  onContinueAnyway: () => void
}

function VacuumVerificationFailed({
  isOnDevice,
  currentPressure,
  targetPressure,
  onRetry,
  onContinueAnyway,
}: VacuumVerificationFailedProps): JSX.Element {
  const { t, i18n } = useTranslation(['module_wizard_flows', 'shared'])

  return (
    <SimpleWizardBody
      justifyContentForOddButton={JUSTIFY_FLEX_END}
      isSuccess={false}
      iconColor={COLORS.red50}
      header={t('target_vacuum_pressure_unmet', {
        current: formatGaugePressureMbar(currentPressure),
        target: formatGaugePressureMbar(targetPressure),
      })}
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
