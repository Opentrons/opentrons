import * as React from 'react'
import { when } from 'jest-when'
import { DeprecatedRobotMotionLoadingModal } from '../DeprecatedRobotMotionLoadingModal'
import { i18n } from '../../../../i18n'
import {
  partialComponentPropsMatcher,
  renderWithProviders,
} from '@opentrons/components'

jest.mock('../DeprecatedRobotMotionLoadingModal')

const mockDeprecatedRobotMotionLoadingModal = DeprecatedRobotMotionLoadingModal as jest.MockedFunction<
  typeof DeprecatedRobotMotionLoadingModal
>

const mockTitle = 'Moving to Slot 7'

const render = () => {
  return renderWithProviders(
    <DeprecatedRobotMotionLoadingModal title={mockTitle} />,
    {
      i18nInstance: i18n,
    }
  )[0]
}

describe('Deprecated Robot in Motion Modal', () => {
  it('should render robot in motion modal WITH title', () => {
    when(mockDeprecatedRobotMotionLoadingModal)
      .calledWith(partialComponentPropsMatcher({ title: mockTitle }))
      .mockReturnValue(<div>mock {mockTitle}</div>)

    const { getByText } = render()
    getByText('mock Moving to Slot 7')
  })
})
