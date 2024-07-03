import type { CommentArgs } from '@opentrons/step-generation'
import type { HydratedCommentFormData } from '../../../form-types'

export const commentFormToArgs = (
  hydratedFormData: HydratedCommentFormData
): CommentArgs => {
  const { fields, stepName, stepDetails } = hydratedFormData
  const { message } = fields

  console.log('comment', message)
  return {
    commandCreatorFnName: 'comment',
    description: stepDetails,
    name: stepName,
    message,
  }
}
