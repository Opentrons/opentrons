import * as React from 'react'
import { parseInt } from 'lodash'
import { useTranslation } from 'react-i18next'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import { Slideout } from '../../../atoms/Slideout'
import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  FONT_WEIGHT_REGULAR,
  SPACING,
  Text,
  TYPOGRAPHY,
} from '@opentrons/components'
import { PrimaryButton } from '../../../atoms/Buttons'
import { InputField } from '../../../atoms/InputField'
import {
  getModuleDisplayName,
  RPM,
  CELSIUS,
  CreateCommand,
} from '@opentrons/shared-data'

import type { AttachedModule } from '../../../redux/modules/types'

interface HeaterShakerSlideoutProps {
  module: AttachedModule
  onCloseClick: () => unknown
  isExpanded: boolean
  isSetShake: boolean
}

export const HeaterShakerSlideout = (
  props: HeaterShakerSlideoutProps
): JSX.Element | null => {
  const { module, onCloseClick, isExpanded, isSetShake } = props
  const { t } = useTranslation('device_details')
  const [hsValue, setHsValue] = React.useState<string | null>(null)
  const { createLiveCommand } = useCreateLiveCommandMutation()
  const moduleName = getModuleDisplayName(module.model)
  const modulePart = isSetShake ? t('shake_speed') : t('temperature')

  //   TODO replace all serial with id

  const saveTempCommand: CreateCommand = {
    commandType: 'heaterShakerModule/awaitTemperature',
    params: { moduleId: module.serial },
  }
  const saveShakeCommand: CreateCommand = {
    commandType: 'heaterShakerModule/setTargetShakeSpeed',
    params: {
      moduleId: module.serial,
      //  the 0 int will never be reached because the button will be disabled if the field is left empty
      rpm: hsValue != null ? parseInt(hsValue) : 0,
    },
  }

  const handleSubmitTemp = (): void => {
    if (hsValue != null) {
      createLiveCommand({
        command: isSetShake ? saveShakeCommand : saveTempCommand,
      })
    }
    setHsValue(null)
  }

  let errorMessage
  if (isSetShake) {
    errorMessage =
      hsValue != null && (parseInt(hsValue) < 200 || parseInt(hsValue) > 1800)
        ? t('input_out_of_range')
        : null
  } else {
    errorMessage =
      hsValue != null && (parseInt(hsValue) < 4 || parseInt(hsValue) > 99)
        ? t('input_out_of_range')
        : null
  }

  return (
    <Slideout
      title={t('set_status_heater_shaker', {
        part: modulePart,
        name: moduleName,
      })}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      height={`calc(100vh - ${SPACING.spacing4})`}
      footer={
        <PrimaryButton
          onClick={handleSubmitTemp}
          disabled={hsValue === null || errorMessage !== null}
          width="100%"
          data-testid={`Hs_set_value_${module.model}`}
        >
          {t('set_temp_or_shake', { part: modulePart })}
        </PrimaryButton>
      }
    >
      <Text
        fontWeight={FONT_WEIGHT_REGULAR}
        fontSize={TYPOGRAPHY.fontSizeP}
        paddingTop={SPACING.spacing2}
        data-testid={`Hs_slideout_body_text_${module.model}`}
      >
        {isSetShake ? t('set_shake_of_hs') : t('set_target_temp_of_hs')}
      </Text>
      <Flex
        marginTop={SPACING.spacing4}
        flexDirection={DIRECTION_COLUMN}
        data-testid={`HS_Slideout_input_field_${module.model}`}
      >
        <Text
          fontWeight={FONT_WEIGHT_REGULAR}
          fontSize={TYPOGRAPHY.fontSizeH6}
          color={COLORS.darkGrey}
          marginBottom={SPACING.spacing1}
        >
          {isSetShake ? t('set_shake_speed') : t('set_block_temp')}
        </Text>
        <InputField
          id={module.model + isSetShake}
          units={isSetShake ? RPM : CELSIUS}
          value={hsValue}
          onChange={e => setHsValue(e.target.value)}
          type="number"
          max={isSetShake ? 1800 : 99}
          min={isSetShake ? 200 : 4}
          caption={isSetShake ? t('between_200_to_1800') : t('between_4_to_99')}
          error={errorMessage}
        />
      </Flex>
    </Slideout>
  )
}
