import { useEffect, useRef } from 'react'
import { useFormikContext } from 'formik'

import {
  AlertItem,
  ALIGN_CENTER,
  Box,
  CheckboxField,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  getAllDefinitions,
  getModuleDisplayName,
  MAGNETIC_BLOCK_V1,
  THERMOCYCLER_MODULE_V2,
} from '@opentrons/shared-data'

import {
  STACKING_OFFSET_HOW_TO,
  STACKING_OFFSET_PURPOSE,
} from '../../../localization'
import { makeMaskToDecimal } from '../../fieldMasks'
import styles from '../../styles.module.css'
import { isEveryFieldHidden } from '../../utils'
import {
  getVacuumCollarSeatingInset,
  getVacuumCollarStackingMeasurement,
  isVacuumCollar,
} from '../../utils/vacuumCollarStacking'
import { FormAlerts } from '../alerts/FormAlerts'
import { StackingAlerts } from '../alerts/StackingAlerts'
import { TextField } from '../TextField'
import { SectionBody } from './SectionBody'

import type { LabwareDefinition2, ModuleModel } from '@opentrons/shared-data'
import type { LabwareFields } from '../../fields'

import src from '../../../images/stacking_offsets.svg'
import heightOfTwoPlates from '../../images/height_stacked_labware.svg'

const HIGHEST_TC_COMPATIBLE_LABWARE_HEIGHT = 16.06
const MODULE_MODELS_WITH_NO_ADAPTERS: ModuleModel[] = [
  MAGNETIC_BLOCK_V1,
  THERMOCYCLER_MODULE_V2,
]
const maskTo2Decimal = makeMaskToDecimal(2)

