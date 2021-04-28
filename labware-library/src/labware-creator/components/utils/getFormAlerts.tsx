import * as React from 'react'
import compact from 'lodash/compact'
import uniq from 'lodash/uniq'
import { AlertItem } from '@opentrons/components'
import { getIsHidden } from '../../formSelectors'
import { LabwareFields, IRREGULAR_LABWARE_ERROR, LINK_CUSTOM_LABWARE_FORM } from '../../fields'
import { LinkOut } from '../LinkOut'

import type { FormikTouched, FormikErrors } from 'formik'
export interface Props {
  values: LabwareFields
  fieldList: Array<keyof LabwareFields>
  touched: FormikTouched<LabwareFields>
  errors: FormikErrors<LabwareFields>
}

export const IrregularLabwareAlert = (): JSX.Element => (
  <AlertItem
    key={IRREGULAR_LABWARE_ERROR}
    type="error"
    title={
      <>
        Your labware is not compatible with the Labware Creator. Please fill out{' '}
        <LinkOut href={LINK_CUSTOM_LABWARE_FORM}>this form</LinkOut> to request
        a custom labware definition.
      </>
    }
  />
)

export const getFormAlerts = (props: Props): JSX.Element[] | null => {
  const { values, fieldList, touched, errors } = props
  if (fieldList.length > 0) {
    const numFieldsHidden = fieldList
      .map(field => getIsHidden(field, values))
      .filter(Boolean).length

    if (numFieldsHidden === fieldList.length) {
      // all fields are hidden, don't render this Section
      return null
    }
  }

  // show Formik errors (from Yup) as WARNINGs for all dirty fields within this Section
  const dirtyFieldNames = fieldList.filter(name => touched[name])
  const allErrors: string[] = uniq(
    compact(dirtyFieldNames.map(name => errors[name]))
  )

  return allErrors.map(error => {
    if (error === IRREGULAR_LABWARE_ERROR) {
      return <IrregularLabwareAlert />
    }
    return <AlertItem key={error} type="warning" title={error} />
  })
}
