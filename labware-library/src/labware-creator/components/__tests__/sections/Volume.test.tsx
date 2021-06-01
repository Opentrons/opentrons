import React from 'react'
import { FormikConfig } from 'formik'
import { when } from 'jest-when'
import isEqual from 'lodash/isEqual'
import { render, screen } from '@testing-library/react'
import { getDefaultFormState, LabwareFields } from '../../../fields'
import { isEveryFieldHidden } from '../../../utils'
import { Volume } from '../../sections/Volume'
import { FormAlerts } from '../../alerts/FormAlerts'
import { TextField } from '../../TextField'
import { wrapInFormik } from '../../utils/wrapInFormik'

jest.mock('../../../utils')
jest.mock('../../TextField')
jest.mock('../../alerts/FormAlerts')

const FormAlertsMock = FormAlerts as jest.MockedFunction<typeof FormAlerts>
const textFieldMock = TextField as jest.MockedFunction<typeof TextField>
const isEveryFieldHiddenMock = isEveryFieldHidden as jest.MockedFunction<
  typeof isEveryFieldHidden
>

const formikConfig: FormikConfig<LabwareFields> = {
  initialValues: getDefaultFormState(),
  onSubmit: jest.fn(),
}

describe('Volume', () => {
  beforeEach(() => {
    textFieldMock.mockImplementation(args => {
      return <div>wellVolume text field</div>
    })

    FormAlertsMock.mockImplementation(args => {
      if (
        isEqual(args, {
          touched: {},
          errors: {},
          fieldList: ['wellVolume'],
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
  })

  it('should render with the correct information', () => {
    render(wrapInFormik(<Volume />, formikConfig))
    expect(screen.getByText('Volume'))
    expect(screen.getByText('Total maximum volume of each well.'))
    expect(screen.getByText('mock alerts'))
    expect(screen.getByText('wellVolume text field'))
  })

  it('should render tubes when tubeRack is selected', () => {
    formikConfig.initialValues.labwareType = 'tubeRack'
    render(wrapInFormik(<Volume />, formikConfig))

    expect(screen.getByText('Total maximum volume of each tube.'))
  })

  it('should render tubes when aluminumBlock is selected', () => {
    formikConfig.initialValues.labwareType = 'aluminumBlock'
    render(wrapInFormik(<Volume />, formikConfig))

    expect(screen.getByText('Total maximum volume of each tube.'))
  })

  it('should render wells when wellplate is selected', () => {
    formikConfig.initialValues.labwareType = 'wellPlate'
    render(wrapInFormik(<Volume />, formikConfig))

    expect(screen.getByText('Total maximum volume of each well.'))
  })

  it('should not render when all fields are hidden', () => {
    when(isEveryFieldHiddenMock)
      .calledWith(['wellVolume'], formikConfig.initialValues)
      .mockReturnValue(true)

    const { container } = render(wrapInFormik(<Volume />, formikConfig))
    expect(container.firstChild).toBe(null)
  })
})
