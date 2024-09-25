import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import { v4 as uuidv4 } from 'uuid'
import HeaterShaker_PlaceAdapter_L from '/app/assets/videos/module_wizard_flows/HeaterShaker_PlaceAdapter_L.webm'
import HeaterShaker_PlaceAdapter_R from '/app/assets/videos/module_wizard_flows/HeaterShaker_PlaceAdapter_R.webm'
import TempModule_PlaceAdapter_L from '/app/assets/videos/module_wizard_flows/TempModule_PlaceAdapter_L.webm'
import TempModule_PlaceAdapter_R from '/app/assets/videos/module_wizard_flows/TempModule_PlaceAdapter_R.webm'
import Thermocycler_PlaceAdapter from '/app/assets/videos/module_wizard_flows/Thermocycler_PlaceAdapter.webm'

import {
  Flex,
  RESPONSIVENESS,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  getCalibrationAdapterLoadName,
  getModuleDisplayName,
  HEATERSHAKER_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  HEATERSHAKER_MODULE_MODELS,
  TEMPERATURE_MODULE_MODELS,
  THERMOCYCLER_MODULE_MODELS,
  FLEX_SINGLE_SLOT_BY_CUTOUT_ID,
  THERMOCYCLER_V2_FRONT_FIXTURE,
} from '@opentrons/shared-data'

import { SimpleWizardInProgressBody } from '/app/molecules/SimpleWizardBody'
import { GenericWizardTile } from '/app/molecules/GenericWizardTile'
import { LEFT_SLOTS } from './constants'

import type { DeckConfiguration, CreateCommand } from '@opentrons/shared-data'
import type { ModuleCalibrationWizardStepProps } from './types'
import type { AxiosError } from 'axios'
import type { UseMutateFunction } from 'react-query'
import type {
  CreateMaintenanceRunData,
  MaintenanceRun,
} from '@opentrons/api-client'

interface PlaceAdapterProps extends ModuleCalibrationWizardStepProps {
  deckConfig: DeckConfiguration
  setCreatedAdapterId: (adapterId: string) => void
  createMaintenanceRun: UseMutateFunction<
    MaintenanceRun,
    AxiosError<any>,
    CreateMaintenanceRunData,
    unknown
  >
  isCreateLoading: boolean
  createdMaintenanceRunId: string | null
}

export const BODY_STYLE = css`
  ${TYPOGRAPHY.pRegular};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    font-size: 1.275rem;
    line-height: 1.75rem;
  }
`

export const PlaceAdapter = (props: PlaceAdapterProps): JSX.Element | null => {
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
    createMaintenanceRun,
    isCreateLoading,
    createdMaintenanceRunId,
  } = props
  const { t } = useTranslation('module_wizard_flows')
  useEffect(() => {
    if (createdMaintenanceRunId == null) {
      createMaintenanceRun({})
    }
  }, [])
  const mount = attachedPipette.mount
  const cutoutId = deckConfig.find(
    cc =>
      cc.opentronsModuleSerialNumber === attachedModule.serialNumber &&
      (attachedModule.moduleType !== THERMOCYCLER_MODULE_TYPE ||
        cc.cutoutFixtureId === THERMOCYCLER_V2_FRONT_FIXTURE)
  )?.cutoutId
  const slotName =
    cutoutId != null ? FLEX_SINGLE_SLOT_BY_CUTOUT_ID[cutoutId] : null
  const handleOnClick = (): void => {
    const calibrationAdapterLoadName = getCalibrationAdapterLoadName(
      attachedModule.moduleModel
    )
    if (calibrationAdapterLoadName == null) {
      console.error(
        `could not get calibration adapter load name for ${attachedModule.moduleModel}`
      )
      return
    }
    if (slotName == null) {
      console.error(
        `could not load module ${attachedModule.moduleModel} into location ${slotName}`
      )
      return
    }

    const calibrationAdapterId = uuidv4()
    const commands: CreateCommand[] = [
      {
        commandType: 'loadModule',
        params: {
          location: { slotName },
          model: attachedModule.moduleModel,
          moduleId: attachedModule.id,
        },
      },
      {
        commandType: 'loadLabware',
        params: {
          labwareId: calibrationAdapterId,
          location: { moduleId: attachedModule.id },
          version: 1,
          namespace: 'opentrons',
          loadName: calibrationAdapterLoadName,
        },
      },
      { commandType: 'home' as const, params: {} },
      {
        commandType: 'calibration/moveToMaintenancePosition',
        params: {
          mount,
          maintenancePosition: 'attachInstrument',
        },
      },
    ]
    chainRunCommands?.(commands, false)
      .then(() => {
        setCreatedAdapterId(calibrationAdapterId)
      })
      .then(() => {
        proceed()
      })
      .catch((e: Error) => {
        setErrorMessage(e.message)
      })
  }

  const moduleType = attachedModule.moduleType
  let bodyText = (
    <LegacyStyledText css={BODY_STYLE}>{t('place_flush')}</LegacyStyledText>
  )
  if (moduleType === HEATERSHAKER_MODULE_TYPE) {
    bodyText = (
      <LegacyStyledText css={BODY_STYLE}>
        {t('place_flush_heater_shaker')}
      </LegacyStyledText>
    )
  }
  if (moduleType === THERMOCYCLER_MODULE_TYPE) {
    bodyText = (
      <LegacyStyledText css={BODY_STYLE}>
        {t('place_flush_thermocycler')}
      </LegacyStyledText>
    )
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
    attachAdapterVideoSrc = null
    console.error(
      `Invalid module type for calibration: ${attachedModule.moduleModel}`
    )
    return null
  }

  const placeAdapterVid = (
    <Flex height="13.25rem" paddingTop={SPACING.spacing4}>
      <video
        css={css`
          max-width: 100%;
          max-height: 100%;
        `}
        autoPlay={true}
        loop={true}
        controls={false}
      >
        <source src={attachAdapterVideoSrc} />
      </video>
    </Flex>
  )

  if (isRobotMoving)
    return (
      <SimpleWizardInProgressBody
        description={t('shared:stand_back_robot_is_in_motion')}
      />
    )
  return (
    <GenericWizardTile
      header={
        moduleType === HEATERSHAKER_MODULE_TYPE
          ? t('install_calibration_adapter')
          : t('install_adapter', { module: moduleDisplayName })
      }
      rightHandBody={placeAdapterVid}
      bodyText={bodyText}
      proceedButtonText={t('confirm_placement')}
      proceed={handleOnClick}
      proceedIsDisabled={isCreateLoading || maintenanceRunId == null}
      back={goBack}
    />
  )
}
