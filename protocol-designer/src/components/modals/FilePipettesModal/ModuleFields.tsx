import * as React from 'react'
import { useSelector } from 'react-redux'
import { CheckboxField, DropdownField, FormGroup } from '@opentrons/components'
import { i18n } from '../../../localization'
import {
  DEFAULT_MODEL_FOR_MODULE_TYPE,
  MODELS_FOR_MODULE_TYPE,
} from '../../../constants'
import { ModuleDiagram } from '../../modules'
import { selectors as featureFlagSelectors } from '../../../feature-flags'

import styles from './FilePipettesModal.css'

import { ModuleType } from '@opentrons/shared-data'
import { FormModulesByType } from '../../../step-forms'

export interface ModuleFieldsProps {
  // TODO 2020-3-20 use formik typing here after we update the def in flow-typed
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
      }
  values: FormModulesByType
  onFieldChange: (event: React.ChangeEvent) => unknown
  onSetFieldValue: (field: string, value: string | null) => void
  onSetFieldTouched: (field: string, touched: boolean) => void
  onBlur: (event: React.FocusEvent<HTMLSelectElement>) => unknown
}

export function ModuleFields(props: ModuleFieldsProps): JSX.Element {
  const {
    onFieldChange,
    onSetFieldValue,
    onSetFieldTouched,
    onBlur,
    values,
    errors,
    touched,
  } = props
  const enableHeaterShaker = useSelector(
    featureFlagSelectors.getEnabledHeaterShaker
  )
  // @ts-expect-error(sa, 2021-6-21): Object.keys not smart enough to take the keys of FormModulesByType
  const modules: ModuleType[] = enableHeaterShaker
    ? Object.keys(values)
    : Object.keys(values).filter(module => module !== 'heaterShakerModuleType')
  const handleOnDeckChange = (type: ModuleType) => (e: React.ChangeEvent) => {
    const targetToClear = `modulesByType.${type}.model`

    onFieldChange(e)

    // only clear model dropdown if not TC
    if (targetToClear !== 'modulesByType.thermocyclerModuleType.model') {
      onSetFieldValue(targetToClear, null)
    }
    onSetFieldTouched(targetToClear, false)
  }

  return (
    <div className={styles.modules_row}>
      {modules.map((moduleType, i) => {
        const moduleTypeAccessor = `modulesByType.${moduleType}`
        const label = i18n.t(`modules.module_display_names.${moduleType}`)
        const defaultModel = DEFAULT_MODEL_FOR_MODULE_TYPE[moduleType]
        const selectedModel = values[moduleType].model

        return (
          <div className={styles.module_form_group} key={`${moduleType}`}>
            <CheckboxField
              label={label}
              name={`${moduleTypeAccessor}.onDeck`}
              value={values[moduleType].onDeck}
              onChange={handleOnDeckChange(moduleType)}
              tabIndex={i}
            />

            <ModuleDiagram
              type={moduleType}
              model={selectedModel ?? defaultModel}
            />

            <div className={styles.module_model}>
              {values[moduleType].onDeck && (
                <FormGroup label="Model*">
                  <DropdownField
                    error={
                      // TODO JF 2020-3-19 allow dropdowns to take error
                      // components from formik so we avoid manually doing this
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
                    name={`${moduleTypeAccessor}.model`}
                    options={MODELS_FOR_MODULE_TYPE[moduleType]}
                    value={selectedModel}
                    onChange={onFieldChange}
                    onBlur={onBlur}
                  />
                </FormGroup>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
