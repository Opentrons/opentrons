import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import { COLORS, JUSTIFY_FLEX_END, PrimaryButton } from '@opentrons/components'
import { DeckConfiguration, getModuleDisplayName } from '@opentrons/shared-data'

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
import { AttachedModule } from '@opentrons/api-client'
import { useGetNewModules } from '/app/App/hooks'
import { i18n } from '/app/i18n'
import { GenericWizardTile } from '/app/molecules/GenericWizardTile'

interface SelectModuleProps extends ModuleCalibrationWizardStepProps {
  robotName: String
  deckConfig: DeckConfiguration
  isLoadedInRun: boolean
  modules: AttachedModule[]
}

export const SelectModule = (
  props: SelectModuleProps
): JSX.Element | null => {
  const { proceed, setErrorMessage, robotName } = props
  const { t } = useTranslation('module_wizard_flows')

  const newModules = useGetNewModules() || []
  console.log("MODULES", newModules)

  const dispatch = useDispatch<Dispatch>()
  const [getLatestRequestId, handleModuleApiRequests] = useModuleApiRequests()

  const [inProgress, setInProgress] = useState(false)
  const [shouldProceed, setShouldProceed] = useState(false)

  //const latestRequestId = getLatestRequestId(attachedModule.serialNumber)
  //const requestStatus = useSelector((state: State) => {
  //  return latestRequestId ? getRequestById(state, latestRequestId) : null
  //})?.status

  const handleSelectModule = (): void => {
    console.log("Handle module")
    // handleModuleApiRequests(robotName, attachedModule.serialNumber)
  }

//if (newModules.length == 1) {
if (newModules.length > 1) {
  const usbPort = newModules[0].usbPort
  const moduleName = getModuleDisplayName(newModules[0].moduleModel)
  const modulePort = usbPort?.hubPort != null ? `${usbPort.port}.${usbPort.hubPort}` : usbPort?.port

  return (
    <SimpleWizardBody
      justifyContentForOddButton={JUSTIFY_FLEX_END}
      isSuccess={true}
      iconColor={COLORS.green50}
      header={t('module_attached_to_port', {
        module: moduleName,
        port: modulePort
      })}
    >
      <PrimaryButton
        onClick={() => {
          console.log("CONTINUE")
        }}
      >
        {i18n.format(t('module_start_setup'), 'capitalize')}
      </PrimaryButton>
    </SimpleWizardBody>
  )
} else if (newModules.length > 1) {
  return (
    <SimpleWizardBody
      isSuccess={true}
      iconColor={COLORS.green50}
      header={t('module_attached_multiple')}
    >
      <PrimaryButton
        onClick={() => {
          console.log("CONTINUE")
        }}
      >
        {i18n.format(t('module_start_setup'), 'capitalize')}
      </PrimaryButton>
    </SimpleWizardBody>
  )
  }
}
