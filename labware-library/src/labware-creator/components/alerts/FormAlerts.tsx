import * as React from 'react'
import toPairs from 'lodash/toPairs'
import pick from 'lodash/pick'
import { LegacyAlertItem } from '@opentrons/components'
import {
  getLabel,
  LabwareFields,
  IRREGULAR_LABWARE_ERROR,
  LABWARE_TOO_SMALL_ERROR,
  LABWARE_TOO_LARGE_ERROR,
  LOOSE_TIP_FIT_ERROR,
  LINK_CUSTOM_LABWARE_FORM,
  LINK_REQUEST_ADAPTER_FORM,
  MUST_BE_A_NUMBER_ERROR,
  REQUIRED_FIELD_ERROR,
} from '../../fields'
import { LinkOut } from '../LinkOut'

import type { FormikTouched, FormikErrors } from 'formik'
export interface Props {
  values: LabwareFields
  fieldList: Array<keyof LabwareFields>
  touched: FormikTouched<LabwareFields>
  errors: FormikErrors<LabwareFields>
}

export const IrregularLabwareAlert = (): JSX.Element => (
  <LegacyAlertItem
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

export const LabwareTooSmallAlert = (): JSX.Element => (
  <LegacyAlertItem
    type="error"
    title={
      <>
        Your labware is too small to fit in a slot properly. Please fill out{' '}
        <LinkOut href={LINK_REQUEST_ADAPTER_FORM}>this form</LinkOut> to request
        an adapter.
      </>
    }
  />
)

export const LabwareTooLargeAlert = (): JSX.Element => (
  <LegacyAlertItem
    type="error"
    title={
      <>
        Your labware is too large to fit in a single slot properly. Please fill
        out <LinkOut href={LINK_CUSTOM_LABWARE_FORM}>this form</LinkOut> to
        request a custom labware definition.
      </>
    }
  />
)

export const LooseTipFitAlert = (): JSX.Element => (
  <LegacyAlertItem
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
  const { fieldList, touched, errors, values } = props

  const dirtyFieldNames = fieldList.filter(name => touched[name])
  const allErrors = toPairs(pick(errors, dirtyFieldNames)) as Array<
    [keyof LabwareFields, string]
  >

  return (
    <>
      {allErrors.map(([name, error]) => {
        if (error === LOOSE_TIP_FIT_ERROR) {
          return <LooseTipFitAlert key={error} />
        }
        if (error === IRREGULAR_LABWARE_ERROR) {
          return <IrregularLabwareAlert key={error} />
        }
        if (error === LABWARE_TOO_SMALL_ERROR) {
          return <LabwareTooSmallAlert key={error} />
        }
        if (error === LABWARE_TOO_LARGE_ERROR) {
          return <LabwareTooLargeAlert key={error} />
        }

        // sometimes fields have dynamic labels, and the "__ is a required field" error
        // should use the dynamic label from getLabel.
        if (error === MUST_BE_A_NUMBER_ERROR) {
          const message = `${getLabel(name, values)} must be a number`
          return <LegacyAlertItem key={message} type="warning" title={message} />
        }
        if (error === REQUIRED_FIELD_ERROR) {
          const message = `${getLabel(name, values)} is a required field`
          return <LegacyAlertItem key={message} type="warning" title={message} />
        }

        // TODO(IL, 2021-07-22): is there actually any cases
        // where the error could be falsey here?
        if (error) return <LegacyAlertItem key={error} type="warning" title={error} />
        return null
      })}
    </>
  )
}
