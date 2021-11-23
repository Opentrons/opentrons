import * as React from 'react'
import { when } from 'jest-when'
import '@testing-library/jest-dom'
import { StaticRouter } from 'react-router-dom'
import {
  componentPropsMatcher,
  renderWithProviders,
} from '@opentrons/components'

import { i18n } from '../../../i18n'

import { RunDetails } from '../../../organisms/RunDetails'
import { Run } from '../'

jest.mock('../../../redux/config')
jest.mock('../../../redux/robot/selectors')
jest.mock('../../../redux/protocol/selectors')
jest.mock('../../../organisms/RunDetails')
jest.mock('../../../organisms/SessionHeader', () => ({
  SessionHeader: () => <div>Mock Session Header</div>,
}))

const mockRunDetails = RunDetails as any

const render = () => {
  return renderWithProviders(
    <StaticRouter>
      <Run />
    </StaticRouter>,
    { i18nInstance: i18n }
  )[0]
}

describe('Run Page', () => {
  beforeEach(() => {
    when(mockRunDetails)
      .calledWith(componentPropsMatcher({}))
      .mockReturnValue(<div>Mock Run Details</div>)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders new run page when usePreProtocolWithoutRPC ff is set', () => {
    const { getByText } = render()
    getByText('Mock Run Details')
  })
})
