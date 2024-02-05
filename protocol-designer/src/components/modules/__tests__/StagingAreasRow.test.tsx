import * as React from 'react'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '../../../__testing-utils__' 
import { i18n } from '../../../localization'
import { FlexSlotMap } from '../FlexSlotMap'
import { StagingAreasRow } from '../StagingAreasRow'

jest.mock('../FlexSlotMap')

const mockFlexSlotMap = FlexSlotMap as jest.MockedFunction<typeof FlexSlotMap>

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
  })
  it('renders no staging areas', () => {
    render(props)
    screen.getByText('Staging Area Slots')
    fireEvent.click(screen.getByRole('button', { name: 'add' }))
  })
  it('renders a staging area', () => {
    props = {
      ...props,
      stagingAreas: [{ name: 'stagingArea', location: 'B3', id: 'mockId' }],
    }
    render(props)
    screen.getByText('mock slot map')
    screen.getByText('Position:')
    screen.getByText('B3')
    fireEvent.click(screen.getByRole('button', { name: 'remove' }))
    expect(props.handleAttachment).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'edit' }))
  })
})
