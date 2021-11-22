import * as React from 'react'
import '@testing-library/jest-dom'
import { renderWithProviders } from '@opentrons/components'
import { AlertItem } from '@opentrons/components/src/alerts'
import { i18n } from '../../../i18n'
import { fireEvent } from '@testing-library/dom'
import { LabwareOffsetSuccessToast } from '../LabwareOffsetSuccessToast'

jest.mock('@opentrons/components/src/alerts')

const mockAlertItem = AlertItem as jest.MockedFunction<typeof AlertItem>

const render = (
  props: React.ComponentProps<typeof LabwareOffsetSuccessToast>
) => {
  return renderWithProviders(<LabwareOffsetSuccessToast {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe(' LabwareOffsetSuccessToast', () => {
  let props: React.ComponentProps<typeof LabwareOffsetSuccessToast>

  beforeEach(() => {
    props = { onCloseClick: jest.fn() }
    mockAlertItem.mockReturnValue(<div>Mock AlertItem</div>)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders LPC success toast and is clickable', () => {
    const { getByText } = render(props)
    const successToast = getByText('Mock AlertItem')
    fireEvent.click(successToast)
  })
})
