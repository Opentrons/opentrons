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
  Box,
  COLORS,
  CheckboxField,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { isEveryFieldHidden } from '../../utils'
import { makeMaskToDecimal } from '../../fieldMasks'
import { FormAlerts } from '../alerts/FormAlerts'
import { TextField } from '../TextField'
import { SectionBody } from './SectionBody'
import type { LabwareDefinition2, ModuleModel } from '@opentrons/shared-data'
import type { LabwareFields } from '../../fields'

import styles from '../../styles.module.css'

const ADAPTER_BLOCK_LIST = ['opentrons_96_deep_well_adapter']
const MODULE_MODELS_WITH_NO_ADAPTERS: ModuleModel[] = [
  MAGNETIC_BLOCK_V1,
  THERMOCYCLER_MODULE_V2,
]

export const StackingOffsets = (): JSX.Element | null => {
  const labwareDefinitions = getAllDefinitions(ADAPTER_BLOCK_LIST)
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

  const label = `Stacking Offset (Optional)`

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
  if (isVBottom) {
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
  if (isFlatBottom && isCircular) {
    modifiedAdapterDefinitions = adapterDefinitions.filter(
      definition =>
        definition.parameters.loadName === 'opentrons_96_flat_bottom_adapter'
    )
  }
  let modifiedModuleModels = MODULE_MODELS_WITH_NO_ADAPTERS
  if (
    (labwareHeight != null && parseInt(labwareHeight) > 16.06) ||
    !has96Wells ||
    !isCircular ||
    !isVBottom
  ) {
    modifiedModuleModels = MODULE_MODELS_WITH_NO_ADAPTERS.filter(
      module => module !== THERMOCYCLER_MODULE_V2
    )
  }
  return (
    <div className={styles.new_definition_section}>
      <SectionBody label={label} id="StackingOffsets">
        <>
          <FormAlerts
            values={values}
            touched={touched}
            errors={errors}
            fieldList={fieldList}
          />
          <div className={styles.instructions_column}>
            <p>
              Stacking offset is required for labware to be placed on modules
              and adapters. Measure from the bottom of the adapter to the
              highest part of the labware using a pair of calipers.
            </p>
          </div>
          {modifiedAdapterDefinitions.length === 0 ? null : (
            <Flex gridGap={SPACING.spacing4} flexDirection={DIRECTION_COLUMN}>
              <StyledText as="h3" fontWeight={600}>
                Adapters
              </StyledText>
              {modifiedAdapterDefinitions.map((definition, index) => {
                const key = definition.parameters.loadName
                const fieldName = `compatibleAdapters.${key}`
                const isChecked = values.compatibleAdapters[key] !== undefined

                return (
                  <Flex
                    key={index}
                    justifyContent={JUSTIFY_SPACE_BETWEEN}
                    alignItems={ALIGN_CENTER}
                    flexDirection={DIRECTION_ROW}
                    height="2rem"
                  >
                    <CheckboxField
                      name={fieldName}
                      value={isChecked}
                      label={definition.metadata.displayName}
                      onChange={() => {
                        const compatibleAdaptersCopy: Record<
                          string,
                          number
                        > = Object.keys(values.compatibleAdapters).reduce<
                          Record<string, number>
                        >((acc, adapterKey) => {
                          if (adapterKey !== key) {
                            acc[adapterKey] =
                              values.compatibleAdapters[adapterKey]
                          }
                          return acc
                        }, {})

                        if (!values.compatibleAdapters[key]) {
                          compatibleAdaptersCopy[key] = 0
                        }

                        setFieldValue(
                          'compatibleAdapters',
                          compatibleAdaptersCopy
                        )
                      }}
                    />
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
          {isTiprack ? null : (
            <>
              <Box
                borderBottom={`1px solid ${COLORS.grey30}`}
                marginY="1.5rem"
              />
              <Flex
                gridGap={SPACING.spacing4}
                flexDirection={DIRECTION_COLUMN}
                marginTop={SPACING.spacing4}
              >
                <StyledText as="h3" fontWeight={600}>
                  Module Models
                </StyledText>
                {modifiedModuleModels.map((model, index) => {
                  const fieldName = `compatibleModules.${model}`
                  const isChecked =
                    values.compatibleModules[model] !== undefined

                  return (
                    <Flex
                      key={index}
                      justifyContent={JUSTIFY_SPACE_BETWEEN}
                      alignItems={ALIGN_CENTER}
                      flexDirection={DIRECTION_ROW}
                      height="2rem"
                    >
                      <CheckboxField
                        name={fieldName}
                        value={isChecked}
                        label={getModuleDisplayName(model)}
                        onChange={() => {
                          const compatibleModulesCopy: Record<
                            string,
                            number
                          > = Object.keys(values.compatibleModules).reduce<
                            Record<string, number>
                          >((acc, key) => {
                            if (key !== model) {
                              acc[key] = values.compatibleModules[key]
                            }
                            return acc
                          }, {})

                          if (!values.compatibleModules[model]) {
                            compatibleModulesCopy[model] = 0
                          }

                          setFieldValue(
                            'compatibleModules',
                            compatibleModulesCopy
                          )
                        }}
                      />
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
            </>
          )}
        </>
      </SectionBody>
    </div>
  )
}
