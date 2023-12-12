import * as React from 'react'
import i18n from 'i18next'
import { renderWithProviders } from '@opentrons/components'

import { Portal } from '../../portals/TopPortal'
import { FlexSlotMap } from '../FlexSlotMap'
import { StagingAreasRow } from '../StagingAreasRow'

jest.mock('../FlexSlotMap')
jest.mock('../../portals/TopPortal')

const mockFlexSlotMap = FlexSlotMap as jest.MockedFunction<typeof FlexSlotMap>
const mockPortal = Portal as jest.MockedFunction<typeof Portal>

const render = (props: React.ComponentProps<typeof StagingAreasRow>) => {
  return renderWithProviders(<StagingAreasRow {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('StagingAreasRow', () => {
  let props: React.ComponentProps<typeof StagingAreasRow>
  beforeEach(() => {
    props = {
      handleAttachment: jest.fn(),
      stagingAreas: [],
    }
    mockFlexSlotMap.mockReturnValue(<div>mock slot map</div>)
    mockPortal.mockReturnValue(<div>mock portal</div>)
  })
  it('renders no staging areas', () => {
    const { getByRole, getByText } = render(props)
    getByText('Staging Area Slots')
    getByRole('button', { name: 'add' }).click()
    getByText('mock portal')
  })
  it('renders a staging area', () => {
    props = {
      ...props,
      stagingAreas: [{ name: 'stagingArea', location: 'B3', id: 'mockId' }],
    }
    const { getByRole, getByText } = render(props)
    getByText('mock slot map')
    getByText('Position:')
    getByText('B3')
    getByRole('button', { name: 'remove' }).click()
    expect(props.handleAttachment).toHaveBeenCalled()
    getByRole('button', { name: 'edit' }).click()
    getByText('mock portal')
  })
})
