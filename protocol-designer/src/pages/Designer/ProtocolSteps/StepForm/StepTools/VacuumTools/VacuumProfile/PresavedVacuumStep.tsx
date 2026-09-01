import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  Icon,
  InputField,
  ListButton,
  ListItem,
  Slider,
  SPACING,
  StyledText,
  ToggleButton,
} from '@opentrons/components'
import {
  VACUUM_MAX_PRESSURE_MBAR,
  VACUUM_MIN_PRESSURE_MBAR,
} from '@opentrons/shared-data'
import {
  VACUUM_MODE_POWER,
  VACUUM_MODE_PRESSURE,
} from '@opentrons/step-generation'

import {
  maskToSignedDecimal,
  maskToTimeWithPlaceholders,
} from '/protocol-designer/steplist/fieldLevel/processing'

import { PROFILE_STEP } from './constants'
import { PresavedVacuumHeader } from './PresavedVacuumHeader'
import { getStepErrors } from './utils'
import styles from './vacuumprofile.module.css'

import type { ReactNode } from 'react'
import type { VacuumProfileStep } from '/protocol-designer/form-types'
import type { VacuumPumpData, VacuumStepBaseProps } from './types'

export interface PresavedVacuumStepProps extends VacuumStepBaseProps {
  onStepChange: (stepId: string, patch: Partial<VacuumProfileStep>) => void
  /** Not required when nested, since save behavior is handled by parent cycle */
  onSaveSuccess?: (stepData: VacuumProfileStep) => void
  /** When true, show validation errors on this step (e.g. when cycle Save is blocked). */
  forceShowErrors?: boolean
}

export function PresavedVacuumStep(props: PresavedVacuumStepProps): ReactNode {
  const {
    stepData,
    displayIndex,
    onSaveSuccess,
    onDelete,
    isNested,
    onStepChange,
    allowDelete = true,
    forceShowErrors = false,
  } = props
  const [showErrors, setShowErrors] = useState<boolean>(false)
  const { t } = useTranslation('protocol_steps')

  const { title, pumpData, time, ventAfter } = stepData

  const updateField = (
    field: 'title' | 'time' | 'pumpData' | 'ventAfter',
    value: string | Partial<VacuumPumpData> | boolean
  ): void => {
    if (field === 'pumpData') {
      const patch = value as Partial<VacuumPumpData>
      const nextPumpData: VacuumPumpData =
        stepData.pumpData.mode === VACUUM_MODE_PRESSURE
          ? {
              mode: VACUUM_MODE_PRESSURE,
              pressureMbar:
                'pressureMbar' in patch && patch.pressureMbar !== undefined
                  ? patch.pressureMbar
                  : stepData.pumpData.pressureMbar,
            }
          : {
              mode: VACUUM_MODE_POWER,
              percentPower:
                'percentPower' in patch && patch.percentPower !== undefined
                  ? patch.percentPower
                  : stepData.pumpData.percentPower,
            }
      onStepChange(stepData.id, { pumpData: nextPumpData })
    } else {
      onStepChange(stepData.id, { [field]: value })
    }
  }

  const errors = getStepErrors(stepData)
  const showValidationErrors = showErrors || forceShowErrors

  const handleSave = (): void => {
    if (Object.values(errors).some(error => error)) {
      setShowErrors(true)
      return
    }
    onSaveSuccess?.(stepData)
  }

  return (
    <ListItem
      type="default"
      backgroundColor={isNested ? COLORS.grey10 : COLORS.grey20}
      padding={0}
    >
      <div className={styles.presaved_vacuum_step_content}>
        {!isNested && (
          <PresavedVacuumHeader
            displayIndex={displayIndex}
            variant={PROFILE_STEP}
            onDelete={onDelete}
            onSave={handleSave}
            showActions={allowDelete}
          />
        )}
        <div className={styles.presaved_content}>
          <div className={styles.presaved_fields}>
            <div className={styles.presaved_vacuum_step_form_row}>
              <div className={styles.flex_fill}>
                <InputField
                  title={t('vacuum.controls.profile.step_title')}
                  value={title}
                  onChange={e => {
                    updateField('title', e.currentTarget.value)
                  }}
                  error={
                    showValidationErrors && errors.title
                      ? t('vacuum.controls.profile.errors.title')
                      : null
                  }
                />
              </div>
              <div className={styles.flex_fill}>
                {pumpData.mode === VACUUM_MODE_PRESSURE ? (
                  <InputField
                    title={t('vacuum.controls.profile.gauge_pressure')}
                    value={pumpData.pressureMbar}
                    caption={t('vacuum.controls.mode.pressure.caption', {
                      min: VACUUM_MIN_PRESSURE_MBAR,
                      max: VACUUM_MAX_PRESSURE_MBAR,
                    })}
                    onChange={e => {
                      const maskedPressure = maskToSignedDecimal(
                        e.currentTarget.value
                      )
                      updateField('pumpData', { pressureMbar: maskedPressure })
                    }}
                    units={t('application:units.millibar')}
                    error={
                      showValidationErrors && errors.pumpData
                        ? t('vacuum.controls.profile.errors.pumpData')
                        : null
                    }
                  />
                ) : (
                  <Slider
                    value={pumpData.percentPower}
                    label={t('vacuum.controls.profile.pump_power')}
                    adjustValue={value => {
                      updateField('pumpData', { percentPower: value })
                    }}
                    backgroundColor={COLORS.grey35}
                    type="small"
                  />
                )}
              </div>
              <div className={styles.flex_fill}>
                <InputField
                  title={t('vacuum.controls.profile.time')}
                  value={time}
                  onChange={e => {
                    const maskedTime = maskToTimeWithPlaceholders(
                      e.currentTarget.value,
                      'mmss'
                    )
                    updateField('time', maskedTime)
                  }}
                  units={t('application:units.time')}
                  error={
                    showValidationErrors && errors.time
                      ? t('vacuum.controls.profile.errors.time')
                      : null
                  }
                />
              </div>
              {isNested && allowDelete ? (
                <div className={styles.delete_button} onClick={onDelete}>
                  <Icon name="close" size="1.5rem" />
                </div>
              ) : null}
            </div>
            <StepEndingHoldField
              toggledOn={ventAfter}
              onChange={() => {
                updateField('ventAfter', !ventAfter)
              }}
            />
          </div>
        </div>
      </div>
    </ListItem>
  )
}

function StepEndingHoldField(props: {
  toggledOn: boolean
  onChange: () => void
}): ReactNode {
  const { toggledOn, onChange } = props
  const { t } = useTranslation('protocol_steps')
  const label = toggledOn
    ? t('vacuum.previous_state.vent.opened')
    : t('vacuum.previous_state.vent.closed')

  return (
    <div className={styles.presaved_vacuum_step_hold}>
      <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
        {t('vacuum.controls.ending_hold_vent.title')}
      </StyledText>
      <ListButton
        type="noActive"
        padding={SPACING.spacing12}
        width="100%"
        justifyContent="space-between"
        onClick={onChange}
        backgroundColor={COLORS.white}
        alignItems="center"
      >
        <StyledText desktopStyle="bodyDefaultRegular">
          {t('vacuum.controls.ending_hold_vent.label')}
        </StyledText>
        <div className={styles.ending_hold_toggle_row}>
          <StyledText desktopStyle="bodyDefaultRegular">{label}</StyledText>
          <ToggleButton label={label} toggledOn={toggledOn} />
        </div>
      </ListButton>
    </div>
  )
}
