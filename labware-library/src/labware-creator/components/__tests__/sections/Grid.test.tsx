import React from 'react'
import { FormikConfig } from 'formik'
import { when } from 'jest-when'
import { render, screen } from '@testing-library/react'
import {
  getDefaultFormState,
  LabwareFields,
  yesNoOptions,
} from '../../../fields'
import { Grid } from '../../sections/Grid'
import { getFormAlerts } from '../../utils/getFormAlerts'
import { TextField } from '../../TextField'
import { RadioField } from '../../RadioField'
import { wrapInFormik } from '../../utils/wrapInFormik'

jest.mock('../../TextField')
jest.mock('../../RadioField')
jest.mock('../../utils/getFormAlerts')

const getFormAlertsMock = getFormAlerts as jest.MockedFunction<
  typeof getFormAlerts
>

const textFieldMock = TextField as jest.MockedFunction<typeof TextField>

const radioFieldMock = RadioField as jest.MockedFunction<typeof RadioField>

const formikConfig: FormikConfig<LabwareFields> = {
  initialValues: getDefaultFormState(),
  onSubmit: jest.fn(),
}

describe('Grid', () => {
  beforeEach(() => {
    radioFieldMock.mockImplementation(args => {
      if (args.name === 'regularRowSpacing') {
        expect(args).toEqual({
          name: 'regularRowSpacing',
          options: yesNoOptions,
        })
        return <div>regularRowSpacing radio group</div>
      }
      if (args.name === 'regularColumnSpacing') {
        expect(args).toEqual({
          name: 'regularColumnSpacing',
          options: yesNoOptions,
        })
        return <div>regularColumnSpacing radio group</div>
      }
      throw new Error(
        `Text field should have been called with regularRowSpacing or regularColumnSpacing, instead got ${args.name} `
      )
    })

    textFieldMock.mockImplementation(args => {
      if (args.name === 'gridRows') {
        return <div>gridRows text field</div>
      }
      if (args.name === 'gridColumns') {
        return <div>gridColumns text field</div>
      }
      throw new Error(
        `Text field should have been called with gridRows or gridColumns, instead got ${args.name} `
      )
    })

    when(getFormAlertsMock)
      .expectCalledWith({
        values: getDefaultFormState(),
        touched: {},
        errors: {},
        fieldList: [
          'gridRows',
          'gridColumns',
          'regularRowSpacing',
          'regularColumnSpacing',
        ],
      })
      .mockReturnValue([<div key="mock key">mock alerts</div>])
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should render with the correct information', () => {
    render(wrapInFormik(<Grid />, formikConfig))
    expect(screen.getByText('Grid'))
    expect(screen.getByText('mock alerts'))
    expect(screen.getByText('gridRows text field'))
    expect(screen.getByText('regularRowSpacing radio group'))
    expect(screen.getByText('gridColumns text field'))
    expect(screen.getByText('regularColumnSpacing radio group'))
  })
})
