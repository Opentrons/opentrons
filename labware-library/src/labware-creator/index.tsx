import assert from 'assert'
import Ajv from 'ajv'
import * as React from 'react'
import { Formik } from 'formik'
import { saveAs } from 'file-saver'
import { reportEvent } from '../analytics'
import { reportErrors } from './analyticsUtils'
import {
  ALIGN_CENTER,
  ALIGN_END,
  AlertModal,
  Box,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  ModalShell,
  PrimaryButton,
} from '@opentrons/components'
import {
  getAllDefinitions,
  labwareSchemaV2 as labwareSchema,
} from '@opentrons/shared-data'
import {
  aluminumBlockAutofills,
  aluminumBlockChildTypeOptions,
  aluminumBlockTypeOptions,
  getDefaultFormState,
  getInitialStatus,
  tubeRackAutofills,
  tubeRackInsertOptions,
} from './fields'

import { makeAutofillOnChange } from './utils/makeAutofillOnChange'
import { labwareDefToFields } from './labwareDefToFields'
import { labwareFormSchema } from './labwareFormSchema'
import { formLevelValidation } from './formLevelValidation'
import { fieldsToLabware } from './fieldsToLabware'
import { LabwareCreator as LabwareCreatorComponent } from './components/LabwareCreator'
import { Dropdown } from './components/Dropdown'
import { IntroCopy } from './components/IntroCopy'

import { ImportErrorModal } from './components/ImportErrorModal'
import { CreateNewDefinition } from './components/sections/CreateNewDefinition'
import { UploadExisting } from './components/sections/UploadExisting'

import { CustomTiprackWarning } from './components/sections/CustomTiprackWarning'
import { Description } from './components/sections/Description'
import { Export } from './components/sections/Export'
import { File } from './components/sections/File'
import { Footprint } from './components/sections/Footprint'
import { Grid } from './components/sections/Grid'
import { GridOffset } from './components/sections/GridOffset'
import { HandPlacedTipFit } from './components/sections/HandPlacedTipFit'
import { Height } from './components/sections/Height'
import { Preview } from './components/sections/Preview'
import { Regularity } from './components/sections/Regularity'
import { Volume } from './components/sections/Volume'
import { WellBottomAndDepth } from './components/sections/WellBottomAndDepth'
import { WellShapeAndSides } from './components/sections/WellShapeAndSides'
import { WellSpacing } from './components/sections/WellSpacing'
import { getDefaultedDef } from './getDefaultedDef'
import { getIsXYGeometryChanged } from './utils/getIsXYGeometryChanged'
import { StackingOffsets } from './components/sections/StackingOffsets'
import { WizardHeader } from './WizardHeader'

import type { FormikErrors } from 'formik'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { LabwareCreatorErrors } from './formLevelValidation'
import type {
  FormStatus,
  ImportError,
  LabwareFields,
  ProcessedLabwareFields,
} from './fields'

import styles from './styles.module.css'

const ajv = new Ajv()
const validateLabwareSchema = ajv.compile(labwareSchema)
type WizardStep =
  | 'intro'
  | 'regularity'
  | 'footprint'
  | 'height'
  | 'grid'
  | 'volume'
  | 'shape'
  | 'depth'
  | 'spacing'
  | 'gridOffset'
  | 'stackingOffset'
  | 'preview'

const WIZARD_STEPS: WizardStep[] = [
  'intro',
  'regularity',
  'footprint',
  'height',
  'grid',
  'volume',
  'shape',
  'depth',
  'spacing',
  'gridOffset',
  'stackingOffset',
  'preview',
]

interface LabwareCreatorProps {
  isOnRunApp?: boolean
  /** only for Run App usage */
  goBack?: () => void
  /** only for Run App usage */
  save?: (fileContent: any) => void
}

