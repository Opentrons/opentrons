import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  AnimationVideo,
  Flex,
  LegacyStyledText,
  RESPONSIVENESS,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  FLEX_SINGLE_SLOT_BY_CUTOUT_ID,
  getCalibrationAdapterLoadName,
  getModuleDisplayName,
  HEATERSHAKER_MODULE_MODELS,
  HEATERSHAKER_MODULE_TYPE,
  TEMPERATURE_MODULE_MODELS,
  THERMOCYCLER_MODULE_MODELS,
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_V2_FRONT_FIXTURE,
} from '@opentrons/shared-data'

import HeaterShaker_PlaceAdapter_L from '/app/assets/videos/module_wizard_flows/HeaterShaker_PlaceAdapter_L.webm'
import HeaterShaker_PlaceAdapter_R from '/app/assets/videos/module_wizard_flows/HeaterShaker_PlaceAdapter_R.webm'
import TempModule_PlaceAdapter_L from '/app/assets/videos/module_wizard_flows/TempModule_PlaceAdapter_L.webm'
import TempModule_PlaceAdapter_R from '/app/assets/videos/module_wizard_flows/TempModule_PlaceAdapter_R.webm'
import Thermocycler_PlaceAdapter from '/app/assets/videos/module_wizard_flows/Thermocycler_PlaceAdapter.webm'
import { getModulePrepCommands } from '/app/local-resources/modules'
import { GenericWizardTile } from '/app/molecules/GenericWizardTile'
import { SimpleWizardInProgressBody } from '/app/molecules/SimpleWizardBody'

import { LEFT_SLOTS } from './constants'

import type { CommandData } from '@opentrons/api-client'
import type { CreateCommand, DeckConfiguration } from '@opentrons/shared-data'
import type { ModuleSetupWizardRequiresPipetteStepProps } from './types'

interface PlaceAdapterProps extends ModuleSetupWizardRequiresPipetteStepProps {
  deckConfig: DeckConfiguration
  setCreatedAdapterId: (adapterId: string) => void
}

export const BODY_STYLE = css`
  ${TYPOGRAPHY.pRegular};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: 1.275rem;
    line-height: 1.75rem;
  }
`

