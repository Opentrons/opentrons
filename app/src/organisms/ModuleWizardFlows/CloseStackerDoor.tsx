import { useTranslation } from 'react-i18next'

import { COLORS, JUSTIFY_FLEX_END, PrimaryButton } from '@opentrons/components'
import {
  FLEX_SINGLE_SLOT_BY_CUTOUT_ID,
  FLEX_STACKER_MODULE_TYPE,
} from '@opentrons/shared-data'

import { SmallButton } from '/app/atoms/buttons'
import { isMaintenanceDoorOpenError } from '/app/local-resources/maintenance_runs/utils/isDoorOpenError'
import {
  SimpleWizardBody,
  SimpleWizardInProgressBody,
} from '/app/molecules/SimpleWizardBody'

import type { ReactNode } from 'react'
import type { CreateCommand, DeckConfiguration } from '@opentrons/shared-data'
import type { ModuleSetupWizardMaybePipetteStepProps } from './types'

interface CloseDoorProps extends ModuleSetupWizardMaybePipetteStepProps {
  deckConfig: DeckConfiguration
}

export function CloseDoor(props: CloseDoorProps): ReactNode {
  const {
    proceed,
    isRobotMoving,
    attachedModule,
    chainRunCommands,
    setErrorMessage,
    setIsDoorOpenError,
    isOnDevice,
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
    setErrorMessage(
      `could not load module ${attachedModule.moduleModel} into location ${slotName}`
    )
  }

  const handleHomeShuttle = (): void => {
    const homeCommands: CreateCommand[] = [
      {
        commandType: 'loadModule',
        params: {
          location: { slotName: slotName ?? '' },
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
        if (isMaintenanceDoorOpenError(e)) {
          setIsDoorOpenError(true)
          setErrorMessage(t('module_wizard_flows:door_is_open') as string)
        } else {
          setErrorMessage(`error homing stacker shuttle: ${e.message}`)
        }
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
        justifyContentForOddButton={JUSTIFY_FLEX_END}
        isSuccess={false}
        iconColor={COLORS.yellow50}
        header={t('close_doors')}
        subHeader={t('close_doors_description')}
      >
        {isOnDevice ? (
          <SmallButton
            buttonType="primary"
            onClick={handleHomeShuttle}
            buttonText={i18n.format(t('shared:continue'), 'capitalize')}
          />
        ) : (
          <PrimaryButton disabled={isRobotMoving} onClick={handleHomeShuttle}>
            {i18n.format(t('shared:continue'), 'capitalize')}
          </PrimaryButton>
        )}
      </SimpleWizardBody>
    )
  }
}
