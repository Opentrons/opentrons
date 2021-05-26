import * as React from 'react'
import compact from 'lodash/compact'
import uniq from 'lodash/uniq'
import { AlertItem } from '@opentrons/components'
import {
  LabwareFields,
  IRREGULAR_LABWARE_ERROR,
  LOOSE_TIP_FIT_ERROR,
  LINK_CUSTOM_LABWARE_FORM,
} from '../fields'
import { LinkOut } from './LinkOut'

import type { FormikTouched, FormikErrors } from 'formik'
export interface Props {
  fieldList: Array<keyof LabwareFields>
  touched: FormikTouched<LabwareFields>
  errors: FormikErrors<LabwareFields>
}

export const IrregularLabwareAlert = (): JSX.Element => (
  <AlertItem
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

export const LooseTipFitAlert = (): JSX.Element => (
  <AlertItem
    type="error"
    title={
      <>
        If your tip does not fit when placed by hand then it is not a good
        candidate for this pipette on the OT-2.
      </>
    }
  />
)

export const FormAlerts = (props: Props): JSX.Element | null => {
  const { fieldList, touched, errors } = props

  const dirtyFieldNames = fieldList.filter(name => touched[name])
  const allErrors: string[] = uniq(
    compact(dirtyFieldNames.map(name => errors[name]))
  )

  return (
    <>
      {allErrors.map(error => {
        if (error === LOOSE_TIP_FIT_ERROR) {
          return <LooseTipFitAlert key={error} />
        }
        if (error === IRREGULAR_LABWARE_ERROR) {
          return <IrregularLabwareAlert key={error} />
        }
        return <AlertItem key={error} type="warning" title={error} />
      })}
    </>
  )
}
