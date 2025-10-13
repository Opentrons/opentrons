import type { CommentArgs } from '@opentrons/step-generation'
import type { HydratedCommentFormData } from '../../../form-types'
import type { GetCastFormData } from '../../fieldLevel'

export const commentFormToArgs = (
  castFormData: GetCastFormData<HydratedCommentFormData>
): CommentArgs => {
  const { message, stepName, stepDetails } = castFormData

  return {
    commandCreatorFnName: 'comment',
    description: stepDetails,
    name: stepName,
    message,
  }
}
