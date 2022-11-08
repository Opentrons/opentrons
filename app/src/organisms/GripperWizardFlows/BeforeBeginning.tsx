import * as React from 'react'
import { UseMutateFunction } from 'react-query'
import { Trans, useTranslation } from 'react-i18next'
import { StyledText } from '../../atoms/text'
import { GenericWizardTile } from '../../molecules/GenericWizardTile'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { WizardRequiredEquipmentList } from '../../molecules/WizardRequiredEquipmentList'
import { CALIBRATION_PROBE, FLOWS } from './constants'
import type { Run, CreateRunData } from '@opentrons/api-client'
import type { GripperWizardStepProps } from './types'
import type { AxiosError } from 'axios'

interface BeforeBeginningProps extends GripperWizardStepProps {
  createRun: UseMutateFunction<Run, AxiosError<any>, CreateRunData, unknown>
  isCreateLoading: boolean
}

export const BeforeBeginning = (
  props: BeforeBeginningProps
): JSX.Element | null => {
  const {
    proceed,
    flowType,
    attachedGripper,
    chainRunCommands,
    isCreateLoading,
    isRobotMoving,
    setIsBetweenCommands,
  } = props
  const { t } = useTranslation('gripper_wizard_flows')

  if (attachedGripper == null) return null
  const handleOnClick = (): void => {
    setIsBetweenCommands(true)
    chainRunCommands([
      {
        commandType: 'home' as const,
        params: {},
      },
    ]).then(() => {
      setIsBetweenCommands(false)
      proceed()
    })
  }

  const proceedButtonText: string = t('get_started')
  const rightHandBody = (
    <WizardRequiredEquipmentList
      width="100%"
      equipmentList={[CALIBRATION_PROBE]}
    />
  )
  if (isRobotMoving) return <InProgressModal description={t('stand_back')} />
  return (
    <GenericWizardTile
      header={t('before_you_begin')}
      //  TODO(BC, 11/8/22): wire up this URL and unhide the link!
      // getHelp={BEFORE_YOU_BEGIN_URL}
      rightHandBody={rightHandBody}
      bodyText={
        <Trans
          t={t}
          i18nKey="remove_labware_to_get_started"
          components={{ block: <StyledText as="p" /> }}
        />
      }
      proceedButtonText={proceedButtonText}
      proceedIsDisabled={isCreateLoading}
      proceed={handleOnClick}
    />
  )
}
