import { useTranslation } from 'react-i18next'

import { COLORS, PrimaryButton } from '@opentrons/components'
import {
  FLEX_SINGLE_SLOT_BY_CUTOUT_ID,
  FLEX_STACKER_MODULE_TYPE,
} from '@opentrons/shared-data'

import {
  SimpleWizardBody,
  SimpleWizardInProgressBody,
} from '/app/molecules/SimpleWizardBody'

import type { CreateCommand, DeckConfiguration } from '@opentrons/shared-data'
import type { ModuleSetupWizardStepProps } from './types'

interface CloseDoorProps extends ModuleSetupWizardStepProps {
  deckConfig: DeckConfiguration
}

export const CloseDoor = (props: CloseDoorProps): JSX.Element | null => {
  const {
    proceed,
    isRobotMoving,
    attachedModule,
    chainRunCommands,
    setErrorMessage,
  } = props
  const { t, i18n } = useTranslation(['module_wizard_flows', 'shared'])

  const cutoutId = props.deckConfig.find(
    cc =>
      cc.opentronsModuleSerialNumber === attachedModule.serialNumber &&
      attachedModule.moduleType === FLEX_STACKER_MODULE_TYPE
  )?.cutoutId
  const slotName =
    cutoutId != null ? FLEX_SINGLE_SLOT_BY_CUTOUT_ID[cutoutId] : null

  if (slotName == null) {
    console.error(
      `could not load module ${attachedModule.moduleModel} into location ${slotName}`
    )
    return null
  }

  const handleHomeShuttle = (): void => {
    const homeCommands: CreateCommand[] = [
      {
        commandType: 'loadModule',
        params: {
          location: { slotName },
          model: attachedModule.moduleModel,
          moduleId: attachedModule.id,
        },
      },
      {
        commandType: 'unsafe/flexStacker/prepareShuttle' as const,
        params: { moduleId: attachedModule.id, ignoreLatch: true },
      },
    ]

    chainRunCommands?.(homeCommands, false)
      .then(() => {
        proceed()
      })
      .catch((e: Error) => {
        setErrorMessage(`error homing stacker shuttle: ${e.message}`)
      })
  }

  if (isRobotMoving) {
    return (
      <SimpleWizardInProgressBody
        alternativeSpinner={null}
        description={t('stand_back_robot_in_motion')}
      />
    )
  } else {
    return (
      <SimpleWizardBody
        isSuccess={false}
        iconColor={COLORS.yellow50}
        header={t('close_doors')}
        subHeader={t('close_doors_description')}
      >
        <PrimaryButton
          onClick={() => {
            handleHomeShuttle()
          }}
        >
          {i18n.format(t('shared:continue'), 'capitalize')}
        </PrimaryButton>
      </SimpleWizardBody>
    )
  }
}
