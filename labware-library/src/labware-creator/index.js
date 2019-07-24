// @flow
import * as React from 'react'
import { Formik } from 'formik'
import cloneDeep from 'lodash/cloneDeep'
import mapValues from 'lodash/mapValues'
import { saveAs } from 'file-saver'
import { AlertItem, AlertModal, PrimaryButton } from '@opentrons/components'
import { makeMaskToDecimal, maskToInteger, maskLoadName } from './fieldMasks'
import {
  labwareTypeOptions,
  tubeRackInsertOptions,
  aluminumBlockAutofills,
  aluminumBlockTypeOptions,
  aluminumBlockChildTypeOptions,
  getDefaultFormState,
  wellBottomShapeOptions,
  wellShapeOptions,
  yesNoOptions,
  tubeRackAutofills,
  MAX_SUGGESTED_Z,
} from './fields'
import {
  initialStatus,
  setIsAutopopulated,
  type FormikStatus,
} from './formikStatus'
import labwareFormSchema from './labwareFormSchema'
import fieldsToLabware from './fieldsToLabware'
import ConditionalLabwareRender from './components/ConditionalLabwareRender'
import Dropdown from './components/Dropdown'
import IntroCopy from './components/IntroCopy'
import RadioField from './components/RadioField'
import Section from './components/Section'
import TextField from './components/TextField'
import styles from './styles.css'
import type {
  LabwareFields,
  LabwareType,
  ProcessedLabwareFields,
  WellShape,
  WellBottomShape,
} from './fields'

const maskTo2Decimal = makeMaskToDecimal(2)

type MakeAutofillOnChangeArgs = {|
  name: $Keys<LabwareFields>,
  autofills: { [string]: $Shape<LabwareFields> },
  status: FormikStatus,
  values: LabwareFields,
  touched: Object,
  setStatus: FormikStatus => void,
  setTouched: ({ [$Keys<LabwareFields>]: boolean }) => void,
  setValues: ($Shape<LabwareFields>) => void,
|}
const makeAutofillOnChange = ({
  autofills,
  values,
  status,
  touched,
  setValues,
  setTouched,
  setStatus,
}: MakeAutofillOnChangeArgs) => (name: string, value: ?string) => {
  if (value == null) {
    console.log(`no value for ${name}, skipping autofill`)
    return
  }
  const _autofillValues = autofills[value]
  if (_autofillValues) {
    let autofillValues = cloneDeep(_autofillValues)
    // mix in some 'derived' autofill values
    if ('gridRows' in autofillValues) {
      autofillValues.regularRowSpacing = 'true'
    }
    if ('gridColumns' in autofillValues) {
      autofillValues.regularColumnSpacing = 'true'
    }

    const namesToTrue = mapValues(autofillValues, () => true)
    setValues({
      ...values,
      ...autofillValues,
      [name]: value,
    })
    setTouched({
      ...touched,
      ...namesToTrue,
    })
    setIsAutopopulated(Object.keys(autofillValues), status, setStatus)
  } else {
    console.error(
      `expected autofills for ${name}: ${value} -- is the value missing from the autofills object?`
    )
  }
}

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
    if (['tubes', 'pcrTubeStrip'].includes(aluminumBlockChildType)) {
      src = require('./images/height_aluminumBlock_tubes.svg')
    } else {
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

const displayAsTube = (values: LabwareFields) =>
  values.labwareType === 'tubeRack' ||
  (values.labwareType === 'aluminumBlock' &&
    values.aluminumBlockType === '96well' &&
    ['tubes', 'pcrTubeStrip'].includes(values.aluminumBlockChildType))

const getHeightAlerts = (
  values: LabwareFields,
  touched: { [$Keys<LabwareFields>]: boolean }
) => {
  const { labwareZDimension } = values
  const zAsNum = Number(labwareZDimension) // NOTE: if empty string or null, may be cast to 0, but that's fine for `>`
  if (touched.labwareZDimension && zAsNum > MAX_SUGGESTED_Z) {
    return (
      <AlertItem
        type="info"
        title="This labware may be too tall to work with some pipette + tip combinations. Please test on robot."
      />
    )
  }
  return null
}

const App = () => {
  const [
    showExportErrorModal,
    setShowExportErrorModal,
  ] = React.useState<boolean>(false)

  React.useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      // NOTE: the contents of this message will be overridden by modern browsers
      window.onbeforeunload = () =>
        'Are you sure you want to leave? You may have unsaved changes.'
      return () => {
        window.onbeforeunload = null
      }
    }
  })

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
        initialStatus={initialStatus}
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
          status,
          touched,
          setStatus,
          setTouched,
          setValues,
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
                  onValueChange={makeAutofillOnChange({
                    name: 'tubeRackInsertLoadName',
                    autofills: tubeRackAutofills,
                    values,
                    status,
                    touched,
                    setStatus,
                    setTouched,
                    setValues,
                  })}
                />
              )}
              {values.labwareType === 'aluminumBlock' && (
                <Dropdown
                  name="aluminumBlockType"
                  options={aluminumBlockTypeOptions}
                  onValueChange={makeAutofillOnChange({
                    name: 'aluminumBlockType',
                    autofills: aluminumBlockAutofills,
                    values,
                    status,
                    touched,
                    setStatus,
                    setTouched,
                    setValues,
                  })}
                />
              )}
              {values.labwareType === 'aluminumBlock' &&
                values.aluminumBlockType === '96well' && (
                  // Only show for '96well' aluminum block type
                  <Dropdown
                    name="aluminumBlockChildType"
                    options={aluminumBlockChildTypeOptions}
                  />
                )}
            </Section>
            {/* PAGE 1 - Labware */}
            <Section label="Regularity" fieldList={['homogeneousWells']}>
              {/* tubeRackSides: Array<string> maybe?? */}
              <RadioField name="homogeneousWells" options={yesNoOptions} />
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
              additionalAlerts={getHeightAlerts(values, touched)}
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
                'regularRowSpacing',
                'regularColumnSpacing',
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
              <RadioField name="regularRowSpacing" options={yesNoOptions} />
              <TextField name="gridColumns" inputMasks={[maskToInteger]} />
              <RadioField name="regularColumnSpacing" options={yesNoOptions} />
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
                  {displayAsTube(values) ? 'tube' : 'well'}.
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
            <Section label="Description" fieldList={['brand', 'brandId']}>
              <TextField name="brand" />
              <TextField name="brandId" caption="Separate multiple by comma" />
            </Section>
            {/* PAGE 4 */}
            <Section label="File" fieldList={['loadName', 'displayName']}>
              <TextField name="displayName" />
              <TextField
                name="loadName"
                caption="Only lower case letters, numbers, periods, and underscores may be used"
                inputMasks={[maskLoadName]}
              />
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
