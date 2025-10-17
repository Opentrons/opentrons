import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { makeContext } from '@opentrons/step-generation'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'

import { SourceLabwareContainer } from '../SourceLabwareContainer'

import type { ComponentProps } from 'react'
import type { LabwareRender } from '@opentrons/components'
import type { Liquid } from '@opentrons/shared-data'
import type { TimelineFrame } from '@opentrons/step-generation'

vi.mock('@opentrons/components', async importOriginal => {
  const actual = await importOriginal<typeof LabwareRender>()
  return {
    ...actual,
    LabwareRender: () => <div>mock LabwareRender</div>,
  }
})

const mockRobotState = {
  liquidState: {
    labware: {
      labware: {
        A1: { liquidId: { volume: 100 }, liquidId2: { volume: 10 } },
      },
    },
  } as any,
} as TimelineFrame
const mockLiquids = [] as Liquid[]
const mockInvariantContext = makeContext()

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
      labwareId: 'tiprack3Id',
      robotState: mockRobotState,
      liquids: mockLiquids,
      invariantContext: mockInvariantContext,
    }
  })
  it('render text and mock labware render', () => {
    render(props)
    screen.getByText('Source labware')
    screen.getByText('mockDisplayName')
    screen.getByText('mock LabwareRender')
  })
})
