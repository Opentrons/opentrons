// @flow
import Ajv from 'ajv'
import cx from 'classnames'
import * as React from 'react'
import { Formik } from 'formik'
import mapValues from 'lodash/mapValues'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import { AlertItem, AlertModal, PrimaryButton } from '@opentrons/components'
import labwareSchema from '@opentrons/shared-data/labware/schemas/2.json'
import { makeMaskToDecimal, maskToInteger, maskLoadName } from './fieldMasks'
import {
  labwareTypeOptions,
  tubeRackInsertOptions,
  aluminumBlockAutofills,
  aluminumBlockTypeOptions,
  aluminumBlockChildTypeOptions,
  getDefaultFormState,
  getImplicitAutofillValues,
  yesNoOptions,
  tubeRackAutofills,
  SUGGESTED_X,
  SUGGESTED_Y,
  SUGGESTED_XY_RANGE,
  MAX_SUGGESTED_Z,
  LINK_CUSTOM_LABWARE_FORM,
} from './fields'
import labwareDefToFields from './labwareDefToFields'
import labwareFormSchema from './labwareFormSchema'
import { getDefaultDisplayName, getDefaultLoadName } from './formSelectors'
import labwareTestProtocol, { pipetteNameOptions } from './labwareTestProtocol'
import fieldsToLabware from './fieldsToLabware'
import LabwareCreator from './components/LabwareCreator'
import ConditionalLabwareRender from './components/ConditionalLabwareRender'
import Dropdown from './components/Dropdown'
import IntroCopy from './components/IntroCopy'
import LinkOut from './components/LinkOut'
import RadioField from './components/RadioField'
import Section from './components/Section'
import TextField from './components/TextField'
import HeightGuidingText from './components/HeightGuidingText'
import ImportLabware from './components/ImportLabware'
import ImportErrorModal from './components/ImportErrorModal'
import {
  wellShapeOptionsWithIcons,
  wellBottomShapeOptionsWithIcons,
} from './components/optionsWithImages'
import styles from './styles.css'

import type {
  LabwareDefinition2,
  WellBottomShape,
} from '@opentrons/shared-data'
import type {
  ImportError,
  LabwareFields,
  LabwareType,
  ProcessedLabwareFields,
  WellShape,
} from './fields'

const ajv = new Ajv()
const validateLabwareSchema = ajv.compile(labwareSchema)

const maskTo2Decimal = makeMaskToDecimal(2)

type MakeAutofillOnChangeArgs = {|
  name: $Keys<LabwareFields>,
  autofills: { [string]: $Shape<LabwareFields> },
  values: LabwareFields,
  touched: Object,
  setTouched: ({ [$Keys<LabwareFields>]: boolean }) => void,
  setValues: ($Shape<LabwareFields>) => void,
|}

const PDF_URL =
  'https://opentrons-publications.s3.us-east-2.amazonaws.com/TestGuide_labware.pdf'

