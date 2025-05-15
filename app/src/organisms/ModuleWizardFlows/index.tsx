import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { COLORS, LegacyStyledText } from '@opentrons/components'

import {
  SimpleWizardBody,
  SimpleWizardInProgressBody,
} from '/app/molecules/SimpleWizardBody'

import { AttachProbe } from './AttachProbe'
import { BeforeBeginning } from './BeforeBeginning'
import { SECTIONS } from './constants'
import { DetachProbe } from './DetachProbe'
import { ModuleWizardScreen } from './ModuleWizardScreen'
import { PlaceAdapter } from './PlaceAdapter'
import { SelectLocation } from './SelectLocation'
import { Success } from './Success'
import { useInitModuleFlow } from './useModuleWizardFlows'

import type { AttachedModule } from '@opentrons/api-client'

interface ModuleWizardFlowsProps {
  attachedModule: AttachedModule
  closeFlow: () => void
  isPrepCommandLoading: boolean
  isLoadedInRun?: boolean
  onComplete?: () => void
  prepCommandErrorMessage?: string
}

export const ModuleWizardFlows = (
  props: ModuleWizardFlowsProps
): JSX.Element | null => {
  const {
    attachedModule,
    isLoadedInRun = false,
    isPrepCommandLoading,
    closeFlow,
    onComplete,
    prepCommandErrorMessage,
  } = props

  const { t } = useTranslation('module_wizard_flows')

  const {
    currentStep,
    currentStepIndex,
    totalStepCount,
    handleCleanUpAndClose,
    wizardFlowBaseProps,
    buildFlowForSelectedModule,
    deckConfig,
  } = useInitModuleFlow({ closeFlow, attachedModule, onComplete })

  // add use effect to call build flow if there is a module passed in at launch
  useEffect(() => {
    if (attachedModule != null) {
      buildFlowForSelectedModule(attachedModule)
    }
  }, [])

  const [createdAdapterId, setCreatedAdapterId] = useState<string | null>(null)
  if (wizardFlowBaseProps.attachedPipette == null) return null

  if (attachedModule == null) {
    //arbitrary step count before we know how many there will be
    return (
      <ModuleWizardScreen
        isRobotMoving={wizardFlowBaseProps.isRobotMoving}
        handleCleanUpAndClose={handleCleanUpAndClose}
        currentStepIndex={0}
        totalStepCount={5}
      >
        <>
          CHOOSE MODULE SCREEN PROCEED FUNCTION HERE WILL BE INITIALIZE MODULE
          FLOW HOOK
        </>
      </ModuleWizardScreen>
    )
  } else if (isPrepCommandLoading || currentStep == null) {
    return (
      <ModuleWizardScreen
        isRobotMoving={wizardFlowBaseProps.isRobotMoving}
        handleCleanUpAndClose={handleCleanUpAndClose}
        currentStepIndex={currentStepIndex}
        totalStepCount={totalStepCount}
      >
        <SimpleWizardInProgressBody
        // description={t('prepping_module', {
        //   module: getModuleDisplayName(attachedModule.moduleModel),
        // })}
        />
      </ModuleWizardScreen>
    )
  } else if (
    prepCommandErrorMessage != null ||
    wizardFlowBaseProps.errorMessage != null
    // maintenanceRunData?.data.status === RUN_STATUS_FAILED
  ) {
    // TODO: change this error header to match designs
    return (
      <ModuleWizardScreen
        isRobotMoving={wizardFlowBaseProps.isRobotMoving}
        handleCleanUpAndClose={handleCleanUpAndClose}
        currentStepIndex={currentStepIndex}
        totalStepCount={totalStepCount}
      >
        <SimpleWizardBody
          isSuccess={false}
          iconColor={COLORS.red50}
          header={t(
            prepCommandErrorMessage != null
              ? 'error_prepping_module'
              : 'error_during_calibration'
          )}
          subHeader={
            prepCommandErrorMessage != null ? (
              prepCommandErrorMessage
            ) : (
              <Trans
                t={t}
                i18nKey={'branded:module_calibration_failed'}
                values={{ error: wizardFlowBaseProps.errorMessage }}
                components={{
                  block: <LegacyStyledText as="p" />,
                }}
              />
            )
          }
        />
      </ModuleWizardScreen>
    )
  } else if (wizardFlowBaseProps.isExiting) {
    return (
      <ModuleWizardScreen
        isRobotMoving={wizardFlowBaseProps.isRobotMoving}
        handleCleanUpAndClose={handleCleanUpAndClose}
        currentStepIndex={currentStepIndex}
        totalStepCount={totalStepCount}
      >
        <SimpleWizardInProgressBody
          description={t('stand_back_robot_in_motion')}
        />
      </ModuleWizardScreen>
    )
  } else if (attachedModule != null && wizardFlowBaseProps.attachedPipette != null) {
    switch (currentStep.section) {
      case SECTIONS.BEFORE_BEGINNING:
        return (
          <ModuleWizardScreen
            isRobotMoving={wizardFlowBaseProps.isRobotMoving}
            handleCleanUpAndClose={handleCleanUpAndClose}
            currentStepIndex={currentStepIndex}
            totalStepCount={totalStepCount}
          >
            <BeforeBeginning {...currentStep} {...wizardFlowBaseProps} />
          </ModuleWizardScreen>
        )
      case SECTIONS.SELECT_LOCATION:
        return (
          <ModuleWizardScreen
            isRobotMoving={wizardFlowBaseProps.isRobotMoving}
            handleCleanUpAndClose={handleCleanUpAndClose}
            currentStepIndex={currentStepIndex}
            totalStepCount={totalStepCount}
          >
            <SelectLocation
              {...currentStep}
              {...wizardFlowBaseProps}
              deckConfig={deckConfig}
              isLoadedInRun={isLoadedInRun}
            />
          </ModuleWizardScreen>
        )
      case SECTIONS.PLACE_ADAPTER:
        return (
          <ModuleWizardScreen
            isRobotMoving={wizardFlowBaseProps.isRobotMoving}
            handleCleanUpAndClose={handleCleanUpAndClose}
            currentStepIndex={currentStepIndex}
            totalStepCount={totalStepCount}
          >
            <PlaceAdapter
              {...currentStep}
              {...wizardFlowBaseProps}
              deckConfig={deckConfig}
              setCreatedAdapterId={setCreatedAdapterId}
              // createMaintenanceRun={createTargetedMaintenanceRun}
              isCreateLoading={false}
              // createdMaintenanceRunId={false}
            />
          </ModuleWizardScreen>
        )
      case SECTIONS.ATTACH_PROBE:
        return (
          <ModuleWizardScreen
            isRobotMoving={wizardFlowBaseProps.isRobotMoving}
            handleCleanUpAndClose={handleCleanUpAndClose}
            currentStepIndex={currentStepIndex}
            totalStepCount={totalStepCount}
          >
            <AttachProbe
              {...currentStep}
              {...wizardFlowBaseProps}
              adapterId={createdAdapterId}
              deckConfig={deckConfig}
            />
          </ModuleWizardScreen>
        )
      case SECTIONS.DETACH_PROBE:
        return (
          <ModuleWizardScreen
            isRobotMoving={wizardFlowBaseProps.isRobotMoving}
            handleCleanUpAndClose={handleCleanUpAndClose}
            currentStepIndex={currentStepIndex}
            totalStepCount={totalStepCount}
          >
            <DetachProbe {...currentStep} {...wizardFlowBaseProps} />
          </ModuleWizardScreen>
        )

      case SECTIONS.SUCCESS:
        return (
          <ModuleWizardScreen
            isRobotMoving={wizardFlowBaseProps.isRobotMoving}
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
            />
          </ModuleWizardScreen>
        )
      case SECTIONS.CHECK_INSTALLATION_PINS:
        return (
          <ModuleWizardScreen
            isRobotMoving={wizardFlowBaseProps.isRobotMoving}
            handleCleanUpAndClose={handleCleanUpAndClose}
            currentStepIndex={currentStepIndex}
            totalStepCount={totalStepCount}
          >
            <>Check installation pins</>
          </ModuleWizardScreen>
        )
      case SECTIONS.CLOSE_DOOR:
        return (
          <ModuleWizardScreen
            isRobotMoving={wizardFlowBaseProps.isRobotMoving}
            handleCleanUpAndClose={handleCleanUpAndClose}
            currentStepIndex={currentStepIndex}
            totalStepCount={totalStepCount}
          >
            <>Close robot door</>
          </ModuleWizardScreen>
        )
      case SECTIONS.INSTALL_SHUTTLE:
        return (
          <ModuleWizardScreen
            isRobotMoving={wizardFlowBaseProps.isRobotMoving}
            handleCleanUpAndClose={handleCleanUpAndClose}
            currentStepIndex={currentStepIndex}
            totalStepCount={totalStepCount}
          >
            <>Install shuttle</>
          </ModuleWizardScreen>
        )
      case SECTIONS.UPDATE_FIRMWARE:
        return (
          <ModuleWizardScreen
            isRobotMoving={wizardFlowBaseProps.isRobotMoving}
            handleCleanUpAndClose={handleCleanUpAndClose}
            currentStepIndex={currentStepIndex}
            totalStepCount={totalStepCount}
          >
            <>Update firmware</>
          </ModuleWizardScreen>
        )
      default:
        return null
    }
  }
}
