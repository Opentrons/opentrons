// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import WellSelectionInput from './WellSelectionInput'
import {selectors as stepFormSelectors} from '../../../../step-forms'
import {getFieldErrors} from '../../../../steplist/fieldLevel'
import type {BaseState, ThunkDispatch} from '../../../../types'
import type {StepFieldName} from '../../../../form-types'
import type {FocusHandlers} from '../../index'
import {showFieldErrors} from '../StepFormField'

type Props = React.ElementProps<typeof WellSelectionInput>

type OP = {
  name: StepFieldName,
  pipetteFieldName: StepFieldName,
  labwareFieldName: StepFieldName,
  onFieldBlur: $PropertyType<FocusHandlers, 'onFieldBlur'>,
  onFieldFocus: $PropertyType<FocusHandlers, 'onFieldFocus'>,
  focusedField: $PropertyType<FocusHandlers, 'focusedField'>,
  dirtyFields: $PropertyType<FocusHandlers, 'dirtyFields'>,
}

type SP = {
  isMulti: $PropertyType<Props, 'isMulti'>,
  primaryWellCount: $PropertyType<Props, 'primaryWellCount'>,
  _pipetteId: ?string,
  _selectedLabwareId: ?string,
  _wellFieldErrors: Array<string>,
}

const mapStateToProps = (state: BaseState, ownProps: OP): SP => {
  const formData = stepFormSelectors.getUnsavedForm(state)
  const pipetteId = formData && formData[ownProps.pipetteFieldName]
  const selectedWells = formData ? formData[ownProps.name] : []

  const pipette = pipetteId && stepFormSelectors.getPipetteEntities(state)[pipetteId]
  const isMulti = pipette ? (pipette.spec.channels > 1) : false

  return {
    _pipetteId: pipetteId,
    _selectedLabwareId: formData && formData[ownProps.labwareFieldName],
    _wellFieldErrors: getFieldErrors(ownProps.name, selectedWells) || [],
    primaryWellCount: selectedWells && selectedWells.length,
    isMulti,
  }
}

function mergeProps (
  stateProps: SP,
  dispatchProps: {dispatch: ThunkDispatch<*>},
  ownProps: OP
): Props {
  const {_pipetteId, _selectedLabwareId, _wellFieldErrors} = stateProps
  const disabled = !(_pipetteId && _selectedLabwareId)
  const {name, focusedField, dirtyFields, onFieldBlur, onFieldFocus} = ownProps
  const showErrors = showFieldErrors({name, focusedField, dirtyFields})

  return {
    name,
    disabled,
    pipetteId: _pipetteId,
    labwareId: _selectedLabwareId,
    isMulti: stateProps.isMulti,
    primaryWellCount: stateProps.primaryWellCount,
    errorToShow: showErrors ? _wellFieldErrors[0] : null,
    onFieldBlur,
    onFieldFocus,
  }
}

export default connect(mapStateToProps, null, mergeProps)(WellSelectionInput)
