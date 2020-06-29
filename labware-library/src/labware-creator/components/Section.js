// @flow
import { AlertItem } from '@opentrons/components'
import { connect } from 'formik'
import compact from 'lodash/compact'
import uniq from 'lodash/uniq'
import * as React from 'react'

import {
  type LabwareFields,
  IRREGULAR_LABWARE_ERROR,
  LINK_CUSTOM_LABWARE_FORM,
} from '../fields'
import { getIsHidden } from '../formSelectors'
import { LinkOut } from './LinkOut'
import styles from './Section.css'

// TODO: Make this DRY, don't require fields (in children) and also fieldList.
type Props = {|
  label: string,
  formik: any, // TODO IMMEDIATELY type this??
  additionalAlerts?: React.Node,
  fieldList?: Array<$Keys<LabwareFields>>,
  children?: React.Node,
  headingClassName?: string,
|}

export const Section: React.AbstractComponent<
  $Diff<Props, {| formik: mixed |}>
> = connect((props: Props) => {
  const fieldList = props.fieldList || []
  if (props.fieldList != null && fieldList.length > 0) {
    const numFieldsHidden = props.fieldList
      .map(field => getIsHidden(field, props.formik.values))
      .filter(Boolean).length

    if (numFieldsHidden === fieldList.length) {
      // all fields are hidden, don't render this Section
      return null
    }
  }

  // show Formik errors (from Yup) as WARNINGs for all dirty fields within this Section
  const dirtyFieldNames = fieldList.filter(
    name => props.formik?.touched?.[name]
  )
  const allErrors: Array<string> = uniq(
    compact(dirtyFieldNames.map(name => props.formik.errors[name]))
  )

  const allErrorAlerts = allErrors.map(error => {
    if (error === IRREGULAR_LABWARE_ERROR) {
      return (
        <AlertItem
          key={error}
          type="error"
          title={
            <>
              Your labware is not compatible with the Labware Creator. Please
              fill out{' '}
              <LinkOut href={LINK_CUSTOM_LABWARE_FORM}>this form</LinkOut> to
              request a custom labware definition.
            </>
          }
        />
      )
    }
    return <AlertItem key={error} type="warning" title={error} />
  })

  return (
    <div className={styles.section_wrapper}>
      <h2 className={props.headingClassName || styles.section_header}>
        {props.label}
      </h2>
      <div>
        {allErrorAlerts}
        {props.additionalAlerts}
      </div>
      {props.children}
    </div>
  )
})
