import mapValues from 'lodash/mapValues'
import { LabwareFields } from '../fields'
import type { FormikTouched } from 'formik'

interface MakeAutofillOnChangeArgs {
  name: keyof LabwareFields
  autofills: Record<string, Partial<LabwareFields>>
  values: LabwareFields
  touched: Object
  setTouched: (touched: FormikTouched<LabwareFields>) => unknown
  setValues: (values: LabwareFields) => unknown
}

export const makeAutofillOnChange = ({
  autofills,
  values,
  touched,
  setValues,
  setTouched,
}: MakeAutofillOnChangeArgs) => (
  name: string,
  value: string | null | undefined
) => {
  if (value == null) {
    console.log(`no value for ${name}, skipping autofill`)
    return
  }
  const _autofillValues = autofills[value]
  if (_autofillValues !== undefined) {
    const autofillValues = {
      ..._autofillValues,
    }

    const namesToTrue = mapValues(autofillValues, () => true)
    setValues({
      ...values,
      ...autofillValues,
      [name]: value,
    })
    setTouched({
      ...touched,
      ...namesToTrue,
    })
  } else {
    console.error(
      `expected autofills for ${name}: ${value} -- is the value missing from the autofills object?`
    )
  }
}
