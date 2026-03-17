import { useTranslation } from 'react-i18next'

import {
  VACUUM_MODE_POWER,
  VACUUM_PROGRAM_PROFILE,
  VACUUM_PROGRAM_STATE,
  VACUUM_STATE_PUMP,
} from '@opentrons/step-generation'

import { getFormattedTime } from '/protocol-designer/utils/getFormattedTime'

import { StyledTrans } from './StyledTrans'

import type { FormData } from '/protocol-designer/form-types'

export function VacuumSummary(props: {
  currentStep: FormData
}): JSX.Element | null {
  const { currentStep } = props
  const {
    programType,
    stateType,
    modeType,
    powerPercent,
    pressureMbar,
    pumpDurationCheckbox,
    pumpDurationTime,
    endingHoldVentCheckbox,
    orderedProfileIds,
  } = currentStep
  const { t } = useTranslation('protocol_steps')
  const formattedTime =
    pumpDurationTime != null ? getFormattedTime(pumpDurationTime as string) : ''
  if (
    programType === VACUUM_PROGRAM_STATE &&
    stateType !== null &&
    stateType !== VACUUM_STATE_PUMP
  ) {
    // Vent state
    return (
      <StyledTrans
        i18nKey="vacuum.step_summary.state.vent"
        tagInfos={[{ text: t(`vacuum.step_summary.state.${stateType}`) }]}
      />
    )
  }
  if (
    programType === VACUUM_PROGRAM_STATE &&
    stateType === VACUUM_STATE_PUMP &&
    modeType != null
  ) {
    // Pump state
    if (pumpDurationCheckbox === true) {
      return (
        <StyledTrans
          i18nKey={`vacuum.step_summary.state.pump_with_end_hold.${modeType}`}
          tagInfos={[
            {
              text: t(
                `vacuum.previous_state.pump.${modeType}`,
                ...(modeType === VACUUM_MODE_POWER
                  ? [{ power: powerPercent }]
                  : [{ pressure: pressureMbar }])
              ),
            },
            {
              text: formattedTime,
              iconName: 'timer',
            },
            {
              text: t(
                `vacuum.step_summary.state.${endingHoldVentCheckbox === true ? 'open' : 'close'}`
              ),
            },
          ]}
        />
      )
    }
    // no pump duration set
    return (
      <StyledTrans
        i18nKey={`vacuum.step_summary.state.pump.${modeType}`}
        tagInfos={[
          {
            text: t(
              `vacuum.previous_state.pump.${modeType}`,
              ...(modeType === VACUUM_MODE_POWER
                ? [{ power: powerPercent }]
                : [{ pressure: pressureMbar }])
            ),
          },
        ]}
      />
    )
  }
  if (programType === VACUUM_PROGRAM_PROFILE && orderedProfileIds.length > 0) {
    return (
      <StyledTrans
        i18nKey="vacuum.step_summary.profile"
        tagInfos={[
          {
            text: t('vacuum.step_summary.num_steps', {
              numSteps: orderedProfileIds.length,
            }),
          },
          {
            text: t(
              `vacuum.step_summary.state.${endingHoldVentCheckbox === true ? 'open' : 'close'}`
            ),
          },
        ]}
      />
    )
  }
  console.log('Bad vacuum form state for StepSummary')
  return null
}
