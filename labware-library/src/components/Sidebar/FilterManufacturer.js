// @flow
// filter labware by manufacturer
import * as React from 'react'

import {SelectField} from '@opentrons/components'
import styles from './styles.css'

// TODO(mc, 2019-03-13): i18n
const EN_MANUFACTURER = 'manufacturer'

// TODO(mc, 2019-03-13): do not hardcode manufacturers; pull from imports
const MANUFACTURERS = [{label: 'All', value: 'all'}]

export default function FilterManufacturer () {
  return (
    <label className={styles.filter_manufacturer}>
      <p className={styles.filter_manufacturer_label}>{EN_MANUFACTURER}</p>
      <SelectField
        className={styles.filter_manufacturer_select}
        name="manufacturer"
        value="all"
        options={MANUFACTURERS}
        onValueChange={(_, value) => {
          // TODO(mc, 2019-03-14): add to query params
          console.log(value)
        }}
      />
    </label>
  )
}
