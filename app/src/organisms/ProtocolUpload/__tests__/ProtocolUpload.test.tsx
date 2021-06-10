import * as React from 'react'
import { mountWithProviders } from '@opentrons/components/__utils__'

import { i18n } from '../../../i18n'
import { ProtocolUpload } from '..'

describe('ProtocolUpload', () => {
  let render: () => ReturnType<typeof mountWithProviders>

  beforeEach(() => {
    render = () => {
      return mountWithProviders(<ProtocolUpload />, { i18n })
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders Protocol Upload Input for empty state', () => {
    const { wrapper } = render()

    expect(wrapper.find('UploadInput').exists()).toBe(true)
  })
})
