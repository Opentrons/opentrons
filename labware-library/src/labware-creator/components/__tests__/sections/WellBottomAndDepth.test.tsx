import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { FormikConfig } from 'formik'
import { when, resetAllWhenMocks } from 'jest-when'
import { getDefaultFormState, LabwareFields } from '../../../fields'
import { displayAsTube } from '../../../utils'
import { WellBottomAndDepth } from '../../sections/WellBottomAndDepth'

import { wrapInFormik } from '../../utils/wrapInFormik'

jest.mock('../../../utils/displayAsTube')

const displayAsTubeMock = displayAsTube as jest.MockedFunction<
  typeof displayAsTube
>

let formikConfig: FormikConfig<LabwareFields>

describe('WellBottomAndDepth', () => {
  beforeEach(() => {
    formikConfig = {
      initialValues: getDefaultFormState(),
      onSubmit: jest.fn(),
    }

    when(displayAsTubeMock)
      .calledWith(expect.any(Object))
      .mockReturnValue(false)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    resetAllWhenMocks()
  })

  it('should render with the correct information', () => {
    render(wrapInFormik(<WellBottomAndDepth />, formikConfig))

    expect(screen.getByRole('heading')).toHaveTextContent(
      /Well Bottom & Depth/i
    )

    screen.getByText(
      'Depth informs the robot how far down it can go inside a well.'
    )
    const radioElements = screen.getAllByRole('radio')
    expect(radioElements).toHaveLength(3)
    screen.getAllByRole('radio', { name: /flat/i })
    screen.getAllByRole('radio', { name: /round/i })
    screen.getAllByRole('radio', { name: /v-bottom/i })

    screen.getByRole('textbox', { name: /depth/i })
  })

  it('should render tubes when labware that should displayAsTube is selected', () => {
    when(displayAsTubeMock)
      .expectCalledWith(formikConfig.initialValues)
      .mockReturnValue(true)

    render(wrapInFormik(<WellBottomAndDepth />, formikConfig))

    screen.getByText(
      'Depth informs the robot how far down it can go inside a tube.'
    )
  })

  it('should render wells when labware that should NOT displayAsTube is selected', () => {
    when(displayAsTubeMock)
      .expectCalledWith(formikConfig.initialValues)
      .mockReturnValue(false)

    render(wrapInFormik(<WellBottomAndDepth />, formikConfig))

    screen.getByText(
      'Depth informs the robot how far down it can go inside a well.'
    )
  })

  it('should render alert when error is present', () => {
    const FAKE_ERROR = 'ahh'
    formikConfig.initialErrors = { wellDepth: FAKE_ERROR }
    formikConfig.initialTouched = { wellDepth: true }
    render(wrapInFormik(<WellBottomAndDepth />, formikConfig))

    // TODO(IL, 2021-05-26): AlertItem should have role="alert", then we can `getByRole('alert', {name: FAKE_ERROR})`
    screen.getByText(FAKE_ERROR)
  })
})
