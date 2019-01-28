// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {DropdownField, type DropdownOption} from '@opentrons/components'
import {selectors as labwareIngredSelectors} from '../../../labware-ingred/selectors'
import type {StepFieldName} from '../../../steplist/fieldLevel'
import type {BaseState} from '../../../types'
import type {FocusHandlers} from '../index'
import StepField from './FieldConnector'

type Options = Array<DropdownOption>

type LabwareFieldOP = {name: StepFieldName, className?: string} & FocusHandlers
type LabwareFieldSP = {labwareOptions: Options}
const LabwareFieldSTP = (state: BaseState): LabwareFieldSP => ({
  labwareOptions: labwareIngredSelectors.labwareOptions(state),
})
const LabwareField = connect(LabwareFieldSTP)((props: LabwareFieldOP & LabwareFieldSP) => {
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

export default LabwareField
