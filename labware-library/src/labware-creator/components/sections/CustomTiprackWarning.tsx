import * as React from 'react'
import { useFormikContext } from 'formik'
import { SectionBody } from './SectionBody'
import styles from '../../styles.css'

import type { LabwareFields } from '../../fields'

export const CustomTiprackWarning = (): JSX.Element | null => {
  const { values } = useFormikContext<LabwareFields>()

  if (values.labwareType === 'tipRack') {
    return (
      <div className={styles.new_definition_section}>
        <SectionBody
          label="Custom Tip Racks Are Not Recommended"
          id="CustomTiprackWarning"
        >
          <div className={styles.flex_row}>
            <p className={styles.instructions_text}>
              Opentrons tip racks are recommended for use with the OT-2. You are
              welcome to try to use third party tip racks but accuracy is not
              guaranteed.
            </p>
          </div>
        </SectionBody>
      </div>
    )
  }

  return null
}
