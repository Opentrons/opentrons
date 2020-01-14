// @flow
import isEmpty from 'lodash/isEmpty'
import { createSelector } from 'reselect'

import type { Selector } from '../../../types'
import { getUnsavedFormErrors } from '../../../step-forms/selectors'

// TODO: BC: 2018-10-26 remove this when we decide to not block save
export const canSaveForm: Selector<boolean> = createSelector(
  getUnsavedFormErrors,
  formErrors => Boolean(formErrors && isEmpty(formErrors))
)
