import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { FormikConfig } from 'formik'
import { when, resetAllWhenMocks } from 'jest-when'
import {
  getDefaultFormState,
  getInitialStatus,
  LabwareFields,
  LabwareType,
} from '../../../fields'
import { getLabwareName } from '../../../utils'
import { WellBottomAndDepth } from '../../sections/WellBottomAndDepth'

import { wrapInFormik } from '../../utils/wrapInFormik'

jest.mock('../../../utils')

const getLabwareNameMock = getLabwareName as jest.MockedFunction<
  typeof getLabwareName
>

let formikConfig: FormikConfig<LabwareFields>

describe('WellBottomAndDepth', () => {
  beforeEach(() => {
    formikConfig = {
      initialValues: getDefaultFormState(),
      initialStatus: getInitialStatus(),
      onSubmit: jest.fn(),
    }
  })

  afterEach(() => {
    jest.restoreAllMocks()
    resetAllWhenMocks()
  })

  const labwareTypes: LabwareType[] = [
    'tubeRack',
    'wellPlate',
    'reservoir',
    'aluminumBlock',
  ]
  labwareTypes.forEach(labwareType => {
    it(`should render with the correct information ${labwareType}`, () => {
      formikConfig.initialValues.labwareType = labwareType
      when(getLabwareNameMock)
        .calledWith(formikConfig.initialValues, false)
        .mockReturnValue('FAKE LABWARE NAME SINGULAR')
      when(getLabwareNameMock)
        .calledWith(formikConfig.initialValues, true)
        .mockReturnValue('FAKE LABWARE NAME PLURAL')

      render(wrapInFormik(<WellBottomAndDepth />, formikConfig))

      expect(screen.getByRole('heading')).toHaveTextContent(
        /FAKE LABWARE NAME SINGULAR Bottom & Depth/i
      )

      screen.getByText(
        'Depth informs the robot how far down it can go inside a FAKE LABWARE NAME SINGULAR.'
      )
      const radioElements = screen.getAllByRole('radio')
      expect(radioElements).toHaveLength(3)
      screen.getAllByRole('radio', { name: /flat/i })
      screen.getAllByRole('radio', { name: /round/i })
      screen.getAllByRole('radio', { name: /v-bottom/i })

      screen.getByRole('textbox', { name: /depth/i })
    })
  })

  it('should render tip length when tipRack is selected and hide the well bottom shape radioFields', () => {
    formikConfig.initialValues.labwareType = 'tipRack'
    render(wrapInFormik(<WellBottomAndDepth />, formikConfig))

    expect(screen.getByRole('heading')).toHaveTextContent(/Tip Length/i)

    screen.getByText('Reference the top of the tip to the bottom of the tip.')

    expect(screen.queryByRole('radio', { name: /flat/i })).toBeNull()
    expect(screen.queryByRole('radio', { name: /u/i })).toBeNull()
    expect(screen.queryByRole('radio', { name: /v/i })).toBeNull()
  })

  it('should render alert when error is present', () => {
    const FAKE_ERROR = 'ahh'
    formikConfig.initialErrors = { wellDepth: FAKE_ERROR }
    formikConfig.initialTouched = { wellDepth: true }
    render(wrapInFormik(<WellBottomAndDepth />, formikConfig))

    screen.getByRole('alert')
  })
})
