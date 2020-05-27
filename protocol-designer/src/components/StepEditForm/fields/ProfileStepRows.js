// @flow
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { InputField } from '@opentrons/components'
import { getUnsavedForm } from '../../../step-forms/selectors'
import { editProfileStep } from '../../../steplist/actions'

type Props = {|
  name: string,
  value: string,
  onBlur: () => mixed,
  onFocus: () => mixed,
  onChange: (e: SyntheticInputEvent<*>) => mixed,
|}

export const maskProfileField = (name: string, rawValue: string) => {
  // TODO: implement maskers for all fields, use existing masker utils
  return rawValue
}

// TODO should look more like ./TextField.js -- this is very barebones now
export const ProfileStepItemFieldComponent = (props: Props) => {
  const { onChange, onBlur, onFocus, value } = props
  return <InputField {...{ onChange, onBlur, onFocus, value }} />
}

// NOTE this is a copy of  showProfileErrors but w/ different type. Instead, make generic type?
export const showProfileFieldErrors = ({
  name,
  focusedProfileField,
  dirtyProfileFields,
}: {|
  name: string,
  focusedProfileField: ?string,
  dirtyProfileFields: Array<string>,
|}): boolean =>
  !(name === focusedProfileField) &&
  dirtyProfileFields &&
  dirtyProfileFields.includes(name)

// TODO factor out
export const getProfileFieldErrors = (
  name: string,
  value: string
): Array<string> => {
  // TODO implement. Use existing error checker utils
  return []
}

export type ProfileStepRowsProps = {|
  focusedField: ?string,
  dirtyPFields: Array<string>,
|}
export const ProfileStepRows = (props: ProfileStepRowsProps) => {
  const { focusedProfileField, dirtyProfileFields } = props
  const dispatch = useDispatch()
  const unsavedForm = useSelector(getUnsavedForm)
  if (!unsavedForm) {
    console.error('ProfileStepRows expected an unsavedForm')
    return null
  }
  const { orderedProfileItems, profileItemsById } = unsavedForm

  return orderedProfileItems.map((itemId, index) => {
    const itemFields = profileItemsById[itemId]
    // TODO just doing temperature field for now
    const name = 'temperature'
    const value = itemFields.temperature
    const onChange = (e: SyntheticEvent<*>) => {
      const rawValue = e.currentTarget.value
      const maskedValue = maskProfileField(name, rawValue)
      dispatch(
        editProfileStep({
          id: itemId,
          fields: { [name]: maskedValue },
        })
      )
    }

    const showErrors = showProfileFieldErrors({
      name,
      focusedProfileField,
      dirtyProfileFields,
    })
    const errors = getProfileFieldErrors(name, value)
    const errorToShow =
      showErrors && errors.length > 0 ? errors.join(', ') : null

    // TODO: tooltips for profile fields
    // const tooltipComponent =
    //   props.tooltipComponent || getTooltipForField(stepType, name, disabled)

    console.log('debug:', { errorToShow }) // TODO DEBUG

    const onBlur = () => {} // TODO
    const onFocus = () => {} // TODO
    return (
      <ProfileStepItemFieldComponent
        key={itemId}
        {...{ name, onChange, onBlur, onFocus, value }}
      />
    )
  })
}
