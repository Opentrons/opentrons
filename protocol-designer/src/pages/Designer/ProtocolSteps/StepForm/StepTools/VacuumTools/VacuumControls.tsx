import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { DIRECTION_COLUMN, Divider, Flex, SPACING } from '@opentrons/components'
import {
  VACUUM_MODE_POWER,
  VACUUM_MODE_PRESSURE,
  VACUUM_PROGRAM_PROFILE,
  VACUUM_PROGRAM_STATE,
  VACUUM_STATE_PUMP,
  VACUUM_VENT_OPEN,
  VACUUM_VENT_SET_CLOSED,
  VACUUM_VENT_SET_OPEN,
  vacuumModuleStateGetter,
} from '@opentrons/step-generation'

import { getRobotStateAtActiveItem } from '/protocol-designer/top-selectors/labware-locations'

import { VacuumControlsGroup } from './VacuumControlsGroup'
import { VacuumPumpControls } from './VacuumPumpControls'

import type { FormData } from '/protocol-designer/form-types'
import type { FieldPropsByName } from '../../types'

interface VacuumControlsProps {
  formData: FormData
  propsForFields: FieldPropsByName
}
export function VacuumControls(props: VacuumControlsProps): JSX.Element {
  const { t } = useTranslation('protocol_steps')
  const { formData, propsForFields } = props
  const { moduleId } = formData
  const robotState = useSelector(getRobotStateAtActiveItem)
  const vacuumModuleState =
    robotState != null
      ? vacuumModuleStateGetter(robotState, moduleId as string)
      : null
  const handleProgramTypeChange = (
    programType: typeof VACUUM_PROGRAM_STATE | typeof VACUUM_PROGRAM_PROFILE
  ): void => {
    propsForFields.programType.updateValue(programType)
  }

  const handleStateTypeChange = (
    stateType:
      | typeof VACUUM_STATE_PUMP
      | typeof VACUUM_VENT_SET_OPEN
      | typeof VACUUM_VENT_SET_CLOSED
  ): void => {
    propsForFields.stateType.updateValue(stateType)
  }

  const handleModeTypeChange = (
    modeType: typeof VACUUM_MODE_PRESSURE | typeof VACUUM_MODE_POWER
  ): void => {
    propsForFields.modeType.updateValue(modeType)
  }

  const ventState = vacuumModuleState?.ventStatus ?? VACUUM_VENT_OPEN
  const ventToSwitch =
    ventState === VACUUM_VENT_SET_OPEN
      ? VACUUM_VENT_SET_CLOSED
      : VACUUM_VENT_SET_OPEN

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
      {/* State / Profile selection */}
      <VacuumControlsGroup
        title={t('vacuum.controls.label')}
        options={[
          {
            label: t('vacuum.controls.options.state'),
            value: VACUUM_PROGRAM_STATE,
          },
          {
            label: t('vacuum.controls.options.profile'),
            value: VACUUM_PROGRAM_PROFILE,
          },
        ]}
        selectedValue={formData.programType}
        onChange={handleProgramTypeChange}
      />
      {formData.programType != null && <Divider marginY="0" />}
      {formData.programType === VACUUM_PROGRAM_STATE && (
        <>
          {/* Pump / Vent selection */}
          <VacuumControlsGroup
            title={t('vacuum.controls.state.label')}
            options={[
              {
                label: t('vacuum.controls.state.options.pump'),
                value: VACUUM_STATE_PUMP,
              },
              {
                label: t(`vacuum.controls.state.options.vent.${ventToSwitch}`),
                value: ventToSwitch,
              },
            ]}
            selectedValue={formData.stateType}
            onChange={handleStateTypeChange}
          />
          {formData.stateType === VACUUM_STATE_PUMP && <Divider marginY="0" />}
          {/* Pressure / Power selection */}
          {formData.stateType === VACUUM_STATE_PUMP && (
            <VacuumControlsGroup
              title={t('vacuum.controls.mode.label')}
              options={[
                {
                  label: t('vacuum.controls.mode.options.pressure.label'),
                  value: VACUUM_MODE_PRESSURE,
                  description: t(
                    'vacuum.controls.mode.options.pressure.description'
                  ),
                },
                {
                  label: t('vacuum.controls.mode.options.power.label'),
                  value: VACUUM_MODE_POWER,
                  description: t(
                    'vacuum.controls.mode.options.power.description'
                  ),
                },
              ]}
              selectedValue={formData.modeType}
              onChange={handleModeTypeChange}
              titleTooltip={t('vacuum.controls.mode.tooltip')}
            />
          )}
          {formData.modeType != null && <Divider marginY="0" />}
          {formData.stateType === VACUUM_STATE_PUMP && (
            <VacuumPumpControls
              formData={formData}
              propsForFields={propsForFields}
            />
          )}
        </>
      )}
      {formData.programType === VACUUM_PROGRAM_PROFILE &&
        'TODO: ADD PROFILE CONTENT'}
    </Flex>
  )
}
