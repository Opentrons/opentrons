// @flow
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { InputField, OutlineButton } from '@opentrons/components'
import { getUnsavedForm } from '../../../step-forms/selectors'
import * as steplistActions from '../../../steplist/actions'
import {
  getProfileFieldErrors,
  maskProfileField,
} from '../../../steplist/fieldLevel'
import { getDynamicFieldFocusHandlerId } from '../utils'
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
      {rows}
      <OutlineButton onClick={addProfileStep}>+ Add Step</OutlineButton>
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
      <div
        key={name}
        style={{ width: '4rem', display: 'inline-block', margin: '0.5rem' }}
      >
        <InputField
          error={errorToShow}
          {...{ name, onChange, onBlur, onFocus, value }}
        />
      </div>
    )
  })
  return (
    <div>
      {fields}
      <div onClick={deleteProfileStep}>X</div>
    </div>
  )
}
