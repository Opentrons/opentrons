import * as React from 'react'
import '@testing-library/jest-dom'
import { renderWithProviders } from '@opentrons/components/__utils__'

import { i18n } from '../../../i18n'
import { ProtocolUpload } from '..'
import * as protocolSelectors from '../../../redux/protocol/selectors'

jest.mock('../../../redux/protocol/selectors')
const getProtocolFile = protocolSelectors.getProtocolFile as jest.MockedFunction<
  typeof protocolSelectors.getProtocolFile
>
const getProtocolName = protocolSelectors.getProtocolName as jest.MockedFunction<
  typeof protocolSelectors.getProtocolName
>

describe('ProtocolUpload', () => {
  let render: () => ReturnType<typeof renderWithProviders>

  beforeEach(() => {
    getProtocolFile.mockReturnValue(null)
    getProtocolName.mockReturnValue(null)
    render = () => {
      return renderWithProviders(<ProtocolUpload />, { i18nInstance: i18n })
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders Protocol Upload Input for empty state', () => {
    const { getByRole, queryByText } = render()

    expect(getByRole('button', {name: 'Choose File...'})).toBeTruthy()
    expect(queryByText('Organization/Author')).toBeNull()
  })
  it('renders Protocol Setup if file loaded', () => {
    getProtocolFile.mockReturnValue(null)
    getProtocolName.mockReturnValue(null)
    const { queryByRole, getByText } = render()

    expect(queryByRole('button', {name: 'Choose File...'})).toBeNull()
    expect(getByText('Organization/Author')).toBeTruthy()
  })

})
