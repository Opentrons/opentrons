import React from 'react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { when } from 'vitest-when'
import { FormikConfig } from 'formik'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import {
  getDefaultFormState,
  getInitialStatus,
  LabwareFields,
} from '../../../fields'
import { isEveryFieldHidden } from '../../../utils'
import { File } from '../../sections/File'
import { wrapInFormik } from '../../utils/wrapInFormik'

vi.mock('../../../utils')

let formikConfig: FormikConfig<LabwareFields>

describe('File', () => {
  beforeEach(() => {
    formikConfig = {
      initialValues: getDefaultFormState(),
      initialStatus: getInitialStatus(),
      onSubmit: vi.fn(),
    }

    when(vi.mocked(isEveryFieldHidden))
      .calledWith(['loadName', 'displayName'], formikConfig.initialValues)
      .thenReturn(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render fields when fields are visible', () => {
    render(wrapInFormik(<File />, formikConfig))
    expect(screen.getByRole('heading')).toHaveTextContent(/file/i)

    // TODO IMMEDIATELY: changes from 7715
    screen.getByRole('textbox', { name: /display name/i })
    screen.getByRole('textbox', { name: /api load name/i })
  })

  it('should render alert when error is present', () => {
    const FAKE_ERROR = 'ahh'
    formikConfig.initialErrors = { displayName: FAKE_ERROR }
    formikConfig.initialTouched = { displayName: true }
    render(wrapInFormik(<File />, formikConfig))

    // TODO(IL, 2021-05-26): AlertItem should have role="alert", then we can `getByRole('alert', {name: FAKE_ERROR})`
    screen.getByText(FAKE_ERROR)
  })

  it('should not render when all of the fields are hidden', () => {
    when(vi.mocked(isEveryFieldHidden))
      .calledWith(['loadName', 'displayName'], formikConfig.initialValues)
      .thenReturn(true)

    const { container } = render(wrapInFormik(<File />, formikConfig))
    expect(container.firstChild).toBe(null)
  })
})
