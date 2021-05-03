import * as React from 'react'
import { useFormikContext } from 'formik'
import cx from 'classnames'
import { PrimaryButton } from '@opentrons/components'
import { Dropdown } from '../../components/Dropdown'
import { labwareTypeOptions } from '../../fields'
import { getFormAlerts } from '../utils/getFormAlerts'
import { SectionBody } from './SectionBody'

import styles from '../../styles.css'
import type { LabwareFields } from '../../fields'

interface Props {
  showDropDownOptions: boolean
  disabled: boolean
  labwareTypeChildFields: any
  onClick: () => void
}

const getContent = (props: Props): JSX.Element => {
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

export const CreateNewDefinition = (props: Props): JSX.Element => {
  const fieldList: Array<keyof LabwareFields> = [
    'labwareType',
    'tubeRackInsertLoadName',
    'aluminumBlockType',
    'aluminumBlockChildType',
  ]
  const { values, errors, touched } = useFormikContext<LabwareFields>()

  return (
    <div className={styles.new_definition_section}>
      <SectionBody
        label="Create a new definition"
        headingClassName={cx(styles.setup_heading, {
          [styles.disabled_section]: !props.showDropDownOptions,
        })}
      >
        <>
          {getFormAlerts({ values, touched, errors, fieldList })}
          {getContent({ ...props })}
        </>
      </SectionBody>
    </div>
  )
}
