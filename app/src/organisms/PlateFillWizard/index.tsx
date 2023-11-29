import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  useConditionalConfirm,
  Flex,
  DIRECTION_COLUMN,
  POSITION_ABSOLUTE,
  COLORS,
  BORDERS,
} from '@opentrons/components'
import { getPipetteNameSpecs, PipetteName } from '@opentrons/shared-data'


import { Portal } from '../../App/portal'
import { WizardHeader } from '../../molecules/WizardHeader'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { StyledText } from '../../atoms/text'
import { getLatestLabwareDef } from '../../assets/labware/getLabware'
import { ExitConfirmation } from './ExitConfirmation'
import {
  CHOOSE_TIP_RACK,
  CHOOSE_SOURCE,
  CHOOSE_DESTINATION,
  PLATE_FILL_STEPS,
  INTRODUCTION,
  SUCCESS,
  TIP_RACK_SLOT_NAME,
} from './constants'
import { BeforeBeginning } from './BeforeBeginning'
import { ChooseLocation } from './ChooseLocation'
import { ChooseTipRack } from './ChooseTipRack'
import { Success } from './Success'

import type { PipetteData } from '@opentrons/api-client'
import type {
  CreateCommand,
  LabwareDefinition2,
  PipetteModelSpecs,
  RobotType,
} from '@opentrons/shared-data'

interface PlateFillWizardProps {
  robotType: RobotType
  mount: PipetteData['mount']
  closeFlow: () => void
  isCreateLoading: boolean
  isRobotMoving: boolean
  isExiting: boolean
  instrumentModelSpecs: PipetteModelSpecs
}

export const PlateFillWizard = (
  props: PlateFillWizardProps
): JSX.Element | null => {
  const {
    robotType,
    closeFlow,
    instrumentModelSpecs,
    mount,
    isRobotMoving,
  } = props
  const { t, i18n } = useTranslation('drop_tip_wizard')

  const [errorMessage, setErrorMessage] = React.useState<null | string>(null)

  const [currentStepIndex, setCurrentStepIndex] = React.useState<number>(0)
  const [workingCommands, setWorkingCommands] = React.useState<CreateCommand[]>([
    {
      commandType: 'loadPipette',
      params: {
        mount,
        pipetteName: instrumentModelSpecs.name,
        pipetteId: 'plate_fill_pipette'
      }
    }
  ])

  const plateFillWizardSteps = PLATE_FILL_STEPS
  const currentStep = plateFillWizardSteps[currentStepIndex]
  const isFinalStep = currentStepIndex === plateFillWizardSteps.length - 1
  const goBack = (): void => {
    setCurrentStepIndex(isFinalStep ? currentStepIndex : currentStepIndex - 1)
  }

  const handleCleanUpAndClose = (): void => {
    console.log('WORKING COMMANDS: ', workingCommands)
    closeFlow()
  }

  const proceed = (): void => {
    if (isFinalStep) {
      handleCleanUpAndClose()
    } else {
      setCurrentStepIndex(currentStepIndex + 1)
    }
  }

  const {
    confirm: confirmExit,
    showConfirmation: showConfirmExit,
    cancel: cancelExit,
  } = useConditionalConfirm(handleCleanUpAndClose, true)

  let modalContent: JSX.Element = <div>UNASSIGNED STEP</div>
  if (showConfirmExit) {
    modalContent = (
      <ExitConfirmation
        handleGoBack={cancelExit}
        handleExit={confirmExit}
        isRobotMoving={isRobotMoving}
      />
    )
  } else if (errorMessage != null) {
    modalContent = (
      <SimpleWizardBody
        isSuccess={false}
        iconColor={COLORS.errorEnabled}
        header={t('error_dropping_tips')}
        subHeader={
          <>
            {t('plate_fill_failed')}
            {errorMessage}
          </>
        }
      />
    )
  } else if (currentStep === INTRODUCTION) {
    modalContent = (<BeforeBeginning handleProceed={proceed} />)
  } else if (
    currentStep === CHOOSE_TIP_RACK
  ) {
    modalContent = (
      <ChooseTipRack
        handleProceed={proceed}
        handleGoBack={goBack}
        handleChooseTipRack={(tipRackDef: LabwareDefinition2) => {
          setWorkingCommands((prevCommands) => ([
            ...prevCommands,
            {
              commandType: 'loadLabware',
              params: {
                namespace: tipRackDef.namespace,
                loadName: tipRackDef.parameters.loadName,
                version: tipRackDef.version,
                location: { slotName: TIP_RACK_SLOT_NAME }
              }
            }
          ]))
        }}
        allTipRackDefs={getPipetteNameSpecs(instrumentModelSpecs.name as PipetteName)?.defaultTipracks.reduce<LabwareDefinition2[]>((acc, tipRackDefURI) => {
          const tipRackDef = getLatestLabwareDef(tipRackDefURI.split('/')[1])
          return tipRackDef != null ? [...acc, tipRackDef] : acc
        }, []) ?? []}
      />
    )
  } else if (
    currentStep === CHOOSE_SOURCE ||
    currentStep === CHOOSE_DESTINATION
  ) {
    modalContent = (
      <ChooseLocation
        robotType={robotType}
        handleProceed={proceed}
        title={
          currentStep === CHOOSE_SOURCE
            ? i18n.format(t('choose_source'), 'capitalize')
            : i18n.format(t('choose_destination'), 'capitalize')
        }
        body={
          <Trans
            t={t}
            i18nKey={i18n.format(t('choose_labware_description'))}
            components={{ block: <StyledText as="p" /> }}
          />
        }
        setErrorMessage={setErrorMessage}
      />
    )
  } else if (
    currentStep === SUCCESS
  ) {
    modalContent = (
      <Success handleProceed={handleCleanUpAndClose} />
    )
  }

  let handleExit: (() => void) | null = confirmExit
  if (isRobotMoving || showConfirmExit) {
    handleExit = null
  } else if (errorMessage != null) {
    handleExit = handleCleanUpAndClose
  }

  const wizardHeader = (
    <WizardHeader
      title={i18n.format(t('fill_plate'), 'capitalize')}
      currentStep={currentStepIndex + 1}
      totalSteps={plateFillWizardSteps.length}
      onExit={
        currentStepIndex === plateFillWizardSteps.length - 1
          ? handleCleanUpAndClose
          : handleExit
      }
    />
  )

  return (
    <Portal level="top">
      <Flex
        flexDirection={DIRECTION_COLUMN}
        width="992px"
        height="568px"
        left="14.5px"
        top="16px"
        border={BORDERS.lineBorder}
        boxShadow={BORDERS.shadowSmall}
        borderRadius={BORDERS.borderRadiusSize4}
        position={POSITION_ABSOLUTE}
        backgroundColor={COLORS.white}
      >
        {wizardHeader}
        {modalContent}
      </Flex>
    </Portal>
  )
}
