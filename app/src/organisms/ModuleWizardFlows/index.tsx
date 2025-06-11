import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { COLORS, LegacyStyledText } from '@opentrons/components'
import { useModulesQuery } from '@opentrons/react-api-client'
import { getModuleDisplayName } from '@opentrons/shared-data'

import {
  SimpleWizardBody,
  SimpleWizardInProgressBody,
} from '/app/molecules/SimpleWizardBody'

import { EQUIPMENT_POLL_MS } from '../DoorOpenControl/constants'
import { AttachProbe } from './AttachProbe'
import { BeforeBeginning } from './BeforeBeginning'
import { CloseDoor } from './CloseStackerDoor'
import { SECTIONS } from './constants'
import { DetachProbe } from './DetachProbe'
import { useSendIdentifyStacker } from './hooks'
import { InstallShuttle } from './InstallShuttle'
import { ModuleWizardScreen } from './ModuleWizardScreen'
import { PlaceAdapter } from './PlaceAdapter'
import { SelectLocation } from './SelectLocation'
import { SelectModule } from './SelectModule'
import { Success } from './Success'
import { UpdateFirmware } from './UpdateFirmware'
import { useModuleSetupWizard } from './useModuleSetupWizard'

import type { AttachedModule } from '@opentrons/api-client'

interface ModuleWizardFlowsProps {
  closeFlow: () => void
  robotName: string
  attachedModule?: AttachedModule
  showSetupLauncher?: boolean
  isLoadedInRun?: boolean
  onComplete?: () => void
}

