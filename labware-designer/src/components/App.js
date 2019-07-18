// @flow
import * as React from 'react'
import { InputField } from '@opentrons/components'
import type { LabwareFields } from '../fields'

const getDefaultFormState = (): LabwareFields => ({
  labwareType: null,
  tubeRackInsertLoadName: null,
  aluminumBlockType: null,
  aluminumBlockChildLabwareType: null,

  tuberackSides: [],
  footprintXDimension: null,
  footprintYDimension: null,
  labwareZDimension: null,

  gridRows: null,
  gridColumns: null,
  gridSpacingX: null,
  gridSpacingY: null,
  gridOffsetX: null,
  gridOffsetY: null,

  heterogeneousWells: null,
  irregularRowSpacing: null,
  irregularColumnSpacing: null,

  wellVolume: null,
  wellBottomShape: null,
  wellDepth: null,
  wellShape: null,

  // used with circular well shape only
  wellDiameter: null,

  // used with rectangular well shape only
  wellXDimension: null,
  wellYDimension: null,

  brand: null,
  brandId: [],

  loadName: null,
  displayName: null,
})

const UPDATE_LABWARE_FORM_FIELD: 'UPDATE_LABWARE_FORM_FIELD' =
  'UPDATE_LABWARE_FORM_FIELD'

// TODO: make an enum of all actions
type FormAction = {|
  type: typeof UPDATE_LABWARE_FORM_FIELD,
  payload: {|
    field: string,
    value: mixed,
  |},
|}

type FormReducer = (state: LabwareFields, action: FormAction) => LabwareFields
const formReducer: FormReducer = (state, action) => {
  console.log({ action })

  // TODO IMMEDIATELY figure out reducer
  switch (action.type) {
    case UPDATE_LABWARE_FORM_FIELD:
      // TODO: masking & casting
      return { ...state, [action.payload.field]: action.payload.value }
    default:
      return state
  }
}

type FieldProps = {
  formDispatch: FormAction => mixed,
  formState: LabwareFields,
  field: $Keys<LabwareFields>,
  label?: string,
}
const Field = (props: FieldProps) => {
  const [fieldState, setFieldState] = React.useState<mixed>(
    props.formState[props.field]
  )
  return (
    <InputField
      onChange={e => setFieldState(e.target.value)}
      onBlur={e =>
        props.formDispatch({
          type: UPDATE_LABWARE_FORM_FIELD,
          payload: { field: props.field, value: e.target.value },
        })
      }
      label={props.label}
      value={fieldState}
    />
  )
}

const App = () => {
  const [formState, formDispatch] = React.useReducer<
    FormReducer,
    LabwareFields
  >(formReducer, getDefaultFormState())

  return (
    <div>
      <h1>Labware Creator</h1>
      <Field
        field="displayName"
        label="Display Name"
        formState={formState}
        formDispatch={formDispatch}
      />
    </div>
  )
}

export default App
