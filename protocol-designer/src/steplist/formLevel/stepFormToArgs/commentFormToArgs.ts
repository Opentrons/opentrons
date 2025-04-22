import type { HydratedCommentFormData } from '../../../form-types'
import type { CommentArgs } from '@opentrons/step-generation'

export const commentFormToArgs = (
  hydratedFormData: HydratedCommentFormData
): CommentArgs => {
  const { message, stepName, stepDetails } = hydratedFormData

  return {
    commandCreatorFnName: 'comment',
    description: stepDetails,
    name: stepName,
    message,
  }
}
