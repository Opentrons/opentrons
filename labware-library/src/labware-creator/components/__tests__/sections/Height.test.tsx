import React from 'react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { when } from 'vitest-when'
import { FormikConfig } from 'formik'
import { render, screen } from '@testing-library/react'
import { nestedTextMatcher } from '../../__testUtils__/nestedTextMatcher'
import { getDefaultFormState, LabwareFields } from '../../../fields'
import { isEveryFieldHidden } from '../../../utils'
import { Height } from '../../sections/Height'
import { wrapInFormik } from '../../utils/wrapInFormik'

vi.mock('../../../utils')

const formikConfig: FormikConfig<LabwareFields> = {
  initialValues: getDefaultFormState(),
  onSubmit: vi.fn(),
}

describe('Height Section', () => {
  beforeEach(() => {
    when(vi.mocked(isEveryFieldHidden))
      .calledWith(
        ['labwareType', 'labwareZDimension'],
        formikConfig.initialValues
      )
      .thenReturn(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render text fields when fields are visible', () => {
    render(wrapInFormik(<Height />, formikConfig))
    expect(screen.getByRole('heading')).toHaveTextContent(/total height/i)
    expect(
      screen.getByText(
        'The height measurement informs the robot of the top and bottom of your labware.'
      )
    )
    screen.getByRole('textbox', { name: /Height/i })
  })

  it('should update instructions when tubeRack is selected', () => {
    formikConfig.initialValues.labwareType = 'tubeRack'
    render(wrapInFormik(<Height />, formikConfig))
    expect(screen.getByText('Place your tubes inside the rack.'))
  })

  it('should update instructions when aluminumBlock is selected', () => {
    formikConfig.initialValues.labwareType = 'aluminumBlock'
    render(wrapInFormik(<Height />, formikConfig))
    expect(screen.getByText('Put your labware on top of the aluminum block.'))
  })

  it('should update instructions when tipRack is selected', () => {
    formikConfig.initialValues.labwareType = 'tipRack'
    render(wrapInFormik(<Height />, formikConfig))
    expect(
      screen.getByText(
        nestedTextMatcher(
          'Include the adapter and tops of the pipette tips in the measurement.'
        )
      )
    ).toBeInTheDocument()
  })

  it('should render form alert when error is present', () => {
    const FAKE_ERROR = 'ahh'
    formikConfig.initialErrors = { labwareZDimension: FAKE_ERROR }
    formikConfig.initialTouched = { labwareZDimension: true }
    render(wrapInFormik(<Height />, formikConfig))
    screen.getByText(FAKE_ERROR)
  })

  it('should render height alert when error is present', () => {
    formikConfig.initialValues.labwareZDimension = '130'
    formikConfig.initialTouched = { labwareZDimension: true }
    render(wrapInFormik(<Height />, formikConfig))
    screen.getByText(
      'This labware may be too tall to work with some pipette + tip combinations. Please test on robot.'
    )
  })

  it('should not render when all fields are hidden', () => {
    when(vi.mocked(isEveryFieldHidden))
      .calledWith(
        ['labwareType', 'labwareZDimension'],
        formikConfig.initialValues
      )
      .thenReturn(true)

    const { container } = render(wrapInFormik(<Height />, formikConfig))
    expect(container.firstChild).toBe(null)
  })
})