export function StackingOffsets(): JSX.Element | null {
  const labwareDefinitions = getAllDefinitions()
  const adapterDefinitions = Object.values(labwareDefinitions).filter(
    definition => definition.allowedRoles?.includes('adapter')
  )

  const fieldList: Array<keyof LabwareFields> = [
    'compatibleAdapters',
    'compatibleModules',
    'stackedLabwareZDimension',
  ]
  const { values, errors, touched, setFieldValue } =
    useFormikContext<LabwareFields>()

  const label = 'Stacking Offset (Optional)'

  const isTiprack = values.labwareType === 'tipRack'
  const isVBottom = values.wellBottomShape === 'v'
  const isFlatBottom = values.wellBottomShape === 'flat'
  const isCircular = values.wellShape === 'circular'
  const isReservoir = values.labwareType === 'reservoir'
  const isWellPlate = values.labwareType === 'wellPlate'
  const isFilterPlate = values.labwareType === 'filterPlate'
  const isStackableLabware =
    isWellPlate || isFilterPlate || values.labwareType === 'tipRack'
  const labwareHeight = values.labwareZDimension
  const has12Columns =
    values.gridColumns != null && parseInt(values.gridColumns) === 12
  const has8Rows = values.gridRows != null && parseInt(values.gridRows) === 8
  const has96Wells = has12Columns && has8Rows
  const skirtHeightMm = Number(values.skirtHeight)
  const canDeriveCollarStacking =
    isFilterPlate && Number.isFinite(skirtHeightMm) && skirtHeightMm > 0

  let modifiedAdapterDefinitions: LabwareDefinition2[] = []
  if (isFilterPlate) {
    modifiedAdapterDefinitions = adapterDefinitions.filter(definition =>
      (definition.parameters.quirks ?? []).some(
        quirk => quirk === 'vacuumModuleDock' || quirk === 'vacuumSpacer'
      )
    )
  } else if (isTiprack) {
    modifiedAdapterDefinitions = adapterDefinitions.filter(
      definition =>
        definition.parameters.loadName === 'opentrons_flex_96_tiprack_adapter'
    )
  }
  if (
    !isFilterPlate &&
    isVBottom &&
    values.labwareType !== 'reservoir' &&
    has96Wells
  ) {
    modifiedAdapterDefinitions = adapterDefinitions.filter(
      definition =>
        definition.parameters.loadName === 'opentrons_96_pcr_adapter' ||
        definition.parameters.loadName === 'opentrons_96_well_aluminum_block'
    )
  }
  if (isFlatBottom && (isReservoir || isWellPlate)) {
    modifiedAdapterDefinitions = adapterDefinitions.filter(
      definition =>
        definition.parameters.loadName ===
          'opentrons_aluminum_flat_bottom_plate' ||
        definition.parameters.loadName === 'opentrons_universal_flat_adapter'
    )
  }

  if (
    isFlatBottom &&
    isCircular &&
    values.labwareType === 'wellPlate' &&
    has96Wells
  ) {
    modifiedAdapterDefinitions = adapterDefinitions.filter(
      definition =>
        definition.parameters.loadName === 'opentrons_96_flat_bottom_adapter' ||
        definition.parameters.loadName ===
          'opentrons_aluminum_flat_bottom_plate' ||
        definition.parameters.loadName === 'opentrons_universal_flat_adapter'
    )
  }
  if (!isFilterPlate && !isCircular && isVBottom && has96Wells) {
    modifiedAdapterDefinitions = adapterDefinitions.filter(
      definition =>
        definition.parameters.loadName === 'opentrons_96_deep_well_adapter' ||
        definition.parameters.loadName ===
          'opentrons_96_deep_well_temp_mod_adapter'
    )
  }

  let modifiedModuleModels = MODULE_MODELS_WITH_NO_ADAPTERS
  if (isFilterPlate) {
    modifiedModuleModels = []
  } else if (has96Wells) {
    if (
      (labwareHeight != null &&
        parseInt(labwareHeight) > HIGHEST_TC_COMPATIBLE_LABWARE_HEIGHT) ||
      !isCircular ||
      !isVBottom
    ) {
      modifiedModuleModels = MODULE_MODELS_WITH_NO_ADAPTERS.filter(
        module => module !== THERMOCYCLER_MODULE_V2
      )
    }
    if (isFlatBottom || values.labwareType === 'reservoir') {
      modifiedModuleModels = modifiedModuleModels.filter(
        module => module !== MAGNETIC_BLOCK_V1
      )
    }
  } else {
    modifiedModuleModels = []
  }

  const vacuumCollars = modifiedAdapterDefinitions.filter(isVacuumCollar)
  const checkedCollarLoadNames = Object.keys(values.compatibleAdapters)
    .filter(loadName =>
      vacuumCollars.some(
        definition => definition.parameters.loadName === loadName
      )
    )
    .sort()
    .join(',')
  const didPreselectCollarsRef = useRef(false)

  // Pre-select both vacuum collars for filter plates (once per filter-plate session).
  useEffect(() => {
    if (!isFilterPlate) {
      didPreselectCollarsRef.current = false
      return
    }
    if (didPreselectCollarsRef.current || vacuumCollars.length === 0) {
      return
    }
    const anyCollarChecked = vacuumCollars.some(
      definition =>
        values.compatibleAdapters[definition.parameters.loadName] !== undefined
    )
    if (anyCollarChecked) {
      didPreselectCollarsRef.current = true
      return
    }

    const nextAdapters = { ...values.compatibleAdapters }
    vacuumCollars.forEach(definition => {
      nextAdapters[definition.parameters.loadName] = canDeriveCollarStacking
        ? getVacuumCollarStackingMeasurement(
            definition.dimensions.zDimension,
            skirtHeightMm,
            getVacuumCollarSeatingInset(definition)
          )
        : 0
    })
    didPreselectCollarsRef.current = true
    setFieldValue('compatibleAdapters', nextAdapters)
  }, [
    canDeriveCollarStacking,
    isFilterPlate,
    setFieldValue,
    skirtHeightMm,
    vacuumCollars
      .map(definition => definition.parameters.loadName)
      .sort()
      .join(','),
  ])

  // Keep checked collar measurements in sync when skirt height changes.
  useEffect(() => {
    if (!canDeriveCollarStacking || checkedCollarLoadNames === '') {
      return
    }
    let changed = false
    const nextAdapters = { ...values.compatibleAdapters }
    vacuumCollars.forEach(definition => {
      const loadName = definition.parameters.loadName
      if (nextAdapters[loadName] === undefined) {
        return
      }
      const derived = getVacuumCollarStackingMeasurement(
        definition.dimensions.zDimension,
        skirtHeightMm,
        getVacuumCollarSeatingInset(definition)
      )
      if (nextAdapters[loadName] !== derived) {
        nextAdapters[loadName] = derived
        changed = true
      }
    })
    if (changed) {
      setFieldValue('compatibleAdapters', nextAdapters)
    }
  }, [
    canDeriveCollarStacking,
    checkedCollarLoadNames,
    setFieldValue,
    skirtHeightMm,
  ])

  if (
    isEveryFieldHidden(fieldList, values) ||
    values.labwareType === 'tubeRack' ||
    values.labwareType === 'aluminumBlock' ||
    (modifiedModuleModels.length === 0 &&
      modifiedAdapterDefinitions.length === 0)
  ) {
    return null
  }

  return (
    <div className={styles.new_definition_section}>
      <SectionBody label={label} id="StackingOffsets">
        <>
          {Object.values(values.compatibleAdapters).length > 0 ||
          Object.values(values.compatibleModules).length > 0 ? (
            <Box
              marginBottom={
                errors.compatibleAdapters != null ||
                errors.compatibleModules != null
                  ? '0rem'
                  : '-1rem'
              }
            >
              <AlertItem
                type="warning"
                title="The stacking offset fields require App version 7.0.0 or higher"
              />
            </Box>
          ) : null}
          <FormAlerts
            values={values}
            touched={touched}
            errors={errors}
            fieldList={fieldList}
          />
          <div className={styles.flex_row_no_columns}>
            <div className={styles.instructions_column}>
              <p>{STACKING_OFFSET_PURPOSE}</p>
              <p>{STACKING_OFFSET_HOW_TO}</p>
            </div>
            {isStackableLabware && (
              <>
                <LegacyStyledText
                  forwardedAs="h3"
                  fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                >
                  Labware
                </LegacyStyledText>
                <img
                  src={heightOfTwoPlates}
                  alt="Labware stacking offset image"
                  style={{ width: '300px', height: 'auto' }}
                />
                <div className={styles.form_fields_column}>
                  <TextField
                    name="stackedLabwareZDimension"
                    inputMasks={[maskTo2Decimal]}
                    units="mm"
                  />
                  <StackingAlerts values={values} touched={touched} />
                </div>
              </>
            )}
            {modifiedAdapterDefinitions.length === 0 ? null : (
              <Flex gridGap={SPACING.spacing4} flexDirection={DIRECTION_COLUMN}>
                <LegacyStyledText
                  forwardedAs="h3"
                  fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                >
                  Adapters
                </LegacyStyledText>
                <img
                  src={src}
                  alt="Stacking offset image"
                  style={{ width: '300px', height: 'auto' }}
                />
                {modifiedAdapterDefinitions.map((definition, index) => {
                  const key = definition.parameters.loadName
                  const fieldName = `compatibleAdapters.${key}`
                  const isChecked = values.compatibleAdapters[key] !== undefined
                  return (
                    <Flex
                      key={`${key}_${index}`}
                      justifyContent={JUSTIFY_SPACE_BETWEEN}
                      alignItems={ALIGN_CENTER}
                      flexDirection={DIRECTION_ROW}
                      height="2rem"
                    >
                      <Flex zIndex={2}>
                        <CheckboxField
                          name={fieldName}
                          value={isChecked}
                          label={definition.metadata.displayName}
                          onChange={() => {
                            const compatibleAdaptersCopy = {
                              ...values.compatibleAdapters,
                            }
                            if (isChecked) {
                              const { [key]: _, ...newCompatibleAdapters } =
                                compatibleAdaptersCopy
                              setFieldValue(
                                'compatibleAdapters',
                                newCompatibleAdapters
                              )
                            } else {
                              const initialValue =
                                canDeriveCollarStacking &&
                                isVacuumCollar(definition)
                                  ? getVacuumCollarStackingMeasurement(
                                      definition.dimensions.zDimension,
                                      skirtHeightMm,
                                      getVacuumCollarSeatingInset(definition)
                                    )
                                  : 0
                              setFieldValue('compatibleAdapters', {
                                ...compatibleAdaptersCopy,
                                [key]: initialValue,
                              })
                            }
                          }}
                        />
                      </Flex>
                      <div className={styles.form_fields_column}>
                        {isChecked ? (
                          <TextField
                            name={fieldName as any}
                            inputMasks={[makeMaskToDecimal(2)]}
                            units="mm"
                          />
                        ) : null}
                      </div>
                    </Flex>
                  )
                })}
              </Flex>
            )}
            {isTiprack || modifiedModuleModels.length === 0 ? null : (
              <Flex
                flexDirection={DIRECTION_COLUMN}
                marginTop={SPACING.spacing4}
                gridGap={SPACING.spacing4}
              >
                <LegacyStyledText
                  forwardedAs="h3"
                  fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                >
                  Modules
                </LegacyStyledText>
                {modifiedModuleModels.map((model, index) => {
                  const fieldName = `compatibleModules.${model}`
                  const isChecked =
                    values.compatibleModules[model] !== undefined

                  return (
                    <Flex
                      flexDirection={DIRECTION_COLUMN}
                      key={`${model}_${index}`}
                    >
                      <Flex
                        key={index}
                        justifyContent={JUSTIFY_SPACE_BETWEEN}
                        alignItems={ALIGN_CENTER}
                        flexDirection={DIRECTION_ROW}
                        height="2rem"
                      >
                        <Flex zIndex={2}>
                          <CheckboxField
                            name={fieldName}
                            value={isChecked}
                            label={getModuleDisplayName(model)}
                            onChange={() => {
                              const compatibleModulesCopy = {
                                ...values.compatibleModules,
                              }
                              if (isChecked) {
                                const { [model]: _, ...newCompatibleModules } =
                                  compatibleModulesCopy
                                setFieldValue(
                                  'compatibleModules',
                                  newCompatibleModules
                                )
                              } else {
                                setFieldValue('compatibleModules', {
                                  ...compatibleModulesCopy,
                                  [model]: 0,
                                })
                              }
                            }}
                          />
                        </Flex>
                        <div className={styles.form_fields_column}>
                          {isChecked ? (
                            <TextField
                              name={fieldName as any}
                              inputMasks={[makeMaskToDecimal(2)]}
                              units="mm"
                            />
                          ) : null}
                        </div>
                      </Flex>
                      {isChecked ? (
                        <div
                          style={{
                            height: '2.0rem',
                            fontSize: '0.75rem',
                          }}
                        >
                          <p>
                            {model === MAGNETIC_BLOCK_V1
                              ? 'Measure from the bottom of the Magnetic Block to the top of the labware.'
                              : 'Measure from the bottom of the Thermocycler block to the top of the labware. Use the narrow side of the calipers.'}
                          </p>
                        </div>
                      ) : null}
                    </Flex>
                  )
                })}
              </Flex>
            )}
          </div>
        </>
      </SectionBody>
    </div>
  )
}
