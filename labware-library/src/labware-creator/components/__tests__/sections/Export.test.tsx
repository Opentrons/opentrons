import React from 'react'
import { when } from 'jest-when'
import { FormikConfig } from 'formik'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  getDefaultFormState,
  getInitialStatus,
  LabwareFields,
} from '../../../fields'
import { isEveryFieldHidden } from '../../../utils'
import { Export } from '../../sections/Export'
import { wrapInFormik } from '../../utils/wrapInFormik'

jest.mock('../../../utils')

const isEveryFieldHiddenMock = isEveryFieldHidden as jest.MockedFunction<
  typeof isEveryFieldHidden
>

let formikConfig: FormikConfig<LabwareFields>
let onExportClick: (e: any) => unknown

describe('Export', () => {
  beforeEach(() => {
    formikConfig = {
      initialStatus: getInitialStatus(),
      initialValues: getDefaultFormState(),
      onSubmit: jest.fn(),
    }

    onExportClick = jest.fn()

    when(isEveryFieldHiddenMock)
      .calledWith(['loadName'], formikConfig.initialValues)
      .mockReturnValue(false)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should render button when section is visible', () => {
    render(wrapInFormik(<Export onExportClick={onExportClick} />, formikConfig))

    screen.getByRole('button', { name: /export/i })
  })
})
