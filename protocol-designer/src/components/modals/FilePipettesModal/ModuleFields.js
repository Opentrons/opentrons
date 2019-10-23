// @flow
import * as React from 'react'
import i18n from '../../../localization'
import { CheckboxField, DropdownField, FormGroup } from '@opentrons/components'

import styles from './FilePipettesModal.css'

import type { ModuleType } from '@opentrons/shared-data'
import type { FormModulesByType } from '../../../step-forms'

type Props = {|
  values: FormModulesByType,
  onFieldChange: (type: ModuleType, value: boolean) => mixed,
|}

const MODULE_IMG_BY_NAME = {
  magdeck: require('../../../images/modules/magdeck.jpg'),
  tempdeck: require('../../../images/modules/tempdeck.jpg'),
  thermocycler: require('../../../images/modules/thermocycler.jpg'),
}

export default function ModuleFields(props: Props) {
  const { onFieldChange, values } = props
  const modules = Object.keys(values)
  const handleOnDeckChange = (type: ModuleType) => (
    e: SyntheticInputEvent<HTMLInputElement>
  ) => onFieldChange(type, e.currentTarget.checked || false)

  return (
    <div className={styles.modules_row}>
      {modules.map((moduleType, i) => {
        const label = i18n.t(
          `modal.new_protocol.module_display_names.${moduleType}`
        )
        return (
          <div className={styles.module_form_group} key={`${moduleType}`}>
            <CheckboxField
              label={label}
              value={values[moduleType].onDeck}
              onChange={handleOnDeckChange(moduleType)}
              tabIndex={i}
            />
            <img src={MODULE_IMG_BY_NAME[moduleType]} alt={`${moduleType}`} />
            {/*
              TODO (ka 2019-10-22): This field is disabled until Gen 2 Modules are available
              - Until then, 'GEN1' is hardcoded
              - onChange returns null because onChange is required by DropdownFields
            */}
            <div className={styles.module_model}>
              {values[moduleType].onDeck && (
                <FormGroup label="Model">
                  <DropdownField
                    tabIndex={i}
                    options={[{ name: 'GEN1', value: 'GEN1' }]}
                    value={'GEN1'}
                    disabled
                    onChange={() => null}
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
