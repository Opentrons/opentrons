import React from 'react'
import { FormikConfig } from 'formik'
import { when } from 'jest-when'
import { render, screen } from '@testing-library/react'
import { getDefaultFormState, LabwareFields } from '../../../fields'
import { Volume } from '../../sections/Volume'
import { getFormAlerts } from '../../utils/getFormAlerts'
import { TextField } from '../../TextField'
import { wrapInFormik } from '../../utils/wrapInFormik'

jest.mock('../../TextField')
jest.mock('../../utils/getFormAlerts')

const getFormAlertsMock = getFormAlerts as jest.MockedFunction<
  typeof getFormAlerts
>
const textFieldMock = TextField as jest.MockedFunction<typeof TextField>

const formikConfig: FormikConfig<LabwareFields> = {
  initialValues: getDefaultFormState(),
  onSubmit: jest.fn(),
}

describe('Volume', () => {
  beforeEach(() => {
    textFieldMock.mockImplementation(args => {
      return <div>wellVolume text field</div>
    })

    when(getFormAlertsMock)
      .calledWith({
        values: getDefaultFormState(),
        touched: {},
        errors: {},
        fieldList: ['wellVolume'],
      })
      .mockReturnValue([<div key="mock key">mock alerts</div>])
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should render with the correct information', () => {
    render(wrapInFormik(<Volume />, formikConfig))
    expect(screen.getByText('Volume'))
    expect(screen.getByText('Total maximum volume of each well.'))
    expect(screen.getByText('mock alerts'))
    expect(screen.getByText('wellVolume text field'))
  })
})
