import React from 'react'
import { FormikConfig } from 'formik'
import { when } from 'jest-when'
import { render, screen } from '@testing-library/react'
import {
  getDefaultFormState,
  LabwareFields,
  yesNoOptions,
} from '../../../fields'
import { Regularity } from '../../sections/Regularity'
import { getFormAlerts } from '../../utils/getFormAlerts'
import { RadioField } from '../../RadioField'
import { wrapInFormik } from '../../utils/wrapInFormik'

jest.mock('../../RadioField')
jest.mock('../../utils/getFormAlerts')

const getFormAlertsMock = getFormAlerts as jest.MockedFunction<
  typeof getFormAlerts
>
const radioFieldMock = RadioField as jest.MockedFunction<typeof RadioField>

const formikConfig: FormikConfig<LabwareFields> = {
  initialValues: getDefaultFormState(),
  onSubmit: jest.fn(),
}

describe('Regularity', () => {
  beforeEach(() => {
    radioFieldMock.mockImplementation(args => {
      expect(args).toEqual({ name: 'homogeneousWells', options: yesNoOptions })
      return <div>homogeneousWells radio group</div>
    })

    when(getFormAlertsMock)
      .expectCalledWith({
        values: getDefaultFormState(),
        touched: {},
        errors: {},
        fieldList: ['homogeneousWells'],
      })
      .mockReturnValue([<div key="mock key">mock alerts</div>])
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should render with the correct information', () => {
    render(wrapInFormik(<Regularity />, formikConfig))
    expect(screen.getByText('Regularity'))
    expect(screen.getByText('mock alerts'))
    expect(screen.getByText('homogeneousWells radio group'))
  })
})
