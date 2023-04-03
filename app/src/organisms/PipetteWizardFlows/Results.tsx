import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  PrimaryButton,
  SecondaryButton,
} from '@opentrons/components'
import { NINETY_SIX_CHANNEL } from '@opentrons/shared-data'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { SmallButton } from '../../atoms/buttons/OnDeviceDisplay'
import { CheckPipetteButton } from './CheckPipetteButton'
import { FLOWS } from './constants'
import type { PipetteWizardStepProps } from './types'

interface ResultsProps extends PipetteWizardStepProps {
  handleCleanUpAndClose: () => void
  currentStepIndex: number
  totalStepCount: number
  isFetching: boolean
  setFetching: React.Dispatch<React.SetStateAction<boolean>>
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
    isFetching,
    setFetching,
    recalibrate,
  } = props
  const { t, i18n } = useTranslation(['pipette_wizard_flows', 'shared'])
  const [numberOfTryAgains, setNumberOfTryAgains] = React.useState<number>(0)
  const pipetteName =
    attachedPipettes[mount] != null
      ? attachedPipettes[mount]?.modelSpecs.displayName
      : ''
  let header: string = 'unknown results screen'
  let iconColor: string = COLORS.successEnabled
  let isSuccess: boolean = true
  let buttonText: string = t('shared:exit')
  let subHeader
  switch (flowType) {
    case FLOWS.CALIBRATE: {
      header = i18n.format(
        t(recalibrate ? 'pip_recal_success' : 'pip_cal_success', {
          pipetteName: pipetteName,
        }),
        'capitalize'
      )
      break
    }
    case FLOWS.ATTACH: {
      // attachment flow success
      if (attachedPipettes[mount] != null) {
        header = i18n.format(
          t('pipette_attached', { pipetteName: pipetteName }),
          'cpaitalize'
        )
        buttonText = t('cal_pipette')
        // attachment flow fail
      } else {
        header = i18n.format(t('pipette_failed_to_attach'), 'capitalize')
        iconColor = COLORS.errorEnabled
        isSuccess = false
      }
      break
    }
    case FLOWS.DETACH: {
      if (attachedPipettes[mount] != null) {
        header = i18n.format(
          t('pipette_failed_to_detach', { pipetteName: pipetteName }),
          'capitalize'
        )
        iconColor = COLORS.errorEnabled
        isSuccess = false
      } else {
        header = i18n.format(t('pipette_detached'), 'capitalize')
        if (selectedPipette === NINETY_SIX_CHANNEL) {
          if (currentStepIndex === totalStepCount) {
            header = i18n.format(
              t('ninety_six_detached_success', {
                pipetteName: NINETY_SIX_CHANNEL,
              }),
              'capitalize'
            )
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
      textTransform={TYPOGRAPHY.textTransformCapitalize}
      onClick={handleProceed}
      buttonText={buttonText}
      buttonType="default"
    />
  ) : (
    <PrimaryButton
      textTransform={TYPOGRAPHY.textTransformCapitalize}
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
        {isOnDevice ? null : (
          <SecondaryButton
            isDangerous
            onClick={handleCleanUpAndClose}
            textTransform={TYPOGRAPHY.textTransformCapitalize}
            disabled={isFetching}
            aria-label="Results_errorExit"
            marginRight={SPACING.spacing2}
          >
            {i18n.format(t('cancel_attachment'), 'capitalize')}
          </SecondaryButton>
        )}
        <CheckPipetteButton
          proceed={() => setNumberOfTryAgains(numberOfTryAgains + 1)}
          proceedButtonText={i18n.format(t('try_again'), 'capitalize')}
          setFetching={setFetching}
          isFetching={isFetching}
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
      isPending={isFetching}
    >
      {button}
    </SimpleWizardBody>
  )
}
