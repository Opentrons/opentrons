// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {DropdownField, type DropdownOption} from '@opentrons/components'
import {selectors as labwareIngredSelectors} from '../../../labware-ingred/reducers'
import type {StepFieldName} from '../../steplist/fieldLevel'
import type {BaseState} from '../../types'
import StepField from './StepFormField'
import type {FocusHandlers} from './index'

type Options = Array<DropdownOption>

type LabwareDropdownOP = {name: StepFieldName, className?: string} & FocusHandlers
type LabwareDropdownSP = {labwareOptions: Options}
const LabwareDropdownSTP = (state: BaseState): LabwareDropdownSP => ({
  labwareOptions: labwareIngredSelectors.labwareOptions(state),
})
export const LabwareDropdown = connect(LabwareDropdownSTP)((props: LabwareDropdownOP & LabwareDropdownSP) => {
  const {labwareOptions, name, className, focusedField, dirtyFields, onFieldBlur, onFieldFocus} = props
  return (
    // TODO: BC abstract e.currentTarget.value inside onChange with fn like onChangeValue of type (value: mixed) => {}
    <StepField
      name={name}
      focusedField={focusedField}
      dirtyFields={dirtyFields}
      render={({value, updateValue, errorToShow}) => {
        // blank out the dropdown if labware id does not exist
        const availableLabwareIds = labwareOptions.map(opt => opt.value)
        const fieldValue = availableLabwareIds.includes(value)
          ? String(value)
          : null
        return (
          <DropdownField
            error={errorToShow}
            className={className}
            options={labwareOptions}
            onBlur={() => { onFieldBlur(name) }}
            onFocus={() => { onFieldFocus(name) }}
            value={fieldValue}
            onChange={(e: SyntheticEvent<HTMLSelectElement>) => { updateValue(e.currentTarget.value) } }
          />
        )
      }}
    />
  )
})
