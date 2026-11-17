import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { DIRECTION_COLUMN, Divider, Flex, SPACING } from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { CheckboxStepFormField } from '/protocol-designer/components/molecules'
import { getRobotType } from '/protocol-designer/file-data/selectors'
import {
  getAdditionalEquipment,
  getCurrentFormCanBeSaved,
} from '/protocol-designer/step-forms/selectors'

import { LabwareLocationField } from './LabwareLocationField'
import { MoveLabwareField } from './MoveLabwareField'

import type { ReactNode } from 'react'
import type { StepFormProps } from '../../types'

export function MoveLabwareTools(props: StepFormProps): ReactNode {
  const { propsForFields } = props
  const { t, i18n } = useTranslation(['application', 'form', 'tooltip'])
  const robotType = useSelector(getRobotType)
  const canSave = useSelector(getCurrentFormCanBeSaved)
  const additionalEquipment = useSelector(getAdditionalEquipment)
  const isGripperAttached = Object.values(additionalEquipment).some(
    equipment => equipment?.name === 'gripper'
  )

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing12}
      paddingY={SPACING.spacing16}
      height="100%"
    >
      {robotType === FLEX_ROBOT_TYPE ? (
        <>
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
          <Divider marginY="0" />
        </>
      ) : null}
      <MoveLabwareField
        {...propsForFields.labware}
        useGripper={propsForFields.useGripper.value === true}
      />
      <Divider marginY="0" />
      <LabwareLocationField
        {...propsForFields.newLocation}
        useGripper={propsForFields.useGripper.value === true}
        canSave={canSave}
        labware={String(propsForFields.labware.value)}
      />
    </Flex>
  )
}
