// @flow
import * as React from 'react'
import { DropdownField, InputField, type Options } from '@opentrons/components'
import {
  labwareTypeOptions,
  tuberackInsertOptions,
  type LabwareFields,
} from '../fields'

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

type UpdateFieldAction = {|
  type: typeof UPDATE_LABWARE_FORM_FIELD,
  payload: {|
    field: string,
    value: mixed,
  |},
|}

// NOTE: this will be an enum of all actions handled by formReducer
type FormAction = UpdateFieldAction

type FormReducer = (state: LabwareFields, action: FormAction) => LabwareFields
const formReducer: FormReducer = (state, action) => {
  console.log({ action })

  // TODO IMMEDIATELY figure out reducer, still WIP
  switch (action.type) {
    case UPDATE_LABWARE_FORM_FIELD:
      // TODO LATER: masking & casting
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
  // TODO make action creator for UPDATE_FORM_FIELD
  return (
    <InputField
      onChange={e => setFieldState(e.target.value)}
      onBlur={e =>
        props.formDispatch({
          type: UPDATE_LABWARE_FORM_FIELD,
          payload: { field: props.field, value: e.currentTarget.value },
        })
      }
      label={props.label}
      value={fieldState}
    />
  )
}

// TODO IMMEDIATELY: needs to support images, use react-select
type DropdownProps = {
  formDispatch: FormAction => mixed,
  formState: LabwareFields,
  field: $Keys<LabwareFields>,
  options: Options,
  label?: string,
}
const Dropdown = (props: DropdownProps) => {
  const fieldState = props.formState[props.field]
  // TODO make action creator
  return (
    <div>
      <strong>{props.label}</strong>
      <DropdownField
        onChange={e =>
          props.formDispatch({
            type: UPDATE_LABWARE_FORM_FIELD,
            payload: { field: props.field, value: e.currentTarget.value },
          })
        }
        options={props.options}
        value={fieldState}
      />
    </div>
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
      <Dropdown
        field="labwareType"
        label="Which labware"
        options={labwareTypeOptions}
        formState={formState}
        formDispatch={formDispatch}
      />
      <Dropdown
        field="tubeRackInsertLoadName"
        label="Which tube rack insert"
        options={tuberackInsertOptions}
        formState={formState}
        formDispatch={formDispatch}
      />
      <Dropdown
        field="aluminumBlockType"
        label="Which aluminum block"
        options={tuberackInsertOptions}
        formState={formState}
        formDispatch={formDispatch}
      />
      <Dropdown
        field="aluminumBlockChildLabwareType"
        label="What labware is on top of your 96 well aluminum block"
        options={tuberackInsertOptions}
        formState={formState}
        formDispatch={formDispatch}
      />
      <div onClick={() => window.alert('TODO not implemented!')}>
        Import File
      </div>
      {/* PAGE 1 - Labware */}
      {/* tuberackSides: Array<string> maybe?? */}
      heterogeneousWells: boolean
      <Field
        field="footprintXDimension"
        label="Length"
        formState={formState}
        formDispatch={formDispatch}
      />
      <Field
        field="footprintYDimension"
        label="Width"
        formState={formState}
        formDispatch={formDispatch}
      />
      <Field
        field="labwareZDimension"
        label="Height"
        formState={formState}
        formDispatch={formDispatch}
      />
      <Field
        field="gridRows"
        label="# of rows"
        formState={formState}
        formDispatch={formDispatch}
      />
      irregularRowSpacing: boolean
      <Field
        field="gridColumns"
        label="# of columns"
        formState={formState}
        formDispatch={formDispatch}
      />
      irregularColumnSpacing: boolean
      {/* PAGE 2 */}
      <Field
        field="wellVolume"
        label="Volume"
        formState={formState}
        formDispatch={formDispatch}
      />
      wellShape: 'circular' | 'rectangular'
      <Field
        field="wellDiameter"
        label="Diameter"
        formState={formState}
        formDispatch={formDispatch}
      />
      <Field
        field="wellXDimension"
        label="Well X"
        formState={formState}
        formDispatch={formDispatch}
      />
      <Field
        field="wellYDimension"
        label="Well Y"
        formState={formState}
        formDispatch={formDispatch}
      />
      wellBottomShape: 'flat' | 'round' | 'v'
      <Field
        field="wellDepth"
        label="Depth"
        formState={formState}
        formDispatch={formDispatch}
      />
      <div>SPACING</div>
      <Field
        field="gridSpacingX"
        label="Xs"
        formState={formState}
        formDispatch={formDispatch}
      />
      <Field
        field="gridSpacingY"
        label="Ys"
        formState={formState}
        formDispatch={formDispatch}
      />
      <div>OFFSET</div>
      <Field
        field="gridOffsetX"
        label="Xo"
        formState={formState}
        formDispatch={formDispatch}
      />
      <Field
        field="gridOffsetY"
        label="Yo"
        formState={formState}
        formDispatch={formDispatch}
      />
      {/* PAGE 3 */}
      <Field
        field="brand"
        label="Brand"
        formState={formState}
        formDispatch={formDispatch}
      />
      {'brandId: Array<string>'}
      {/* PAGE 4 */}
      <Field
        field="loadName"
        label="Load Name"
        formState={formState}
        formDispatch={formDispatch}
      />
      <Field
        field="displayName"
        label="Display Name"
        formState={formState}
        formDispatch={formDispatch}
      />
      <div onClick={() => window.alert('TODO not implemented!')}>
        SAVE LABWARE
      </div>
    </div>
  )
}

export default App
