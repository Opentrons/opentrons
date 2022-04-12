import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { StaticRouter } from 'react-router-dom'
import { fireEvent } from '@testing-library/react'
import { i18n } from '../../../i18n'
import { getStoredProtocols } from '../../../redux/protocol-storage'
import { mockConnectableRobot } from '../../../redux/discovery/__fixtures__'
import { storedProtocolData as storedProtocolDataFixture } from '../../../redux/protocol-storage/__fixtures__'
import { ChooseProtocolSlideout } from '../'

jest.mock('../../../redux/protocol-storage')

const mockGetStoredProtocols = getStoredProtocols as jest.MockedFunction<
  typeof getStoredProtocols
>

const render = (props: React.ComponentProps<typeof ChooseProtocolSlideout>) => {
  return renderWithProviders(
    <StaticRouter>
      <ChooseProtocolSlideout {...props} />
    </StaticRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('ChooseProtocolSlideout', () => {
  beforeEach(() => {
    mockGetStoredProtocols.mockReturnValue([storedProtocolDataFixture])
  })
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders slideout if showSlideout true', () => {
    const [{ queryAllByText }] = render({
      robot: mockConnectableRobot,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    expect(queryAllByText('Choose Protocol to Run')).not.toBeFalsy()
    expect(queryAllByText(mockConnectableRobot.name)).not.toBeFalsy()
  })
  it('does not render slideout if showSlideout false', () => {
    const [{ queryAllByText }] = render({
      robot: mockConnectableRobot,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    expect(queryAllByText('Choose Protocol to Run').length).toEqual(0)
    expect(queryAllByText(mockConnectableRobot.name).length).toEqual(0)
  })
  it('renders an available protocol option for every stored protocol if any', () => {
    const [{ queryByText }] = render({
      robot: mockConnectableRobot,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    expect(queryByText('fakeProtocolName')).toBeInTheDocument()
  })
  it('renders an empty state if no protocol options', () => {
    const [{ queryByText }] = render({
      robot: mockConnectableRobot,
      onCloseClick: jest.fn(),
      showSlideout: true,
    })
    expect(queryByText('No protocols found')).toBeInTheDocument()
  })
})
