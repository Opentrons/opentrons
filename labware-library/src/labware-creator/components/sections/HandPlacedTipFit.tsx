import * as React from 'react'
import { useFormikContext } from 'formik'
import { snugLooseOptions } from '../../fields'
import { getTipFitAlerts } from '../utils/getTipFitAlerts'
import { FormAlerts } from '../FormAlerts'
import { Dropdown } from '../Dropdown'
import { SectionBody } from './SectionBody'

import styles from '../../styles.css'

import type { LabwareFields } from '../../fields'

const Content = (): JSX.Element => (
  <div className={styles.flex_row}>
    <div className={styles.tip_fit_column}>
      <p>
        Place the tip you wish to use on the pipette you wish to use it on. Give
        the tip a wiggle to check the fit.
      </p>

      <p>
        Note that fit may vary between Single and 8 Channel pipettes, as well as
        between generations of the same pipette.
      </p>
    </div>
    <div className={styles.form_fields_column}>
      <Dropdown name="handPlacedTipFit" options={snugLooseOptions} />
    </div>
  </div>
)

export const HandPlacedTipFit = (): JSX.Element | null => {
  const fieldList: Array<keyof LabwareFields> = ['handPlacedTipFit']
  const { values, errors, touched } = useFormikContext<LabwareFields>()

  if (values.labwareType === 'tipRack') {
    return (
      <div className={styles.new_definition_section}>
        <SectionBody label="Hand-Placed Tip Fit">
          <>
            <FormAlerts
              touched={touched}
              errors={errors}
              fieldList={fieldList}
            />
            {getTipFitAlerts(values, touched)}
            <Content />
          </>
        </SectionBody>
      </div>
    )
  }

  return null
}
