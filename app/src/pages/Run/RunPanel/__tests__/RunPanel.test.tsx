import * as React from 'react'
import { when } from 'jest-when'
import '@testing-library/jest-dom'
import {
  partialComponentPropsMatcher,
  renderWithProviders,
} from '@opentrons/components'

import { i18n } from '../../../../i18n'

import { RunTimeControl } from '../../../../organisms/RunTimeControl'
import { RunPanel } from '../'

jest.mock('../../../../redux/config')
jest.mock('../../../../organisms/RunTimeControl')

const mockRunTimeControl = RunTimeControl as jest.Mock

const render = () => {
  return renderWithProviders(<RunPanel />, { i18nInstance: i18n })[0]
}

describe('RunSetupCard', () => {
  beforeEach(() => {
    when(mockRunTimeControl)
      .calledWith(partialComponentPropsMatcher({}))
      .mockImplementation(() => <div>Mock Run Time Control</div>)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders run panel components', () => {
    const { getByText } = render()
    getByText('Mock Run Time Control')
  })
})
