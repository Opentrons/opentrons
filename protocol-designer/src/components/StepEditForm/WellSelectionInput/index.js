// @flow
import * as React from 'react'
import WellSelectionInput from './WellSelectionInput'
import {connect} from 'react-redux'
import {selectors as pipetteSelectors} from '../../../pipettes'
import {selectors as steplistSelectors} from '../../../steplist'
import {getFieldErrors, type StepFieldName} from '../../../steplist/fieldLevel'
import {openWellSelectionModal} from '../../../well-selection/actions'
import type {BaseState, ThunkDispatch} from '../../../types'
import {showFieldErrors} from '../StepFormField'
import type {FocusHandlers} from '../index'

type Props = React.ElementProps<typeof WellSelectionInput>

type OP = {
  name: StepFieldName,
  pipetteFieldName: StepFieldName,
  labwareFieldName: StepFieldName,
} & FocusHandlers

type SP = {
  isMulti: $PropertyType<Props, 'isMulti'>,
  primaryWellCount: $PropertyType<Props, 'primaryWellCount'>,
  _pipetteId: ?string,
  _selectedLabwareId: ?string,
  _wellFieldErrors: Array<string>,
}

const mapStateToProps = (state: BaseState, ownProps: OP): SP => {
  const formData = steplistSelectors.getUnsavedForm(state)
  const pipetteId = formData && formData[ownProps.pipetteFieldName]
  const selectedWells = formData ? formData[ownProps.name] : []
  const pipetteData = pipetteId && pipetteSelectors.pipettesById(state)[pipetteId]
  const isMulti = pipetteData && (pipetteData.channels > 1)

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
  const {dispatch} = dispatchProps
  const {_pipetteId, _selectedLabwareId, _wellFieldErrors} = stateProps
  const disabled = !(_pipetteId && _selectedLabwareId)
  const {name, focusedField, dirtyFields} = ownProps
  const showErrors = showFieldErrors({name, focusedField, dirtyFields})

  const onClick = () => {
    if (ownProps.onFieldBlur) {
      ownProps.onFieldBlur(ownProps.name)
    }
    if (_pipetteId && _selectedLabwareId) {
      dispatch(
        openWellSelectionModal({
          pipetteId: _pipetteId,
          labwareId: _selectedLabwareId,
          formFieldAccessor: ownProps.name,
        })
      )
    }
  }

  return {
    name,
    disabled,
    isMulti: stateProps.isMulti,
    primaryWellCount: stateProps.primaryWellCount,
    errorToShow: showErrors ? _wellFieldErrors[0] : null,
    onClick,
  }
}

export default connect(mapStateToProps, null, mergeProps)(WellSelectionInput)
