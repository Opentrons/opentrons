import type { CommentArgs } from '@opentrons/step-generation'
import type { HydratedCommentFormData } from '../../../form-types'
import type { GetCastFormData } from '../../fieldLevel'

export const commentFormToArgs = (
  hydratedFormData: GetCastFormData<HydratedCommentFormData>
): CommentArgs => {
  const { message, stepName, stepDetails } = hydratedFormData

  return {
    commandCreatorFnName: 'comment',
    description: stepDetails,
    name: stepName,
    message,
  }
}
