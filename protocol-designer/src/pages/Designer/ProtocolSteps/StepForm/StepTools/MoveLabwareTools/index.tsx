import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Box, COLORS, DIRECTION_COLUMN, Flex } from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'
import { getRobotType } from '../../../../../../file-data/selectors'
import { CheckboxStepFormField } from '../../../../../../molecules'
import {
  getAdditionalEquipment,
  getCurrentFormCanBeSaved,
} from '../../../../../../step-forms/selectors'
import { MoveLabwareField } from './MoveLabwareField'
import { LabwareLocationField } from './LabwareLocationField'

import type { StepFormProps } from '../../types'

export function MoveLabwareTools(props: StepFormProps): JSX.Element {
  const { propsForFields } = props
  const { t, i18n } = useTranslation(['application', 'form', 'tooltip'])
  const robotType = useSelector(getRobotType)
  const canSave = useSelector(getCurrentFormCanBeSaved)
  const additionalEquipment = useSelector(getAdditionalEquipment)
  const isGripperAttached = Object.values(additionalEquipment).some(
    equipment => equipment?.name === 'gripper'
  )

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      {robotType === FLEX_ROBOT_TYPE ? (
        <CheckboxStepFormField
          {...propsForFields.useGripper}
          disabled={!isGripperAttached}
          label={i18n.format(
            t('form:step_edit_form.field.useGripper.label'),
            'capitalize'
          )}
          tooltipContent={
            !isGripperAttached
              ? t('tooltip:step_fields.moveLabware.disabled.gripper_not_used')
              : null
          }
        />
      ) : null}
      <MoveLabwareField {...propsForFields.labware} />
      <Box borderBottom={`1px solid ${COLORS.grey30}`} />
      <LabwareLocationField
        {...propsForFields.newLocation}
        useGripper={propsForFields.useGripper.value === true}
        canSave={canSave}
        labware={String(propsForFields.labware.value)}
      />
      <Box borderBottom={`1px solid ${COLORS.grey30}`} />
    </Flex>
  )
}
