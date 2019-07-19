// @flow
import * as React from 'react'
import { Formik, Field } from 'formik'
import * as Yup from 'yup'
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
} from './fields'
import fieldsToLabware from './fieldsToLabware'

const getDefaultFormState = (): LabwareFields => ({
  labwareType: null,
  tubeRackInsertLoadName: null,
  aluminumBlockType: null,
  aluminumBlockChildLabwareType: null,

  // tubeRackSides: [],
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

// TODO: DRY this validation schema
const labwareFormSchema = Yup.object().shape({
  labwareType: Yup.string()
    .oneOf(labwareTypeOptions.map(o => o.value))
    .required(),
  tubeRackInsertLoadName: Yup.string().when('labwareType', {
    is: 'tubeRack',
    then: Yup.string().required(),
    otherwise: Yup.string().nullable(),
  }),
  aluminumBlockType: Yup.string().when('labwareType', {
    is: 'aluminumBlock',
    then: Yup.string().required(),
    otherwise: Yup.string().nullable(),
  }),
  aluminumBlockChildLabwareType: Yup.string().when('labwareType', {
    is: 'aluminumBlock',
    then: Yup.string().required(),
    otherwise: Yup.string().nullable(),
  }),

  // tubeRackSides: Array<string>
  footprintXDimension: Yup.number()
    .min(0)
    .required(),
  footprintYDimension: Yup.number()
    .min(0)
    .required(),
  labwareZDimension: Yup.number()
    .min(0)
    .required(),

  gridRows: Yup.number()
    .min(0)
    .integer()
    .required(),
  gridColumns: Yup.number()
    .min(0)
    .integer()
    .required(),
  gridSpacingX: Yup.number()
    .min(0)
    .required(),
  gridSpacingY: Yup.number()
    .min(0)
    .required(),
  gridOffsetX: Yup.number()
    .min(0)
    .required(),
  gridOffsetY: Yup.number()
    .min(0)
    .required(),

  heterogeneousWells: Yup.boolean()
    .oneOf([true], 'heterogeneousWells bad TODO!')
    .required(),
  irregularRowSpacing: Yup.boolean()
    .oneOf([true], 'irregularRowSpacing bad TODO!')
    .required(),
  irregularColumnSpacing: Yup.boolean()
    .oneOf([true], 'irregularColumnSpacing bad TODO!')
    .required(),

  wellVolume: Yup.number()
    .min(0)
    .required(),
  wellBottomShape: Yup.string()
    .oneOf(wellBottomShapeOptions.map(o => o.value))
    .required(),
  wellDepth: Yup.number()
    .min(0)
    .required(),
  wellShape: Yup.string()
    .oneOf(wellShapeOptions.map(o => o.value))
    .required(),

  // used with circular well shape only
  wellDiameter: Yup.number().when('wellShape', {
    is: 'circular',
    then: Yup.number()
      .min(0)
      .required(),
    otherwise: Yup.number().nullable(),
  }),

  // used with rectangular well shape only
  wellXDimension: Yup.number().when('wellShape', {
    is: 'rectangular',
    then: Yup.number()
      .min(0)
      .required(),
    otherwise: Yup.number().nullable(),
  }),
  wellYDimension: Yup.number().when('wellShape', {
    is: 'rectangular',
    then: Yup.number()
      .min(0)
      .required(),
    otherwise: Yup.number().nullable(),
  }),

  brand: Yup.string().required(),
  brandId: Yup.array().of(Yup.string()),

  loadName: Yup.string().required(),
  displayName: Yup.string().required(),
})

type TextFieldProps = {
  name: $Keys<LabwareFields>,
  label?: string,
}
const TextField = (props: TextFieldProps) => (
  <Field name={props.name}>
    {({ field, form }) => <InputField {...field} label={props.label} />}
  </Field>
)

type DropdownProps = {
  name: $Keys<LabwareFields>,
  options: Array<Object>, // Array<{| name: string, value: string, image?: string |}>, // TODO IMMEDIATELY
  label?: string,
}
const Dropdown = (props: DropdownProps) => (
  <div>
    <strong>{props.label}</strong>
    <Field name={props.name}>
      {({ field, form }) => (
        <DropdownField {...field} options={props.options} />
      )}
    </Field>
  </div>
)

type RadioFieldProps = {
  name: $Keys<LabwareFields>,
  options: Array<{ name: string, value: string, children?: React.Node }>,
  label?: string,
}
const RadioField = (props: RadioFieldProps) => (
  <div>
    <strong>{props.label}</strong>
    <Field name={props.name}>
      {({ form, field }) => <RadioGroup {...field} options={props.options} />}
    </Field>
  </div>
)

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
    // tubeRackSides,
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
      // tubeRackSides,
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

const App = () => (
  <Formik
    initialValues={getDefaultFormState()}
    validationSchema={labwareFormSchema}
    onSubmit={(values: LabwareFields) => {
      const castValues = labwareFormSchema.cast(values)
      console.log(
        'your cast form values (they are not used right now!)',
        castValues
      )

      const validForm = processValidForm(values)
      console.log('validForm', validForm)
      if (validForm) {
        console.log('your labware def:', fieldsToLabware(validForm))
      } else {
        console.warn(
          'form not valid! this should not get past Yup validation :('
        )
      }
    }}
  >
    {({ handleSubmit, values, errors }) => (
      <div>
        <h1>Labware Creator</h1>
        <Dropdown
          name="labwareType"
          label="Which labware"
          options={labwareTypeOptions}
        />
        <Dropdown
          name="tubeRackInsertLoadName"
          label="Which tube rack insert"
          options={tubeRackInsertOptions}
        />
        <Dropdown
          name="aluminumBlockType"
          label="Which aluminum block"
          options={tubeRackInsertOptions}
        />
        <Dropdown
          name="aluminumBlockChildLabwareType"
          label="What labware is on top of your 96 well aluminum block"
          options={tubeRackInsertOptions}
        />
        <div onClick={() => window.alert('TODO not implemented!')}>
          Import File
        </div>
        {/* PAGE 1 - Labware */}
        {/* tubeRackSides: Array<string> maybe?? */}
        <RadioField
          name="heterogeneousWells"
          label="Regularity"
          options={yesNoOptions}
        />
        <TextField name="footprintXDimension" label="Length" />
        <TextField name="footprintYDimension" label="Width" />
        <TextField name="labwareZDimension" label="Height" />
        <TextField name="gridRows" label="# of rows" />
        <RadioField
          name="irregularRowSpacing"
          label="Row spacing"
          options={yesNoOptions}
        />
        <TextField name="gridColumns" label="# of columns" />
        <RadioField
          name="irregularColumnSpacing"
          label="Column spacing"
          options={yesNoOptions}
        />
        {/* PAGE 2 */}
        <TextField name="wellVolume" label="Volume" />
        <RadioField
          name="wellShape"
          label="Well shape"
          options={wellShapeOptions}
        />
        <TextField name="wellDiameter" label="Diameter" />
        <TextField name="wellXDimension" label="Well X" />
        <TextField name="wellYDimension" label="Well Y" />
        <Dropdown
          name="wellBottomShape"
          label="Bottom shape"
          options={wellBottomShapeOptions}
        />
        <TextField name="wellDepth" label="Depth" />
        <div>SPACING</div>
        <TextField name="gridSpacingX" label="Xs" />
        <TextField name="gridSpacingY" label="Ys" />
        <div>OFFSET</div>
        <TextField name="gridOffsetX" label="Xo" />
        <TextField name="gridOffsetY" label="Yo" />
        {/* PAGE 3 */}
        <TextField name="brand" label="Brand" />
        {'brandId: Array<string> (TODO!!!)'}
        {/* PAGE 4 */}
        <TextField name="loadName" label="Load Name" />
        <TextField name="displayName" label="Display Name" />
        <div>
          <div onClick={handleSubmit}>SAVE LABWARE</div>
        </div>
      </div>
    )}
  </Formik>
)

export default App
