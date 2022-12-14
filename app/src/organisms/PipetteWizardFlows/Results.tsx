import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { NINETY_SIX_CHANNEL } from '@opentrons/shared-data'
import { COLORS, TEXT_TRANSFORM_CAPITALIZE } from '@opentrons/components'
import { PrimaryButton } from '../../atoms/buttons'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { FLOWS } from './constants'
import { getIsGantryEmpty } from './utils'
import type { PipetteWizardStepProps } from './types'

interface ResultsProps extends PipetteWizardStepProps {
  handleCleanUpAndClose: () => void
  currentStepIndex: number
}

export const Results = (props: ResultsProps): JSX.Element => {
  const {
    proceed,
    flowType,
    attachedPipette,
    mount,
    handleCleanUpAndClose,
    selectedPipette,
    currentStepIndex,
  } = props
  const { t } = useTranslation(['pipette_wizard_flows', 'shared'])
  const isGantryEmpty = getIsGantryEmpty(attachedPipette)
  const is96ChannelAttachFailedToDetachOthers =
    flowType === FLOWS.ATTACH &&
    selectedPipette === NINETY_SIX_CHANNEL &&
    currentStepIndex === 2 &&
    !isGantryEmpty

  let header: string = 'unknown results screen'
  let iconColor: string = COLORS.successEnabled
  let isSuccess: boolean = true
  let buttonText: string = t('shared:exit')
  switch (flowType) {
    case FLOWS.CALIBRATE: {
      header = t('pip_cal_success')
      break
    }
    case FLOWS.ATTACH: {
      //  96-channel attachment with pipette attached before hand failed to detach
      if (
        !isGantryEmpty &&
        selectedPipette === NINETY_SIX_CHANNEL &&
        currentStepIndex === 2
      ) {
        header = t('pipette_failed_to_detach')
        iconColor = COLORS.errorEnabled
        isSuccess = false
        //  96-channel attachment with pipette attached before hand succeeded to detach
      } else if (
        isGantryEmpty &&
        selectedPipette === NINETY_SIX_CHANNEL &&
        currentStepIndex === 2
      ) {
        header = t('pipette_detached')
        buttonText = t('continue')
        // normal attachment flow success
      } else if (attachedPipette[mount] != null) {
        const pipetteName = attachedPipette[mount]?.modelSpecs.displayName
        header = t('pipette_attached', { pipetteName: pipetteName })
        if (selectedPipette === NINETY_SIX_CHANNEL) {
          buttonText = t('shared:exit')
        } else {
          buttonText = t('cal_pipette')
        }
        // normal detachment flow fail
      } else {
        header = t('pipette_failed_to_attach')
        iconColor = COLORS.errorEnabled
        isSuccess = false
      }
      break
    }
    case FLOWS.DETACH: {
      if (attachedPipette[mount] != null) {
        header = t('pipette_failed_to_detach')
        iconColor = COLORS.errorEnabled
        isSuccess = false
      } else {
        header = t('pipette_detached')
      }
      break
    }
  }

  const handleProceed = (): void => {
    if (flowType === FLOWS.DETACH || is96ChannelAttachFailedToDetachOthers) {
      handleCleanUpAndClose()
    } else {
      proceed()
    }
  }

  return (
    <SimpleWizardBody
      iconColor={iconColor}
      header={header}
      isSuccess={isSuccess}
    >
      <PrimaryButton
        textTransform={TEXT_TRANSFORM_CAPITALIZE}
        onClick={handleProceed}
        aria-label="Results_exit"
      >
        {buttonText}
      </PrimaryButton>
    </SimpleWizardBody>
  )
}