export function PlaceAdapter(props: PlaceAdapterProps): JSX.Element {
  const {
    proceed,
    goBack,
    deckConfig,
    attachedModule,
    chainRunCommands,
    setErrorMessage,
    setCreatedAdapterId,
    attachedPipette,
    isRobotMoving,
    maintenanceRunId,
  } = props
  const { t } = useTranslation('module_wizard_flows')

  const [didSetup, setDidSetup] = useState<boolean>(false)

  const mount = attachedPipette.mount
  const cutoutId = deckConfig.find(
    cc =>
      cc.opentronsModuleSerialNumber === attachedModule.serialNumber &&
      (attachedModule.moduleType !== THERMOCYCLER_MODULE_TYPE ||
        cc.cutoutFixtureId === THERMOCYCLER_V2_FRONT_FIXTURE)
  )?.cutoutId
  const slotName =
    cutoutId != null ? FLEX_SINGLE_SLOT_BY_CUTOUT_ID[cutoutId] : null
  if (!didSetup && !!chainRunCommands) {
    // Run the module setup commands. This is a little finicky because we might run
    // them several times if this component is mounted and unmounted.
    const calibrationAdapterLoadName = getCalibrationAdapterLoadName(
      attachedModule.moduleModel
    )
    if (calibrationAdapterLoadName == null) {
      setErrorMessage(
        `could not get calibration adapter load name for ${attachedModule.moduleModel}`
      )
    }
    if (slotName == null) {
      setErrorMessage(
        `could not load module ${attachedModule.moduleModel} into location ${slotName}`
      )
    }

    const calibrationAdapterId = `${attachedModule.id}-calibration-adapter`
    // it's always ok to run loadmodule because if you load a module twice we
    // override the previous one
    chainRunCommands(
      [
        {
          commandType: 'loadModule',
          params: {
            location: { slotName: slotName ?? '' },
            model: attachedModule.moduleModel,
            moduleId: attachedModule.id,
          },
        },
      ],
      false
    )
      .then(() =>
        chainRunCommands(
          [
            {
              commandType: 'loadLabware',
              params: {
                labwareId: calibrationAdapterId,
                location: { moduleId: attachedModule.id },
                version: 1,
                namespace: 'opentrons',
                loadName: calibrationAdapterLoadName ?? '',
              },
            },
          ],
          true
        )
      )
      // it's not always safe to load labware since the position might be taken,
      // but this is such a limited interaction that we can be confident that we'll
      // only fail because that labware was already loaded, and since we load with
      // fixed ids we can be confident that a labware exists at that id to use
      .catch(
        () =>
          new Promise<CommandData[]>(resolve => {
            resolve([])
          })
      )
      .finally(() => {
        setCreatedAdapterId(calibrationAdapterId)
      })
      .then(() =>
        chainRunCommands(getModulePrepCommands(attachedModule), false)
      )
    setDidSetup(true)
  }
  const handleOnClick = (): void => {
    const calibrationAdapterLoadName = getCalibrationAdapterLoadName(
      attachedModule.moduleModel
    )
    if (calibrationAdapterLoadName == null) {
      setErrorMessage(
        `could not get calibration adapter load name for ${attachedModule.moduleModel}`
      )
    }
    if (slotName == null) {
      setErrorMessage(
        `could not load module ${attachedModule.moduleModel} into location ${slotName}`
      )
    }

    const moveToPositionCommands: CreateCommand[] = [
      { commandType: 'home' as const, params: {} },
      {
        commandType: 'calibration/moveToMaintenancePosition',
        params: {
          mount,
        },
      },
    ]

    chainRunCommands?.(moveToPositionCommands, false)
      .then(() => {
        proceed()
      })
      .catch((e: Error) => {
        setErrorMessage(e.message)
      })
  }

  const moduleDisplayName = getModuleDisplayName(attachedModule.moduleModel)
  const isInLeftSlot = LEFT_SLOTS.some(slot => slot === slotName)
  let attachAdapterVideoSrc
  if (
    THERMOCYCLER_MODULE_MODELS.some(
      model => model === attachedModule.moduleModel
    )
  ) {
    attachAdapterVideoSrc = Thermocycler_PlaceAdapter
  } else if (
    HEATERSHAKER_MODULE_MODELS.some(
      model => model === attachedModule.moduleModel
    )
  ) {
    attachAdapterVideoSrc = isInLeftSlot
      ? HeaterShaker_PlaceAdapter_L
      : HeaterShaker_PlaceAdapter_R
  } else if (
    TEMPERATURE_MODULE_MODELS.some(
      model => model === attachedModule.moduleModel
    )
  ) {
    attachAdapterVideoSrc = isInLeftSlot
      ? TempModule_PlaceAdapter_L
      : TempModule_PlaceAdapter_R
  } else {
    setErrorMessage(
      `Invalid module type for calibration: ${attachedModule.moduleModel}`
    )
  }

  if (isRobotMoving) {
    return (
      <SimpleWizardInProgressBody
        description={t('shared:stand_back_robot_is_in_motion')}
      />
    )
  } else {
    return (
      <GenericWizardTile
        header={
          attachedModule.moduleType === HEATERSHAKER_MODULE_TYPE
            ? t('install_calibration_adapter')
            : t('install_adapter', { module: moduleDisplayName })
        }
        rightHandBody={
          <Flex height="13.25rem" paddingTop={SPACING.spacing4}>
            <AnimationVideo
              css={css`
                max-width: 100%;
                max-height: 100%;
              `}
            >
              <source src={attachAdapterVideoSrc} />
            </AnimationVideo>
          </Flex>
        }
        bodyText={
          attachedModule.moduleType === HEATERSHAKER_MODULE_TYPE ? (
            <LegacyStyledText css={BODY_STYLE}>
              {t('place_flush_heater_shaker')}
            </LegacyStyledText>
          ) : attachedModule.moduleType === THERMOCYCLER_MODULE_TYPE ? (
            <LegacyStyledText css={BODY_STYLE}>
              {t('place_flush_thermocycler')}
            </LegacyStyledText>
          ) : (
            <LegacyStyledText css={BODY_STYLE}>
              {t('place_flush')}
            </LegacyStyledText>
          )
        }
        proceedButtonText={t('confirm_placement')}
        proceed={handleOnClick}
        proceedIsDisabled={maintenanceRunId == null}
        back={() => {
          goBack()
        }}
      />
    )
  }
}
