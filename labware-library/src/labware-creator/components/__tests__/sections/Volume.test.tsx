import React from 'react'
import { vi, it, expect, describe, beforeEach, afterEach } from 'vitest'
import { FormikConfig } from 'formik'
import '@testing-library/jest-dom/vitest'
import { when } from 'vitest-when'
import { render, screen } from '@testing-library/react'
import {
  getDefaultFormState,
  getInitialStatus,
  LabwareFields,
} from '../../../fields'
import { isEveryFieldHidden, getLabwareName } from '../../../utils'
import { Volume } from '../../sections/Volume'
import { wrapInFormik } from '../../utils/wrapInFormik'

vi.mock('../../../utils')

let formikConfig: FormikConfig<LabwareFields>

describe('Volume', () => {
  beforeEach(() => {
    formikConfig = {
      initialValues: getDefaultFormState(),
      initialStatus: getInitialStatus(),
      onSubmit: vi.fn(),
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render with the correct information', () => {
    when(vi.mocked(getLabwareName))
      .calledWith(formikConfig.initialValues, false)
      .thenReturn('well')
    render(wrapInFormik(<Volume />, formikConfig))
    expect(screen.getByRole('heading')).toHaveTextContent(/Volume/i)

    screen.getByText('Total maximum volume of each well.')

    screen.getByRole('textbox', { name: /Volume/i })
  })

  it('should render tubes when tubeRack is selected', () => {
    formikConfig.initialValues.labwareType = 'tubeRack'
    when(vi.mocked(getLabwareName))
      .calledWith(formikConfig.initialValues, false)
      .thenReturn('tube')
    render(wrapInFormik(<Volume />, formikConfig))

    screen.getByText('Total maximum volume of each tube.')
  })

  it('should render tubes when aluminumBlock is selected', () => {
    formikConfig.initialValues.labwareType = 'aluminumBlock'
    when(vi.mocked(getLabwareName))
      .calledWith(formikConfig.initialValues, false)
      .thenReturn('tube')
    render(wrapInFormik(<Volume />, formikConfig))

    screen.getByText('Total maximum volume of each tube.')
  })

  it('should render wells when wellPlate is selected', () => {
    formikConfig.initialValues.labwareType = 'wellPlate'
    when(vi.mocked(getLabwareName))
      .calledWith(formikConfig.initialValues, false)
      .thenReturn('well')
    render(wrapInFormik(<Volume />, formikConfig))

    screen.getByText('Total maximum volume of each well.')
  })

  it('should render tips when tipRack is selected', () => {
    formikConfig.initialValues.labwareType = 'tipRack'
    when(vi.mocked(getLabwareName))
      .calledWith(formikConfig.initialValues, false)
      .thenReturn('tip')
    render(wrapInFormik(<Volume />, formikConfig))

    screen.getByText('Total maximum volume of each tip.')
  })

  it('should render alert when error is present', () => {
    const FAKE_ERROR = 'ahh'
    formikConfig.initialErrors = { wellVolume: FAKE_ERROR }
    formikConfig.initialTouched = { wellVolume: true }
    render(wrapInFormik(<Volume />, formikConfig))

    // TODO(IL, 2021-05-26): AlertItem should have role="alert", then we can `getByRole('alert', {name: FAKE_ERROR})`
    screen.getByText(FAKE_ERROR)
  })

  it('should not render when all fields are hidden', () => {
    when(vi.mocked(isEveryFieldHidden))
      .calledWith(['wellVolume'], formikConfig.initialValues)
      .thenReturn(true)

    const { container } = render(wrapInFormik(<Volume />, formikConfig))
    expect(container.firstChild).toBe(null)
  })
})
