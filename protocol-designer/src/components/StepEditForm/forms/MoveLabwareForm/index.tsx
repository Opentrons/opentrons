import * as React from 'react'
import { useSelector } from 'react-redux'
import {
  FormGroup,
  Tooltip,
  TOOLTIP_BOTTOM,
  TOOLTIP_FIXED,
  useHoverTooltip,
} from '@opentrons/components'
import { i18n } from '../../../../localization'
import {
  LabwareField,
  ToggleRowField,
  LabwareLocationField,
} from '../../fields'
import styles from '../../StepEditForm.css'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'
import { getRobotType } from '../../../../file-data/selectors'
import { getAdditionalEquipment } from '../../../../step-forms/selectors'
import { StepFormProps } from '../../types'

export const MoveLabwareForm = (props: StepFormProps): JSX.Element => {
  const { propsForFields } = props
  const robotType = useSelector(getRobotType)
  const additionalEquipment = useSelector(getAdditionalEquipment)
  const isGripperAttached = Object.values(additionalEquipment).some(
    equipment => equipment?.name === 'gripper'
  )
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_BOTTOM,
    strategy: TOOLTIP_FIXED,
  })

  return (
    <div className={styles.form_wrapper}>
      <div className={styles.section_header}>
        <span className={styles.section_header_text}>
          {i18n.t('application.stepType.moveLabware')}
        </span>
      </div>
      <div className={styles.form_row}>
        <FormGroup
          label={i18n.t('form.step_edit_form.labwareLabel.movedLabware')}
          className={styles.large_field}
        >
          <LabwareField {...propsForFields.labware} />
        </FormGroup>
        {robotType === FLEX_ROBOT_TYPE ? (
          <>
            {!isGripperAttached ? (
              <Tooltip {...tooltipProps}>
                {i18n.t(
                  'tooltip.step_fields.moveLabware.disabled.gripper_not_used'
                )}
              </Tooltip>
            ) : null}
            <div {...targetProps}>
              <FormGroup
                className={styles.small_field}
                label={i18n.t('form.step_edit_form.field.useGripper.label')}
              >
                <ToggleRowField
                  {...propsForFields.useGripper}
                  disabled={!isGripperAttached}
                  offLabel={i18n.t(
                    'form.step_edit_form.field.useGripper.toggleOff'
                  )}
                  onLabel={i18n.t(
                    'form.step_edit_form.field.useGripper.toggleOn'
                  )}
                />
              </FormGroup>
            </div>
          </>
        ) : null}
      </div>
      <div className={styles.form_row}>
        <FormGroup
          className={styles.small_field}
          label={i18n.t('form.step_edit_form.field.newLocation.label')}
        >
          <LabwareLocationField
            {...propsForFields.newLocation}
            useGripper={propsForFields.useGripper.value === true}
          />
        </FormGroup>
      </div>
    </div>
  )
}
