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

// TODO should look more like ./TextField.js
export const ProfileStepItemFieldComponent = (props: Props) => {
  const { onChange, onBlur, onFocus, value } = props
  return <InputField {...{ onChange, onBlur, onFocus, value }} />
}

export const ProfileStepRows = () => {
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
    const onChange = (e: SyntheticEvent<*>) =>
      dispatch(
        editProfileStep({
          id: itemId,
          fields: { temperature: e.currentTarget.value },
        })
      )
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
