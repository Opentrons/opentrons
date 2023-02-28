import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  TEXT_TRANSFORM_CAPITALIZE,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { NINETY_SIX_CHANNEL } from '@opentrons/shared-data'
import { PrimaryButton, SecondaryButton } from '../../atoms/buttons'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { SmallButton } from '../../atoms/buttons/ODD'
import { StyledText } from '../../atoms/text'
import { CheckPipetteButton } from './CheckPipetteButton'
import { FLOWS } from './constants'
import type { PipetteWizardStepProps } from './types'

interface ResultsProps extends PipetteWizardStepProps {
  handleCleanUpAndClose: () => void
  currentStepIndex: number
  totalStepCount: number
}

export const Results = (props: ResultsProps): JSX.Element => {
  const {
    proceed,
    flowType,
    attachedPipettes,
    mount,
    handleCleanUpAndClose,
    currentStepIndex,
    totalStepCount,
    selectedPipette,
    isOnDevice,
  } = props
  const { t } = useTranslation(['pipette_wizard_flows', 'shared'])
  const [numberOfTryAgains, setNumberOfTryAgains] = React.useState<number>(0)
  const [isPending, setPending] = React.useState(false)

  let header: string = 'unknown results screen'
  let iconColor: string = COLORS.successEnabled
  let isSuccess: boolean = true
  let buttonText: string = t('shared:exit')
  let subHeader
  switch (flowType) {
    case FLOWS.CALIBRATE: {
      header = t('pip_cal_success')
      break
    }
    case FLOWS.ATTACH: {
      // attachment flow success
      if (attachedPipettes[mount] != null) {
        const pipetteName = attachedPipettes[mount]?.modelSpecs.displayName
        header = t('pipette_attached', { pipetteName: pipetteName })
        buttonText = t('cal_pipette')
        // attachment flow fail
      } else {
        header = t('pipette_failed_to_attach')
        iconColor = COLORS.errorEnabled
        isSuccess = false
      }
      break
    }
    case FLOWS.DETACH: {
      if (attachedPipettes[mount] != null) {
        header = t('pipette_failed_to_detach')
        iconColor = COLORS.errorEnabled
        isSuccess = false
      } else {
        header = t('pipette_detached')
        if (selectedPipette === NINETY_SIX_CHANNEL) {
          if (currentStepIndex === totalStepCount) {
            header = t('ninety_six_detached_success')
          } else {
            header = t('all_pipette_detached')
            subHeader = t('gantry_empty_for_96_channel_success')
            buttonText = t('attach_pip')
          }
        }
      }
      break
    }
  }

  const handleProceed = (): void => {
    if (currentStepIndex === totalStepCount || !isSuccess) {
      handleCleanUpAndClose()
    } else {
      proceed()
    }
  }
  let button: JSX.Element = isOnDevice ? (
    <SmallButton
      textTransform={TEXT_TRANSFORM_CAPITALIZE}
      onClick={handleProceed}
      aria-label="Results_exit_isOnDevice"
    >
      <StyledText
        fontSize="1.375rem"
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        padding={SPACING.spacing4}
      >
        {buttonText}
      </StyledText>
    </SmallButton>
  ) : (
    <PrimaryButton
      textTransform={TEXT_TRANSFORM_CAPITALIZE}
      onClick={handleProceed}
      aria-label="Results_exit"
    >
      {buttonText}
    </PrimaryButton>
  )

  if (!isSuccess && (flowType === FLOWS.ATTACH || flowType === FLOWS.DETACH)) {
    subHeader = numberOfTryAgains > 2 ? t('something_seems_wrong') : undefined
    button = (
      <>
        {isOnDevice ? (
          false
        ) : (
          <SecondaryButton
            onClick={handleCleanUpAndClose}
            textTransform={TEXT_TRANSFORM_CAPITALIZE}
            disabled={isPending}
            aria-label="Results_errorExit"
            marginRight={SPACING.spacing2}
          >
            {t('shared:exit')}
          </SecondaryButton>
        )}
        <CheckPipetteButton
          proceed={() => setNumberOfTryAgains(numberOfTryAgains + 1)}
          proceedButtonText={t(
            flowType === FLOWS.ATTACH ? 'try_again' : 'attach_and_retry'
          )}
          isDisabled={isPending}
          setPending={setPending}
          isOnDevice={isOnDevice}
        />
      </>
    )
  }

  return (
    <SimpleWizardBody
      iconColor={iconColor}
      header={header}
      isSuccess={isSuccess}
      subHeader={subHeader}
      isPending={isPending}
    >
      {button}
    </SimpleWizardBody>
  )
}
