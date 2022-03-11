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
  InputField,
  SPACING,
  SPACING_1,
  SPACING_3,
  Text,
  TYPOGRAPHY,
} from '@opentrons/components'
import { PrimaryButton } from '../../../atoms/Buttons'
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
      //  the empty string will never be reached because the button will be disabled if the field is left empty
      rpm: parseInt(hsValue !== null ? hsValue : ''),
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

  return (
    <Slideout
      title={t('set_status_heater_shaker', {
        part: modulePart,
        name: moduleName,
      })}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      height={`calc(100vh - ${SPACING_3})`}
      footer={
        <PrimaryButton
          onClick={handleSubmitTemp}
          disabled={hsValue === null}
          width="100%"
          data-testid={`HS_set_value_${module.model}`}
        >
          {t('set_temp_or_shake', { part: modulePart })}
        </PrimaryButton>
      }
    >
      <Text
        fontWeight={FONT_WEIGHT_REGULAR}
        fontSize={TYPOGRAPHY.fontSizeP}
        paddingTop={SPACING_1}
        data-testid={`HS_slideout_body_text_${module.model}`}
      >
        {isSetShake ? t('set_shake_of_hs') : t('set_target_temp_of_hs')}
      </Text>
      <Flex
        marginTop={SPACING_3}
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
        {/* TODO Immediately: make sure input field matches final designs */}
        <InputField
          units={isSetShake ? RPM : CELSIUS}
          value={hsValue}
          onChange={e => setHsValue(e.target.value)}
        />
      </Flex>
    </Slideout>
  )
}
