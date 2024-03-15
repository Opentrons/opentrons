import * as React from 'react'
import { useFormikContext } from 'formik'
import { SectionBody } from './SectionBody'
import styles from '../../styles.module.css'

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
            <div className={styles.instructions_text}>
              <p>
                Opentrons tip racks are recommended for use with the OT-2
                because they are specifically designed and verified for
                automation.
              </p>
              <p>
                Third party tips can fit, but not necessarily with a tight seal.
                You risk tips falling off mid-run as well as pipetting
                inaccuracy. They may also be more likely to bend or break.
              </p>
            </div>
          </div>
        </SectionBody>
      </div>
    )
  }

  return null
}
