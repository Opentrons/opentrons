// @flow
import { CheckboxField, DropdownField, FormGroup } from '@opentrons/components'
import type { ModuleRealType } from '@opentrons/shared-data'
import cx from 'classnames'
import * as React from 'react'

import {
  DEFAULT_MODEL_FOR_MODULE_TYPE,
  MODELS_FOR_MODULE_TYPE,
} from '../../../constants'
import { i18n } from '../../../localization'
import type { FormModulesByType } from '../../../step-forms'
import { ModuleDiagram } from '../../modules'
import styles from './FilePipettesModal.css'

type Props = {|
  // TODO 2020-3-20 use formik typing here after we update the def in flow-typed
  errors:
    | null
    | string
    | {|
        magneticModuleType?: {
          model: string,
        },
        temperatureModuleType?: {
          model: string,
        },
        thermocyclerModuleType?: {
          model: string,
        },
      |},
  touched:
    | null
    | boolean
    | {
        magneticModuleType?: {
          model: boolean,
        },
        temperatureModuleType?: {
          model: boolean,
        },
        thermocyclerModuleType?: {
          model: boolean,
        },
      },
  values: FormModulesByType,
  thermocyclerEnabled: ?boolean,
  onFieldChange: (
    event: SyntheticInputEvent<HTMLSelectElement | HTMLInputElement>
  ) => mixed,
  onSetFieldValue: (field: string, value: string | null) => void,
  onSetFieldTouched: (field: string, touched: boolean) => void,
  onBlur: (event: SyntheticFocusEvent<HTMLSelectElement>) => mixed,
|}

export function ModuleFields(props: Props): React.Node {
  const {
    onFieldChange,
    onSetFieldValue,
    onSetFieldTouched,
    onBlur,
    values,
    thermocyclerEnabled,
    errors,
    touched,
  } = props
  const modules = Object.keys(values)
  const handleOnDeckChange = (type: ModuleRealType) => (
    e: SyntheticInputEvent<HTMLInputElement>
  ) => {
    const targetToClear = `modulesByType.${type}.model`

    onFieldChange(e)

    // only clear model dropdown if not TC
    if (targetToClear !== 'modulesByType.thermocyclerModuleType.model') {
      onSetFieldValue(targetToClear, null)
    }
    onSetFieldTouched(targetToClear, false)
  }

  const className = cx(styles.modules_row, {
    [styles.hide_thermo]: !thermocyclerEnabled,
  })

  return (
    <div className={className}>
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
                      touched[moduleType].model &&
                      errors !== null &&
                      typeof errors !== 'string' &&
                      errors[moduleType]
                        ? errors[moduleType].model
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
