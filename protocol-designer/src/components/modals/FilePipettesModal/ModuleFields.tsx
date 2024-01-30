import * as React from 'react'
import { Control, Controller, UseFormTrigger } from 'react-hook-form'
import {
  DeprecatedCheckboxField,
  DropdownField,
  FormGroup,
} from '@opentrons/components'
import { MAGNETIC_BLOCK_TYPE, ModuleType } from '@opentrons/shared-data'
import { i18n } from '../../../localization'
import {
  DEFAULT_MODEL_FOR_MODULE_TYPE,
  MODELS_FOR_MODULE_TYPE,
} from '../../../constants'
import { FormModulesByType } from '../../../step-forms'
import { ModuleDiagram } from '../../modules'
import styles from './FilePipettesModal.css'
import type { FormState } from '../CreateFileWizard/types'

export interface ModuleFieldsProps {
  errors:
    | null
    | string
    | {
        magneticModuleType?: {
          model: string
        }
        temperatureModuleType?: {
          model: string
        }
        thermocyclerModuleType?: {
          model: string
        }
        heaterShakerModuleType?: {
          model: string
        }
        magneticBlockType?: {
          model: string
        }
      }
  touched:
    | null
    | boolean
    | {
        magneticModuleType?: {
          model: boolean
        }
        temperatureModuleType?: {
          model: boolean
        }
        thermocyclerModuleType?: {
          model: boolean
        }
        heaterShakerModuleType?: {
          model: boolean
        }
        magneticBlockType?: {
          model: boolean
        }
      }
  values: FormModulesByType
  control: Control<FormState, any>
  trigger: UseFormTrigger<FormState>
}

export function ModuleFields(props: ModuleFieldsProps): JSX.Element {
  const { values, errors, touched, control, trigger } = props
  // TODO(BC, 2023-05-11): REMOVE THIS MAG BLOCK FILTER BEFORE LAUNCH TO INCLUDE IT AMONG MODULE OPTIONS
  // @ts-expect-error(sa, 2021-6-21): Object.keys not smart enough to take the keys of FormModulesByType
  const modules: ModuleType[] = Object.keys(values).filter(
    k => k !== MAGNETIC_BLOCK_TYPE
  )

  return (
    <div className={styles.modules_row}>
      {modules.map((moduleType, i) => {
        const label = i18n.t(`modules.module_display_names.${moduleType}`)
        const defaultModel = DEFAULT_MODEL_FOR_MODULE_TYPE[moduleType]
        const selectedModel = values[moduleType].model
        return (
          <div className={styles.module_form_group} key={`${moduleType}`}>
            <Controller
              control={control}
              name={`modulesByType.${moduleType}.onDeck`}
              render={({ field }) => (
                <DeprecatedCheckboxField
                  label={label}
                  name={`modulesByType.${moduleType}.onDeck`}
                  value={field.value}
                  onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                    const type: ModuleType = e.target.value as ModuleType
                    field.onChange(e)
                    await trigger(`modulesByType.${type}.onDeck`)
                  }}
                  tabIndex={i}
                />
              )}
            />

            <ModuleDiagram
              type={moduleType}
              model={selectedModel ?? defaultModel}
            />
            <Controller
              control={control}
              name={`modulesByType.${moduleType}.model`}
              render={({ field }) => (
                <div className={styles.module_model}>
                  {values[moduleType].onDeck && (
                    <FormGroup label="Model*">
                      <DropdownField
                        error={
                          touched &&
                          typeof touched !== 'boolean' &&
                          touched[moduleType] &&
                          // @ts-expect-error(sa, 2021-6-21): not a valid way to type narrow
                          touched[moduleType].model &&
                          errors !== null &&
                          typeof errors !== 'string' &&
                          errors[moduleType]
                            ? // @ts-expect-error(sa, 2021-6-21): not a valid way to type narrow
                              errors[moduleType].model
                            : null
                        }
                        tabIndex={i}
                        name={`modulesByType.${moduleType}.model`}
                        options={MODELS_FOR_MODULE_TYPE[moduleType]}
                        value={selectedModel ?? defaultModel}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    </FormGroup>
                  )}
                </div>
              )}
            />
          </div>
        )
      })}
    </div>
  )
}
