// @flow
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { InputField, OutlineButton, Icon } from '@opentrons/components'
import { i18n } from '../../../localization'
import { getUnsavedForm } from '../../../step-forms/selectors'
import * as steplistActions from '../../../steplist/actions'
import {
  getProfileFieldErrors,
  maskProfileField,
} from '../../../steplist/fieldLevel'
import { getDynamicFieldFocusHandlerId } from '../utils'
import styles from '../StepEditForm.css'
import type { ProfileStepItem } from '../../../form-types'
import type { FocusHandlers } from '../types'

export const showProfileFieldErrors = ({
  fieldId,
  focusedField,
  dirtyFields,
}: {|
  fieldId: string,
  focusedField: ?string,
  dirtyFields: Array<string>,
|}): boolean =>
  !(fieldId === focusedField) && dirtyFields && dirtyFields.includes(fieldId)

export type ProfileStepRowsProps = {|
  focusHandlers: FocusHandlers,
|}
export const ProfileStepRows = (props: ProfileStepRowsProps) => {
  const dispatch = useDispatch()
  const addProfileStep = () => dispatch(steplistActions.addProfileStep(null))

  const unsavedForm = useSelector(getUnsavedForm)
  if (!unsavedForm) {
    console.error('ProfileStepRows expected an unsavedForm')
    return null
  }
  const { orderedProfileItems, profileItemsById } = unsavedForm

  const rows = orderedProfileItems.map((itemId, index) => {
    const updateStepFieldValue = (name: string, value: string) => {
      const maskedValue = maskProfileField(name, value)
      dispatch(
        steplistActions.editProfileStep({
          id: itemId,
          fields: { [name]: maskedValue },
        })
      )
    }

    const deleteProfileStep = () => {
      dispatch(steplistActions.deleteProfileStep({ id: itemId }))
    }

    const itemFields = profileItemsById[itemId]

    return (
      <div key={index}>
        <ProfileStepRow
          deleteProfileStep={deleteProfileStep}
          profileStepItem={itemFields}
          updateStepFieldValue={updateStepFieldValue}
          focusHandlers={props.focusHandlers}
        />
      </div>
    )
  })

  return (
    <>
      {rows.length > 0 && (
        <div className={styles.profile_step_labels}>
          <div>Name:</div>
          <div>Temperature:</div>
          <div>Time:</div>
        </div>
      )}
      {rows}
      <div className={styles.profile_button_group}>
        <OutlineButton onClick={addProfileStep}>+ Add Step</OutlineButton>
      </div>
    </>
  )
}

type ProfileStepRowProps = {|
  deleteProfileStep: () => mixed,
  profileStepItem: ProfileStepItem,
  updateStepFieldValue: (name: string, value: string) => mixed,
  focusHandlers: FocusHandlers,
|}

const ProfileStepRow = (props: ProfileStepRowProps) => {
  const names = ['title', 'temperature', 'durationMinutes', 'durationSeconds']
  const units = {
    title: null,
    temperature: i18n.t('application.units.degrees'),
    durationMinutes: i18n.t('application.units.minutes'),
    durationSeconds: i18n.t('application.units.seconds'),
  }
  const {
    deleteProfileStep,
    profileStepItem,
    updateStepFieldValue,
    focusHandlers,
  } = props
  const fields = names.map(name => {
    const value = profileStepItem[name]
    const fieldId = getDynamicFieldFocusHandlerId({
      id: profileStepItem.id,
      name,
    })

    const onChange = (e: SyntheticEvent<*>) => {
      updateStepFieldValue(name, e.currentTarget.value)
    }

    const showErrors = showProfileFieldErrors({
      fieldId,
      focusedField: focusHandlers.focusedField,
      dirtyFields: focusHandlers.dirtyFields,
    })
    const errors = getProfileFieldErrors(name, value)
    const errorToShow =
      showErrors && errors.length > 0 ? errors.join(', ') : null

    // TODO: tooltips for profile fields
    // const tooltipComponent =
    //   props.tooltipComponent || getTooltipForField(stepType, name, disabled)

    const onBlur = () => {
      focusHandlers.onFieldBlur(fieldId)
    }
    const onFocus = () => {
      focusHandlers.onFieldFocus(fieldId)
    }
    return (
      <div key={name} className={styles.step_input_wrapper}>
        <InputField
          className={styles.step_input}
          error={errorToShow}
          units={units[name]}
          {...{ name, onChange, onBlur, onFocus, value }}
        />
      </div>
    )
  })
  return (
    <div className={styles.profile_step_row}>
      <div className={styles.profile_step_fields}>{fields}</div>
      <div onClick={deleteProfileStep}>
        <Icon name="close" className={styles.delete_step_icon} />
      </div>
    </div>
  )
}
