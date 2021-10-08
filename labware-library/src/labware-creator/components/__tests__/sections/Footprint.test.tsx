import React from 'react'
import '@testing-library/jest-dom'
import { FormikConfig } from 'formik'
import { when, resetAllWhenMocks } from 'jest-when'
import { nestedTextMatcher } from '@opentrons/components'
import { render, screen } from '@testing-library/react'
import { getDefaultFormState, LabwareFields } from '../../../fields'
import { Footprint } from '../../sections/Footprint'
import { wrapInFormik } from '../../utils/wrapInFormik'
import { isEveryFieldHidden } from '../../../utils'

jest.mock('../../../utils')

const isEveryFieldHiddenMock = isEveryFieldHidden as jest.MockedFunction<
  typeof isEveryFieldHidden
>

const formikConfig: FormikConfig<LabwareFields> = {
  initialValues: getDefaultFormState(),
  onSubmit: jest.fn(),
}

describe('Footprint', () => {
  beforeEach(() => {
    when(isEveryFieldHiddenMock)
      .calledWith(
        ['footprintXDimension', 'footprintYDimension'],
        formikConfig.initialValues
      )
      .mockReturnValue(false)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    resetAllWhenMocks()
  })
  it('should render alerts and text fields when fields are visible', () => {
    render(wrapInFormik(<Footprint />, formikConfig))
    expect(screen.getByRole('heading')).toHaveTextContent(/total footprint/i)
    screen.getByText(
      `The footprint measurement helps determine if the labware (in adapter if needed) fits firmly into the slots on the OT-2 deck.`
    )
    const textBoxElements = screen.getAllByRole('textbox')
    expect(textBoxElements).toHaveLength(2)
    screen.getByRole('textbox', { name: /Length/i })
    screen.getByRole('textbox', { name: /Width/i })
  })

  it.only('should render correct copy when tipRack is selected', () => {
    formikConfig.initialValues.labwareType = 'tipRack'
    render(wrapInFormik(<Footprint />, formikConfig))

    expect(
      screen.getByText(
        nestedTextMatcher(
          'If your Tip Rack has an adapter, place it in the adapter.'
        )
      )
    ).toBeInTheDocument()
  })

  it('should not render extra copy when tipRack is not selected', () => {
    formikConfig.initialValues.labwareType = 'wellPlate'
    render(wrapInFormik(<Footprint />, formikConfig))
    expect(
      screen.queryByText(
        nestedTextMatcher(
          'If your Tip Rack has an adapter, place it in the adapter.'
        )
      )
    ).toBe(null)
  })

  it('should render form alert when error is present', () => {
    const FAKE_ERROR = 'ahh'
    formikConfig.initialErrors = { footprintXDimension: FAKE_ERROR }
    formikConfig.initialTouched = { footprintXDimension: true }
    render(wrapInFormik(<Footprint />, formikConfig))
    screen.getByText(FAKE_ERROR)
  })

  it('should render xydimension alert when error is present', () => {
    formikConfig.initialValues.footprintXDimension = '130'
    formikConfig.initialTouched = { footprintXDimension: true }
    const { container } = render(wrapInFormik(<Footprint />, formikConfig))
    const error = container.querySelector('[class="alert info"]')
    expect(error?.textContent).toBe(
      'Our recommended footprint for labware is 127.76 by 85.47 +/- 1mm. If you can fit your labware snugly into a single slot on the deck continue through the form. If not please request custom labware via this form.'
    )
  })

  it('should not render when all fields are hidden', () => {
    when(isEveryFieldHiddenMock)
      .calledWith(
        ['footprintXDimension', 'footprintYDimension'],
        formikConfig.initialValues
      )
      .mockReturnValue(true)

    const { container } = render(wrapInFormik(<Footprint />, formikConfig))
    expect(container.firstChild).toBe(null)
  })
})
