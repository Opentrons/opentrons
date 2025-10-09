import type { CommentArgs } from '@opentrons/step-generation'
import type { HydratedCommentFormData } from '../../../form-types'
import type { GetCastFormData } from '../../fieldLevel'

export const commentFormToArgs = (
  formData: GetCastFormData<HydratedCommentFormData>
): CommentArgs => {
  const { message, stepName, stepDetails } = formData

  return {
    commandCreatorFnName: 'comment',
    description: stepDetails,
    name: stepName,
    message,
  }
}
