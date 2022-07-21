import * as React from 'react'
import { i18n } from '../../../../../i18n'
import { renderWithProviders } from '@opentrons/components'
import { SetupLiquids } from '../index'
import { SetupLiquidsList } from '../SetupLiquidsList'
import { SetupLiquidsMap } from '../SetupLiquidsMap'
import { ProceedToRunButton } from '../../ProceedToRunButton'
import { fireEvent } from '@testing-library/react'

jest.mock('../SetupLiquidsList')
jest.mock('../SetupLiquidsMap')
jest.mock('../../ProceedToRunButton')

const mockSetupLiquidsList = SetupLiquidsList as jest.MockedFunction<
  typeof SetupLiquidsList
>
const mockSetupLiquidsMap = SetupLiquidsMap as jest.MockedFunction<
  typeof SetupLiquidsMap
>
const mockProceedToRunButton = ProceedToRunButton as jest.MockedFunction<
  typeof ProceedToRunButton
>

const render = (props: React.ComponentProps<typeof SetupLiquids>) => {
  return renderWithProviders(
    <SetupLiquids robotName="otie" runId="123" protocolRunHeaderRef={null} />,
    {
      i18nInstance: i18n,
    }
  )
}

describe('SetupLiquids', () => {
  let props: React.ComponentProps<typeof SetupLiquids>
  beforeEach(() => {
    mockSetupLiquidsList.mockReturnValue(<div>Mock setup liquids list</div>)
    mockSetupLiquidsMap.mockReturnValue(<div>Mock setup liquids map</div>)
    mockProceedToRunButton.mockReturnValue(
      <button>Mock ProceedToRunButton</button>
    )
  })

  it('renders the list and map view buttons and proceed button', () => {
    const [{ getByRole }] = render(props)
    getByRole('button', { name: 'List View' })
    getByRole('button', { name: 'Map View' })
    getByRole('button', { name: 'Mock ProceedToRunButton' })
  })
  it('renders the map view when you press that toggle button', () => {
    const [{ getByRole, getByText }] = render(props)
    const mapViewButton = getByRole('button', { name: 'Map View' })
    fireEvent.click(mapViewButton)
    getByText('Mock setup liquids map')
  })
  it('renders the list view when you press that toggle button', () => {
    const [{ getByRole, getByText }] = render(props)
    const mapViewButton = getByRole('button', { name: 'List View' })
    fireEvent.click(mapViewButton)
    getByText('Mock setup liquids list')
  })
})
