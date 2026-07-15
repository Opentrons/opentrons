import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  InputField,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useCreateLiveCommandMutation } from '@opentrons/react-api-client'
import {
  CELSIUS,
  getModuleDisplayName,
  TEMP_MAX,
  TEMP_MIN,
} from '@opentrons/shared-data'

import { SubmitPrimaryButton } from '/app/atoms/buttons'
import { Slideout } from '/app/atoms/Slideout'
import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { useModuleCommandAnalytics } from '/app/redux-resources/analytics/'

import type { TemperatureModuleSetTargetTemperatureCreateCommand } from '@opentrons/shared-data'
import type { TemperatureModule } from '/app/redux/modules/types'

interface TemperatureModuleSlideoutProps {
  module: TemperatureModule
  onCloseClick: () => unknown
  isExpanded: boolean
}

export const TemperatureModuleSlideout = (
  props: TemperatureModuleSlideoutProps
): JSX.Element | null => {
  const { module, onCloseClick, isExpanded } = props
  const { t } = useTranslation('device_details')
  const documentationState = useDocumentationState()
  const { createLiveCommand } = useCreateLiveCommandMutation(documentationState)
  const name = getModuleDisplayName(module.moduleModel)
  const [temperatureValue, setTemperatureValue] = useState<number | null>(null)
  const { reportModuleCommand } = useModuleCommandAnalytics()
  const handleSubmitTemperature = (): void => {
    if (temperatureValue != null) {
      const saveTempCommand: TemperatureModuleSetTargetTemperatureCreateCommand =
        {
          commandType: 'temperatureModule/setTargetTemperature',
          params: {
            moduleId: module.id,
            celsius: temperatureValue,
          },
        }
      createLiveCommand({
        command: saveTempCommand,
      })
        .then(() => {
          reportModuleCommand({
            kind: 'liveCommand',
            moduleType: module.moduleType,
            analyticCommand: saveTempCommand.commandType,
            result: { status: 'succeeded', data: undefined },
            serialNumber: module.serialNumber,
            temperature: temperatureValue,
            errorDetails: '',
            firmwareVersion: module.firmwareVersion,
          })
        })
        .catch((e: Error) => {
          reportModuleCommand({
            kind: 'liveCommand',
            moduleType: module.moduleType,
            analyticCommand: saveTempCommand.commandType,
            result: { status: 'failed', data: undefined },
            errorDetails: e.message,
            serialNumber: module.serialNumber,
            temperature: temperatureValue,
            firmwareVersion: module.firmwareVersion,
          })
          console.error(
            `error setting module status with command type ${saveTempCommand.commandType}: ${e.message}`
          )
        })
    }
    setTemperatureValue(null)
    onCloseClick()
  }

  const valueOutOfRange =
    temperatureValue != null &&
    (temperatureValue < TEMP_MIN || temperatureValue > TEMP_MAX)

  return (
    <Slideout
      title={t('tempdeck_slideout_title', { name: name })}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      footer={
        <SubmitPrimaryButton
          form="TemperatureModuleSlideout_submitValue"
          value={t('confirm')}
          onClick={handleSubmitTemperature}
          disabled={temperatureValue === null || valueOutOfRange}
          data-testid={`TemperatureSlideout_btn_${module.serialNumber}`}
        />
      }
    >
      <LegacyStyledText
        fontWeight={TYPOGRAPHY.fontWeightRegular}
        fontSize={TYPOGRAPHY.fontSizeP}
        paddingTop={SPACING.spacing4}
        data-testid={`TemperatureSlideout_body_text_${module.serialNumber}`}
      >
        {t('tempdeck_slideout_body', {
          model: name,
        })}
      </LegacyStyledText>
      <Flex
        marginTop={SPACING.spacing16}
        flexDirection={DIRECTION_COLUMN}
        data-testid={`TemperatureSlideout_input_field_${module.serialNumber}`}
      >
        <LegacyStyledText
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          fontSize={TYPOGRAPHY.fontSizeH6}
          color={COLORS.black90}
          paddingBottom={SPACING.spacing8}
        >
          {t('set_temperature')}
        </LegacyStyledText>
        <form id="TemperatureModuleSlideout_submitValue">
          <InputField
            id={`${String(module.moduleModel)}`}
            title={`${String(module.moduleModel)}`}
            units={CELSIUS}
            value={
              temperatureValue != null ? Math.round(temperatureValue) : null
            }
            autoFocus
            onChange={e => {
              setTemperatureValue(e.target.valueAsNumber)
            }}
            type="number"
            caption={t('module_status_range', {
              min: TEMP_MIN,
              max: TEMP_MAX,
              unit: CELSIUS,
            })}
            error={valueOutOfRange ? t('input_out_of_range') : null}
          />
        </form>
      </Flex>
    </Slideout>
  )
}
