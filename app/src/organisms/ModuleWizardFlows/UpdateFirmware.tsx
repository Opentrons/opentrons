import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import { COLORS, PrimaryButton } from '@opentrons/components'

import {
  SimpleWizardBody,
  SimpleWizardInProgressBody,
} from '/app/molecules/SimpleWizardBody'
import { useModuleApiRequests } from '/app/organisms/ModuleCard/utils'
import {
  dismissRequest,
  FAILURE,
  getRequestById,
  PENDING,
  SUCCESS,
} from '/app/redux/robot-api'


import type { Dispatch, State } from '/app/redux/types'
import type { ModuleCalibrationWizardStepProps } from './types'

interface UpdateFirmwareProps extends ModuleCalibrationWizardStepProps {
  robotName: string
}

export const UpdateFirmware = (
  props: UpdateFirmwareProps
): JSX.Element | null => {
  const { proceed, setErrorMessage, attachedModule, robotName } = props
  const { t } = useTranslation('module_wizard_flows')

  const dispatch = useDispatch<Dispatch>()
  const [getLatestRequestId, handleModuleApiRequests] = useModuleApiRequests()

  const [inProgress, setInProgress] = useState(false)
  const [shouldProceed, setShouldProceed] = useState(false)

  const latestRequestId = getLatestRequestId(attachedModule.serialNumber)
  const requestStatus = useSelector((state: State) => {
    return latestRequestId ? getRequestById(state, latestRequestId) : null
  })?.status

  const handleUpdateFirmware = (): void => {
    handleModuleApiRequests(attachedModule.serialNumber, robotName)
  }

  useEffect(() => {
    if (!attachedModule.hasAvailableUpdate) {
      setShouldProceed(true)
      setTimeout(() => {
        proceed()
      }, 2000)
    }
  }, [])

  useEffect(() => {
    setInProgress(requestStatus === PENDING)

    if (requestStatus === FAILURE) {
      setErrorMessage(t('firmware_update_failed') as string)
      if (latestRequestId != null) dispatch(dismissRequest(latestRequestId))
    }

    if (requestStatus === SUCCESS) proceed()
  }, [requestStatus, setInProgress])

  if (inProgress)
    return (
      <SimpleWizardInProgressBody
        description={t('installing_latest_firmware')}
      />
    )

  if (shouldProceed)
    return (
      <SimpleWizardBody
        isSuccess={true}
        iconColor={COLORS.green50}
        header={t('firmware_up_to_date')}
      />
    )
  return (
    <SimpleWizardBody
      isSuccess={false}
      iconColor={COLORS.yellow50}
      header={t('firmware_update_found')}
      subHeader={t('firmware_update_to_latest', {
        moduleName: attachedModule.moduleModel,
      })}
    >
      <PrimaryButton
        onClick={() => {
          handleUpdateFirmware()
        }}
      >
        {t('install_update')}
      </PrimaryButton>
    </SimpleWizardBody>
  )
}
