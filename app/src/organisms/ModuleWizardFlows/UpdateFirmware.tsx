import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import { COLORS, JUSTIFY_FLEX_END, PrimaryButton } from '@opentrons/components'
import { useModulesQuery } from '@opentrons/react-api-client'
import { getModuleDisplayName } from '@opentrons/shared-data'

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

import type { AttachedModule } from '@opentrons/api-client'
import type { Dispatch, State } from '/app/redux/types'
import type { ModuleSetupWizardStepProps } from './types'

const EQUIPMENT_POLL_MS = 3000
const MODULE_TIMEOUT_MS = 30000
const NO_UPDATE_FOUND_TIMEOUT_MS = 2000
interface UpdateFirmwareProps extends ModuleSetupWizardStepProps {
  robotName: string
  patchModuleAfterUpdate: (module: AttachedModule) => void
}

export const UpdateFirmware = (
  props: UpdateFirmwareProps
): JSX.Element | null => {
  const {
    proceed,
    setErrorMessage,
    attachedModule,
    robotName,
    patchModuleAfterUpdate,
  } = props
  const { t } = useTranslation('module_wizard_flows')

  const dispatch = useDispatch<Dispatch>()
  const [getLatestRequestId, handleModuleApiRequests] = useModuleApiRequests()
  const moduleSerialNumber = props.attachedModule.serialNumber
  const [
    moduleRequestTimeoutId,
    setModuleRequestTimeoutId,
  ] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [inProgress, setInProgress] = useState(false)
  const [shouldProceed, setShouldProceed] = useState(false)

  const latestRequestId = getLatestRequestId(attachedModule.serialNumber)
  const requestStatus = useSelector((state: State) => {
    return latestRequestId ? getRequestById(state, latestRequestId) : null
  })?.status
  const attachedModules =
    useModulesQuery({
      refetchInterval: EQUIPMENT_POLL_MS,
      enabled: requestStatus === SUCCESS && inProgress,
    })?.data?.data ?? []
  useEffect(() => {
    const matchingModule = attachedModules.find(
      module => module.serialNumber === moduleSerialNumber
    )
    if (matchingModule != null && requestStatus === SUCCESS) {
      if (moduleRequestTimeoutId != null) {
        clearTimeout(moduleRequestTimeoutId)
      }
      patchModuleAfterUpdate(matchingModule)
      proceed()
    }
  }, [attachedModules, requestStatus])

  const handleUpdateFirmware = (): void => {
    handleModuleApiRequests(robotName, attachedModule.serialNumber)
  }

  useEffect(() => {
    if (!attachedModule.hasAvailableUpdate) {
      setShouldProceed(true)
      setTimeout(() => {
        proceed()
      }, NO_UPDATE_FOUND_TIMEOUT_MS)
    }
  }, [])

  useEffect(() => {
    if (requestStatus === PENDING) {
      setInProgress(true)
    } else if (requestStatus === FAILURE) {
      setInProgress(false)
      setErrorMessage(t('firmware_update_failed') as string)
      if (latestRequestId != null) dispatch(dismissRequest(latestRequestId))
    } else if (requestStatus === SUCCESS) {
      // if the request succeeds but the module doesn't come back online within 30 seconds
      // we should display an error message
      const timeoutId = setTimeout(() => {
        setErrorMessage(t('firmware_update_failed') as string)
      }, MODULE_TIMEOUT_MS)
      setModuleRequestTimeoutId(timeoutId)
    }
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
        header={t('firmware_up_to_date', {
          module: getModuleDisplayName(attachedModule.moduleModel),
        })}
      />
    )

  return (
    <SimpleWizardBody
      justifyContentForOddButton={JUSTIFY_FLEX_END}
      isSuccess={false}
      iconColor={COLORS.yellow50}
      header={t('firmware_update_found')}
      subHeader={t('firmware_update_to_latest', {
        module: getModuleDisplayName(attachedModule.moduleModel),
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
