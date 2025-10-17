import { screen } from '@testing-library/react'
import { beforeEach, describe, it } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { DestinationLabwareContainer } from '../DestinationLabwareContainer'

import type { ComponentProps } from 'react'
import type { LabwareRender } from '@opentrons/components'

vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof LabwareRender>()
  return {
    ...actual,
    LabwareRender: () => <div>mock LabwareRender</div>,
  }
})

const render = (props: ComponentProps<typeof DestinationLabwareContainer>) => {
  return renderWithProviders(<DestinationLabwareContainer {...props} />, {
    i18nInstance: i18n,
  })
}

describe('DestinationLabwareContainer', () => {
  let props: ComponentProps<typeof DestinationLabwareContainer>
  beforeEach(() => {
    props = {
      slotId: 'mockSlotId',
      displayName: 'mockDisplayName',
      labwareId: 'mockLabwareId',
      robotState: mockRobotState,
      liquids: mockLiquids,
      invariantContext: mockInvariantContext,
    }
  })
  it('render text', () => {
    render(props)
    screen.getByText('Destination labware')
    screen.getByText('mockDisplayName')
  })

  it('renders mock labware render', () => {
    render(props)
    screen.getByText('mock LabwareRender')
  })
})
