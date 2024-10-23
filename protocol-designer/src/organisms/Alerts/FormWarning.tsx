import { useDispatch, useSelector } from 'react-redux'
import {
  Banner,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'
import {
  actions as dismissActions,
  selectors as dismissSelectors,
} from '../../dismiss'
import { selectors as stepFormSelectors } from '../../step-forms'
import {
  getVisibleFormWarnings,
  getVisibleProfileFormLevelErrors,
} from '../../pages/Designer/ProtocolSteps/StepForm/utils'

import type { ProfileItem } from '@opentrons/step-generation'
import type { StepFieldName } from '../../form-types'
import type { ProfileFormError } from '../../steplist/formLevel/profileErrors'
import type { MakeAlert } from './types'

interface FormWarningProps {
  focusedField?: StepFieldName | null
  dirtyFields?: StepFieldName[]
}

export function FormWarning(props: FormWarningProps): JSX.Element {
  const { focusedField, dirtyFields } = props
  const dispatch = useDispatch()
  const formWarningsForSelectedStep = useSelector(
    dismissSelectors.getFormWarningsForSelectedStep
  )
  const unsavedForm = useSelector(stepFormSelectors.getHydratedUnsavedForm)
  const dynamicFieldFormErrors = useSelector(
    stepFormSelectors.getDynamicFieldFormErrorsForUnsavedForm
  )

  const visibleFormWarnings = getVisibleFormWarnings({
    focusedField,
    dirtyFields: dirtyFields ?? [],
    errors: formWarningsForSelectedStep,
  })

  const profileItemsById: Record<string, ProfileItem> | null | undefined =
    unsavedForm?.profileItemsById

  let visibleDynamicFieldFormErrors: ProfileFormError[] = []

  if (profileItemsById != null) {
    visibleDynamicFieldFormErrors = getVisibleProfileFormLevelErrors({
      focusedField,
      dirtyFields: dirtyFields ?? [],
      errors: dynamicFieldFormErrors,
      profileItemsById,
    })
  }

  const makeHandleCloseWarning = (dismissId?: string | null) => () => {
    console.assert(
      dismissId,
      'expected dismissId, Alert cannot dismiss warning'
    )
    if (dismissId) {
      dismissWarning(dismissId)
    }
  }

  const makeAlert: MakeAlert = (alertType, data, key) => (
    <Flex padding={`${SPACING.spacing16} ${SPACING.spacing16} 0`}>
      <Banner
        type="warning"
        key={`${alertType}:${key}`}
        onCloseClick={makeHandleCloseWarning(data.dismissId)}
      >
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {data.title}
          </StyledText>
          <StyledText desktopStyle="bodyDefaultRegular">
            {data.description}
          </StyledText>
        </Flex>
      </Banner>
    </Flex>
  )
  const formWarnings = visibleFormWarnings.map(warning => ({
    title: warning.title,
    description: warning.body || null,
    dismissId: warning.type,
  }))

  const dismissWarning = (dismissId: string): void => {
    dispatch(
      dismissActions.dismissFormWarning({
        type: dismissId,
      })
    )
  }

  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
      {formWarnings.map((warning, key) => makeAlert('warning', warning, key))}
    </Flex>
  )
}
