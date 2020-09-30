// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import { WellSelectionInput } from './WellSelectionInput'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import { getFieldErrors } from '../../../../steplist/fieldLevel'
import { getDisabledFields } from '../../../../steplist/formLevel'
import type { BaseState, ThunkDispatch } from '../../../../types'
import type { StepFieldName } from '../../../../form-types'
import type { FocusHandlers } from '../../types'
import { showFieldErrors } from '../FieldConnector'

type Props = React.ElementConfig<typeof WellSelectionInput>

type OP = {|
  name: StepFieldName,
  pipetteFieldName: StepFieldName,
  labwareFieldName: StepFieldName,
  onFieldBlur: $PropertyType<FocusHandlers, 'onFieldBlur'>,
  onFieldFocus: $PropertyType<FocusHandlers, 'onFieldFocus'>,
  focusedField: $PropertyType<FocusHandlers, 'focusedField'>,
  dirtyFields: $PropertyType<FocusHandlers, 'dirtyFields'>,
|}

type SP = {|
  disabled: boolean,
  isMulti: $PropertyType<Props, 'isMulti'>,
  primaryWellCount: $PropertyType<Props, 'primaryWellCount'>,
  _pipetteId: ?string,
  _selectedLabwareId: ?string,
  _wellFieldErrors: Array<string>,
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
    _wellFieldErrors: getFieldErrors(ownProps.name, selectedWells) || [],
    primaryWellCount: selectedWells && selectedWells.length,
    isMulti,
  }
}

function mergeProps(
  stateProps: SP,
  dispatchProps: { dispatch: ThunkDispatch<*> },
  ownProps: OP
): Props {
  const { _pipetteId, _selectedLabwareId, _wellFieldErrors } = stateProps
  const {
    name,
    focusedField,
    dirtyFields,
    onFieldBlur,
    onFieldFocus,
  } = ownProps
  const showErrors = showFieldErrors({ name, focusedField, dirtyFields })

  return {
    name,
    disabled: stateProps.disabled,
    pipetteId: _pipetteId,
    labwareId: _selectedLabwareId,
    isMulti: stateProps.isMulti,
    primaryWellCount: stateProps.primaryWellCount,
    errorToShow: showErrors ? _wellFieldErrors[0] : null,
    onFieldBlur,
    onFieldFocus,
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
