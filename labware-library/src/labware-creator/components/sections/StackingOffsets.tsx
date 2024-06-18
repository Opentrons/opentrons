import * as React from 'react'
import { useFormikContext } from 'formik'
import {
  MAGNETIC_BLOCK_V1,
  THERMOCYCLER_MODULE_V2,
  getAllDefinitions,
  getModuleDisplayName,
} from '@opentrons/shared-data'
import {
  ALIGN_CENTER,
  CheckboxField,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  TYPOGRAPHY,
  StyledText,
  AlertItem,
  Box,
} from '@opentrons/components'
import { isEveryFieldHidden } from '../../utils'
import { makeMaskToDecimal } from '../../fieldMasks'
import { FormAlerts } from '../alerts/FormAlerts'
import { TextField } from '../TextField'
import { SectionBody } from './SectionBody'
import type { LabwareDefinition2, ModuleModel } from '@opentrons/shared-data'
import type { LabwareFields } from '../../fields'

import styles from '../../styles.module.css'

const HIGHEST_TC_COMPATIBLE_LABWARE_HEIGHT = 16.06
const MODULE_MODELS_WITH_NO_ADAPTERS: ModuleModel[] = [
  MAGNETIC_BLOCK_V1,
  THERMOCYCLER_MODULE_V2,
]

export function StackingOffsets(): JSX.Element | null {
  const labwareDefinitions = getAllDefinitions()
  const adapterDefinitions = Object.values(
    labwareDefinitions
  ).filter(definition => definition.allowedRoles?.includes('adapter'))

  const fieldList: Array<keyof LabwareFields> = [
    'compatibleAdapters',
    'compatibleModules',
  ]
  const {
    values,
    errors,
    touched,
    setFieldValue,
  } = useFormikContext<LabwareFields>()

  if (isEveryFieldHidden(fieldList, values)) {
    return null
  }

  const label = 'Stacking Offset (Optional)'

  const isTiprack = values.labwareType === 'tipRack'
  const isVBottom = values.wellBottomShape === 'v'
  const isFlatBottom = values.wellBottomShape === 'flat'
  const isCircular = values.wellShape === 'circular'
  const isReservoir = values.labwareType === 'reservoir'
  const labwareHeight = values.labwareZDimension
  const has12Columns =
    values.gridColumns != null && parseInt(values.gridColumns) === 12
  const has8Rows = values.gridRows != null && parseInt(values.gridRows) === 8
  const has96Wells = has12Columns && has8Rows

  let modifiedAdapterDefinitions: LabwareDefinition2[] = []
  if (isTiprack) {
    modifiedAdapterDefinitions = adapterDefinitions.filter(
      definition =>
        definition.parameters.loadName === 'opentrons_flex_96_tiprack_adapter'
    )
  }
  if (isVBottom && values.labwareType !== 'reservoir' && has96Wells) {
    modifiedAdapterDefinitions = adapterDefinitions.filter(
      definition =>
        definition.parameters.loadName === 'opentrons_96_pcr_adapter' ||
        definition.parameters.loadName === 'opentrons_96_well_aluminum_block'
    )
  }
  if (isFlatBottom && isReservoir) {
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
    values.labwareType !== 'reservoir' &&
    has96Wells
  ) {
    modifiedAdapterDefinitions = adapterDefinitions.filter(
      definition =>
        definition.parameters.loadName === 'opentrons_96_flat_bottom_adapter'
    )
  }
  if (!isCircular && isVBottom && has96Wells) {
    modifiedAdapterDefinitions = adapterDefinitions.filter(
      definition =>
        definition.parameters.loadName === 'opentrons_96_deep_well_adapter' ||
        definition.parameters.loadName ===
          'opentrons_96_deep_well_temp_mod_adapter'
    )
  }

  let modifiedModuleModels = MODULE_MODELS_WITH_NO_ADAPTERS
  if (has96Wells) {
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

  if (
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
              <p>
                Select which adapters or modules this labware will be placed on.
              </p>
              <p>
                Stacking offset is required for labware to be placed on modules
                and adapters. Measure from the bottom of the adapter to the
                highest part of the labware using a pair of calipers.
              </p>
            </div>
            {modifiedAdapterDefinitions.length === 0 ? null : (
              <Flex gridGap={SPACING.spacing4} flexDirection={DIRECTION_COLUMN}>
                <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
                  Adapters
                </StyledText>
                {modifiedAdapterDefinitions.map((definition, index) => {
                  const key = definition.parameters.loadName
                  const fieldName = `compatibleAdapters.${key}`
                  const isChecked = values.compatibleAdapters[key] !== undefined

                  return (
                    <Flex
                      flexDirection={DIRECTION_COLUMN}
                      key={`${key}_${index}`}
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
                            label={definition.metadata.displayName}
                            onChange={() => {
                              const compatibleAdaptersCopy = {
                                ...values.compatibleAdapters,
                              }
                              if (isChecked) {
                                const {
                                  [key]: _,
                                  ...newCompatibleAdapters
                                } = compatibleAdaptersCopy
                                setFieldValue(
                                  'compatibleAdapters',
                                  newCompatibleAdapters
                                )
                              } else {
                                setFieldValue('compatibleAdapters', {
                                  ...compatibleAdaptersCopy,
                                  [key]: 0,
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
                      {key === 'opentrons_flex_96_tiprack_adapter' &&
                      isChecked ? (
                        <div
                          style={{
                            marginTop: '-1.2rem',
                            height: '2.0rem',
                            fontSize: '0.75rem',
                          }}
                        >
                          <p>
                            Measure from the bottom of the tip rack adapter to
                            the top of the tip rack.
                          </p>
                        </div>
                      ) : null}
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
                <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
                  Modules
                </StyledText>
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
                                const {
                                  [model]: _,
                                  ...newCompatibleModules
                                } = compatibleModulesCopy
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
                            marginTop: '-1.2rem',
                            height: '2.0rem',
                            fontSize: '0.75rem',
                          }}
                        >
                          <p>
                            {model === MAGNETIC_BLOCK_V1
                              ? 'Measure from the bottom of the Magnetic Block to the top of the labware.'
                              : 'Measure the inside of the Thermocycler using the narrow side of a pair of calipers from the bottom of the block to the top of the labware.'}
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
