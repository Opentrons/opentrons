// @flow
import * as React from 'react'
import { DropdownField, InputField, RadioGroup } from '@opentrons/components'
import {
  labwareTypeOptions,
  tubeRackInsertOptions,
  wellBottomShapeOptions,
  wellShapeOptions,
  yesNoOptions,
  type LabwareFields,
  type ProcessedLabwareFields,
  type ProcessedLabwareCommonFields,
  type ProcessedLabwareTypeFields,
} from '../fields'
import fieldsToLabware from '../fieldsToLabware'

const getDefaultFormState = (): LabwareFields => ({
  labwareType: null,
  tubeRackInsertLoadName: null,
  aluminumBlockType: null,
  aluminumBlockChildLabwareType: null,

  tubeRackSides: [],
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
    value: $Values<LabwareFields>,
  |},
|}

// NOTE: this will be an enum of all actions handled by formReducer
type FormAction = UpdateFieldAction

const formReducer = (
  state: LabwareFields,
  action: FormAction
): LabwareFields => {
  console.debug({ action })

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
  const [fieldState, setFieldState] = React.useState<$Values<LabwareFields>>(
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
      value={Array.isArray(fieldState) ? fieldState.join(', ') : fieldState}
    />
  )
}

// TODO IMMEDIATELY: needs to support images, use react-select
type DropdownProps = {
  formDispatch: FormAction => mixed,
  formState: LabwareFields,
  field: $Keys<LabwareFields>,
  options: Array<Object>, // Array<{| name: string, value: string, image?: string |}>, // TODO IMMEDIATELY
  label?: string,
}
const Dropdown = (props: DropdownProps) => {
  const fieldState = props.formState[props.field]
  if (fieldState != null && typeof fieldState !== 'string') {
    console.error(
      `Tried to pass non ?string value to option field ${props.field}`,
      fieldState
    )
    return null
  }
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

type RadioFieldProps = {
  formDispatch: FormAction => mixed,
  formState: LabwareFields,
  field: $Keys<LabwareFields>,
  options: Array<{ name: string, value: string, children?: React.Node }>,
  label?: string,
}
const RadioField = (props: RadioFieldProps) => {
  const fieldState = props.formState[props.field]
  if (fieldState != null && typeof fieldState !== 'string') {
    console.error(
      `Tried to pass non ?string value to option field ${props.field}`,
      fieldState
    )
    return null
  }
  // TODO make action creator
  return (
    <div>
      <strong>{props.label}</strong>
      <RadioGroup
        onChange={e =>
          props.formDispatch({
            type: UPDATE_LABWARE_FORM_FIELD,
            payload: { field: props.field, value: e.currentTarget.value },
          })
        }
        options={props.options}
        value={fieldState == null ? undefined : fieldState}
      />
    </div>
  )
}

// For a LabwareFields object that has already been actually validated, cast it into ProcessedLabwareFields.
// This fn should NEVER return null in production, the Maybe is just an escape hatch for Flow
const processValidForm = (fields: LabwareFields): ?ProcessedLabwareFields => {
  const {
    wellBottomShape,
    brand,
    loadName,
    displayName,
    labwareType,
    aluminumBlockType,
    aluminumBlockChildLabwareType,
    tubeRackInsertLoadName,
    tubeRackSides,
  } = fields
  if (
    wellBottomShape == null ||
    brand == null ||
    loadName == null ||
    displayName == null ||
    labwareType == null
  ) {
    console.error('Got a nullsy required field! This should not happen', fields)
    return null
  }
  const commonFields: ProcessedLabwareCommonFields = {
    footprintXDimension: Number(fields.footprintXDimension),
    footprintYDimension: Number(fields.footprintYDimension),
    labwareZDimension: Number(fields.labwareZDimension),

    gridRows: Number(fields.gridRows),
    gridColumns: Number(fields.gridColumns),
    gridSpacingX: Number(fields.gridSpacingX),
    gridSpacingY: Number(fields.gridSpacingY),
    gridOffsetX: Number(fields.gridOffsetX),
    gridOffsetY: Number(fields.gridOffsetY),

    // NOTE: these fields don't *really* need to be here after processing, but might be useful down the road?
    heterogeneousWells: fields.heterogeneousWells === 'true',
    irregularRowSpacing: fields.irregularRowSpacing === 'true',
    irregularColumnSpacing: fields.irregularColumnSpacing === 'true',

    wellVolume: Number(fields.wellVolume),
    wellBottomShape,
    wellDepth: Number(fields.wellDepth),

    brand,
    brandId: fields.brandId,

    loadName,
    displayName,
  }

  const wellShapeFields =
    fields.wellShape === 'circular'
      ? {
          wellShape: 'circular',
          wellDiameter: Number(fields.wellDiameter),
        }
      : {
          wellShape: 'rectangular',
          wellXDimension: Number(fields.wellXDimension),
          wellYDimension: Number(fields.wellYDimension),
        }

  let labwareTypeFields: ?ProcessedLabwareTypeFields = null
  if (labwareType === 'aluminumBlock') {
    if (aluminumBlockChildLabwareType == null) {
      console.error('aluminumBlockChildLabwareType should not be nullsy')
      return null
    }
    labwareTypeFields = {
      labwareType: 'aluminumBlock',
      aluminumBlockType,
      aluminumBlockChildLabwareType,
    }
  } else if (labwareType === 'tubeRack') {
    if (tubeRackInsertLoadName == null) {
      console.error('aluminumBlockChildLabwareType should not be nullsy')
      return null
    }
    labwareTypeFields = {
      labwareType: 'tubeRack',
      tubeRackInsertLoadName,
      tubeRackSides,
    }
  } else {
    labwareTypeFields = { labwareType }
  }

  return {
    commonFields,
    wellShapeFields,
    labwareTypeFields,
  }
}

const App = () => {
  // TODO: can't make Flow understand useReducer
  const [formState, formDispatch] = React.useReducer<*, *>(
    formReducer,
    getDefaultFormState()
  )

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
        options={tubeRackInsertOptions}
        formState={formState}
        formDispatch={formDispatch}
      />
      <Dropdown
        field="aluminumBlockType"
        label="Which aluminum block"
        options={tubeRackInsertOptions}
        formState={formState}
        formDispatch={formDispatch}
      />
      <Dropdown
        field="aluminumBlockChildLabwareType"
        label="What labware is on top of your 96 well aluminum block"
        options={tubeRackInsertOptions}
        formState={formState}
        formDispatch={formDispatch}
      />
      <div onClick={() => window.alert('TODO not implemented!')}>
        Import File
      </div>
      {/* PAGE 1 - Labware */}
      {/* tubeRackSides: Array<string> maybe?? */}
      <RadioField
        field="heterogeneousWells"
        label="Regularity"
        options={wellShapeOptions}
        formState={formState}
        formDispatch={formDispatch}
      />
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
      <RadioField
        field="irregularRowSpacing"
        label="Row spacing"
        options={yesNoOptions}
        formState={formState}
        formDispatch={formDispatch}
      />
      <Field
        field="gridColumns"
        label="# of columns"
        formState={formState}
        formDispatch={formDispatch}
      />
      <RadioField
        field="irregularColumnSpacing"
        label="Column spacing"
        options={yesNoOptions}
        formState={formState}
        formDispatch={formDispatch}
      />
      {/* PAGE 2 */}
      <Field
        field="wellVolume"
        label="Volume"
        formState={formState}
        formDispatch={formDispatch}
      />
      <RadioField
        field="wellShape"
        label="Well shape"
        options={wellShapeOptions}
        formState={formState}
        formDispatch={formDispatch}
      />
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
      <Dropdown
        field="wellBottomShape"
        label="Bottom shape"
        options={wellBottomShapeOptions}
        formState={formState}
        formDispatch={formDispatch}
      />
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
      {'brandId: Array<string> (TODO!!!)'}
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
      <div
        onClick={() => {
          const validForm = processValidForm(formState)
          if (validForm) {
            console.log(fieldsToLabware(validForm))
          } else {
            console.warn('form not valid!')
          }
        }}
      >
        SAVE LABWARE
      </div>
    </div>
  )
}

export default App
