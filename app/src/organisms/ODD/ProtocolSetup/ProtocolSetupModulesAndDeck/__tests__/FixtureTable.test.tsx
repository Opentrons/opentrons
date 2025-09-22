import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'

import {
  FLEX_ROBOT_TYPE,
  MOVABLE_TRASH_D3_ADDRESSABLE_AREA,
  SINGLE_RIGHT_SLOT_FIXTURE,
  STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
  TRASH_BIN_ADAPTER_FIXTURE,
} from '@opentrons/shared-data'

import { renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import { LocationConflictModal } from '/app/organisms/LocationConflictModal'
import { NotConfiguredModal } from '/app/organisms/LocationConflictModal/NotConfiguredModal'
import { getLocalRobot } from '/app/redux/discovery'
import { mockConnectedRobot } from '/app/redux/discovery/__fixtures__'

import { FixtureTable } from '../FixtureTable'

import type { ComponentProps } from 'react'

vi.mock('/app/redux/discovery')
vi.mock('/app/organisms/LocationConflictModal')
vi.mock('/app/organisms/LocationConflictModal/NotConfiguredModal')

const render = (props: ComponentProps<typeof FixtureTable>) => {
  return renderWithProviders(<FixtureTable {...props} />, {
    i18nInstance: i18n,
  })
}

describe('FixtureTable', () => {
  let props: ComponentProps<typeof FixtureTable>
  beforeEach(() => {
    props = {
      deckConfigCompatibility: [
        {
          cutoutId: 'cutoutD3',
          cutoutFixtureId: STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
          requiredAddressableAreas: ['D4'],
          compatibleCutoutFixtureIds: [
            STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
          ],
        },
      ],
      robotType: FLEX_ROBOT_TYPE,
    }
    vi.mocked(getLocalRobot).mockReturnValue(mockConnectedRobot)
    vi.mocked(LocationConflictModal).mockReturnValue(
      <div>mock location conflict modal</div>
    )
    vi.mocked(NotConfiguredModal).mockReturnValue(
      <div>mock not configured modal</div>
    )
  })
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render the current status - configured', () => {
    render(props)
    screen.getByText('Configured')
  })

  it('should render the current status - not configured', () => {
    render({
      ...props,
      deckConfigCompatibility: [
        {
          cutoutId: 'cutoutD3',
          cutoutFixtureId: SINGLE_RIGHT_SLOT_FIXTURE,
          requiredAddressableAreas: [MOVABLE_TRASH_D3_ADDRESSABLE_AREA],
          compatibleCutoutFixtureIds: [TRASH_BIN_ADAPTER_FIXTURE],
        },
      ],
    })

    screen.getByText('Not configured')
    fireEvent.click(screen.getByText('Configure'))
    screen.getByText('mock not configured modal')
  })

  it('should render the current status - conflicting', () => {
    render({
      ...props,
      deckConfigCompatibility: [
        {
          cutoutId: 'cutoutD3',
          cutoutFixtureId: STAGING_AREA_SLOT_WITH_WASTE_CHUTE_RIGHT_ADAPTER_NO_COVER_FIXTURE,
          requiredAddressableAreas: [MOVABLE_TRASH_D3_ADDRESSABLE_AREA],
          compatibleCutoutFixtureIds: [TRASH_BIN_ADAPTER_FIXTURE],
        },
      ],
    })

    render(props)

    screen.getByText('Location conflict')
    fireEvent.click(screen.getByText('Resolve'))
    screen.getByText('mock location conflict modal')
  })
})
