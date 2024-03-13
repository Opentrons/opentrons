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
import { Description } from '../../sections/Description'
import { isEveryFieldHidden } from '../../../utils/isEveryFieldHidden'
import { wrapInFormik } from '../../utils/wrapInFormik'

vi.mock('../../../utils/isEveryFieldHidden')

let formikConfig: FormikConfig<LabwareFields>

describe('Description', () => {
  beforeEach(() => {
    formikConfig = {
      initialValues: getDefaultFormState(),
      initialStatus: getInitialStatus(),
      onSubmit: vi.fn(),
    }

    when(vi.mocked(isEveryFieldHidden))
      .calledWith(
        ['brand', 'brandId', 'groupBrand', 'groupBrandId'],
        formikConfig.initialValues
      )
      .thenReturn(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render fields when fields are visible', () => {
    render(wrapInFormik(<Description />, formikConfig))
    expect(screen.getByRole('heading')).toHaveTextContent(/description/i)

    // TODO IMMEDIATELY: changes from 7715 ???
    screen.getByRole('textbox', { name: /^brand$/i })
    screen.getByRole('textbox', { name: /manufacturer\/catalog #/i })
  })

  it('should show tube brand when an Opentrons Tube rack is selected', () => {
    formikConfig.initialValues.labwareType = 'tubeRack'
    formikConfig.initialValues.tubeRackInsertLoadName = '6tubes'
    render(wrapInFormik(<Description />, formikConfig))
    expect(screen.getByRole('heading')).toHaveTextContent(/description/i)

    screen.getByRole('textbox', { name: /^tube brand$/i })
    screen.getByRole('textbox', { name: /manufacturer\/catalog #/i })
    expect(screen.queryByRole('textbox', { name: /^rack brand$/i })).toBeNull()
  })

  it('should show tube brand and rack brand when Custom Tube rack is selected', () => {
    formikConfig.initialValues.labwareType = 'tubeRack'
    formikConfig.initialValues.tubeRackInsertLoadName = 'customTubeRack'
    render(wrapInFormik(<Description />, formikConfig))
    expect(screen.getByRole('heading')).toHaveTextContent(/description/i)

    screen.getByRole('textbox', { name: /^tube brand$/i })
    expect(
      screen.getAllByRole('textbox', { name: /manufacturer\/catalog #/i })
    ).toHaveLength(2)
    screen.getByRole('textbox', { name: /^rack brand$/i })
  })

  it('should render alert when error is present', () => {
    const FAKE_ERROR = 'ahh'
    formikConfig.initialErrors = { brand: FAKE_ERROR }
    formikConfig.initialTouched = { brand: true }
    render(wrapInFormik(<Description />, formikConfig))

    // TODO(IL, 2021-05-26): AlertItem should have role="alert", then we can `getByRole('alert', {name: FAKE_ERROR})`
    screen.getByText(FAKE_ERROR)
  })

  it('should not render when all of the fields are hidden', () => {
    when(vi.mocked(isEveryFieldHidden))
      .calledWith(
        ['brand', 'brandId', 'groupBrand', 'groupBrandId'],
        formikConfig.initialValues
      )
      .thenReturn(true)

    const { container } = render(wrapInFormik(<Description />, formikConfig))
    expect(container.firstChild).toBe(null)
  })
})
