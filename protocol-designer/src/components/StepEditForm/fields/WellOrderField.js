
// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {DropdownField} from '@opentrons/components'
import i18n from '../../../localization'
import {selectors, actions} from '../../../steplist'
import type {StepFieldName} from '../../../steplist/fieldLevel'
import type {BaseState, Dispatch} from '../../../types'

export type WellOrderOrdinality = 'first' | 'second'
export type WellOrderOption = 'l2r' | 'r2l' | 't2b' | 'b2t'
const VERTICAL_VALUES: Array<WellOrderOption> = ['t2b', 'b2t']
const HORIZONTAL_VALUES: Array<WellOrderOption> = ['l2r', 'r2l']
const WELL_ORDER_VALUES: Array<WellOrderOption> = [...VERTICAL_VALUES, ...HORIZONTAL_VALUES]

type WellOrderFieldProps = {name: StepFieldName}
export const WellOrderField = (props: WellOrderFieldProps) => (
  <DropdownField
    options={
      WELL_ORDER_VALUES.map((value) => ({
        value,
        name: i18n.t(`step_edit_form.field.well_order.option.${value}`)
      }))
    }
    value={props.value ? String(props.value) : null}
    onChange={(e: SyntheticEvent<HTMLSelectElement>) => { props.updateValue(e.currentTarget.value) } } />
)

const mapSTP = (state: BaseState, ownProps: OP): SP => {
  const formData = selectors.getUnsavedForm(state)
  const {prefix, ordinality} = ownProps
  const _valueName = `${prefix}_wellOrder_${ordinality}`
  const _converseName = `${prefix}_wellOrder_${ordinality === 'first' ? 'second' : 'first'}`
  return {
    _valueName,
    _converseName,
    value: formData ? formData[_valueName] : null,
    converse: formData ? formData[_converseName] : null
  }
}

const mapDTP = (dispatch: Dispatch, ownProps): DP => ({
  updateInput: (name: StepFieldName, value: mixed) => {
    dispatch(actions.changeFormInput({update: {[name]: value}}))
  }
})

const mergeProps = (stateProps: SP, dispatchProps: DP, ownProps: OP) => {
  const { _valueName, _converseName, value, converse } = stateProps
  const {updateInput} = dispatchProps
  return {
    value,
    updateValue: (value: WellOrderOption) => {
      updateInput(_valueName, value)
      // default if axes collision
      if (VERTICAL_VALUES.includes(value) && VERTICAL_VALUES.includes(converse)) {
        updateInput(_converseName, HORIZONTAL_VALUES[0])
      } else if (HORIZONTAL_VALUES.includes(value) && HORIZONTAL_VALUES.includes(converse)) {
        updateInput(_converseName, VERTICAL_VALUES[0])
      }
    }
  }
}

export default connect(mapSTP, mapDTP, mergeProps)(WellOrderField)
