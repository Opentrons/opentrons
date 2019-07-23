// @flow
import * as React from 'react'
import { connect } from 'formik'
import { AlertItem } from '@opentrons/components'
import styles from './Section.css'
import type { LabwareFields } from '../fields'

// TODO: Make this DRY, don't require fields (in children) and also fieldList.
type Props = {|
  label: string,
  fieldList?: Array<$Keys<LabwareFields>>,
  children?: React.Node,
  formik?: any, // TODO IMMEDIATELY type this??
|}
const Section = connect((props: Props) => {
  const fieldList = props.fieldList || []
  const dirtyFieldNames = fieldList.filter(
    name => props.formik?.touched?.[name]
  )
  const allErrors = dirtyFieldNames.map(name => {
    const errors: ?string = props.formik?.errors?.[name]
    if (errors != null) {
      return <AlertItem key={name} type="warning" title={errors} />
    }
    return null
  })
  return (
    <div className={styles.section_wrapper}>
      <h2 className={styles.section_header}>{props.label}</h2>
      <div>{allErrors}</div>
      {props.children}
    </div>
  )
})

export default Section
