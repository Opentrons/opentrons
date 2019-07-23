// @flow
// Formik Status is used as supplemental state in the form.
import type { LabwareFields } from './fields'

export type FormikStatus = {|
  /** names of fields that have been autopopulated from tube rack / aluminum block dropdowns */
  autopopulated: { [$Keys<LabwareFields>]: ?boolean },
|}

export const initialStatus: FormikStatus = { autopopulated: {} }

export const setIsAutopopulated = (
  names: Array<$Keys<LabwareFields>>,
  status: FormikStatus,
  setStatus: FormikStatus => void
) =>
  setStatus({
    ...status,
    autopopulated: {
      ...status.autopopulated,
      ...names.reduce((acc, name) => ({ ...acc, [name]: true }), {}),
    },
  })

export const getIsAutopopulated = (
  name: $Keys<LabwareFields>,
  status: FormikStatus
): true | null => status.autopopulated[name] || null
