import { connect } from 'react-redux'
import { selectors as stepFormSelectors } from '../../../../step-forms'
import {
  WellSelectionInput,
  Props as WellSelectionInputProps,
  DP,
} from './WellSelectionInput'
import type { BaseState } from '../../../../types'
import type { FieldProps } from '../../types'

type Props = Omit<
  JSX.LibraryManagedAttributes<
    typeof WellSelectionInput,
    WellSelectionInputProps
  >,
  keyof DP
>
type OP = FieldProps & {
  labwareId?: string | null
  pipetteId?: string | null
}
interface SP {
  isMulti: Props['isMulti']
  primaryWellCount: Props['primaryWellCount']
  additionalEquipmentEntities: Props['additionalEquipmentEntities']
}

const mapStateToProps = (state: BaseState, ownProps: OP): SP => {
  const { pipetteId, labwareId } = ownProps
  const selectedWells = ownProps.value
  const pipette =
    pipetteId && stepFormSelectors.getPipetteEntities(state)[pipetteId]
  const additionalEquipmentEntities = stepFormSelectors.getAdditionalEquipmentEntities(
    state
  )
  const isMulti = pipette ? pipette.spec.channels > 1 : false
  let primaryWellCount = Array.isArray(selectedWells)
    ? selectedWells.length
    : undefined

  const selectingForTrash =
    labwareId != null && additionalEquipmentEntities[labwareId] != null
  //  if 'labwareId' is actually a waste chute or trash bin
  if (selectingForTrash) {
    primaryWellCount = 1
  }
  return {
    primaryWellCount,
    isMulti,
    additionalEquipmentEntities,
  }
}

function mergeProps(stateProps: SP, _dispatchProps: null, ownProps: OP): Props {
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
    additionalEquipmentEntities: stateProps.additionalEquipmentEntities,
  }
}

export const WellSelectionField = connect(
  mapStateToProps,
  null,
  mergeProps
)(WellSelectionInput)