export const LabwareCreator = (props: LabwareCreatorProps): JSX.Element => {
  const { save, goBack, isOnRunApp = false } = props
  const [
    showExportErrorModal,
    _setShowExportErrorModal,
  ] = React.useState<boolean>(false)
  const labwareDefinitions = getAllDefinitions()
  const adapterDefinitions = Object.values(
    labwareDefinitions
  ).filter(definition => definition.allowedRoles?.includes('adapter'))
  const [wizardSteps, setWizardSteps] = React.useState<WizardStep[]>(
    WIZARD_STEPS
  )
  const [currentStepIndex, setCurrentStepIndex] = React.useState<number>(0)

  const setShowExportErrorModal = React.useMemo(
    () => (v: boolean, fieldValues?: LabwareFields) => {
      // NOTE: values that take a default will remain null in this event
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-boolean-literal-compare
      if (v === true) {
        assert(
          fieldValues,
          'expected `fieldValues` when setting showExportErrorModal to true'
        )
        reportEvent({
          name: 'labwareCreatorFileExport',
          properties: {
            labwareType: fieldValues?.labwareType,
            labwareDisplayName: fieldValues?.displayName,
            labwareAPIName: fieldValues?.loadName,
            labwareBrand: fieldValues?.brand,
            labwareManufacturerID: fieldValues?.brandId,
            exportSuccess: false,
            exportError: true,
          },
        })
      }
      _setShowExportErrorModal(v)
    },
    [_setShowExportErrorModal]
  )

  const [showCreatorForm, setShowCreatorForm] = React.useState<boolean>(false)

  const [importError, _setImportError] = React.useState<ImportError | null>(
    null
  )
  const setImportError = React.useMemo(
    () => (v: ImportError | null, def?: LabwareDefinition2) => {
      if (v != null) {
        reportEvent({
          name: 'labwareCreatorFileImport',
          properties: {
            labwareDisplayName: def?.metadata.displayName,
            labwareAPIName: def?.parameters.loadName,
            labwareBrand: def?.brand.brand,
            importSuccess: false,
            importError: v.key,
          },
        })
      }
      _setImportError(v)
    },
    [_setImportError]
  )

  const [lastUploaded, _setLastUploaded] = React.useState<LabwareFields | null>(
    null
  )
  const setLastUploaded = React.useMemo(
    () => (v: LabwareFields | null, def?: LabwareDefinition2) => {
      if (v != null) {
        assert(def, "setLastUploaded expected `def` if `v` isn't null")
        reportEvent({
          name: 'labwareCreatorFileImport',
          properties: {
            labwareType: v.labwareType,
            labwareDisplayName: def?.metadata.displayName,
            labwareAPIName: def?.parameters.loadName,
            labwareBrand: def?.brand.brand,
            labwareManufacturerID: v.brandId,
            importSuccess: true,
            importError: null,
          },
        })
      }
      _setLastUploaded(v)
    },
    [_setLastUploaded]
  )

  const scrollRef = React.useRef<HTMLDivElement | null>(null)

  const scrollToForm = React.useCallback(() => {
    setShowCreatorForm(true)
    window.scrollTo({
      left: 0,
      top: scrollRef.current != null ? scrollRef.current.offsetTop - 200 : 0,
      behavior: 'smooth',
    })
  }, [scrollRef])

  // if showCreatorForm has changed and is a truthy value, it must have been false -> true. Scroll to it
  React.useEffect(() => {
    if (showCreatorForm) {
      scrollToForm()
    }
  }, [showCreatorForm, scrollToForm])

  const wizardHeader = (
    <WizardHeader
      title={'Labware Creator'}
      currentStep={currentStepIndex}
      totalSteps={wizardSteps.length - 1}
      onExit={goBack}
    />
  )

  const currentWizardStep = wizardSteps[currentStepIndex]
  const goBackWizard = (stepsBack: number = 1): void => {
    if (currentStepIndex >= 0 + stepsBack) {
      setCurrentStepIndex(currentStepIndex - stepsBack)
    }
  }
  const proceed = (stepsForward: number = 1): void => {
    if (currentStepIndex + stepsForward < wizardSteps.length) {
      setCurrentStepIndex(currentStepIndex + stepsForward)
    }
  }

  const onUpload = React.useCallback(
    (
      event:
        | React.DragEvent<HTMLLabelElement>
        | React.ChangeEvent<HTMLInputElement>
    ) => {
      let files: FileList | never[] = []
      if ('dataTransfer' in event && event.dataTransfer.files !== null) {
        files = event.dataTransfer.files
      } else if ('files' in event.target && event.target.files !== null) {
        files = event.target.files
      }

      const file = files[0]
      const reader = new FileReader()

      // reset the state of the input to allow file re-uploads
      if ('value' in event.currentTarget) {
        event.currentTarget.value = ''
      }

      if (!file.name.endsWith('.json')) {
        setImportError({ key: 'INVALID_FILE_TYPE' })
      } else {
        reader.onload = readEvent => {
          const result = (readEvent.currentTarget as FileReader).result
          let parsedLabwareDef: LabwareDefinition2

          try {
            parsedLabwareDef = JSON.parse(result as string)
          } catch (error: any) {
            console.error(error)
            if (error instanceof Error) {
              setImportError({
                key: 'INVALID_JSON_FILE',
                messages: [error.message],
              })
            }
            return
          }

          if (!Boolean(validateLabwareSchema(parsedLabwareDef))) {
            console.warn(validateLabwareSchema.errors)

            setImportError({
              key: 'INVALID_LABWARE_DEF',
              // @ts-expect-error(IL, 2021-03-24): ajv def mixup
              messages: validateLabwareSchema.errors.map(
                ajvError =>
                  `${ajvError.schemaPath}: ${
                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                    ajvError.message
                  }. (${JSON.stringify(ajvError.params)})`
              ),
            })
            return
          }
          const fields = labwareDefToFields(
            parsedLabwareDef,
            adapterDefinitions
          )
          if (fields == null) {
            setImportError(
              { key: 'UNSUPPORTED_LABWARE_PROPERTIES' },
              parsedLabwareDef
            )
            return
          }
          setLastUploaded(fields, parsedLabwareDef)
          if (
            fields.labwareType === 'wellPlate' ||
            fields.labwareType === 'reservoir' ||
            fields.labwareType === 'tipRack'
          ) {
            // no additional required labware type child fields, we can scroll right away
            if (isOnRunApp) {
              proceed()
            } else {
              scrollToForm()
            }
          }
        }
        reader.readAsText(file)
      }
    },
    [scrollToForm, proceed, setLastUploaded, setImportError]
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

  const body = (
    <>
      {importError != null ? (
        <ImportErrorModal
          onClose={() => {
            setImportError(null)
          }}
          importError={importError}
        />
      ) : null}
      {showExportErrorModal && (
        <AlertModal
          className={styles.error_modal}
          heading="Cannot export file"
          onCloseClick={() => {
            setShowExportErrorModal(false)
          }}
          buttons={[
            {
              onClick: () => {
                setShowExportErrorModal(false)
              },
              children: 'close',
            },
          ]}
        >
          Please resolve all invalid fields in order to export the labware
          definition
        </AlertModal>
      )}
      <Formik
        initialValues={lastUploaded ?? getDefaultFormState()}
        enableReinitialize
        validationSchema={labwareFormSchema}
        validate={formLevelValidation}
        initialStatus={getInitialStatus}
        onSubmit={(values: LabwareFields) => {
          const castValues: ProcessedLabwareFields = labwareFormSchema.cast(
            values
          )
          const def = fieldsToLabware(castValues, adapterDefinitions)
          const { displayName } = def.metadata
          const { loadName } = def.parameters
          const blob = new Blob([JSON.stringify(def, null, 4)], {
            type: 'text/plain;charset=utf-8',
          })
          if (save != null) {
            const fileReader = new FileReader()
            fileReader.onload = function (event) {
              const fileContent =
                event.target != null ? event.target.result : null
              save(fileContent)
            }
            fileReader.readAsText(blob)
          } else {
            saveAs(blob, `${loadName}.json`)
          }

          reportEvent({
            name: 'labwareCreatorFileExport',
            properties: {
              labwareType: castValues.labwareType,
              labwareDisplayName: displayName,
              labwareAPIName: castValues.loadName,
              labwareBrand: castValues.brand,
              labwareManufacturerID: castValues.brandId,
              exportSuccess: true,
              exportError: null,
            },
          })
        }}
      >
        {bag => {
          const {
            values,
            touched,
            setTouched,
            setValues,
            isValid,
            handleSubmit,
          } = bag
          const status: FormStatus = bag.status
          const setStatus: (status: FormStatus) => void = bag.setStatus
          const errors: LabwareCreatorErrors = bag.errors

          if (
            (status.prevValues !== values && status.prevValues == null) ||
            getIsXYGeometryChanged(status.prevValues, values)
          ) {
            // update defaultedDef with new values
            setStatus({
              defaultedDef: getDefaultedDef(values),
              prevValues: values,
            })
          }
          const onExportClick = (): void => {
            if (!isValid && !showExportErrorModal) {
              setShowExportErrorModal(true, values)
            }
            handleSubmit()
            if (goBack != null) {
              goBack()
            }
          }

          // @ts-expect-error(IL, 2021-03-24): values/errors/touched not typed for reportErrors to be happy
          reportErrors({ values, errors, touched })
          // TODO (ka 2019-8-27): factor out this as sub-schema from Yup schema and use it to validate instead of repeating the logic
          const canProceedToForm = Boolean(
            values.labwareType === 'wellPlate' ||
              values.labwareType === 'reservoir' ||
              values.labwareType === 'tipRack' ||
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

          return isOnRunApp && goBack != null ? (
            <ModalShell width="48rem" header={wizardHeader}>
              <Box padding="2rem">
                <CreateForm
                  values={values}
                  errors={errors}
                  onExportClick={onExportClick}
                  currentWizardStep={currentWizardStep}
                  proceed={proceed}
                  goBack={goBackWizard}
                  setWizardSteps={setWizardSteps}
                  canProceedToForm={canProceedToForm}
                  onUpload={onUpload}
                  lastUploaded={lastUploaded}
                  labwareTypeChildFields={labwareTypeChildFields}
                />
              </Box>
            </ModalShell>
          ) : (
            <div className={styles.labware_creator}>
              <h2>Custom Labware Creator</h2>
              <IntroCopy />
              <div className={styles.flex_row}>
                <CreateNewDefinition
                  showDropDownOptions={lastUploaded === null}
                  disabled={!canProceedToForm || lastUploaded !== null}
                  labwareTypeChildFields={labwareTypeChildFields}
                  onClick={scrollToForm}
                />
                <UploadExisting
                  disabled={!canProceedToForm}
                  labwareTypeChildFields={labwareTypeChildFields}
                  lastUploaded={lastUploaded}
                  onClick={scrollToForm}
                  onUpload={onUpload}
                />
              </div>
              <div ref={scrollRef} />
              {showCreatorForm && (
                <>
                  <CustomTiprackWarning />
                  <HandPlacedTipFit />
                  <Regularity />
                  <Footprint />
                  <Height />
                  <Grid />
                  <Volume />
                  <WellShapeAndSides />
                  <WellBottomAndDepth />
                  <WellSpacing />
                  <GridOffset />
                  <StackingOffsets />
                  <Preview />
                  <Description />
                  <File />
                  <Export
                    disabled={false}
                    onExportClick={onExportClick}
                    isOnRunApp={isOnRunApp}
                  />
                </>
              )}
            </div>
          )
        }}
      </Formik>
    </>
  )

  return goBack != null ? (
    body
  ) : (
    <LabwareCreatorComponent>{body}</LabwareCreatorComponent>
  )
}

interface CreateFileFormProps {
  values: LabwareFields
  errors: FormikErrors<
    LabwareFields & {
      FORM_LEVEL_ERRORS: Partial<Record<any, string>>
    }
  >
  lastUploaded: LabwareFields | null
  canProceedToForm: boolean
  labwareTypeChildFields: any
  currentWizardStep: WizardStep
  onUpload: (
    event:
      | React.DragEvent<HTMLLabelElement>
      | React.ChangeEvent<HTMLInputElement>
  ) => void
  goBack: (stepsBack: number) => void
  onExportClick: () => void
  proceed: (stepsForward: number) => void
  setWizardSteps: React.Dispatch<React.SetStateAction<WizardStep[]>>
}

function CreateForm(props: CreateFileFormProps): JSX.Element {
  const {
    currentWizardStep,
    errors,
    proceed,
    goBack,
    onUpload,
    lastUploaded,
    canProceedToForm,
    onExportClick,
    labwareTypeChildFields,
    values,
  } = props

  const skipStackingOffset =
    values.labwareType === 'aluminumBlock' || values.labwareType === 'reservoir'
  const skipSpacing =
    values.gridRows != null &&
    values.gridRows === '1' &&
    values.gridColumns != null &&
    values.gridColumns === '1'

  switch (currentWizardStep) {
    case 'intro':
      return (
        <>
          <h2>Custom Labware Creator BETA</h2>
          <IntroCopy />
          <div className={styles.flex_row}>
            <CreateNewDefinition
              showDropDownOptions={lastUploaded === null}
              disabled={!canProceedToForm || lastUploaded !== null}
              labwareTypeChildFields={labwareTypeChildFields}
              onClick={() => {
                proceed(1)
              }}
            />
            <UploadExisting
              disabled={!canProceedToForm}
              labwareTypeChildFields={labwareTypeChildFields}
              lastUploaded={lastUploaded}
              onClick={() => {
                proceed(1)
              }}
              onUpload={onUpload}
            />
          </div>
        </>
      )
    case 'regularity':
      return (
        <Flex flexDirection={DIRECTION_COLUMN} gridGap="1rem">
          <Flex flexDirection={DIRECTION_COLUMN} height="100%">
            <CustomTiprackWarning />
            <HandPlacedTipFit />
            <Regularity />
          </Flex>
          <Flex
            alignItems={ALIGN_END}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            width="100%"
          >
            <PrimaryButton
              onClick={() => {
                goBack(1)
              }}
            >
              Go back
            </PrimaryButton>
            <PrimaryButton
              onClick={() => {
                proceed(1)
              }}
              disabled={errors.homogeneousWells != null}
            >
              Next
            </PrimaryButton>
          </Flex>
        </Flex>
      )
    case 'footprint':
      return (
        <>
          <Footprint />
          <Flex
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            width="100%"
          >
            <PrimaryButton
              onClick={() => {
                goBack(1)
              }}
            >
              Go back
            </PrimaryButton>
            <PrimaryButton
              onClick={() => {
                proceed(1)
              }}
              disabled={
                !(
                  errors.footprintXDimension == null &&
                  errors.footprintYDimension == null
                )
              }
            >
              Next
            </PrimaryButton>
          </Flex>
        </>
      )
    case 'height':
      return (
        <>
          <Height />
          <Flex
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            width="100%"
          >
            <PrimaryButton
              onClick={() => {
                goBack(1)
              }}
            >
              Go back
            </PrimaryButton>
            <PrimaryButton
              onClick={() => {
                proceed(1)
              }}
              disabled={errors.labwareZDimension != null}
            >
              Next
            </PrimaryButton>
          </Flex>
        </>
      )
    case 'grid':
      return (
        <>
          <Grid />
          <Flex
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            width="100%"
          >
            <PrimaryButton
              onClick={() => {
                goBack(1)
              }}
            >
              Go back
            </PrimaryButton>
            <PrimaryButton
              onClick={() => {
                proceed(1)
              }}
              disabled={
                !(
                  errors.gridColumns == null &&
                  errors.gridRows == null &&
                  errors.regularColumnSpacing == null &&
                  errors.regularRowSpacing == null
                )
              }
            >
              Next
            </PrimaryButton>
          </Flex>
        </>
      )
    case 'volume':
      return (
        <>
          <Volume />
          <Flex
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            width="100%"
          >
            <PrimaryButton
              onClick={() => {
                goBack(1)
              }}
            >
              Go back
            </PrimaryButton>
            <PrimaryButton
              onClick={() => {
                proceed(1)
              }}
              disabled={errors.wellVolume != null}
            >
              Next
            </PrimaryButton>
          </Flex>
        </>
      )
    case 'shape':
      return (
        <>
          <WellShapeAndSides />
          <Flex
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            width="100%"
          >
            <PrimaryButton
              onClick={() => {
                goBack(1)
              }}
            >
              Go back
            </PrimaryButton>
            <PrimaryButton
              onClick={() => {
                proceed(1)
              }}
              //  TODO fix this tho
              disabled={
                errors.wellDiameter != null ||
                !(
                  errors.wellXDimension == null && errors.wellYDimension == null
                )
              }
            >
              Next
            </PrimaryButton>
          </Flex>
        </>
      )
    case 'depth':
      return (
        <>
          <WellBottomAndDepth />
          <Flex
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            width="100%"
          >
            <PrimaryButton
              onClick={() => {
                goBack(1)
              }}
            >
              Go back
            </PrimaryButton>
            <PrimaryButton
              onClick={() => {
                if (skipSpacing) {
                  proceed(2)
                } else {
                  proceed(1)
                }
              }}
              disabled={errors.wellDepth != null}
            >
              Next
            </PrimaryButton>
          </Flex>
        </>
      )
    case 'spacing':
      return (
        <>
          <WellSpacing />
          <Flex
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            width="100%"
          >
            <PrimaryButton
              onClick={() => {
                if (skipSpacing) {
                  goBack(2)
                } else {
                  goBack(1)
                }
              }}
            >
              Go back
            </PrimaryButton>
            <PrimaryButton
              onClick={() => {
                proceed(1)
              }}
              disabled={
                !(errors.gridSpacingX == null && errors.gridSpacingY == null)
              }
            >
              Next
            </PrimaryButton>
          </Flex>
        </>
      )
    case 'gridOffset':
      return (
        <>
          <GridOffset />
          <Flex
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            width="100%"
          >
            <PrimaryButton
              onClick={() => {
                goBack(1)
              }}
            >
              Go back
            </PrimaryButton>
            <PrimaryButton
              onClick={() => {
                if (skipStackingOffset) {
                  proceed(2)
                } else {
                  proceed(1)
                }
              }}
              disabled={
                !(errors.gridOffsetX == null && errors.gridOffsetY == null)
              }
            >
              Next
            </PrimaryButton>
          </Flex>
        </>
      )
    case 'stackingOffset':
      return (
        <>
          <StackingOffsets />
          <Flex
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            width="100%"
          >
            <PrimaryButton
              onClick={() => {
                goBack(1)
              }}
            >
              Go back
            </PrimaryButton>
            <PrimaryButton
              onClick={() => {
                proceed(1)
              }}
            >
              Next
            </PrimaryButton>
          </Flex>
        </>
      )
    case 'preview':
      return (
        <>
          <Preview />
          <Description />
          <File />
          <Flex
            flexDirection={DIRECTION_ROW}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
          >
            <PrimaryButton
              alignSelf="center"
              onClick={() => {
                if (skipStackingOffset) {
                  goBack(2)
                } else {
                  goBack(1)
                }
              }}
            >
              Go back
            </PrimaryButton>
            <Export
              onExportClick={onExportClick}
              isOnRunApp={true}
              disabled={Object.keys(errors).length > 0}
            />
          </Flex>
        </>
      )
    default:
      return <div></div>
  }
}
