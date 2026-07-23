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
import {
  getModuleDisplayName,
  VACUUM_MAX_PRESSURE_MBAR,
  VACUUM_MIN_PRESSURE_MBAR,
} from '@opentrons/shared-data'

import { SubmitPrimaryButton } from '/app/atoms/buttons'
import { Slideout } from '/app/atoms/Slideout'

import { useVacuumModuleControls } from './hooks/useVacuumModuleControls'
import { parseGaugePressureValue } from './utils/parseGaugePressureValue'
import { sanitizeGaugePressureInput } from './utils/sanitizeGaugePressureInput'
import styles from './vacuummodule.module.css'

import type {
  VacuumMode,
  VacuumModule,
} from '@opentrons/api-client'

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
  const [pressureInput, setPressureInput] = useState<string>('')
  const [powerPercent, setPowerPercent] = useState<number>(1)
  const [targetProps, tooltipProps] = useHoverTooltip()
  const { setVacuumPressure, setVacuumPower } = useVacuumModuleControls(module)
  const [showPressureRangeError, setShowPressureRangeError] =
    useState<boolean>(false)
  const pressure = parseGaugePressureValue(pressureInput)
  const isPressureRangeError =
    pressure != null &&
    (pressure < VACUUM_MIN_PRESSURE_MBAR || pressure > VACUUM_MAX_PRESSURE_MBAR)

  const handleConfirm = (): void => {
    if (modeType == null) {
      return
    }
    if (modeType === 'power') {
      setVacuumPower(powerPercent)
    } else if (pressure != null) {
      // non-null pressure value with pressure mode selected
      if (isPressureRangeError) {
        setShowPressureRangeError(true)
        return
      }
      setVacuumPressure(pressure)
    } else {
      return
    }
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
                min: VACUUM_MIN_PRESSURE_MBAR,
                max: VACUUM_MAX_PRESSURE_MBAR,
              })}
              units={t('mbar')}
              type="text"
              onChange={e => {
                setPressureInput(sanitizeGaugePressureInput(e.target.value))
              }}
              value={pressureInput}
              error={
                showPressureRangeError && isPressureRangeError
                  ? t('vacuum_range_error', {
                      min: VACUUM_MIN_PRESSURE_MBAR,
                      max: VACUUM_MAX_PRESSURE_MBAR,
                    })
                  : null
              }
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
