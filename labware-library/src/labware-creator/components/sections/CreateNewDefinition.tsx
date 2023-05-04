import { Dropdown } from '../../components/Dropdown'
import { labwareTypeOptions, labwareTypeAutofills } from '../../fields'
import type { LabwareFields } from '../../fields'
import styles from '../../styles.css'
import { isEveryFieldHidden, makeAutofillOnChange } from '../../utils'
import { FormAlerts } from '../alerts/FormAlerts'
import { SectionBody } from './SectionBody'
import { PrimaryBtn } from '@opentrons/components'
import cx from 'classnames'
import { useFormikContext } from 'formik'
import * as React from 'react'

interface Props {
  showDropDownOptions: boolean
  disabled: boolean
  labwareTypeChildFields: any
  onClick: () => void
}

export const CreateNewDefinition = (props: Props): JSX.Element | null => {
  const fieldList: Array<keyof LabwareFields> = [
    'labwareType',
    'tubeRackInsertLoadName',
    'aluminumBlockType',
    'aluminumBlockChildType',
  ]
  const {
    disabled,
    onClick,
    showDropDownOptions,
    labwareTypeChildFields,
  } = props
  const {
    values,
    errors,
    touched,
    setValues,
    setTouched,
  } = useFormikContext<LabwareFields>()

  if (isEveryFieldHidden(fieldList, values)) {
    return null
  }

  const content = (
    <div className={styles.labware_type_fields}>
      {showDropDownOptions && (
        <>
          <Dropdown
            name="labwareType"
            options={labwareTypeOptions}
            onValueChange={makeAutofillOnChange({
              name: 'labwareType',
              autofills: labwareTypeAutofills,
              values,
              touched,
              setTouched,
              setValues,
            })}
          />
          {labwareTypeChildFields}
        </>
      )}

      <PrimaryBtn
        className={styles.start_creating_btn}
        disabled={disabled}
        onClick={onClick}
      >
        start creating labware
      </PrimaryBtn>
    </div>
  )

  return (
    <div className={styles.new_definition_section}>
      <SectionBody
        label="Create a new definition"
        headingClassName={cx(styles.setup_heading, {
          [styles.disabled_section]: !props.showDropDownOptions,
        })}
      >
        <>
          <FormAlerts
            values={values}
            touched={touched}
            errors={errors}
            fieldList={fieldList}
          />
          {content}
        </>
      </SectionBody>
    </div>
  )
}
