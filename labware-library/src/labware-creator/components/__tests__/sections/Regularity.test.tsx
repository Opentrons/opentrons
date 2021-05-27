import React from 'react'
import isEqual from 'lodash/isEqual'
import { when } from 'jest-when'
import { FormikConfig } from 'formik'
import { render, screen } from '@testing-library/react'
import {
  getDefaultFormState,
  LabwareFields,
  yesNoOptions,
} from '../../../fields'
import { isEveryFieldHidden } from '../../../utils'
import { Regularity } from '../../sections/Regularity'
import { FormAlerts } from '../../alerts/FormAlerts'
import { RadioField } from '../../RadioField'
import { wrapInFormik } from '../../utils/wrapInFormik'

jest.mock('../../RadioField')
jest.mock('../../alerts/FormAlerts')
jest.mock('../../../utils')

const RadioFieldMock = RadioField as jest.MockedFunction<typeof RadioField>
const FormAlertsMock = FormAlerts as jest.MockedFunction<typeof FormAlerts>
const isEveryFieldHiddenMock = isEveryFieldHidden as jest.MockedFunction<
  typeof isEveryFieldHidden
>

const formikConfig: FormikConfig<LabwareFields> = {
  initialValues: getDefaultFormState(),
  onSubmit: jest.fn(),
}

describe('Regularity', () => {
  beforeEach(() => {
    RadioFieldMock.mockImplementation(args => {
      if (isEqual(args, { name: 'homogeneousWells', options: yesNoOptions })) {
        return <div>homogeneousWells radio group</div>
      } else {
        return <div></div>
      }
    })

    FormAlertsMock.mockImplementation(args => {
      if (
        isEqual(args, {
          touched: {},
          errors: {},
          fieldList: ['homogeneousWells'],
        })
      ) {
        return <div>mock alerts</div>
      } else {
        return <div></div>
      }
    })

    when(isEveryFieldHiddenMock)
      .calledWith(['homogeneousWells'], formikConfig.initialValues)
      .mockReturnValue(false)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })
  it('should render alerts and a radio field when fields are visible', () => {
    render(wrapInFormik(<Regularity />, formikConfig))
    expect(screen.getByText('Regularity'))
    expect(screen.getByText('mock alerts'))
    expect(screen.getByText('homogeneousWells radio group'))
  })
  it('should not render when all of the fields are hidden', () => {
    when(isEveryFieldHiddenMock)
      .calledWith(['homogeneousWells'], formikConfig.initialValues)
      .mockReturnValue(true)

    const { container } = render(wrapInFormik(<Regularity />, formikConfig))
    expect(container.firstChild).toBe(null)
  })
})
