// @flow
import * as React from 'react'
import { Formik, Field, connect } from 'formik'
import * as Yup from 'yup'
import {
  AlertItem,
  DropdownField,
  InputField,
  RadioGroup,
} from '@opentrons/components'
import {
  labwareTypeOptions,
  tubeRackInsertOptions,
  wellBottomShapeOptions,
  wellShapeOptions,
  yesNoOptions,
  X_DIMENSION,
  Y_DIMENSION,
  XY_ALLOWED_VARIANCE,
} from './fields'
import type {
  LabwareFields,
  LabwareType,
  ProcessedLabwareFields,
  ProcessedLabwareCommonFields,
  ProcessedLabwareTypeFields,
  WellShape,
  WellBottomShape,
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

// TODO: add decimal-point constraint where needed (Yup.mixed.test ?)
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
    .min(X_DIMENSION - XY_ALLOWED_VARIANCE)
    .max(X_DIMENSION + XY_ALLOWED_VARIANCE)
    .required(),
  footprintYDimension: Yup.number()
    .min(Y_DIMENSION - XY_ALLOWED_VARIANCE)
    .max(Y_DIMENSION + XY_ALLOWED_VARIANCE)
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

// TODO: Make this DRY, don't require fields (in children) and also fieldList.
type SectionProps = {|
  label: string,
  fieldList: Array<$Keys<LabwareFields>>,
  children?: React.Node,
  formik?: any, // TODO IMMEDIATELY type this
|}
const Section = connect((props: SectionProps) => {
  const dirtyFieldNames = props.fieldList.filter(
    name => props.formik?.touched?.[name]
  )
  const allErrors = dirtyFieldNames.map(name => {
    const errors: ?string = props.formik?.errors?.[name]
    if (errors != null) {
      return <AlertItem key={name} type="warning" title={errors} />
    }
    return null
  })
  return (
    <div>
      <h2>{props.label}</h2>
      <div>{allErrors}</div>
      {props.children}
    </div>
  )
})

// TODO IMMEDIATELY: Yup is sufficient for this, right? Is it OK to leave Maybe's instead of enum-branching, and handling that
// (for flow only, should not happen at runtime) in the fieldsToLabware fn?
//
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

type HeightImgProps = {|
  labwareType: ?LabwareType,
  aluminumBlockChildLabwareType: ?string,
|}

const HeightImg = (props: HeightImgProps) => {
  const { labwareType, aluminumBlockChildLabwareType } = props
  let src = require('./images/height_plate-and-reservoir.svg')
  if (labwareType === 'tubeRack') {
    src = require('./images/height_tubeRack.svg')
  } else if (labwareType === 'aluminumBlock') {
    if (aluminumBlockChildLabwareType === 'tubeRack') {
      // TODO IMMEDIATELY it's not going to literally equal 'tubeRack' right??
      src = require('./images/height_aluminumBlock_tubes.svg')
    } else if (aluminumBlockChildLabwareType === 'wellPlate') {
      // TODO IMMEDIATELY it's not going to literally equal 'wellPlate' right??
      src = require('./images/height_aluminumBlock_plate.svg')
    }
  }
  return src != null ? <img src={src} /> : null
}

const WellXYImg = (props: {| wellShape: WellShape |}) => {
  const { wellShape } = props
  let src
  if (wellShape === 'circular') {
    src = require('./images/wellXY_circular.svg')
  }
  if (wellShape === 'rectangular') {
    src = require('./images/wellXY_rectangular.svg')
  }
  return src != null ? <img src={src} /> : null
}

const XYSpacingImg = (props: {|
  labwareType: ?LabwareType,
  wellShape: ?WellShape,
  gridRows: ?number,
|}) => {
  const { labwareType, wellShape, gridRows } = props
  // default to this
  let src = require('./images/spacing_plate_circular.svg')

  if (labwareType === 'reservoir') {
    if (gridRows != null && gridRows > 1) {
      src = require('./images/spacing_reservoir_multirow.svg')
    } else {
      src = require('./images/spacing_reservoir_1row.svg')
    }
  } else {
    if (wellShape === 'rectangular') {
      src = require('./images/spacing_plate_rectangular.svg')
    }
  }
  return <img src={src} />
}

type DepthImgProps = {|
  labwareType: ?LabwareType,
  wellBottomShape: ?WellBottomShape,
|}
const DepthImg = (props: DepthImgProps) => {
  const { labwareType, wellBottomShape } = props
  let src

  if (wellBottomShape == null) return null

  if (labwareType === 'wellPlate') {
    const imgMap = {
      v: require('./images/depth_plate_v.svg'),
      flat: require('./images/depth_plate_flat.svg'),
      round: require('./images/depth_plate_round.svg'),
    }
    src = imgMap[wellBottomShape]
  } else if (labwareType === 'reservoir' || labwareType === 'tubeRack') {
    const imgMap = {
      v: require('./images/depth_reservoir-and-tubes_v.svg'),
      flat: require('./images/depth_reservoir-and-tubes_flat.svg'),
      round: require('./images/depth_reservoir-and-tubes_round.svg'),
    }
    src = imgMap[wellBottomShape]
  }

  return src != null ? <img src={src} /> : null
}

const XYOffsetImg = (props: {|
  labwareType: ?LabwareType,
  wellShape: ?WellShape,
|}) => {
  const { labwareType, wellShape } = props
  let src = require('./images/offset_plate_circular.svg')
  if (labwareType === 'reservoir') {
    src = require('./images/offset_reservoir.svg')
  } else if (wellShape === 'rectangular') {
    src = require('./images/offset_plate_rectangular.svg')
  }
  return <img src={src} />
}

const HeightGuidingText = (props: {| labwareType: ?LabwareType |}) => {
  const { labwareType } = props
  const footer = (
    <p>
      The height measurement informs the robot of the top and bottom of your
      labware.
    </p>
  )
  if (labwareType === 'tubeRack') {
    return (
      <>
        <p>Place your tubes inside the rack.</p>
        <p>
          Reference{' '}
          <strong>from the top of the tube to bottom of the rack.</strong>{' '}
          Include any well lip. Exclude any cover or cap.
        </p>
        {footer}
      </>
    )
  }
  if (labwareType === 'aluminumBlock') {
    return (
      <>
        <p>Put your labware on top of the aluminum block.</p>
        <p>
          Reference{' '}
          <strong>
            form the top of your labware to the bottom of the block.
          </strong>{' '}
          Include any well or tube lip. Exclude any cover or cap.
        </p>
        {footer}
      </>
    )
  }
  return (
    <>
      <p>
        'Include any well lip in the measurement. Exclude any cover or cap.'
      </p>
      {footer}
    </>
  )
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
        <Section
          label="Create a new definition"
          fieldList={[
            'labwareType',
            'tubeRackInsertLoadName',
            'aluminumBlockType',
            'aluminumBlockChildLabwareType',
          ]}
        >
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
        </Section>
        {/* PAGE 1 - Labware */}
        <Section label="Regularity" fieldList={['heterogeneousWells']}>
          {/* tubeRackSides: Array<string> maybe?? */}
          <RadioField
            name="heterogeneousWells"
            label="Are your wells the same shape and size?"
            options={yesNoOptions}
          />
        </Section>
        <Section
          label="Footprint"
          fieldList={['footprintXDimension', 'footprintYDimension']}
        >
          <div>
            <p>Ensure measurement is taken from the very bottom of plate.</p>
            <p>
              The footprint measurement helps determine if the labware fits
              firmly into the slots on the OT-2 deck.
            </p>
          </div>
          <img src={require('./images/footprint.svg')} />
          <TextField name="footprintXDimension" label="Length" units="mm" />
          <TextField name="footprintYDimension" label="Width" units="mm" />
        </Section>
        <Section
          label={
            ['aluminumBlock', 'tubeRack'].includes(values.labwareType)
              ? 'Total Height'
              : 'Height'
          }
          fieldList={['labwareZDimension']}
        >
          <div>
            <HeightGuidingText labwareType={values.labwareType} />
          </div>
          <HeightImg
            labwareType={values.labwareType}
            aluminumBlockChildLabwareType={values.aluminumBlockChildLabwareType}
          />
          <TextField name="labwareZDimension" label="Height" />
        </Section>
        <Section
          label="Grid"
          fieldList={[
            'gridRows',
            'gridColumns',
            'irregularRowSpacing',
            'irregularColumnSpacing',
          ]}
        >
          <div>
            <p>Check that the grid roughly resembles your labware.</p>
            <p>
              Spacing and well dimensions will be adjusted in the next section.
            </p>
          </div>
          <img src={require('./images/offset_helpText.svg')} />
          <XYOffsetImg
            labwareType={values.labwareType}
            wellShape={values.wellShape}
          />
          <TextField name="gridRows" label="Number of rows" />
          <RadioField
            name="irregularRowSpacing"
            label="Are all of your rows evenly spaced?"
            options={yesNoOptions}
          />
          <TextField name="gridColumns" label="Number of columns" />
          <RadioField
            name="irregularColumnSpacing"
            label="Are all of your columns evenly spaced?"
            options={yesNoOptions}
          />
        </Section>
        {/* PAGE 2 */}
        <Section label="Well/Tube Volume" fieldList={['wellVolume']}>
          <div>
            <p>Total maximum volume of each well.</p>
          </div>
          <TextField name="wellVolume" label="Max volume per well" />
        </Section>
        <Section
          label="Well Shape"
          fieldList={[
            'wellShape',
            'wellDiameter',
            'wellXDimension',
            'wellYDimension',
          ]}
        >
          <div>
            <p>
              Reference measurement from the <strong>inside</strong> of the
              well. Ignore any lip.
            </p>
            <p>This helps the robot locate the sides of the well.</p>
          </div>
          <WellXYImg wellShape={values.wellShape} />
          <RadioField
            name="wellShape"
            label="Well shape"
            options={wellShapeOptions}
          />
          <TextField name="wellDiameter" label="Diameter" />
          <TextField name="wellXDimension" label="Well X" />
          <TextField name="wellYDimension" label="Well Y" />
        </Section>
        <Section
          label="Bottom & Depth"
          fieldList={['wellBottomShape', 'wellDepth']}
        >
          <div>
            <p>
              Reference the measurement from the top of the well (include any
              lip but exclude any cap) to the bottom of the{' '}
              <strong>inside</strong> of the{' '}
              {values.labwareType === 'tubeRack'
                ? 'tube'
                : 'well' /* TODO: also use 'tube' with aluminum block that has tube */}
              .
            </p>

            <p>Depth informs the robot how far down it can go inside a well.</p>
          </div>
          <DepthImg
            labwareType={values.labwareType}
            wellBottomShape={values.wellBottomShape}
          />
          <Dropdown
            name="wellBottomShape"
            label="Bottom shape"
            options={wellBottomShapeOptions}
          />
          <TextField name="wellDepth" label="Depth" />
        </Section>
        <Section label="Spacing" fieldList={['gridSpacingX', 'gridSpacingY']}>
          <div>
            <p>
              Spacing is between the <strong>center</strong> of wells.
            </p>
            <p>
              Well spacing measurements inform the robot how far away rows and
              columns are from each other.
            </p>
          </div>
          <XYSpacingImg
            labwareType={values.labwareType}
            wellShape={values.wellShape}
            gridRows={values.gridRows}
          />
          <TextField name="gridSpacingX" label="X Spacing (Xs)" />
          <TextField name="gridSpacingY" label="Y Spacing (Ys)" />
        </Section>
        <Section label="Offset" fieldList={['gridOffsetX', 'gridOffsetY']}>
          <div>
            <p>
              Find the measurement from the center of{' '}
              <strong>
                {values.labwareType === 'reservoir'
                  ? 'the top left-most well'
                  : 'well A1'}
              </strong>{' '}
              to the edge of the labware{"'"}s footprint.
            </p>
            <p>
              Corner offset informs the robot how far the grid of wells is from
              the slot{"'"}s top left corner.
            </p>
          </div>
          <TextField name="gridOffsetX" label="X Offset (Xo)" />
          <TextField name="gridOffsetY" label="Y Offset (Yo)" />
        </Section>

        {/* TODO: is this a Section with no fields??? */}
        <div>
          <p>
            Check that the size, spacing, and shape of your wells looks correct.
          </p>
        </div>

        {/* PAGE 3 */}
        <Section label="Description" fieldList={['brand']}>
          <TextField name="brand" label="Brand" />
          {'brandId: Array<string> (TODO!!!)'}
        </Section>
        {/* PAGE 4 */}
        <Section label="File" fieldList={['loadName', 'displayName']}>
          <TextField name="loadName" label="Load Name" />
          <TextField name="displayName" label="Display Name" />
        </Section>
        <div>
          <div onClick={handleSubmit}>SAVE LABWARE</div>
        </div>
      </div>
    )}
  </Formik>
)

export default App
