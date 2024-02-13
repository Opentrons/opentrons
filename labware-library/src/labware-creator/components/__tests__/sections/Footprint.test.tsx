import React from 'react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { FormikConfig } from 'formik'
import { when } from 'vitest-when'
import { render, screen } from '@testing-library/react'
import { nestedTextMatcher } from '../../__testUtils__/nestedTextMatcher'
import { getDefaultFormState, LabwareFields } from '../../../fields'
import { Footprint } from '../../sections/Footprint'
import { wrapInFormik } from '../../utils/wrapInFormik'
import { isEveryFieldHidden } from '../../../utils'

vi.mock('../../../utils')

const formikConfig: FormikConfig<LabwareFields> = {
  initialValues: getDefaultFormState(),
  onSubmit: vi.fn(),
}

describe('Footprint', () => {
  beforeEach(() => {
    when(vi.mocked(isEveryFieldHidden))
      .calledWith(
        ['footprintXDimension', 'footprintYDimension'],
        formikConfig.initialValues
      )
      .thenReturn(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
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

  it('should render correct copy when tipRack is selected', () => {
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
    render(wrapInFormik(<Footprint />, formikConfig))
    const warning = screen.getByText('Our recommended footprint for labware', {exact: false})
    expect(warning.textContent).toEqual('Our recommended footprint for labware is 127.76 by 85.47 +/- 1mm. If you can fit your labware snugly into a single slot on the deck continue through the form. If not please request custom labware via this form.')
  })

  it('should not render when all fields are hidden', () => {
    when(vi.mocked(isEveryFieldHidden))
      .calledWith(
        ['footprintXDimension', 'footprintYDimension'],
        formikConfig.initialValues
      )
      .thenReturn(true)

    const { container } = render(wrapInFormik(<Footprint />, formikConfig))
    expect(container.firstChild).toBe(null)
  })
})
