// @flow
import * as React from 'react'
import { Formik, Field, connect } from 'formik'
import * as Yup from 'yup'
import cloneDeep from 'lodash/cloneDeep'
import mapValues from 'lodash/mapValues'
import { saveAs } from 'file-saver'
import {
  AlertItem,
  AlertModal,
  DropdownField,
  PrimaryButton,
  InputField,
  RadioGroup,
  LabwareRender,
  RobotWorkSpace,
} from '@opentrons/components'
import { makeMaskToDecimal, maskToInteger, maskLoadName } from './fieldMasks'
import {
  labwareTypeOptions,
  tubeRackInsertOptions,
  aluminumBlockTypeOptions,
  aluminumBlockChildTypeOptions,
  wellBottomShapeOptions,
  wellShapeOptions,
  yesNoOptions,
  tubeRackAutofills,
  X_DIMENSION,
  Y_DIMENSION,
  XY_ALLOWED_VARIANCE,
} from './fields'
import fieldsToLabware from './fieldsToLabware'
import styles from './styles.css'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type {
  LabwareFields,
  LabwareType,
  ProcessedLabwareFields,
  WellShape,
  WellBottomShape,
} from './fields'

const maskTo2Decimal = makeMaskToDecimal(2)

const getDefaultFormState = (): LabwareFields => ({
  labwareType: null,
  tubeRackInsertLoadName: null,
  aluminumBlockType: null,
  aluminumBlockChildType: null,

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

const LABELS: { [$Keys<LabwareFields>]: string } = {
  labwareType: 'What type of labware are you creating?',
  tubeRackInsertLoadName: 'Which tube rack insert?',
  aluminumBlockType: 'Which aluminum block?',
  aluminumBlockChildType: 'What labware is on top of your aluminum block?',
  heterogeneousWells: 'Are all your wells the same shape and size?',
  footprintXDimension: 'Length',
  footprintYDimension: 'Width',
  labwareZDimension: 'Height',
  gridRows: 'Number of rows',
  gridColumns: 'Number of columns',
  irregularRowSpacing: 'Are all of your rows evenly spaced?',
  irregularColumnSpacing: 'Are all of your columns evenly spaced?',
  wellVolume: 'Max volume per well',
  wellShape: 'Well shape',
  wellDiameter: 'Diameter',
  wellXDimension: 'Well X',
  wellYDimension: 'Well Y',
  wellBottomShape: 'Bottom shape',
  wellDepth: 'Depth',
  gridSpacingX: 'X Spacing (Xs)',
  gridSpacingY: 'Y Spacing (Ys)',
  gridOffsetX: 'X Offset (Xo)',
  gridOffsetY: 'Y Offset (Yo)',
  brand: 'Brand',
  displayName: "Display Name ('File name' ??? TODO)",
  loadName: 'API Load Name',
}

const REQUIRED_FIELD = '${label} is required' // eslint-disable-line no-template-curly-in-string
const requiredString = (label: string) =>
  Yup.string()
    .label(label)
    .typeError(REQUIRED_FIELD)
    .required()
const MUST_BE_A_NUMBER = '${label} must be a number' // eslint-disable-line no-template-curly-in-string

// TODO: add decimal-point constraint where needed (Yup.mixed.test ?)
const requiredPositiveNumber = (label: string) =>
  Yup.number()
    .label(label)
    .typeError(MUST_BE_A_NUMBER)
    .moreThan(0)
    .required()

const requiredPositiveInteger = (label: string) =>
  Yup.number()
    .label(label)
    .typeError(MUST_BE_A_NUMBER)
    .moreThan(0)
    .integer()
    .required()

const aluminumBlockRequiredString = (label: string) =>
  Yup.mixed().when('labwareType', {
    is: 'aluminumBlock',
    then: requiredString(label),
    otherwise: Yup.mixed().nullable(),
  })

const unsupportedLabwareIfFalse = (label: string) =>
  Yup.boolean()
    .label(label)
    .typeError(REQUIRED_FIELD)
    .oneOf([true], 'TODO! Text here')
    .required()

const labwareFormSchema = Yup.object().shape({
  labwareType: requiredString(LABELS.labwareType).oneOf(
    labwareTypeOptions.map(o => o.value)
  ),
  tubeRackInsertLoadName: Yup.mixed().when('labwareType', {
    is: 'tubeRack',
    then: requiredString(LABELS.tubeRackInsertLoadName),
    otherwise: Yup.mixed().nullable(),
  }),
  aluminumBlockType: aluminumBlockRequiredString(LABELS.aluminumBlockType),
  aluminumBlockChildType: aluminumBlockRequiredString(
    LABELS.aluminumBlockChildType
  ),

  // tubeRackSides: Array<string>
  footprintXDimension: Yup.number()
    .label(LABELS.footprintXDimension)
    .typeError(MUST_BE_A_NUMBER)
    .min(X_DIMENSION - XY_ALLOWED_VARIANCE)
    .max(X_DIMENSION + XY_ALLOWED_VARIANCE)
    .required(),
  footprintYDimension: Yup.number()
    .label(LABELS.footprintYDimension)
    .typeError(MUST_BE_A_NUMBER)
    .min(Y_DIMENSION - XY_ALLOWED_VARIANCE)
    .max(Y_DIMENSION + XY_ALLOWED_VARIANCE)
    .required(),
  labwareZDimension: requiredPositiveNumber(LABELS.labwareZDimension),

  gridRows: requiredPositiveInteger(LABELS.gridRows),
  gridColumns: requiredPositiveInteger(LABELS.gridColumns),
  gridSpacingX: requiredPositiveNumber(LABELS.gridSpacingX),
  gridSpacingY: requiredPositiveNumber(LABELS.gridSpacingY),
  gridOffsetX: requiredPositiveNumber(LABELS.gridOffsetX),
  gridOffsetY: requiredPositiveNumber(LABELS.gridOffsetY),

  heterogeneousWells: unsupportedLabwareIfFalse(LABELS.heterogeneousWells),
  irregularRowSpacing: unsupportedLabwareIfFalse(LABELS.irregularRowSpacing),
  irregularColumnSpacing: unsupportedLabwareIfFalse(
    LABELS.irregularColumnSpacing
  ),

  wellVolume: requiredPositiveNumber(LABELS.wellVolume),
  wellBottomShape: requiredString(LABELS.wellBottomShape).oneOf(
    wellBottomShapeOptions.map(o => o.value)
  ),
  wellDepth: Yup.number()
    .label(LABELS.wellDepth)
    .typeError(MUST_BE_A_NUMBER)
    .moreThan(0)
    .max(
      Yup.ref('labwareZDimension'),
      'Well depth cannot exceed labware height'
    )
    .required(),
  wellShape: requiredString(LABELS.wellShape).oneOf(
    wellShapeOptions.map(o => o.value)
  ),

  // used with circular well shape only
  wellDiameter: Yup.mixed().when('wellShape', {
    is: 'circular',
    then: requiredPositiveNumber(LABELS.wellDiameter),
    otherwise: Yup.mixed().nullable(),
  }),

  // used with rectangular well shape only
  wellXDimension: Yup.mixed().when('wellShape', {
    is: 'rectangular',
    then: requiredPositiveNumber(LABELS.wellXDimension),
    otherwise: Yup.mixed().nullable(),
  }),
  wellYDimension: Yup.mixed().when('wellShape', {
    is: 'rectangular',
    then: requiredPositiveNumber(LABELS.wellYDimension),
    otherwise: Yup.mixed().nullable(),
  }),

  brand: requiredString(LABELS.brand),
  brandId: Yup.array().of(Yup.string()),

  loadName: requiredString(LABELS.loadName).matches(
    /^[a-z0-9._]+$/,
    '${label} can only contain lowercase letters, numbers, dot (.) and underscore (_). Spaces are not allowed.' // eslint-disable-line no-template-curly-in-string
  ),
  displayName: requiredString(LABELS.displayName),
})

type MakeAutofillOnChangeArgs = {|
  name: $Keys<LabwareFields>,
  autofills: { [string]: $Shape<LabwareFields> },
  values: LabwareFields,
  touched: Object,
  setValues: Object => mixed,
  setTouched: Object => mixed,
|}
const makeAutofillOnChange = ({
  name,
  autofills,
  values,
  touched,
  setValues,
  setTouched,
}: MakeAutofillOnChangeArgs) => (e: SyntheticEvent<HTMLSelectElement>) => {
  const value = e.currentTarget.value
  const autofillValues = autofills[value]
  if (autofillValues) {
    setValues({
      ...values,
      ...autofillValues,
      [name]: value,
    })
    setTouched({
      ...touched,
      ...mapValues(autofillValues, () => true),
    })
  } else {
    console.error(
      `expected autofills for ${name}: ${value} -- is the value missing from the autofills object?`
    )
  }
}

type TextFieldProps = {|
  name: $Keys<LabwareFields>,
  units?: $PropertyType<React.ElementProps<typeof InputField>, 'units'>,
  inputMasks?: Array<(prevValue: string, update: string) => string>,
|}
const TextField = (props: TextFieldProps) => {
  const { name, units } = props
  const inputMasks = props.inputMasks || []
  const makeHandleChange = ({ field, form }) => (
    e: SyntheticEvent<HTMLInputElement>
  ) => {
    const prevValue = field.value
    const rawValue = e.currentTarget.value
    const nextValue = inputMasks.reduce(
      (acc, maskFn) => maskFn(prevValue, acc),
      rawValue
    )
    form.setFieldValue(props.name, nextValue)
  }
  return (
    <div className={styles.field_wrapper}>
      <div className={styles.field_label}>{LABELS[name]}</div>
      <Field name={props.name}>
        {({ field, form }) => (
          <InputField
            {...field}
            onChange={makeHandleChange({ field, form })}
            units={units}
          />
        )}
      </Field>
    </div>
  )
}

type DropdownProps = {|
  name: $Keys<LabwareFields>,
  options: Array<Object>, // Array<{| name: string, value: string, image?: string |}>, // TODO IMMEDIATELY
  /** optionally override Formik Field's field.onChange */
  onChange?: (e: SyntheticEvent<HTMLSelectElement>) => mixed,
|}
const Dropdown = (props: DropdownProps) => (
  <div className={styles.field_wrapper}>
    <div className={styles.field_label}>{LABELS[props.name]}</div>
    <Field name={props.name}>
      {({ field, form }) => (
        <DropdownField
          {...field}
          onChange={props.onChange || field.onChange}
          options={props.options}
        />
      )}
    </Field>
  </div>
)

type RadioFieldProps = {|
  name: $Keys<LabwareFields>,
  options: Array<{ name: string, value: string, children?: React.Node }>,
|}
const RadioField = (props: RadioFieldProps) => (
  <div className={styles.field_wrapper}>
    <div className={styles.field_label}>{LABELS[props.name]}</div>
    <Field name={props.name}>
      {({ form, field }) => (
        <RadioGroup
          {...field}
          onChange={e => {
            field.onChange(e)
            // do not wait until blur to make radio field 'dirty'
            field.onBlur(e)
          }}
          options={props.options}
          inline
        />
      )}
    </Field>
  </div>
)

// TODO: Make this DRY, don't require fields (in children) and also fieldList.
type SectionProps = {|
  label: string,
  fieldList?: Array<$Keys<LabwareFields>>,
  children?: React.Node,
  formik?: any, // TODO IMMEDIATELY type this??
|}
const Section = connect((props: SectionProps) => {
  const fieldList = props.fieldList || []
  const dirtyFieldNames = fieldList.filter(
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
    <div className={styles.section_wrapper}>
      <h2 className={styles.section_header}>{props.label}</h2>
      <div>{allErrors}</div>
      {props.children}
    </div>
  )
})

type HeightImgProps = {|
  labwareType: ?LabwareType,
  aluminumBlockChildType: ?string,
|}

const HeightImg = (props: HeightImgProps) => {
  const { labwareType, aluminumBlockChildType } = props
  let src = require('./images/height_plate-and-reservoir.svg')
  if (labwareType === 'tubeRack') {
    src = require('./images/height_tubeRack.svg')
  } else if (labwareType === 'aluminumBlock') {
    if (aluminumBlockChildType === 'tubeRack') {
      // TODO IMMEDIATELY it's not going to literally equal 'tubeRack' right??
      src = require('./images/height_aluminumBlock_tubes.svg')
    } else if (aluminumBlockChildType === 'wellPlate') {
      // TODO IMMEDIATELY it's not going to literally equal 'wellPlate' right??
      src = require('./images/height_aluminumBlock_plate.svg')
    }
  }
  return <img src={src} />
}

const WellXYImg = (props: {| wellShape: WellShape |}) => {
  const { wellShape } = props
  let src = require('./images/wellXY_circular.svg')
  if (wellShape === 'rectangular') {
    src = require('./images/wellXY_rectangular.svg')
  }
  return <img src={src} />
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
  const defaultSrc = require('./images/depth_plate_flat.svg')
  let src

  if (!wellBottomShape) return <img src={defaultSrc} />

  if (labwareType === 'reservoir' || labwareType === 'tubeRack') {
    const imgMap = {
      v: require('./images/depth_reservoir-and-tubes_v.svg'),
      flat: require('./images/depth_reservoir-and-tubes_flat.svg'),
      round: require('./images/depth_reservoir-and-tubes_round.svg'),
    }
    src = imgMap[wellBottomShape]
  } else {
    const imgMap = {
      v: require('./images/depth_plate_v.svg'),
      flat: require('./images/depth_plate_flat.svg'),
      round: require('./images/depth_plate_round.svg'),
    }
    src = imgMap[wellBottomShape]
  }

  return <img src={src != null ? src : defaultSrc} />
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
      <p>Include any well lip in the measurement. Exclude any cover or cap.</p>
      {footer}
    </>
  )
}

// TODO IMMEDIATELY this is copied from PD, make it a component library component??
function SingleLabware(props: {| definition: LabwareDefinition2 |}) {
  return (
    <RobotWorkSpace
      viewBox={`0 0 ${props.definition.dimensions.xDimension} ${
        props.definition.dimensions.yDimension
      }`}
    >
      {() => <LabwareRender {...props} />}
    </RobotWorkSpace>
  )
}

type ConditionalLabwareRenderProps = {|
  values: LabwareFields,
|}

const ConditionalLabwareRender = (props: ConditionalLabwareRenderProps) => {
  const definition = React.useMemo(() => {
    const values = cloneDeep(props.values)

    // Fill arbitrary values in to any missing fields that aren't needed for this render,
    // eg some required definition data like well volume, height, and bottom shape don't affect the render.
    values.footprintXDimension = values.footprintXDimension || `${X_DIMENSION}`
    values.footprintYDimension = values.footprintYDimension || `${Y_DIMENSION}`
    values.labwareZDimension = values.wellDepth || '100'
    values.wellDepth = values.wellDepth || '80'
    values.wellVolume = values.wellVolume || '50'
    values.wellBottomShape = values.wellBottomShape || 'flat'
    values.labwareType = values.labwareType || 'wellPlate'

    values.displayName = values.displayName || 'Some Labware'
    values.loadName = values.loadName || 'some_labware'
    values.brand = values.brand || 'somebrand'
    // A few other fields don't even go into the definition (eg "is row spacing uniform" etc).
    values.heterogeneousWells = 'true'
    values.irregularRowSpacing = 'true'
    values.irregularColumnSpacing = 'true'

    let castValues: ?ProcessedLabwareFields = null
    try {
      castValues = labwareFormSchema.cast(values)
    } catch (error) {}
    console.log('yup output inside conditional labware', castValues)
    if (castValues === null) {
      return null
    }

    let def = null
    if (castValues) {
      def = fieldsToLabware(castValues)
    } else {
      console.log('invalid, no def for conditional render')
    }
    return def
  }, [props.values])

  const errorComponent = 'Cannot render labware, invalid inputs' // TODO get SVG for no-definition
  return definition ? <SingleLabware definition={definition} /> : errorComponent
}

type LinkOutProps = {|
  href: string,
  className?: ?string,
  children?: React.Node,
|}
const LinkOut = (props: LinkOutProps) => (
  <a
    className={props.className}
    href={props.href}
    target="_blank"
    rel="noopener noreferrer"
  >
    {props.children}
  </a>
)

const IntroCopy = () => (
  <>
    <p>Use this tool if you are creating one of the following:</p>
    <ul>
      <li>
        Well plates and reservoirs which can be made via the labware creator
        (refer to{' '}
        <LinkOut href="https://support.opentrons.com/en/articles/3136504-creating-custom-labware-definitions">
          this guide
        </LinkOut>{' '}
        for more information)
      </li>
      <li>
        Tubes + the{' '}
        <LinkOut href="https://shop.opentrons.com/collections/racks-and-adapters/products/tube-rack-set-1">
          Opentrons tube rack
        </LinkOut>
      </li>
      <li>
        Tubes / plates + the{' '}
        <LinkOut href="https://shop.opentrons.com/collections/racks-and-adapters/products/aluminum-block-set">
          Opentrons aluminum block
        </LinkOut>
      </li>
      <p>
        For all other custom labware, please use this{' '}
        <LinkOut href="https://opentrons-ux.typeform.com/to/xi8h0W">
          request form
        </LinkOut>
      </p>
    </ul>

    <p>
      <strong>Please note:</strong> We strongly recommend you reference
      mechanical drawing to ensure accurate measurements for defining labware,
      only relying on manual measurements to supplement missing information.
    </p>
  </>
)

const App = () => {
  const [
    showExportErrorModal,
    setShowExportErrorModal,
  ] = React.useState<boolean>(false)

  return (
    <div>
      {showExportErrorModal && (
        <AlertModal
          className={styles.export_error_modal}
          heading="Cannot export file"
          onCloseClick={() => setShowExportErrorModal(false)}
          buttons={[
            {
              onClick: () => setShowExportErrorModal(false),
              children: 'close',
            },
          ]}
        >
          Please resolve all invalid fields in order to export the labware
          definition
        </AlertModal>
      )}
      <Formik
        initialValues={getDefaultFormState()}
        validationSchema={labwareFormSchema}
        onSubmit={(values: LabwareFields) => {
          const castValues: ProcessedLabwareFields = labwareFormSchema.cast(
            values
          )
          const def = fieldsToLabware(castValues)
          const blob = new Blob([JSON.stringify(def, null, 4)], {
            type: 'application/json',
          })
          saveAs(blob, castValues.displayName)
        }}
      >
        {({
          handleSubmit,
          values,
          isValid,
          errors,
          touched,
          setValues,
          setTouched,
        }) => (
          <div className={styles.labware_creator}>
            <h2>Custom Labware Creator</h2>
            <IntroCopy />
            <Section
              label="Labware Type"
              fieldList={[
                'labwareType',
                'tubeRackInsertLoadName',
                'aluminumBlockType',
                'aluminumBlockChildType',
              ]}
            >
              <Dropdown name="labwareType" options={labwareTypeOptions} />
              {values.labwareType === 'tubeRack' && (
                <Dropdown
                  name="tubeRackInsertLoadName"
                  options={tubeRackInsertOptions}
                  onChange={makeAutofillOnChange({
                    name: 'tubeRackInsertLoadName',
                    autofills: tubeRackAutofills,
                    values,
                    touched,
                    setValues,
                    setTouched,
                  })}
                />
              )}
              {values.labwareType === 'aluminumBlock' && (
                <>
                  <Dropdown
                    name="aluminumBlockType"
                    options={aluminumBlockTypeOptions}
                  />
                  <Dropdown
                    name="aluminumBlockChildType"
                    options={aluminumBlockChildTypeOptions}
                  />
                </>
              )}
            </Section>
            {/* PAGE 1 - Labware */}
            <Section label="Regularity" fieldList={['heterogeneousWells']}>
              {/* tubeRackSides: Array<string> maybe?? */}
              <RadioField name="heterogeneousWells" options={yesNoOptions} />
            </Section>
            <Section
              label="Footprint"
              fieldList={['footprintXDimension', 'footprintYDimension']}
            >
              <div>
                <p>
                  Ensure measurement is taken from the{' '}
                  <strong>very bottom</strong> of plate.
                </p>
                <p>
                  The footprint measurement helps determine if the labware fits
                  firmly into the slots on the OT-2 deck.
                </p>
              </div>
              <img src={require('./images/footprint.svg')} />
              <TextField
                name="footprintXDimension"
                inputMasks={[maskTo2Decimal]}
                units="mm"
              />
              <TextField
                name="footprintYDimension"
                inputMasks={[maskTo2Decimal]}
                units="mm"
              />
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
                aluminumBlockChildType={values.aluminumBlockChildType}
              />
              <TextField
                name="labwareZDimension"
                inputMasks={[maskTo2Decimal]}
                units="mm"
              />
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
                  Spacing and well dimensions will be adjusted in the next
                  section.
                </p>
              </div>
              <img src={require('./images/offset_helpText.svg')} />
              <XYOffsetImg
                labwareType={values.labwareType}
                wellShape={values.wellShape}
              />
              <TextField name="gridRows" inputMasks={[maskToInteger]} />
              <RadioField name="irregularRowSpacing" options={yesNoOptions} />
              <TextField name="gridColumns" inputMasks={[maskToInteger]} />
              <RadioField
                name="irregularColumnSpacing"
                options={yesNoOptions}
              />
            </Section>
            {/* PAGE 2 */}
            <Section label="Well/Tube Volume" fieldList={['wellVolume']}>
              <div>
                <p>Total maximum volume of each well.</p>
              </div>
              <TextField
                name="wellVolume"
                inputMasks={[maskTo2Decimal]}
                units="μL"
              />
            </Section>
            <Section
              label="Well Shape & Sides"
              fieldList={[
                'wellShape',
                'wellDiameter',
                'wellXDimension',
                'wellYDimension',
              ]}
            >
              <div>
                <p>
                  Reference the <strong>inside</strong> of the well. Ignore any
                  lip.
                </p>
                <p>Diameter helps the robot locate the sides of the wells.</p>
              </div>
              <WellXYImg wellShape={values.wellShape} />
              <RadioField name="wellShape" options={wellShapeOptions} />
              {values.wellShape === 'circular' && (
                <TextField
                  name="wellDiameter"
                  inputMasks={[maskTo2Decimal]}
                  units="mm"
                />
              )}
              {values.wellShape === 'rectangular' && (
                <>
                  <TextField
                    name="wellXDimension"
                    inputMasks={[maskTo2Decimal]}
                    units="mm"
                  />
                  <TextField
                    name="wellYDimension"
                    inputMasks={[maskTo2Decimal]}
                    units="mm"
                  />
                </>
              )}
            </Section>
            <Section
              label="Well Bottom & Depth"
              fieldList={['wellBottomShape', 'wellDepth']}
            >
              <div>
                <p>
                  Reference the measurement from the top of the well (include
                  any lip but exclude any cap) to the bottom of the{' '}
                  <strong>inside</strong> of the{' '}
                  {values.labwareType === 'tubeRack'
                    ? 'tube'
                    : 'well' /* TODO: also use 'tube' with aluminum block that has tube */}
                  .
                </p>

                <p>
                  Depth informs the robot how far down it can go inside a well.
                </p>
              </div>
              <DepthImg
                labwareType={values.labwareType}
                wellBottomShape={values.wellBottomShape}
              />
              <Dropdown
                name="wellBottomShape"
                options={wellBottomShapeOptions}
              />
              <TextField
                name="wellDepth"
                inputMasks={[maskTo2Decimal]}
                units="mm"
              />
            </Section>
            <Section
              label="Well Spacing"
              fieldList={['gridSpacingX', 'gridSpacingY']}
            >
              <div>
                <p>
                  Spacing is between the <strong>center</strong> of wells.
                </p>
                <p>
                  Well spacing measurements inform the robot how far away rows
                  and columns are from each other.
                </p>
              </div>
              <XYSpacingImg
                labwareType={values.labwareType}
                wellShape={values.wellShape}
                gridRows={values.gridRows}
              />
              <TextField
                name="gridSpacingX"
                inputMasks={[maskTo2Decimal]}
                units="mm"
              />
              <TextField
                name="gridSpacingY"
                inputMasks={[maskTo2Decimal]}
                units="mm"
              />
            </Section>
            <Section
              label="Grid Offset"
              fieldList={['gridOffsetX', 'gridOffsetY']}
            >
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
                  Corner offset informs the robot how far the grid of wells is
                  from the slot{"'"}s top left corner.
                </p>
              </div>
              <TextField
                name="gridOffsetX"
                inputMasks={[maskTo2Decimal]}
                units="mm"
              />
              <TextField
                name="gridOffsetY"
                inputMasks={[maskTo2Decimal]}
                units="mm"
              />
            </Section>
            <Section label="Check your work">
              <p>
                Check that the size, spacing, and shape of your wells looks
                correct.
              </p>
              <ConditionalLabwareRender values={values} />
            </Section>

            {/* PAGE 3 */}
            <Section label="Description" fieldList={['brand']}>
              <TextField name="brand" />
              {'brandId: Array<string> (TODO!!!)'}
            </Section>
            {/* PAGE 4 */}
            <Section label="File" fieldList={['loadName', 'displayName']}>
              <TextField name="displayName" />
              <TextField name="loadName" inputMasks={[maskLoadName]} />
            </Section>
            <div className={styles.double_check_before_exporting}>
              <p>DOUBLE CHECK YOUR WORK BEFORE EXPORTING!</p>
              <p>
                If you are not comfortable reading a JSON labware definition
                then consider noting down the values you put in these fields.
                You will not be able to re-import your file back into the
                labware creator to read or edit it.
              </p>
            </div>
            <div>
              <PrimaryButton
                className={styles.export_button}
                onClick={() => {
                  if (!isValid && !showExportErrorModal) {
                    setShowExportErrorModal(true)
                  }
                  handleSubmit()
                }}
              >
                EXPORT FILE
              </PrimaryButton>
            </div>
          </div>
        )}
      </Formik>
    </div>
  )
}

export default App
