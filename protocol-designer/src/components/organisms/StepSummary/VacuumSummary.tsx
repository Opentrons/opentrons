import { useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'
import {
  VACUUM_MODE_POWER,
  VACUUM_PROGRAM_PROFILE,
  VACUUM_PROGRAM_STATE,
  VACUUM_STATE_PUMP_OFF,
  VACUUM_STATE_PUMP_ON,
} from '@opentrons/step-generation'

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
    percentPower,
    pressureMbar,
    pumpDurationCheckbox,
    pumpDurationTime,
    endingHoldVentCheckbox,
    vacuumOrderedProfileIds,
  } = currentStep
  const { t } = useTranslation('protocol_steps')
  if (
    programType === VACUUM_PROGRAM_STATE &&
    stateType !== null &&
    stateType !== VACUUM_STATE_PUMP_ON &&
    stateType !== VACUUM_STATE_PUMP_OFF
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
    stateType === VACUUM_STATE_PUMP_ON &&
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
                  ? [{ power: percentPower }]
                  : [{ pressure: pressureMbar }])
              ),
            },
            {
              text: pumpDurationTime,
              iconName: 'timer',
            },
            {
              text: t(
                `vacuum.step_summary.state.${endingHoldVentCheckbox === true ? 'open' : 'closed'}`
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
                ? [{ power: percentPower }]
                : [{ pressure: pressureMbar }])
            ),
          },
        ]}
      />
    )
  }
  if (
    programType === VACUUM_PROGRAM_STATE &&
    stateType === VACUUM_STATE_PUMP_OFF
  ) {
    return (
      <StyledText desktopStyle="bodyDefaultRegular">
        {t('vacuum.step_summary.state.pump.off')}
      </StyledText>
    )
  }
  if (
    programType === VACUUM_PROGRAM_PROFILE &&
    vacuumOrderedProfileIds.length > 0
  ) {
    const numProfileSteps = vacuumOrderedProfileIds.length
    return (
      <StyledTrans
        i18nKey="vacuum.step_summary.profile"
        tagInfos={[
          {
            text: t(
              numProfileSteps === 1
                ? 'vacuum.step_summary.num_steps_one'
                : 'vacuum.step_summary.num_steps_multiple',
              {
                numSteps: numProfileSteps,
              }
            ),
          },
          {
            text: t(
              `vacuum.step_summary.state.${endingHoldVentCheckbox === true ? 'open' : 'closed'}`
            ),
          },
        ]}
      />
    )
  }
  console.log('Bad vacuum form state for StepSummary')
  return null
}
