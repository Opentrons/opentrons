import * as React from 'react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { fireEvent, screen, cleanup } from '@testing-library/react'
import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../localization'
import { getInitialDeckSetup } from '../../../step-forms/selectors'
import { getSlotIsEmpty } from '../../../step-forms'
import { StagingAreasModal } from '../StagingAreasModal'
import type * as Components from '@opentrons/components'

vi.mock('../../../step-forms')
vi.mock('../../../step-forms/selectors')
vi.mock('../../../step-forms/actions/additionalItems')
vi.mock('@opentrons/components', async (importOriginal) => {
  const actual = await importOriginal<typeof Components>()
  return {
    ...actual,
    DeckConfigurator: vi.fn(() => (<div>mock deck config</div>))
  }
})

const render = (props: React.ComponentProps<typeof StagingAreasModal>) => {
  return renderWithProviders(<StagingAreasModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('StagingAreasModal', () => {
  let props: React.ComponentProps<typeof StagingAreasModal>
  beforeEach(() => {
    props = {
      onCloseClick: vi.fn(),
      stagingAreas: [],
    }
    vi.mocked(getInitialDeckSetup).mockReturnValue({
      pipettes: {},
      additionalEquipmentOnDeck: {},
      labware: {},
      modules: {},
    })
    vi.mocked(getSlotIsEmpty).mockReturnValue(true)
  })
  afterEach(() => {
    cleanup()
  })
  it('renders the deck, header, and buttons work as expected', () => {
    render(props)
    screen.getByText('mock deck config')
    screen.getByText('Staging Area Slots')
    fireEvent.click(screen.getByRole('button', { name: 'cancel' }))
    expect(props.onCloseClick).toHaveBeenCalled()
  })
})