const makeAutofillOnChange = ({
  autofills,
  values,
  touched,
  setValues,
  setTouched,
}: MakeAutofillOnChangeArgs) => (name: string, value: ?string) => {
  if (value == null) {
    console.log(`no value for ${name}, skipping autofill`)
    return
  }
  const _autofillValues = autofills[value]
  if (_autofillValues) {
    const autofillValues = {
      ..._autofillValues,
      ...getImplicitAutofillValues(_autofillValues),
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

const GridImg = () => {
  const src = require('./images/grid_row_column.svg')
  return <img src={src} />
}

const WellXYImg = (props: {| wellShape: ?WellShape |}) => {
  const { wellShape } = props
  const wellShapeToImg: { [WellShape]: string } = {
    circular: require('./images/wellXY_circular.svg'),
    rectangular: require('./images/wellXY_rectangular.svg'),
  }

  if (wellShape != null && wellShape in wellShapeToImg) {
    return <img src={wellShapeToImg[wellShape]} />
  }

  return null
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

  if (!wellBottomShape) return null

  if (labwareType === 'reservoir' || labwareType === 'tubeRack') {
    const imgMap = {
      v: require('./images/depth_reservoir-and-tubes_v.svg'),
      flat: require('./images/depth_reservoir-and-tubes_flat.svg'),
      u: require('./images/depth_reservoir-and-tubes_round.svg'),
    }
    src = imgMap[wellBottomShape]
  } else {
    const imgMap = {
      v: require('./images/depth_plate_v.svg'),
      flat: require('./images/depth_plate_flat.svg'),
      u: require('./images/depth_plate_round.svg'),
    }
    src = imgMap[wellBottomShape]
  }

  return <img src={src} />
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

const xyMessage = (
  <div>
    Our recommended footprint for labware is {SUGGESTED_X} by {SUGGESTED_Y} +/-
    1mm. If you can fit your labware snugly into a single slot on the deck
    continue through the form. If not please request custom labware via{' '}
    <LinkOut href={LINK_CUSTOM_LABWARE_FORM}>this form</LinkOut>.
  </div>
)

const getXYDimensionAlerts = (
  values: LabwareFields,
  touched: { [$Keys<LabwareFields>]: boolean }
) => {
  const xAsNum = Number(values.footprintXDimension)
  const yAsNum = Number(values.footprintYDimension)
  const showXInfo =
    touched.footprintXDimension &&
    Math.abs(xAsNum - SUGGESTED_X) > SUGGESTED_XY_RANGE
  const showYInfo =
    touched.footprintYDimension &&
    Math.abs(yAsNum - SUGGESTED_Y) > SUGGESTED_XY_RANGE

  return showXInfo || showYInfo ? (
    <AlertItem type="info" title={xyMessage} />
  ) : null
}

const App = () => {
  const [
    showExportErrorModal,
    setShowExportErrorModal,
  ] = React.useState<boolean>(false)

  const [showCreatorForm, setShowCreatorForm] = React.useState<boolean>(false)
  const [importError, setImportError] = React.useState<ImportError | null>(null)

  const [lastUploaded, setLastUploaded] = React.useState<LabwareFields | null>(
    null
  )

  const scrollRef = React.useRef<HTMLDivElement | null>(null)

  const scrollToForm = React.useCallback(() => {
    setShowCreatorForm(true)
    window.scrollTo({
      left: 0,
      top: scrollRef.current && scrollRef.current.offsetTop - 200,
      behavior: 'smooth',
    })
  }, [scrollRef])

  // if showCreatorForm has changed and is a truthy value, it must have been false -> true. Scroll to it
  React.useEffect(() => {
    if (showCreatorForm) {
      scrollToForm()
    }
  }, [showCreatorForm, scrollToForm])

  const onUpload = React.useCallback(
    (event: SyntheticInputEvent<HTMLInputElement> | SyntheticDragEvent<*>) => {
      let files: Array<File> = []
      if (event.dataTransfer && event.dataTransfer.files) {
        files = (event.dataTransfer.files: any)
      } else if (event.target.files) {
        files = (event.target.files: any)
      }

      const file = files[0]
      const reader = new FileReader()

      // reset the state of the input to allow file re-uploads
      event.currentTarget.value = ''

      if (!file.name.endsWith('.json')) {
        setImportError({ key: 'INVALID_FILE_TYPE' })
      } else {
        reader.onload = readEvent => {
          const result = readEvent.currentTarget.result
          let parsedLabwareDef: ?LabwareDefinition2

          try {
            parsedLabwareDef = JSON.parse(result)
          } catch (error) {
            console.error(error)
            setImportError({
              key: 'INVALID_JSON_FILE',
              messages: [error.message],
            })
            return
          }

          if (!validateLabwareSchema(parsedLabwareDef)) {
            console.warn(validateLabwareSchema.errors)

            setImportError({
              key: 'INVALID_LABWARE_DEF',
              messages: validateLabwareSchema.errors.map(
                ajvError =>
                  `${ajvError.schemaPath}: ${
                    ajvError.message
                  }. (${JSON.stringify(ajvError.params)})`
              ),
            })
            return
          }
          const fields = labwareDefToFields(parsedLabwareDef)
          if (!fields) {
            setImportError({ key: 'UNSUPPORTED_LABWARE_PROPERTIES' })
            return
          }
          setLastUploaded(fields)
          if (
            fields.labwareType === 'wellPlate' ||
            fields.labwareType === 'reservoir'
          ) {
            // no additional required labware type child fields, we can scroll right away
            scrollToForm()
          }
        }
        reader.readAsText(file)
      }
    },
    [scrollToForm]
  )

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
    <LabwareCreator>
      {importError && (
        <ImportErrorModal
          onClose={() => setImportError(null)}
          importError={importError}
        />
      )}
      {showExportErrorModal && (
        <AlertModal
          className={styles.error_modal}
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
        initialValues={lastUploaded || getDefaultFormState()}
        enableReinitialize
        validationSchema={labwareFormSchema}
        onSubmit={(values: LabwareFields) => {
          const castValues: ProcessedLabwareFields = labwareFormSchema.cast(
            values
          )
          const { pipetteName } = castValues
          const def = fieldsToLabware(castValues)
          const { displayName } = def.metadata

          const zip = new JSZip()
          zip.file(`${displayName}.json`, JSON.stringify(def, null, 4))
          zip.file(
            `test_${displayName}.py`,
            labwareTestProtocol({ pipetteName, definition: def })
          )
          zip
            .generateAsync({ type: 'blob' })
            .then(blob => saveAs(blob, `${displayName}.zip`))
        }}
      >
        {({
          handleSubmit,
          values,
          isValid,
          errors,
          touched,
          setTouched,
          setValues,
        }) => {
          // TODO (ka 2019-8-27): factor out this as sub-schema from Yup schema and use it to validate instead of repeating the logic
          const canProceedToForm = Boolean(
            values.labwareType === 'wellPlate' ||
              values.labwareType === 'reservoir' ||
              (values.labwareType === 'tubeRack' &&
                values.tubeRackInsertLoadName) ||
              (values.labwareType === 'aluminumBlock' &&
                values.aluminumBlockType === '24well') ||
              (values.labwareType === 'aluminumBlock' &&
                values.aluminumBlockType === '96well' &&
                values.aluminumBlockChildType)
          )

          const labwareTypeChildFields = (
            <>
              {values.labwareType === 'tubeRack' && (
                <Dropdown
                  name="tubeRackInsertLoadName"
                  options={tubeRackInsertOptions}
                  onValueChange={makeAutofillOnChange({
                    name: 'tubeRackInsertLoadName',
                    autofills: tubeRackAutofills,
                    values,
                    touched,
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
                    touched,
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
            </>
          )

          return (
            <div className={styles.labware_creator}>
              <h2>Custom Labware Creator BETA</h2>
              <IntroCopy />
              <div className={styles.flex_row}>
                <div className={styles.new_definition_section}>
                  <Section
                    label="Create a new definition"
                    fieldList={[
                      'labwareType',
                      'tubeRackInsertLoadName',
                      'aluminumBlockType',
                      'aluminumBlockChildType',
                    ]}
                    headingClassName={cx(styles.setup_heading, {
                      [styles.disabled_section]: lastUploaded !== null,
                    })}
                  >
                    <div className={styles.labware_type_fields}>
                      {lastUploaded === null ? (
                        <>
                          <Dropdown
                            name="labwareType"
                            options={labwareTypeOptions}
                          />
                          {labwareTypeChildFields}
                        </>
                      ) : null}

                      <PrimaryButton
                        className={styles.start_creating_btn}
                        disabled={!canProceedToForm || lastUploaded !== null}
                        onClick={scrollToForm}
                      >
                        start creating labware
                      </PrimaryButton>
                    </div>
                  </Section>
                </div>
                <div className={styles.upload_existing_section}>
                  <h2 className={styles.setup_heading}>
                    Edit a file you’ve built with our labware creator
                  </h2>
                  {lastUploaded === null ? (
                    <ImportLabware onUpload={onUpload} />
                  ) : (
                    <div className={styles.labware_type_fields}>
                      {labwareTypeChildFields}
                      <PrimaryButton
                        className={styles.start_creating_btn}
                        onClick={scrollToForm}
                        disabled={!canProceedToForm}
                      >
                        start editing labware
                      </PrimaryButton>
                    </div>
                  )}
                </div>
              </div>
              <div ref={scrollRef} />
              {showCreatorForm && (
                <>
                  {/* PAGE 1 - Labware */}
                  <Section label="Regularity" fieldList={['homogeneousWells']}>
                    {/* tubeRackSides: Array<string> maybe?? */}
                    <div className={styles.flex_row}>
                      <div className={styles.homogenous_wells_section}>
                        <RadioField
                          name="homogeneousWells"
                          options={yesNoOptions}
                        />
                      </div>
                    </div>
                  </Section>
                  <Section
                    label="Footprint"
                    fieldList={['footprintXDimension', 'footprintYDimension']}
                    additionalAlerts={getXYDimensionAlerts(values, touched)}
                  >
                    <div className={styles.flex_row}>
                      <div className={styles.instructions_column}>
                        <p>
                          Ensure measurement is taken from the{' '}
                          <strong>very bottom</strong> of plate.
                        </p>
                        <p>
                          The footprint measurement helps determine if the
                          labware fits firmly into the slots on the OT-2 deck.
                        </p>
                      </div>
                      <div className={styles.diagram_column}>
                        <img src={require('./images/footprint.svg')} />
                      </div>
                      <div className={styles.form_fields_column}>
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
                      </div>
                    </div>
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
                    <div className={styles.flex_row}>
                      <div className={styles.instructions_column}>
                        <HeightGuidingText labwareType={values.labwareType} />
                      </div>
                      <div className={styles.diagram_column}>
                        <HeightImg
                          labwareType={values.labwareType}
                          aluminumBlockChildType={values.aluminumBlockChildType}
                        />
                      </div>
                      <div className={styles.form_fields_column}>
                        <TextField
                          name="labwareZDimension"
                          inputMasks={[maskTo2Decimal]}
                          units="mm"
                        />
                      </div>
                    </div>
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
                    <div className={styles.flex_row}>
                      <div className={styles.instructions_column}>
                        <p>
                          The grid of wells on your labware is arranged via rows
                          and columns. Rows run horizontally across your labware
                          (left to right). Columns run top to bottom.
                        </p>
                      </div>
                      <div className={styles.diagram_column}>
                        <GridImg />
                      </div>
                      <div className={styles.form_fields_column}>
                        <TextField
                          name="gridRows"
                          inputMasks={[maskToInteger]}
                        />
                        <RadioField
                          name="regularRowSpacing"
                          options={yesNoOptions}
                        />
                        <TextField
                          name="gridColumns"
                          inputMasks={[maskToInteger]}
                        />
                        <RadioField
                          name="regularColumnSpacing"
                          options={yesNoOptions}
                        />
                      </div>
                    </div>
                  </Section>
                  {/* PAGE 2 */}
                  <Section label="Volume" fieldList={['wellVolume']}>
                    <div className={styles.flex_row}>
                      <div className={styles.volume_instructions_column}>
                        <p>Total maximum volume of each well.</p>
                      </div>

                      <div className={styles.form_fields_column}>
                        <TextField
                          name="wellVolume"
                          inputMasks={[maskTo2Decimal]}
                          units="μL"
                        />
                      </div>
                    </div>
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
                    <div className={styles.flex_row}>
                      <div className={styles.instructions_column}>
                        {displayAsTube(values) ? (
                          <>
                            <p>
                              Reference the <strong>top</strong> of the{' '}
                              <strong>inside</strong> of the tube. Ignore any
                              lip.{' '}
                            </p>
                            <p>
                              Diameter helps the robot locate the sides of the
                              tubes. If there are multiple measurements for this
                              dimension then use the smaller one.{' '}
                            </p>
                          </>
                        ) : (
                          <>
                            <p>
                              Reference the <strong>inside</strong> of the well.
                              Ignore any lip.
                            </p>
                            <p>
                              Diameter helps the robot locate the sides of the
                              wells.
                            </p>
                          </>
                        )}
                      </div>
                      <div className={styles.diagram_column}>
                        <WellXYImg wellShape={values.wellShape} />
                      </div>
                      <div className={styles.form_fields_column}>
                        <RadioField
                          name="wellShape"
                          labelTextClassName={styles.hidden}
                          options={wellShapeOptionsWithIcons}
                        />
                        {values.wellShape === 'rectangular' ? (
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
                        ) : (
                          <TextField
                            name="wellDiameter"
                            inputMasks={[maskTo2Decimal]}
                            units="mm"
                          />
                        )}
                      </div>
                    </div>
                  </Section>
                  <Section
                    label="Well Bottom & Depth"
                    fieldList={['wellBottomShape', 'wellDepth']}
                  >
                    <div className={styles.flex_row}>
                      <div className={styles.instructions_column}>
                        <p>
                          Reference the measurement from the top of the well
                          (include any lip but exclude any cap) to the bottom of
                          the <strong>inside</strong> of the{' '}
                          {displayAsTube(values) ? 'tube' : 'well'}.
                        </p>

                        <p>
                          Depth informs the robot how far down it can go inside
                          a well.
                        </p>
                      </div>
                      <div className={styles.diagram_column}>
                        <DepthImg
                          labwareType={values.labwareType}
                          wellBottomShape={values.wellBottomShape}
                        />
                      </div>
                      <div className={styles.form_fields_column}>
                        <RadioField
                          name="wellBottomShape"
                          labelTextClassName={styles.hidden}
                          options={wellBottomShapeOptionsWithIcons}
                        />
                        <TextField
                          name="wellDepth"
                          inputMasks={[maskTo2Decimal]}
                          units="mm"
                        />
                      </div>
                    </div>
                  </Section>
                  <Section
                    label="Well Spacing"
                    fieldList={['gridSpacingX', 'gridSpacingY']}
                  >
                    <div className={styles.flex_row}>
                      <div className={styles.instructions_column}>
                        <p>
                          Spacing is between the <strong>center</strong> of
                          wells.
                        </p>
                        <p>
                          Well spacing measurements inform the robot how far
                          away rows and columns are from each other.
                        </p>
                      </div>
                      <div className={styles.diagram_column}>
                        <XYSpacingImg
                          labwareType={values.labwareType}
                          wellShape={values.wellShape}
                          gridRows={values.gridRows}
                        />
                      </div>
                      <div className={styles.form_fields_column}>
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
                      </div>
                    </div>
                  </Section>
                  <Section
                    label="Grid Offset"
                    fieldList={['gridOffsetX', 'gridOffsetY']}
                  >
                    <div className={styles.flex_row}>
                      <div className={styles.instructions_column}>
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
                          Corner offset informs the robot how far the grid of
                          wells is from the slot{"'"}s top left corner.
                        </p>
                        <div className={styles.help_text}>
                          <img src={require('./images/offset_helpText.svg')} />
                        </div>
                      </div>
                      <div className={styles.diagram_column}>
                        <XYOffsetImg
                          labwareType={values.labwareType}
                          wellShape={values.wellShape}
                        />
                      </div>
                      <div className={styles.form_fields_column}>
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
                      </div>
                    </div>
                  </Section>
                  <Section label="Check your work">
                    <div className={styles.preview_labware}>
                      <ConditionalLabwareRender values={values} />
                      <p className={styles.preview_instructions}>
                        Check that the size, spacing, and shape of your wells
                        looks correct.
                      </p>
                    </div>
                  </Section>

                  {/* PAGE 3 */}
                  <Section label="Description" fieldList={['brand', 'brandId']}>
                    <div className={styles.flex_row}>
                      <div className={styles.brand_column}>
                        <TextField name="brand" />
                      </div>
                      <div className={styles.brand_id_column}>
                        <TextField
                          name="brandId"
                          caption="Separate multiple by comma"
                        />
                      </div>
                    </div>
                  </Section>
                  {/* PAGE 4 */}

                  <Section
                    label="File"
                    fieldList={['loadName', 'displayName', 'pipetteName']}
                  >
                    <div className={styles.flex_row}>
                      <div className={styles.instructions_column}>
                        <p>
                          Files are exported as a zipped file containing 1) the
                          labware definition as a JSON file, and 2) a test
                          python protocol referencing the labware to help
                          troubleshoot the accuracy of the definition on your
                          robot. The test protocol will require a single channel
                          pipette on the
                          <strong> right mount</strong> of your robot.{' '}
                          <LinkOut href={PDF_URL}>Click here</LinkOut> for
                          instructions on running the test protocol.
                        </p>
                        <p>
                          Please Note: It’s important to create a labware
                          definition that is precise, and does not rely on
                          excessive calibration prior to each run to achieve
                          accuracy. In this way you&apos;ll generate labware
                          definitions that are reusable and shareable with
                          others inside or outside your lab.
                        </p>
                      </div>
                      <div className={styles.export_form_fields}>
                        <TextField
                          name="displayName"
                          placeholder={getDefaultDisplayName(values)}
                        />
                        <TextField
                          name="loadName"
                          placeholder={getDefaultLoadName(values)}
                          caption="Only lower case letters, numbers, periods, and underscores may be used"
                          inputMasks={[maskLoadName]}
                        />
                        <div className={styles.pipette_field_wrapper}>
                          <Dropdown
                            name="pipetteName"
                            options={pipetteNameOptions}
                          />
                        </div>
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
                  </Section>
                </>
              )}
            </div>
          )
        }}
      </Formik>
    </LabwareCreator>
  )
}

export default App
