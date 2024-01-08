import React from 'react'
import { when } from 'jest-when'
import { FormikConfig } from 'formik'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  getDefaultFormState,
  getInitialStatus,
  LabwareFields,
} from '../../../fields'
import { isEveryFieldHidden } from '../../../utils'
import { File } from '../../sections/File'
import { wrapInFormik } from '../../utils/wrapInFormik'

jest.mock('../../../utils')

const isEveryFieldHiddenMock = isEveryFieldHidden as jest.MockedFunction<
  typeof isEveryFieldHidden
>

let formikConfig: FormikConfig<LabwareFields>

describe('File', () => {
  beforeEach(() => {
    formikConfig = {
      initialValues: getDefaultFormState(),
      initialStatus: getInitialStatus(),
      onSubmit: jest.fn(),
    }

    when(isEveryFieldHiddenMock)
      .calledWith(['loadName', 'displayName'], formikConfig.initialValues)
      .mockReturnValue(false)
  })

  afterEach(() => {
    jest.restoreAllMocks()
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

    screen.getByRole('alert')
  })

  it('should not render when all of the fields are hidden', () => {
    when(isEveryFieldHiddenMock)
      .calledWith(['loadName', 'displayName'], formikConfig.initialValues)
      .mockReturnValue(true)

    const { container } = render(wrapInFormik(<File />, formikConfig))
    expect(container.firstChild).toBe(null)
  })
})
