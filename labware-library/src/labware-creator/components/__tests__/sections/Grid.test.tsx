import React from 'react'
import { FormikConfig } from 'formik'
import isEqual from 'lodash/isEqual'
import { when, resetAllWhenMocks } from 'jest-when'
import { render, screen } from '@testing-library/react'
import {
  getDefaultFormState,
  LabwareFields,
  yesNoOptions,
} from '../../../fields'
import { isEveryFieldHidden, getLabwareName } from '../../../utils'
import { Grid } from '../../sections/Grid'
import { FormAlerts } from '../../alerts/FormAlerts'
import { TextField } from '../../TextField'
import { RadioField } from '../../RadioField'
import { wrapInFormik } from '../../utils/wrapInFormik'

jest.mock('../../../utils')
jest.mock('../../TextField')
jest.mock('../../RadioField')
jest.mock('../../alerts/FormAlerts')

const FormAlertsMock = FormAlerts as jest.MockedFunction<typeof FormAlerts>

const textFieldMock = TextField as jest.MockedFunction<typeof TextField>

const radioFieldMock = RadioField as jest.MockedFunction<typeof RadioField>

const isEveryFieldHiddenMock = isEveryFieldHidden as jest.MockedFunction<
  typeof isEveryFieldHidden
>

const getLabwareNameMock = getLabwareName as jest.MockedFunction<
  typeof getLabwareName
>

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

    FormAlertsMock.mockImplementation(args => {
      if (
        isEqual(args, {
          values: formikConfig.initialValues,
          touched: {},
          errors: {},
          fieldList: [
            'gridRows',
            'gridColumns',
            'regularRowSpacing',
            'regularColumnSpacing',
          ],
        })
      ) {
        return <div>mock alerts</div>
      } else {
        return <div></div>
      }
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    resetAllWhenMocks()
  })
  it('should render when fields are visible', () => {
    when(getLabwareNameMock)
      .calledWith(formikConfig.initialValues, true)
      .mockReturnValue('FAKE LABWARE NAME PLURAL')
    when(getLabwareNameMock)

    render(wrapInFormik(<Grid />, formikConfig))
    expect(screen.getByText('Grid'))
    expect(screen.getByText('mock alerts'))
    expect(
      screen.getByText(
        'The grid of FAKE LABWARE NAME PLURAL on your labware is arranged via rows and columns. ' +
          'Rows run horizontally across your labware (left to right). Columns run top to bottom.'
      )
    )
    expect(screen.getByText('gridRows text field'))
    expect(screen.getByText('regularRowSpacing radio group'))
    expect(screen.getByText('gridColumns text field'))
    expect(screen.getByText('regularColumnSpacing radio group'))
  })

  it('should NOT render when the labware type is aluminumBlock', () => {
    const { container } = render(
      wrapInFormik(<Grid />, {
        ...formikConfig,
        initialValues: {
          ...formikConfig.initialValues,
          labwareType: 'aluminumBlock',
        },
      })
    )
    expect(container.firstChild).toBe(null)
  })

  it('should not render when all fields are hidden', () => {
    when(isEveryFieldHiddenMock)
      .calledWith(
        [
          'gridRows',
          'gridColumns',
          'regularRowSpacing',
          'regularColumnSpacing',
        ],
        formikConfig.initialValues
      )
      .mockReturnValue(true)

    const { container } = render(wrapInFormik(<Grid />, formikConfig))
    expect(container.firstChild).toBe(null)
  })
})
