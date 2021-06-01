import React from 'react'
import { FormikConfig } from 'formik'
import { render, screen } from '@testing-library/react'
import { DEFAULT_FORM_STATE, LabwareFields } from '../../../fields'

import { CustomTiprackWarning } from '../../sections/CustomTiprackWarning'

import { wrapInFormik } from '../../utils/wrapInFormik'

let formikConfig: FormikConfig<LabwareFields>

describe('CustomTiprackWarning', () => {
  beforeEach(() => {
    formikConfig = {
      initialValues: DEFAULT_FORM_STATE,
      onSubmit: jest.fn(),
    }
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should not render when no labware type selected', () => {
    const { container } = render(
      wrapInFormik(<CustomTiprackWarning />, formikConfig)
    )
    expect(container.firstChild).toBe(null)
  })

  it('should render when tiprack is selected', () => {
    formikConfig.initialValues.labwareType = 'tipRack'
    render(wrapInFormik(<CustomTiprackWarning />, formikConfig))
    expect(screen.getByText('Custom Tip Racks Are Not Recommended'))
  })

  it('should not render when non tiprack labware selected', () => {
    formikConfig.initialValues.labwareType = 'tubeRack'
    const { container } = render(
      wrapInFormik(<CustomTiprackWarning />, formikConfig)
    )
    expect(container.firstChild).toBe(null)
  })
})
