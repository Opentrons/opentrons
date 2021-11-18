import * as React from 'react'
import { when } from 'jest-when'
import { RobotMotionLoadingModal } from '../RobotMotionLoadingModal'
import { i18n } from '../../../../i18n'
import {
  partialComponentPropsMatcher,
  renderWithProviders,
} from '@opentrons/components'

jest.mock('../RobotMotionLoadingModal')

const mockRobotMotionLoadingModal = RobotMotionLoadingModal as jest.MockedFunction<
  typeof RobotMotionLoadingModal
>

const mockTitle = 'Moving to Slot 7'

const render = () => {
  return renderWithProviders(<RobotMotionLoadingModal title={mockTitle} />, {
    i18nInstance: i18n,
  })[0]
}

describe('Robot in Motion Modal', () => {
  it('should render robot in motion modal WITH title', () => {
    when(mockRobotMotionLoadingModal)
      .calledWith(partialComponentPropsMatcher({ title: mockTitle }))
      .mockReturnValue(<div>mock {mockTitle}</div>)

    const { getByText } = render()
    getByText('mock Moving to Slot 7')
  })
})
