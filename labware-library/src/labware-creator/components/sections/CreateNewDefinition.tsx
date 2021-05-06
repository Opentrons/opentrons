import * as React from 'react'
import { useFormikContext } from 'formik'
import cx from 'classnames'
import { PrimaryButton } from '@opentrons/components'
import { Dropdown } from '../../components/Dropdown'
import { isEveryFieldHidden } from '../../utils'
import { labwareTypeOptions } from '../../fields'
import { FormAlerts } from '../FormAlerts'
import { SectionBody } from './SectionBody'

import styles from '../../styles.css'
import type { LabwareFields } from '../../fields'

interface Props {
  showDropDownOptions: boolean
  disabled: boolean
  labwareTypeChildFields: any
  onClick: () => void
}

const Content = (props: Props): JSX.Element => {
  const {
    disabled,
    labwareTypeChildFields,
    onClick,
    showDropDownOptions,
  } = props
  return (
    <div className={styles.labware_type_fields}>
      {showDropDownOptions && (
        <>
          <Dropdown name="labwareType" options={labwareTypeOptions} />
          {labwareTypeChildFields}
        </>
      )}

      <PrimaryButton
        className={styles.start_creating_btn}
        disabled={disabled}
        onClick={onClick}
      >
        start creating labware
      </PrimaryButton>
    </div>
  )
}

export const CreateNewDefinition = (props: Props): JSX.Element | null => {
  const fieldList: Array<keyof LabwareFields> = [
    'labwareType',
    'tubeRackInsertLoadName',
    'aluminumBlockType',
    'aluminumBlockChildType',
  ]
  const { values, errors, touched } = useFormikContext<LabwareFields>()

  if (isEveryFieldHidden(fieldList, values)) {
    return null
  }

  return (
    <div className={styles.new_definition_section}>
      <SectionBody
        label="Create a new definition"
        headingClassName={cx(styles.setup_heading, {
          [styles.disabled_section]: !props.showDropDownOptions,
        })}
      >
        <>
          <FormAlerts touched={touched} errors={errors} fieldList={fieldList} />
          <Content {...props} />
        </>
      </SectionBody>
    </div>
  )
}
