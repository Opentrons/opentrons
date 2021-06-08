import * as React from 'react'
import { connect } from 'react-redux'
import { WellSelectionInput } from './WellSelectionInput'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import { BaseState, ThunkDispatch } from '../../../../types'
import { FieldProps } from '../../types'
type Props = JSX.LibraryManagedAttributes<
  typeof WellSelectionInput,
  React.ComponentProps<typeof WellSelectionInput>
>
type OP = FieldProps & {
  labwareId: string | null | undefined
  pipetteId: string | null | undefined
}
type SP = {
  isMulti: Props['isMulti']
  primaryWellCount: Props['primaryWellCount']
}

const mapStateToProps = (state: BaseState, ownProps: OP): SP => {
  const { pipetteId } = ownProps
  const selectedWells = ownProps.value
  const pipette =
    pipetteId && stepFormSelectors.getPipetteEntities(state)[pipetteId]
  const isMulti = pipette ? pipette.spec.channels > 1 : false
  return {
    primaryWellCount: Array.isArray(selectedWells)
      ? selectedWells.length
      : undefined,
    isMulti,
  }
}

function mergeProps(
  stateProps: SP,
  dispatchProps: {
    dispatch: ThunkDispatch<any>
  },
  ownProps: OP
): Props {
  const {
    disabled,
    errorToShow,
    labwareId,
    name,
    onFieldBlur,
    onFieldFocus,
    pipetteId,
    updateValue,
    value,
  } = ownProps
  return {
    disabled,
    errorToShow,
    isMulti: stateProps.isMulti,
    labwareId,
    name,
    onFieldBlur,
    onFieldFocus,
    pipetteId,
    primaryWellCount: stateProps.primaryWellCount,
    updateValue,
    value,
  }
}

export const WellSelectionField: React.AbstractComponent<OP> = connect<
  Props,
  OP,
  SP,
  {},
  _,
  _
>(
  mapStateToProps,
  null,
  mergeProps
)(WellSelectionInput)
