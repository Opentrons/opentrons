import React from 'react'
import { FormikConfig } from 'formik'
import isEqual from 'lodash/isEqual'
import { when } from 'jest-when'
import { render, screen, MatcherFunction } from '@testing-library/react'
import { getDefaultFormState, LabwareFields } from '../../../fields'
import { isEveryFieldHidden } from '../../../utils'
import { GridOffset } from '../../sections/GridOffset'
import { FormAlerts } from '../../FormAlerts'
import { TextField } from '../../TextField'

import { wrapInFormik } from '../../utils/wrapInFormik'

jest.mock('../../../utils')
jest.mock('../../TextField')
jest.mock('../../FormAlerts')

const FormAlertsMock = FormAlerts as jest.MockedFunction<typeof FormAlerts>

const textFieldMock = TextField as jest.MockedFunction<typeof TextField>

const isEveryFieldHiddenMock = isEveryFieldHidden as jest.MockedFunction<
  typeof isEveryFieldHidden
>

const formikConfig: FormikConfig<LabwareFields> = {
  initialValues: getDefaultFormState(),
  onSubmit: jest.fn(),
}

type Query = (f: MatcherFunction) => HTMLElement

// This helper function is needed to grab text with other html markup within
const withMarkup = (query: Query) => (text: string): HTMLElement =>
  // @ts-expect-error `from` doesnt want null | undefined
  query((content: string, element: HTMLElement) => {
    const hasText = (element: HTMLElement): boolean =>
      element.textContent === text
    const childrenDontHaveText = Array.from(element.children).every(
      child => !hasText(child as HTMLElement)
    )
    return hasText(element) && childrenDontHaveText
  })

describe('GridOffset', () => {
  beforeEach(() => {
    textFieldMock.mockImplementation(args => {
      if (args.name === 'gridOffsetX') {
        return <div>gridOffsetX text field</div>
      }
      if (args.name === 'gridOffsetY') {
        return <div>gridOffsetY text field</div>
      } else {
        return <div></div>
      }
    })

    FormAlertsMock.mockImplementation(args => {
      if (
        isEqual(args, {
          touched: {},
          errors: {},
          fieldList: ['gridOffsetX', 'gridOffsetY'],
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

  it('should render when fields are visible', () => {
    render(wrapInFormik(<GridOffset />, formikConfig))
    expect(screen.getByText('Grid Offset'))
    expect(screen.getByText('mock alerts'))
    expect(
      screen.getByText(
        "Corner offset informs the robot how far the grid of wells is from the slot's top left corner."
      )
    )
    expect(screen.getByText('gridOffsetX text field'))
    expect(screen.getByText('gridOffsetY text field'))
  })

  it('should update instructions when reservoir is selected', () => {
    const { getByText } = render(
      wrapInFormik(<GridOffset />, {
        ...formikConfig,
        initialValues: {
          ...formikConfig.initialValues,
          labwareType: 'reservoir',
        },
      })
    )

    const getByTextWithMarkup = withMarkup(getByText)
    getByTextWithMarkup(
      "Find the measurement from the center of the top left-most well to the edge of the labware's footprint."
    )
  })

  it('should NOT render when the labware type is aluminumBlock', () => {
    const { container } = render(
      wrapInFormik(<GridOffset />, {
        ...formikConfig,
        initialValues: {
          ...formikConfig.initialValues,
          labwareType: 'aluminumBlock',
        },
      })
    )
    expect(container.firstChild).toBe(null)
  })

  it('should NOT render when the labware type is tubeRack', () => {
    const { container } = render(
      wrapInFormik(<GridOffset />, {
        ...formikConfig,
        initialValues: {
          ...formikConfig.initialValues,
          labwareType: 'tubeRack',
        },
      })
    )
    expect(container.firstChild).toBe(null)
  })

  it('should not render when all fields are hidden', () => {
    when(isEveryFieldHiddenMock)
      .calledWith(['gridOffsetX', 'gridOffsetY'], formikConfig.initialValues)
      .mockReturnValue(true)

    const { container } = render(wrapInFormik(<GridOffset />, formikConfig))
    expect(container.firstChild).toBe(null)
  })
})
