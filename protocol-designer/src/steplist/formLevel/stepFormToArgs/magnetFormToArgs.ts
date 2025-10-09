import type {
  DisengageMagnetArgs,
  EngageMagnetArgs,
} from '@opentrons/step-generation'
import type { HydratedMagnetFormData } from '../../../form-types'
import type { GetCastFormData } from '../../fieldLevel'

type MagnetArgs = EngageMagnetArgs | DisengageMagnetArgs
export const magnetFormToArgs = (
  formData: GetCastFormData<HydratedMagnetFormData>
): MagnetArgs => {
  const { magnetAction, moduleId, stepDetails, stepName } = formData
  // @ts-expect-error - todo(2025-10-09): Type error inherited from prior code.
  // engageHeight seems to already be a float. Confirm that and remove this if it's safe.
  const engageHeight = parseFloat(formData.engageHeight)
  console.assert(
    magnetAction === 'engage' ? !Number.isNaN(engageHeight) : true,
    'magnetFormToArgs expected (hydrated) engageHeight to be non-NaN if magnetAction is "engage"'
  )

  if (magnetAction === 'engage' && !Number.isNaN(engageHeight)) {
    return {
      commandCreatorFnName: 'engageMagnet',
      // todo(mm, 2025-10-09): form-types.ts is inconsistent about whether moduleId is nullable.
      // This runtime behavior of assuming it can't be nullish here is inherited from prior code.
      // Look into this.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      moduleId: moduleId!,
      height: engageHeight,
      description: stepDetails,
      name: stepName,
    }
  } else {
    return {
      commandCreatorFnName: 'disengageMagnet',
      // todo(mm, 2025-10-09): form-types.ts is inconsistent about whether moduleId is nullable.
      // This runtime behavior of assuming it can't be nullish here is inherited from prior code.
      // Look into this.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      moduleId: moduleId!,
      description: stepDetails,
      name: stepName,
    }
  }
}
