import type {
  FormData,
  HydratedThermocyclerFormData,
} from '/protocol-designer/form-types'

type ThermocyclerFormType = HydratedThermocyclerFormData['thermocyclerFormType']

export function getThermocyclerFormType(
  formData: FormData | null
): ThermocyclerFormType | null {
  return formData?.stepType === 'thermocycler'
    ? formData.thermocyclerFormType
    : null
}
