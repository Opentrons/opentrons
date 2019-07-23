// @flow
import * as React from 'react'
import { connect } from 'formik'
import { AlertItem } from '@opentrons/components'
import { getIsAutopopulated } from '../formikStatus'
import styles from './Section.css'
import type { LabwareFields } from '../fields'

// TODO: Make this DRY, don't require fields (in children) and also fieldList.
type Props = {|
  label: string,
  formik: any, // TODO IMMEDIATELY type this??
  fieldList?: Array<$Keys<LabwareFields>>,
  children?: React.Node,
|}
const Section = connect((props: Props) => {
  const fieldList = props.fieldList || []
  if (props.fieldList != null && fieldList.length > 0) {
    const numFieldsAutopopulated = props.fieldList
      .map(field => getIsAutopopulated(field, props.formik.status))
      .filter(Boolean).length

    if (numFieldsAutopopulated === fieldList.length) {
      // all fields are autopopulated
      return null
    }
    if (
      numFieldsAutopopulated > 0 &&
      numFieldsAutopopulated !== fieldList.length
    ) {
      console.error(
        `section "${
          props.label
        }" has fields where some but not all are autofilled - this shouldn't happen?!`
      )
    }
  }
  const dirtyFieldNames = fieldList.filter(
    name => props.formik?.touched?.[name]
  )
  const allErrors = dirtyFieldNames.map(name => {
    const errors: ?string = props.formik.errors[name]
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
