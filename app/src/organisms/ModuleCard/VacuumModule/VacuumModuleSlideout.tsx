import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  Divider,
  Icon,
  InputField,
  RadioButton,
  Slider,
  SPACING,
  StyledText,
  Tooltip,
  useHoverTooltip,
} from '@opentrons/components'
import { getModuleDisplayName } from '@opentrons/shared-data'

import { SubmitPrimaryButton } from '/app/atoms/buttons'
import { Slideout } from '/app/atoms/Slideout'

import styles from './vacuummodule.module.css'

import type { VacuumModule } from '@opentrons/api-client'
import type { VacuumMode } from '/app/redux/modules/api-types'

// TODO: get from module definition or equivalent
const MAX_PRESSURE = 1000
const MIN_PRESSURE = 0

interface VacuumModuleSlideoutProps {
  module: VacuumModule
  onCloseClick: () => unknown
  isExpanded: boolean
}

export function VacuumModuleSlideout(
  props: VacuumModuleSlideoutProps
): JSX.Element {
  const { module, onCloseClick, isExpanded } = props
  const { moduleModel } = module
  const { t } = useTranslation('device_details')
  const [modeType, setModeType] = useState<VacuumMode | null>(null)
  const [pressure, setPressure] = useState<number | null>(null)
  const [powerPercent, setPowerPercent] = useState<number>(1)
  const [targetProps, tooltipProps] = useHoverTooltip()

  const handleConfirm = (): void => {
    console.log('TODO: save settings')
    onCloseClick()
  }
  return (
    <Slideout
      title={t('set_vacuum', {
        displayName: getModuleDisplayName(moduleModel),
      })}
      onCloseClick={onCloseClick}
      isExpanded={isExpanded}
      footer={
        <SubmitPrimaryButton
          form="VacuumModuleSlideout_submitValue"
          value={t('confirm')}
          onClick={handleConfirm}
          data-testid={`VacuumModuleSlideout_btn_${module.serialNumber}`}
        />
      }
      childrenPadding={`${SPACING.spacing16} 0`}
    >
      <div className={styles.vacuum_module_slideout_container}>
        {/* mode */}
        <div className={styles.vacuum_module_slideout_mode_container}>
          <div className={styles.vacuum_module_slideout_mode_title_container}>
            <StyledText desktopStyle="bodyDefaultSemiBold">
              {t('select_mode_type')}
            </StyledText>
            <div
              className={
                styles.vacuum_module_slideout_mode_tooltip_icon_container
              }
              {...targetProps}
            >
              <Icon name="information" size="1rem" color={COLORS.grey60}></Icon>
            </div>
            <Tooltip tooltipProps={tooltipProps}>
              {t('select_mode_type_tooltip')}
            </Tooltip>
          </div>
          <div className={styles.vacuum_module_slideout_mode_radio_container}>
            <RadioButton
              buttonValue="pressure"
              buttonLabel={t('pressure')}
              onChange={() => {
                setModeType('pressure')
              }}
              isSelected={modeType === 'pressure'}
              largeDesktopBorderRadius
            />
            <RadioButton
              buttonValue="power"
              buttonLabel={t('power')}
              onChange={() => {
                setModeType('power')
              }}
              isSelected={modeType === 'power'}
              largeDesktopBorderRadius
            />
          </div>
        </div>
        <Divider marginY={SPACING.spacing16} />
        {/* pressure or power input */}
        <div
          className={
            styles.vacuum_module_slideout_pressure_power_input_container
          }
        >
          {modeType === 'pressure' && (
            <InputField
              title={t('gauge_pressure')}
              caption={t('valid_range', {
                min: MIN_PRESSURE,
                max: MAX_PRESSURE,
              })}
              units={t('mbar')}
              type="number"
              onChange={e => {
                setPressure(e.target.valueAsNumber)
              }}
              value={pressure}
              max={MAX_PRESSURE}
              min={MIN_PRESSURE}
            />
          )}
          {modeType === 'power' && (
            <Slider
              label={t('pump_power')}
              value={powerPercent}
              adjustValue={value => {
                setPowerPercent(value)
              }}
            />
          )}
        </div>
      </div>
    </Slideout>
  )
}
