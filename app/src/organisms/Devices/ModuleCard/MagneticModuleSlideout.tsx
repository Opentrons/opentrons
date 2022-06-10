import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  useCreateCommandMutation,
  useCreateLiveCommandMutation,
} from '@opentrons/react-api-client'
import { useModuleIdFromRun } from './useModuleIdFromRun'
import {
  Flex,
  Text,
  DIRECTION_ROW,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  TEXT_TRANSFORM_UPPERCASE,
  JUSTIFY_FLEX_END,
  COLORS,
  TYPOGRAPHY,
  SPACING,
} from '@opentrons/components'
import {
  getModuleDisplayName,
  MAGNETIC_MODULE_TYPE_LABWARE_BOTTOM_HEIGHT,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V1_DISNEGAGED_HEIGHT,
  MAGNETIC_MODULE_V1_MAX_ENGAGE_HEIGHT,
  MAGNETIC_MODULE_V2_DISNEGAGED_HEIGHT,
  MAGNETIC_MODULE_V2_MAX_ENGAGE_HEIGHT,
  MM,
} from '@opentrons/shared-data'
import { Slideout } from '../../../atoms/Slideout'
import { InputField } from '../../../atoms/InputField'
import { PrimaryButton } from '../../../atoms/buttons'

import type { TFunctionResult } from 'i18next'
import type { MagneticModule } from '../../../redux/modules/types'
import type { MagneticModuleModel } from '@opentrons/shared-data'
import type { MagneticModuleEngageMagnetCreateCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/module'

interface ModelContents {
  version: string
  units: string | null
  maxHeight: number
  labwareBottomHeight: number
  disengagedHeight: number
}

const getInfoByModel = (model: MagneticModuleModel): ModelContents => {
  if (model === MAGNETIC_MODULE_V1) {
    return {
      version: 'GEN 1',
      units: null,
      maxHeight: MAGNETIC_MODULE_V1_MAX_ENGAGE_HEIGHT,
      labwareBottomHeight: MAGNETIC_MODULE_TYPE_LABWARE_BOTTOM_HEIGHT,
      disengagedHeight: MAGNETIC_MODULE_V1_DISNEGAGED_HEIGHT,
    }
  } else {
    return {
      version: 'GEN 2',
      units: MM,
      maxHeight: MAGNETIC_MODULE_V2_MAX_ENGAGE_HEIGHT,
      labwareBottomHeight: MAGNETIC_MODULE_TYPE_LABWARE_BOTTOM_HEIGHT,
      disengagedHeight: MAGNETIC_MODULE_V2_DISNEGAGED_HEIGHT,
    }
  }
}

interface MagneticModuleSlideoutProps {
  module: MagneticModule
  onCloseClick: () => unknown
  isExpanded: boolean
  runId?: string
}

export const MagneticModuleSlideout = (
  props: MagneticModuleSlideoutProps
): JSX.Element | null => {
  const { module, isExpanded, onCloseClick, runId } = props
  const { t } = useTranslation('device_details')
  const { createLiveCommand } = useCreateLiveCommandMutation()
  const { createCommand } = useCreateCommandMutation()
  const [engageHeightValue, setEngageHeightValue] = React.useState<
    string | null
  >(null)
  const { moduleIdFromRun } = useModuleIdFromRun(
    module,
    runId != null ? runId : null
  )

  const moduleName = getModuleDisplayName(module.moduleModel)
  const info = getInfoByModel(module.moduleModel)

  let max: number | TFunctionResult = 0
  let labwareBottom: number | TFunctionResult = 0
  let disengageHeight: number | TFunctionResult = 0

  switch (info.version) {
    case 'GEN 1': {
      max = info.maxHeight
      labwareBottom = info.labwareBottomHeight
      disengageHeight = info.disengagedHeight
      break
    }
    case 'GEN 2': {
      max = t('gen_2_num', { num: info.maxHeight })
      labwareBottom = t('gen_2_num', { num: info.labwareBottomHeight })
      disengageHeight = t('gen_2_num', { num: info.disengagedHeight })
    }
  }

  const errorMessage =
    engageHeightValue != null &&
    (parseInt(engageHeightValue) < info.disengagedHeight ||
      parseInt(engageHeightValue) > info.maxHeight)
      ? t('input_out_of_range')
      : null

  const handleSubmitHeight = (): void => {
    if (engageHeightValue != null) {
      const setEngageCommand: MagneticModuleEngageMagnetCreateCommand = {
        commandType: 'magneticModule/engage',
        params: {
          moduleId: runId != null ? moduleIdFromRun : module.id,
          height: parseInt(engageHeightValue),
        },
      }
      if (runId != null) {
        createCommand({ runId: runId, command: setEngageCommand }).catch(
          (e: Error) => {
            console.error(
              `error setting module status with command type ${setEngageCommand.commandType} and run id ${runId}: ${e.message}`
            )
          }
        )
      } else {
        createLiveCommand({ command: setEngageCommand }).catch((e: Error) => {
          console.error(
            `error setting module status with command type ${setEngageCommand.commandType}: ${e.message}`
          )
        })
      }
    }
    setEngageHeightValue(null)
  }

  return (
    <Slideout
      title={t('set_engage_height_for_module', { name: moduleName })}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      footer={
        <PrimaryButton
          width="100%"
          onClick={handleSubmitHeight}
          disabled={engageHeightValue == null || errorMessage !== null}
          data-testid={`MagneticModuleSlideout_btn_${module.serialNumber}`}
        >
          {t('confirm')}
        </PrimaryButton>
      }
    >
      <Text
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        fontSize={TYPOGRAPHY.fontSizeP}
        color={COLORS.darkBlack}
        paddingTop={SPACING.spacing2}
        data-testid={`MagneticModuleSlideout_body_text_${module.serialNumber}`}
      >
        {t('set_engage_height_and_enter_integer', {
          lower:
            module.moduleModel === MAGNETIC_MODULE_V1
              ? MAGNETIC_MODULE_V1_DISNEGAGED_HEIGHT
              : MAGNETIC_MODULE_V2_DISNEGAGED_HEIGHT,
          higher:
            module.moduleModel === MAGNETIC_MODULE_V1
              ? MAGNETIC_MODULE_V1_MAX_ENGAGE_HEIGHT
              : MAGNETIC_MODULE_V2_MAX_ENGAGE_HEIGHT,
        })}
      </Text>
      <Text
        fontSize={TYPOGRAPHY.fontSizeH6}
        color={COLORS.darkGreyEnabled}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
        paddingTop={SPACING.spacing4}
        textTransform={TEXT_TRANSFORM_UPPERCASE}
        paddingBottom={SPACING.spacing3}
        data-testid={`MagneticModuleSlideout_body_subtitle_${module.serialNumber}`}
      >
        {t('height_ranges', { gen: info.version })}
      </Text>
      <Flex
        backgroundColor={COLORS.background}
        flexDirection={DIRECTION_ROW}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        fontSize={TYPOGRAPHY.fontSizeP}
        padding={SPACING.spacing4}
      >
        <Flex
          flexDirection={DIRECTION_COLUMN}
          data-testid={`MagneticModuleSlideout_body_data_text_${module.serialNumber}`}
        >
          <Text paddingBottom={SPACING.spacing3}>{t('max_engage_height')}</Text>
          <Text paddingBottom={SPACING.spacing3}>{t('labware_bottom')}</Text>
          <Text>{t('disengaged')}</Text>
        </Flex>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          justifyContent={JUSTIFY_FLEX_END}
          data-testid={`MagneticModuleSlideout_body_data_num_${module.serialNumber}`}
        >
          <Text paddingBottom={SPACING.spacing3}>{max}</Text>
          <Text paddingBottom={SPACING.spacing3} paddingLeft={SPACING.spacing2}>
            {labwareBottom}
          </Text>
          <Text>{disengageHeight}</Text>
        </Flex>
      </Flex>
      <Flex
        marginTop={SPACING.spacing4}
        flexDirection={DIRECTION_COLUMN}
        data-testid={`MagneticModuleSlideout_input_field_${module.serialNumber}`}
      >
        <Text
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          fontSize={TYPOGRAPHY.fontSizeH6}
          color={COLORS.darkGrey}
          paddingBottom={SPACING.spacing3}
        >
          {t('set_engage_height')}
        </Text>
        <InputField
          data-testid={`${module.moduleModel}`}
          id={`${module.moduleModel}`}
          autoFocus
          units={info.units}
          value={engageHeightValue}
          onChange={e => setEngageHeightValue(e.target.value)}
          type="number"
          caption={t('module_status_range', {
            min: info.disengagedHeight,
            max: info.maxHeight,
            unit: info.units,
          })}
          error={errorMessage}
        />
      </Flex>
    </Slideout>
  )
}
