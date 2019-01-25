// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {DropdownField, type DropdownOption} from '@opentrons/components'
import {selectors as labwareIngredSelectors} from '../../../labware-ingred/reducers'
import type {StepFieldName} from '../../../steplist/fieldLevel'
import {
  SOURCE_WELL_BLOWOUT_DESTINATION,
  DEST_WELL_BLOWOUT_DESTINATION,
} from '../../../step-generation/utils'
import type {BaseState} from '../../../types'
import type {FocusHandlers} from '../index'
import StepField from './StepFormField'

type Options = Array<DropdownOption>

// TODO: 2019-01-24 i18n for these options

type BlowoutLocationDropdownOP = {
  name: StepFieldName,
  className?: string,
  includeSourceWell?: ?boolean,
  includeDestWell?: ?boolean,
} & FocusHandlers
type BlowoutLocationDropdownSP = {options: Options}
const BlowoutLocationDropdownSTP = (state: BaseState, ownProps: BlowoutLocationDropdownOP): BlowoutLocationDropdownSP => {
  let options = labwareIngredSelectors.disposalLabwareOptions(state)
  if (ownProps.includeDestWell) {
    options = [
      ...options,
      {name: 'Destination Well', value: DEST_WELL_BLOWOUT_DESTINATION},
    ]
  }
  if (ownProps.includeSourceWell) {
    options = [
      ...options,
      {name: 'Source Well', value: SOURCE_WELL_BLOWOUT_DESTINATION},
    ]
  }
  return {options}
}
export const BlowoutLocationDropdown = connect(BlowoutLocationDropdownSTP)((props: BlowoutLocationDropdownOP & BlowoutLocationDropdownSP) => {
  const {options, name, className, focusedField, dirtyFields, onFieldBlur, onFieldFocus} = props
  return (
    <StepField
      name={name}
      focusedField={focusedField}
      dirtyFields={dirtyFields}
      render={({value, updateValue}) => (
        <DropdownField
          className={className}
          options={options}
          onBlur={() => { onFieldBlur(name) }}
          onFocus={() => { onFieldFocus(name) }}
          value={value ? String(value) : null}
          onChange={(e: SyntheticEvent<HTMLSelectElement>) => { updateValue(e.currentTarget.value) } } />
      )} />
  )
})

export default BlowoutLocationDropdown
