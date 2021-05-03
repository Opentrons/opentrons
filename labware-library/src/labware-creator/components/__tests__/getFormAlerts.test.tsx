import * as React from 'react'
import { AlertItem } from '@opentrons/components'
import { getIsHidden } from '../../formSelectors'
import { IRREGULAR_LABWARE_ERROR } from '../../fields'
import {
  getFormAlerts,
  Props as FormAlertProps,
  IrregularLabwareAlert,
} from '../utils/getFormAlerts'
import { when, resetAllWhenMocks } from 'jest-when'

jest.mock('../../formSelectors')

const getIsHiddenMock = getIsHidden as jest.MockedFunction<typeof getIsHidden>

describe('getFormAlerts', () => {
  afterEach(() => {
    resetAllWhenMocks()
  })
  it('should return null when all fields are hidden', () => {
    when(getIsHiddenMock)
      .expectCalledWith('labwareType', {} as any)
      .mockReturnValue(true)
    const props: FormAlertProps = {
      values: {} as any,
      fieldList: ['labwareType'],
      touched: {},
      errors: {},
    }
    expect(getFormAlerts(props)).toBe(null)
  })
  it('should return errors for the dirty fields with errors when fields are not hidden', () => {
    when(getIsHiddenMock)
      .calledWith('labwareType', {} as any)
      .mockReturnValue(false)

    when(getIsHiddenMock)
      .calledWith('tubeRackInsertLoadName', {} as any)
      .mockReturnValue(false)

    const props: FormAlertProps = {
      values: {} as any,
      fieldList: ['labwareType', 'tubeRackInsertLoadName'],
      touched: { labwareType: true, tubeRackInsertLoadName: true },
      errors: {
        labwareType: 'some error',
        tubeRackInsertLoadName: IRREGULAR_LABWARE_ERROR,
      },
    }
    const expectedErrors = [
      <AlertItem key={'some error'} type="warning" title={'some error'} />,
      // eslint-disable-next-line react/jsx-key
      <IrregularLabwareAlert />,
    ]
    expect(getFormAlerts(props)).toEqual(expectedErrors)
  })
})
