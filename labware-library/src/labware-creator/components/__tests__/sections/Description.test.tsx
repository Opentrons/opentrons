import React from 'react'
import { resetAllWhenMocks, when } from 'jest-when'
import { FormikConfig } from 'formik'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  getDefaultFormState,
  getInitialStatus,
  LabwareFields,
} from '../../../fields'
import { Description } from '../../sections/Description'
import { isEveryFieldHidden } from '../../../utils/isEveryFieldHidden'
import { wrapInFormik } from '../../utils/wrapInFormik'

jest.mock('../../../utils/isEveryFieldHidden')

const isEveryFieldHiddenMock = isEveryFieldHidden as jest.MockedFunction<
  typeof isEveryFieldHidden
>

let formikConfig: FormikConfig<LabwareFields>

describe('Description', () => {
  beforeEach(() => {
    formikConfig = {
      initialValues: getDefaultFormState(),
      initialStatus: getInitialStatus(),
      onSubmit: jest.fn(),
    }

    when(isEveryFieldHiddenMock)
      .calledWith(
        ['brand', 'brandId', 'groupBrand', 'groupBrandId'],
        formikConfig.initialValues
      )
      .mockReturnValue(false)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    resetAllWhenMocks()
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

    screen.getByRole('alert')
  })

  it('should not render when all of the fields are hidden', () => {
    when(isEveryFieldHiddenMock)
      .calledWith(
        ['brand', 'brandId', 'groupBrand', 'groupBrandId'],
        formikConfig.initialValues
      )
      .mockReturnValue(true)

    const { container } = render(wrapInFormik(<Description />, formikConfig))
    expect(container.firstChild).toBe(null)
  })
})
