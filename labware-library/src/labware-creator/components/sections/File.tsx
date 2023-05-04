import { maskLoadName } from '../../fieldMasks'
import { LabwareFields } from '../../fields'
import { getDefaultDisplayName, getDefaultLoadName } from '../../formSelectors'
import styles from '../../styles.css'
import { isEveryFieldHidden } from '../../utils'
import { TextField } from '../TextField'
import { FormAlerts } from '../alerts/FormAlerts'
import { SectionBody } from './SectionBody'
import { useFormikContext } from 'formik'
import * as React from 'react'

const Content = (props: { values: LabwareFields }): JSX.Element => (
  <div className={styles.flex_row}>
    <div className={styles.export_form_fields}>
      <TextField
        name="displayName"
        placeholder={getDefaultDisplayName(props.values)}
      />
      <TextField
        name="loadName"
        placeholder={getDefaultLoadName(props.values)}
        caption="Only lower case letters, numbers, periods, and underscores may be used"
        inputMasks={[maskLoadName]}
      />
    </div>
  </div>
)

export const File = (): JSX.Element | null => {
  const fieldList: Array<keyof LabwareFields> = ['loadName', 'displayName']
  const { values, errors, touched } = useFormikContext<LabwareFields>()

  if (isEveryFieldHidden(fieldList, values)) {
    return null
  }

  return (
    <SectionBody label="File" id="File">
      <FormAlerts
        values={values}
        touched={touched}
        errors={errors}
        fieldList={fieldList}
      />
      <Content values={values} />
    </SectionBody>
  )
}
