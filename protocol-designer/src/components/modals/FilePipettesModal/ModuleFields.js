// @flow
import * as React from 'react'
import i18n from '../../../localization'
import { CheckboxField, DropdownField, FormGroup } from '@opentrons/components'

import styles from './FilePipettesModal.css'

import type { FormModulesByType } from '../../../step-forms'

type Props = {
  values: FormModulesByType,
  onFieldChange: (type: string, value: boolean) => mixed,
}
export default function ModuleFields(props: Props) {
  const { onFieldChange, values } = props
  const modules = Object.keys(values)
  const handleOnDeckChange = (type: string) => (
    e: SyntheticInputEvent<HTMLInputElement>
  ) => onFieldChange(type, e.currentTarget.checked || false)

  return (
    <div className={styles.modules_row}>
      {modules.map((m, i) => {
        const label = i18n.t(`modal.new_protocol.module_display_names.${m}`)
        return (
          <div className={styles.module_form_group} key={`${m}`}>
            <CheckboxField
              label={label}
              value={values[`${m}`].onDeck}
              onChange={handleOnDeckChange(m)}
              tabIndex={i}
            />
            <img src={MODULE_IMG_BY_NAME[m]} alt={`${m}`} />
            <div className={styles.module_model}>
              {values[m].onDeck && (
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

const MODULE_IMG_BY_NAME = {
  magdeck: require('../../../images/modules/magdeck.jpg'),
  tempdeck: require('../../../images/modules/tempdeck.jpg'),
  thermocycler: require('../../../images/modules/thermocycler.jpg'),
}
