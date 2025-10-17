import { screen } from '@testing-library/react'
import { beforeEach, describe, it } from 'vitest'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { SourceLabwareContainer } from '../SourceLabwareContainer'

import type { ComponentProps } from 'react'
import type { LabwareRender } from '@opentrons/components'

vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof LabwareRender>()
  return {
    ...actual,
    LabwareRender: () => <div>mock LabwareRender</div>,
  }
})

const render = (props: ComponentProps<typeof SourceLabwareContainer>) => {
  return renderWithProviders(<SourceLabwareContainer {...props} />, {
    i18nInstance: i18n,
  })
}

describe('SourceLabwareContainer', () => {
  let props: ComponentProps<typeof SourceLabwareContainer>
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
    screen.getByText('Source labware')
    screen.getByText('source labware name')
  })
})