export function ModuleWizardFlows(
  props: ModuleWizardFlowsProps
): JSX.Element | null {
  const {
    attachedModule: attachedModuleOnLaunch,
    robotName,
    isLoadedInRun = false,
    showSetupLauncher = false,
    closeFlow,
    onComplete,
  } = props

  const { t } = useTranslation('module_wizard_flows')

  const {
    currentStep,
    currentStepIndex,
    totalStepCount,
    createMaintenanceRun,
    handleCleanUpAndClose,
    wizardFlowBaseProps,
    buildFlowForSelectedModule,
    patchModuleAfterUpdate,
    deckConfig,
  } = useModuleSetupWizard({ closeFlow, attachedModuleOnLaunch, onComplete })

  // build out flow if there is a module passed in at launch
  useEffect(() => {
    if (attachedModuleOnLaunch != null) {
      buildFlowForSelectedModule(attachedModuleOnLaunch)
    }
  }, [])

  const sendIdentifyStacker = useSendIdentifyStacker()
  const [selectedModule, setSelectedModule] = useState<AttachedModule | null>(
    null
  )
  const [showLaunchSetup, setShowLaunchSetup] = useState<boolean>(
    showSetupLauncher
  )
  const [createdAdapterId, setCreatedAdapterId] = useState<string | null>(null)

  const attachedModules =
    useModulesQuery({
      refetchInterval: EQUIPMENT_POLL_MS,
      enabled: wizardFlowBaseProps.attachedModule != null,
    })?.data?.data ?? []

  if (wizardFlowBaseProps.attachedPipette == null) return null
  if (showLaunchSetup || wizardFlowBaseProps.attachedModule == null) {
    return (
      <ModuleWizardScreen
        isRobotMoving={wizardFlowBaseProps.isRobotMoving}
        isModuleUpdating={wizardFlowBaseProps.isModuleUpdating}
        handleCleanUpAndClose={() => {
          if (selectedModule != null) {
            sendIdentifyStacker(selectedModule, false)
          }
          handleCleanUpAndClose()
        }}
        currentStepIndex={currentStepIndex}
        totalStepCount={totalStepCount}
      >
        <SelectModule
          {...currentStep}
          {...wizardFlowBaseProps}
          buildFlowForSelectedModule={buildFlowForSelectedModule}
          selectedModule={selectedModule}
          setSelectedModule={setSelectedModule}
          setShowLaunchSetup={setShowLaunchSetup}
          attachedModuleOnLaunch={attachedModuleOnLaunch}
        />
      </ModuleWizardScreen>
    )
  } else if (
    (wizardFlowBaseProps.isRobotMoving &&
      wizardFlowBaseProps.maintenanceRunId == null) ||
    currentStep == null
  ) {
    return (
      <ModuleWizardScreen
        isRobotMoving={wizardFlowBaseProps.isRobotMoving}
        isModuleUpdating={wizardFlowBaseProps.isModuleUpdating}
        handleCleanUpAndClose={handleCleanUpAndClose}
        currentStepIndex={currentStepIndex}
        totalStepCount={totalStepCount}
      >
        <SimpleWizardInProgressBody
          description={t('prepping_module', {
            module: getModuleDisplayName(
              wizardFlowBaseProps.attachedModule.moduleModel
            ),
          })}
        />
      </ModuleWizardScreen>
    )
  } else if (wizardFlowBaseProps.errorMessage != null) {
    return (
      <ModuleWizardScreen
        isRobotMoving={wizardFlowBaseProps.isRobotMoving}
        isModuleUpdating={wizardFlowBaseProps.isModuleUpdating}
        handleCleanUpAndClose={handleCleanUpAndClose}
        currentStepIndex={currentStepIndex}
        totalStepCount={totalStepCount}
      >
        <SimpleWizardBody
          isSuccess={false}
          iconColor={COLORS.red50}
          header={t('error_during_setup')}
          subHeader={
            <Trans
              t={t}
              i18nKey="branded:module_setup_failed"
              values={{ error: wizardFlowBaseProps.errorMessage }}
              components={{
                block: <LegacyStyledText as="p" />,
              }}
            />
          }
        />
      </ModuleWizardScreen>
    )
  } else if (wizardFlowBaseProps.isExiting) {
    return (
      <ModuleWizardScreen
        isRobotMoving={wizardFlowBaseProps.isRobotMoving}
        isModuleUpdating={wizardFlowBaseProps.isModuleUpdating}
        handleCleanUpAndClose={handleCleanUpAndClose}
        currentStepIndex={currentStepIndex}
        totalStepCount={totalStepCount}
      >
        <SimpleWizardInProgressBody
          description={t('stand_back_robot_in_motion')}
        />
      </ModuleWizardScreen>
    )
  }
  switch (currentStep.section) {
    case SECTIONS.BEFORE_BEGINNING:
      return (
        <ModuleWizardScreen
          isRobotMoving={wizardFlowBaseProps.isRobotMoving}
          isModuleUpdating={wizardFlowBaseProps.isModuleUpdating}
          handleCleanUpAndClose={handleCleanUpAndClose}
          currentStepIndex={currentStepIndex}
          totalStepCount={totalStepCount}
        >
          <BeforeBeginning
            {...currentStep}
            {...wizardFlowBaseProps}
            attachedModule={wizardFlowBaseProps.attachedModule}
            attachedPipette={wizardFlowBaseProps.attachedPipette}
          />
        </ModuleWizardScreen>
      )
    case SECTIONS.SELECT_LOCATION:
      return (
        <ModuleWizardScreen
          isRobotMoving={wizardFlowBaseProps.isRobotMoving}
          isModuleUpdating={wizardFlowBaseProps.isModuleUpdating}
          handleCleanUpAndClose={handleCleanUpAndClose}
          currentStepIndex={currentStepIndex}
          totalStepCount={totalStepCount}
        >
          <SelectLocation
            {...currentStep}
            {...wizardFlowBaseProps}
            deckConfig={deckConfig}
            createMaintenanceRun={createMaintenanceRun}
            isLoadedInRun={isLoadedInRun}
            attachedModule={wizardFlowBaseProps.attachedModule}
            attachedPipette={wizardFlowBaseProps.attachedPipette}
          />
        </ModuleWizardScreen>
      )
    case SECTIONS.PLACE_ADAPTER:
      return (
        <ModuleWizardScreen
          isRobotMoving={wizardFlowBaseProps.isRobotMoving}
          isModuleUpdating={wizardFlowBaseProps.isModuleUpdating}
          handleCleanUpAndClose={handleCleanUpAndClose}
          currentStepIndex={currentStepIndex}
          totalStepCount={totalStepCount}
        >
          <PlaceAdapter
            {...currentStep}
            {...wizardFlowBaseProps}
            deckConfig={deckConfig}
            setCreatedAdapterId={setCreatedAdapterId}
            attachedModule={wizardFlowBaseProps.attachedModule}
            attachedPipette={wizardFlowBaseProps.attachedPipette}
          />
        </ModuleWizardScreen>
      )
    case SECTIONS.ATTACH_PROBE:
      return (
        <ModuleWizardScreen
          isRobotMoving={wizardFlowBaseProps.isRobotMoving}
          isModuleUpdating={wizardFlowBaseProps.isModuleUpdating}
          handleCleanUpAndClose={handleCleanUpAndClose}
          currentStepIndex={currentStepIndex}
          totalStepCount={totalStepCount}
        >
          <AttachProbe
            {...currentStep}
            {...wizardFlowBaseProps}
            adapterId={createdAdapterId}
            deckConfig={deckConfig}
            attachedModule={wizardFlowBaseProps.attachedModule}
            attachedPipette={wizardFlowBaseProps.attachedPipette}
          />
        </ModuleWizardScreen>
      )
    case SECTIONS.DETACH_PROBE:
      return (
        <ModuleWizardScreen
          isRobotMoving={wizardFlowBaseProps.isRobotMoving}
          isModuleUpdating={wizardFlowBaseProps.isModuleUpdating}
          handleCleanUpAndClose={handleCleanUpAndClose}
          currentStepIndex={currentStepIndex}
          totalStepCount={totalStepCount}
        >
          <DetachProbe
            {...currentStep}
            {...wizardFlowBaseProps}
            attachedModule={wizardFlowBaseProps.attachedModule}
            attachedPipette={wizardFlowBaseProps.attachedPipette}
          />
        </ModuleWizardScreen>
      )

    case SECTIONS.SUCCESS:
      return (
        <ModuleWizardScreen
          isRobotMoving={wizardFlowBaseProps.isRobotMoving}
          isModuleUpdating={wizardFlowBaseProps.isModuleUpdating}
          handleCleanUpAndClose={handleCleanUpAndClose}
          currentStepIndex={currentStepIndex}
          totalStepCount={totalStepCount}
        >
          <Success
            {...currentStep}
            {...wizardFlowBaseProps}
            isRobotMoving={wizardFlowBaseProps.isRobotMoving}
            proceed={
              wizardFlowBaseProps.isRobotMoving
                ? () => {}
                : handleCleanUpAndClose
            }
            attachedModule={wizardFlowBaseProps.attachedModule}
            attachedModuleOnLaunch={attachedModuleOnLaunch}
            attachedPipette={wizardFlowBaseProps.attachedPipette}
            setSelectedModule={setSelectedModule}
          />
        </ModuleWizardScreen>
      )
    case SECTIONS.CLOSE_DOOR:
      return (
        <ModuleWizardScreen
          isRobotMoving={wizardFlowBaseProps.isRobotMoving}
          isModuleUpdating={wizardFlowBaseProps.isModuleUpdating}
          handleCleanUpAndClose={handleCleanUpAndClose}
          currentStepIndex={currentStepIndex}
          totalStepCount={totalStepCount}
        >
          <CloseDoor
            {...currentStep}
            {...wizardFlowBaseProps}
            deckConfig={deckConfig}
            attachedModule={wizardFlowBaseProps.attachedModule}
            attachedPipette={wizardFlowBaseProps.attachedPipette}
          />
        </ModuleWizardScreen>
      )
    case SECTIONS.INSTALL_SHUTTLE:
      return (
        <ModuleWizardScreen
          isRobotMoving={wizardFlowBaseProps.isRobotMoving}
          isModuleUpdating={wizardFlowBaseProps.isModuleUpdating}
          handleCleanUpAndClose={handleCleanUpAndClose}
          currentStepIndex={currentStepIndex}
          totalStepCount={totalStepCount}
        >
          <InstallShuttle
            {...currentStep}
            {...wizardFlowBaseProps}
            deckConfig={deckConfig}
            attachedModule={wizardFlowBaseProps.attachedModule}
            attachedModules={attachedModules}
            attachedPipette={wizardFlowBaseProps.attachedPipette}
          />
        </ModuleWizardScreen>
      )
    case SECTIONS.UPDATE_FIRMWARE:
      return (
        <ModuleWizardScreen
          isRobotMoving={wizardFlowBaseProps.isRobotMoving}
          isModuleUpdating={wizardFlowBaseProps.isModuleUpdating}
          handleCleanUpAndClose={handleCleanUpAndClose}
          currentStepIndex={currentStepIndex}
          totalStepCount={totalStepCount}
        >
          <UpdateFirmware
            {...currentStep}
            {...wizardFlowBaseProps}
            attachedModule={wizardFlowBaseProps.attachedModule}
            attachedPipette={wizardFlowBaseProps.attachedPipette}
            robotName={robotName}
            patchModuleAfterUpdate={patchModuleAfterUpdate}
          />
        </ModuleWizardScreen>
      )
  }
}
