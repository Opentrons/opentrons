import React from 'react'
import { when, resetAllWhenMocks } from 'jest-when'
import { FormikConfig } from 'formik'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  getDefaultFormState,
  getInitialStatus,
  LabwareFields,
} from '../../../fields'
import { isEveryFieldHidden, getLabwareName } from '../../../utils'
import { Regularity } from '../../sections/Regularity'
import { wrapInFormik } from '../../utils/wrapInFormik'

jest.mock('../../../utils')

const isEveryFieldHiddenMock = isEveryFieldHidden as jest.MockedFunction<
  typeof isEveryFieldHidden
>

const getLabwareNameMock = getLabwareName as jest.MockedFunction<
  typeof getLabwareName
>

let formikConfig: FormikConfig<LabwareFields>

describe('Regularity', () => {
  beforeEach(() => {
    formikConfig = {
      initialValues: getDefaultFormState(),
      initialStatus: getInitialStatus(),
      onSubmit: jest.fn(),
    }

    when(isEveryFieldHiddenMock)
      .calledWith(['homogeneousWells'], formikConfig.initialValues)
      .mockReturnValue(false)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    resetAllWhenMocks()
  })

  it('should render radio fields when fields are visible', () => {
    when(getLabwareNameMock)
      .calledWith(formikConfig.initialValues, true)
      .mockReturnValue('FAKE LABWARE NAME PLURAL')

    render(wrapInFormik(<Regularity />, formikConfig))
    expect(screen.getByRole('heading')).toHaveTextContent(/regularity/i)
    // TODO(IL, 2021-05-26): this should be a semantic label, but is just a div
    screen.getByText(
      'Are all your FAKE LABWARE NAME PLURAL the same shape and size?'
    )

    const radioElements = screen.getAllByRole('radio')
    expect(radioElements).toHaveLength(2)
    screen.getByRole('radio', { name: /yes/i })
    screen.getByRole('radio', { name: /no/i })
  })

  it('should render alert when error is present', () => {
    const FAKE_ERROR = 'ahh'
    formikConfig.initialErrors = { homogeneousWells: FAKE_ERROR }
    formikConfig.initialTouched = { homogeneousWells: true }
    render(wrapInFormik(<Regularity />, formikConfig))

    screen.getByRole('alert')
  })

  it('should not render when all of the fields are hidden', () => {
    when(isEveryFieldHiddenMock)
      .calledWith(['homogeneousWells'], formikConfig.initialValues)
      .mockReturnValue(true)

    const { container } = render(wrapInFormik(<Regularity />, formikConfig))
    expect(container.firstChild).toBe(null)
  })
})
