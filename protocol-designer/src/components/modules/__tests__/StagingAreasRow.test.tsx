import type * as React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../assets/localization'
import { FlexSlotMap } from '../FlexSlotMap'
import { StagingAreasRow } from '../StagingAreasRow'
import { getInitialDeckSetup } from '../../../step-forms/selectors'

vi.mock('../../../step-forms/selectors')
vi.mock('../FlexSlotMap')

const render = (props: React.ComponentProps<typeof StagingAreasRow>) => {
  return renderWithProviders(<StagingAreasRow {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('StagingAreasRow', () => {
  let props: React.ComponentProps<typeof StagingAreasRow>
  beforeEach(() => {
    props = {
      handleAttachment: vi.fn(),
      stagingAreas: [],
    }
    vi.mocked(FlexSlotMap).mockReturnValue(<div>mock slot map</div>)
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      pipettes: {},
      modules: {},
      additionalEquipmentOnDeck: {},
      labware: {},
    })
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
