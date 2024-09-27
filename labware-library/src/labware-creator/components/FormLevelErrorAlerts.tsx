import { AlertItem } from '@opentrons/components'
import { FORM_LEVEL_ERRORS } from '../formLevelValidation'
import type { LabwareCreatorErrors } from '../formLevelValidation'

export const FormLevelErrorAlerts = (props: {
  errors: LabwareCreatorErrors
}): JSX.Element | null => {
  const { errors } = props
  const formLevelErrors = errors[FORM_LEVEL_ERRORS]
  if (formLevelErrors !== undefined) {
    const errorTypesAndErrors = Object.entries(formLevelErrors)
    return (
      <>
        {errorTypesAndErrors.map(([errorType, errorMessage]) => (
          <AlertItem type="error" title={errorMessage} key={errorType} />
        ))}
      </>
    )
  } else {
    return null
  }
}
