// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { WellSelectionInput } from './WellSelectionInput'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import { getDisabledFields } from '../../../../steplist/formLevel'
import type { BaseState, ThunkDispatch } from '../../../../types'
import type { StepFieldName } from '../../../../form-types'
import type { FieldProps } from '../useSingleEditFieldProps'

type Props = React.ElementConfig<typeof WellSelectionInput>

type OP = {|
  ...FieldProps,
  pipetteFieldName: StepFieldName,
  labwareFieldName: StepFieldName,
|}

type SP = {|
  disabled: boolean,
  isMulti: $PropertyType<Props, 'isMulti'>,
  primaryWellCount: $PropertyType<Props, 'primaryWellCount'>,
  _pipetteId: ?string,
  _selectedLabwareId: ?string,
  // _wellFieldErrors: Array<string>,
|}

const mapStateToProps = (state: BaseState, ownProps: OP): SP => {
  const formData = stepFormSelectors.getUnsavedForm(state)
  const pipetteId = formData && formData[ownProps.pipetteFieldName]
  const selectedWells = formData ? formData[ownProps.name] : []
  const disabled = formData
    ? getDisabledFields(formData).has(ownProps.name)
    : false

  const pipette =
    pipetteId && stepFormSelectors.getPipetteEntities(state)[pipetteId]
  const isMulti = pipette ? pipette.spec.channels > 1 : false

  return {
    disabled,
    _pipetteId: pipetteId,
    _selectedLabwareId: formData && formData[ownProps.labwareFieldName],
    // TODO IMMEDIATELY: trace this out
    // _wellFieldErrors: getFieldErrors(ownProps.name, selectedWells) || [],
    primaryWellCount: selectedWells && selectedWells.length,
    isMulti,
  }
}

function mergeProps(
  stateProps: SP,
  dispatchProps: { dispatch: ThunkDispatch<*> },
  ownProps: OP
): Props {
  const { _pipetteId, _selectedLabwareId } = stateProps
  const {
    name,
    onFieldBlur,
    onFieldFocus,
    errorToShow,
    value,
    updateValue,
  } = ownProps

  return {
    name,
    disabled: stateProps.disabled,
    pipetteId: _pipetteId,
    labwareId: _selectedLabwareId,
    isMulti: stateProps.isMulti,
    primaryWellCount: stateProps.primaryWellCount,
    value,
    errorToShow,
    onFieldBlur,
    onFieldFocus,
    updateValue,
  }
}

export const WellSelectionField: React.AbstractComponent<OP> = connect<
  Props,
  OP,
  SP,
  {||},
  _,
  _
>(
  mapStateToProps,
  null,
  mergeProps
)(WellSelectionInput)
