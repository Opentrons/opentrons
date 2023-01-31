import * as React from 'react'
import { useTranslation } from 'react-i18next'
import startCase from 'lodash/startCase'
import { COLORS, TEXT_TRANSFORM_CAPITALIZE } from '@opentrons/components'
import { NINETY_SIX_CHANNEL } from '@opentrons/shared-data'
import { PrimaryButton } from '../../atoms/buttons'
import { useDispatchApiRequest } from '../../redux/robot-api'
import { fetchPipettes } from '../../redux/pipettes'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { FLOWS } from './constants'
import { useCheckPipettes } from './hooks'
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
    robotName,
  } = props
  const { t } = useTranslation(['pipette_wizard_flows', 'shared'])
  const { handleCheckPipette, isPending } = useCheckPipettes(robotName)
  const [dispatchRequest] = useDispatchApiRequest()
  const [numberOfTryAgains, setNumberOfTryAgains] = React.useState<number>(0)
  //  when attachedPipettes updates with the try again button, if it is successful,
  // the Results should automatically show the success screen
  React.useEffect(() => {
    if (robotName != null) {
      dispatchRequest(fetchPipettes(robotName))
    }
  }, [dispatchRequest, robotName])

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

  const handleTryAgain = (): void => {
    handleCheckPipette()
    setNumberOfTryAgains(numberOfTryAgains + 1)
  }

  const handleProceed = (): void => {
    if (currentStepIndex === totalStepCount || !isSuccess) {
      handleCleanUpAndClose()
    } else {
      proceed()
    }
  }
  let button: JSX.Element = (
    <PrimaryButton
      textTransform={TEXT_TRANSFORM_CAPITALIZE}
      onClick={handleProceed}
      aria-label="Results_exit"
    >
      {buttonText}
    </PrimaryButton>
  )

  if (
    !isSuccess &&
    (flowType === FLOWS.ATTACH || flowType === FLOWS.DETACH) &&
    numberOfTryAgains < 3
  ) {
    button = (
      <PrimaryButton
        onClick={handleTryAgain}
        disabled={isPending}
        aria-label="Results_tryAgain"
      >
        {t(flowType === FLOWS.ATTACH ? 'detach_and_retry' : 'attach_and_retry')}
      </PrimaryButton>
    )
  } else if (
    !isSuccess &&
    (flowType === FLOWS.ATTACH || flowType === FLOWS.DETACH) &&
    numberOfTryAgains <= 3
  ) {
    header = startCase(t('shared:something_went_wrong'))
    button = (
      <PrimaryButton
        onClick={handleCleanUpAndClose}
        textTransform={TEXT_TRANSFORM_CAPITALIZE}
        disabled={isPending}
        aria-label="Results_errorExit"
      >
        {t('shared:exit')}
      </PrimaryButton>
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
