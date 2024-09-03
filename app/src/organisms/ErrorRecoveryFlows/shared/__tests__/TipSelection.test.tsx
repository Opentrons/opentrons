import * as React from 'react'
import { describe, it, vi, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'

import { mockRecoveryContentProps } from '../../__fixtures__'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { TipSelection } from '../TipSelection'
import { WellSelection } from '../../../WellSelection'

vi.mock('../../../WellSelection')

const render = (props: React.ComponentProps<typeof TipSelection>) => {
  return renderWithProviders(<TipSelection {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('TipSelection', () => {
  let props: React.ComponentProps<typeof TipSelection>
  beforeEach(() => {
    props = {
      ...mockRecoveryContentProps,
      allowTipSelection: true,
      failedPipetteInfo: { data: { channels: 8 } } as any,
    }

    vi.mocked(WellSelection).mockReturnValue(<div>MOCK WELL SELECTION</div>)
  })

  it('renders the WellSelection component with the correct props', () => {
    render(props)

    expect(screen.getByText('MOCK WELL SELECTION')).toBeInTheDocument()
    expect(vi.mocked(WellSelection)).toHaveBeenCalledWith(
      expect.objectContaining({
        definition: props.failedLabwareUtils.tipSelectorDef,
        selectedPrimaryWells: props.failedLabwareUtils.selectedTipLocations,
        channels: props.failedPipetteInfo?.data.channels ?? 1,
      }),
      {}
    )
  })
})
