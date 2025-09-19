import { useSelector } from 'react-redux'
import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { nestedTextMatcher, renderWithProviders } from '/app/__testing-utils__'
import { i18n } from '/app/i18n'
import {
  getFlexSlotNameOnly,
  OFFSET_KIND_DEFAULT,
  OFFSET_KIND_LOCATION_SPECIFIC,
  selectActivePipetteChannelCount,
  selectIsSelectedLwTipRack,
  selectLwDisplayName,
  selectSelectedLwOverview,
} from '/app/redux/protocol-runs'

import { PlaceItemInstruction } from '../PlaceItemInstruction'

vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux')
  return {
    ...actual,
    useSelector: vi.fn(),
  }
})
vi.mock('/app/redux/protocol-runs')

describe('PlaceItemInstruction', () => {
  const mockRunId = 'mock_run_id'
  const mockProps = {
    runId: mockRunId,
  }
  const mockSlotLocation = 'Slot C2'
  const mockLwDisplayName = 'Mock Labware'
  const mockTipRackDisplayName = 'Mock Tip Rack'
  const mockLpcState = {
    protocolData: {},
  }

  const mockTipRackStackup = {
    offsetLocationDetails: {
      kind: OFFSET_KIND_DEFAULT,
      closestBeneathModuleModel: null,
      lwModOnlyStackupDetails: [{ kind: 'labware', labwareUri: 'tiprack-uri' }],
    },
  }

  const mockLabwareStackup = {
    offsetLocationDetails: {
      kind: OFFSET_KIND_DEFAULT,
      closestBeneathModuleModel: null,
      lwModOnlyStackupDetails: [{ kind: 'labware', labwareUri: 'labware-uri' }],
    },
  }

  const mockLabwareWithModuleStackup = {
    offsetLocationDetails: {
      kind: OFFSET_KIND_LOCATION_SPECIFIC,
      closestBeneathModuleModel: 'temperatureModule',
      lwModOnlyStackupDetails: [
        { kind: 'module', moduleModel: 'temperatureModule' },
        { kind: 'labware', labwareUri: 'labware-uri' },
      ],
    },
  }

  const render = () => {
    // @ts-expect-error Not all props necessary for testing.
    return renderWithProviders(<PlaceItemInstruction {...mockProps} />, {
      i18nInstance: i18n,
    })[0]
  }

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(getFlexSlotNameOnly).mockReturnValue(mockSlotLocation)
    vi.mocked(selectLwDisplayName).mockReturnValue(() => mockLwDisplayName)

    vi.mocked(selectIsSelectedLwTipRack).mockImplementation(() => () => false)
    vi.mocked(selectSelectedLwOverview).mockImplementation(() => () =>
      mockLabwareStackup as any
    )
    vi.mocked(selectActivePipetteChannelCount).mockImplementation(() => () => 8)

    vi.mocked(useSelector).mockImplementation(selector => {
      return selector({
        protocolRuns: {
          [mockRunId]: {
            lpc: mockLpcState,
          },
        },
      })
    })
  })

  it('should render prepare labware instruction in slot location', () => {
    render()

    screen.getByText(`Prepare labware in ${mockSlotLocation}`)
  })

  it('should render prepare tip rack instruction in slot location', () => {
    vi.mocked(selectIsSelectedLwTipRack).mockImplementation(() => () => true)
    vi.mocked(selectSelectedLwOverview).mockImplementation(() => () =>
      mockTipRackStackup as any
    )

    render()

    screen.getByText(`Prepare tip rack in ${mockSlotLocation}`)
  })

  it('should show clear deck instruction for default offsets', () => {
    render()

    screen.getByText(
      /Clear all deck slots of labware and remove any modules from/
    )
  })

  it('should show clear deck but modules instruction for non-default offset with a module', () => {
    vi.mocked(selectSelectedLwOverview).mockImplementation(() => () =>
      mockLabwareWithModuleStackup as any
    )

    render()

    screen.getByText(
      'Clear all deck slots of labware, leaving modules in place'
    )
  })

  it('should show a place labware instruction', () => {
    render()

    const listItems = screen.getAllByRole('listitem')
    const labwareItem = listItems.find(
      li =>
        li.textContent?.includes('Place a') &&
        li.textContent.includes(mockLwDisplayName) &&
        li.textContent.includes(mockSlotLocation)
    )

    expect(labwareItem).toBeTruthy()
  })

  it('should show a place tip rack instruction', () => {
    vi.mocked(selectIsSelectedLwTipRack).mockImplementation(() => () => true)
    vi.mocked(selectSelectedLwOverview).mockImplementation(() => () =>
      mockTipRackStackup as any
    )
    vi.mocked(selectLwDisplayName).mockReturnValue(() => mockTipRackDisplayName)

    render()

    const listItems = screen.getAllByRole('listitem')
    const tipRackItem = listItems.find(
      li =>
        li.textContent?.includes('Place') &&
        li.textContent.includes('full') &&
        li.textContent.includes(mockTipRackDisplayName) &&
        li.textContent.includes(mockSlotLocation)
    )
    expect(tipRackItem).toBeTruthy()
  })

  it('should show inline notification for 96-channel pipette when calibrating a default offset for a tiprack ', () => {
    vi.mocked(selectIsSelectedLwTipRack).mockImplementation(() => () => true)
    vi.mocked(selectSelectedLwOverview).mockImplementation(() => () =>
      mockTipRackStackup as any
    )
    vi.mocked(selectActivePipetteChannelCount).mockImplementation(() => () =>
      96
    )

    render()

    screen.getByText(
      'Ensure the tip rack is accurately placed in the slot according to the instructions provided to prevent damage.'
    )
  })

  it('should show inline notification for 96-channel pipette when calibrating a default offset for a labware', () => {
    vi.mocked(selectIsSelectedLwTipRack).mockImplementation(() => () => false)
    vi.mocked(selectSelectedLwOverview).mockImplementation(() => () =>
      mockTipRackStackup as any
    )
    vi.mocked(selectActivePipetteChannelCount).mockImplementation(() => () =>
      96
    )

    render()

    screen.getByText(
      'Ensure the labware is accurately placed in the slot according to the instructions provided to prevent damage.'
    )
  })

  it('should not show inline notification for other pipettes when calibrating a default offset', () => {
    render()

    expect(
      screen.queryByText(
        'Ensure the tip rack is accurately placed in the slot as outlined above to prevent damage to your labware.'
      )
    ).not.toBeInTheDocument()
  })

  it('should show special copy when calibrating a default offset for a tiprack with a 96ch', () => {
    const stackUp = {
      offsetLocationDetails: {
        kind: OFFSET_KIND_DEFAULT,
        closestBeneathModuleModel: null,
        lwModOnlyStackupDetails: [
          { kind: 'labware', labwareUri: 'labware-uri-1' },
        ],
      },
    } as any

    vi.mocked(selectIsSelectedLwTipRack).mockImplementation(() => () => true)
    vi.mocked(selectSelectedLwOverview).mockImplementation(() => () =>
      mockTipRackStackup as any
    )
    vi.mocked(selectActivePipetteChannelCount).mockImplementation(() => () =>
      96
    )
    vi.mocked(selectSelectedLwOverview).mockImplementation(() => () => stackUp)

    render()

    screen.getByText(
      nestedTextMatcher(
        'Place a full Mock Labware into Slot C2 without the tip rack adapter'
      )
    )
  })

  it('should show next place labware instruction for the second item in a stackup', () => {
    const multiItemStackup = {
      offsetLocationDetails: {
        kind: OFFSET_KIND_DEFAULT,
        closestBeneathModuleModel: null,
        lwModOnlyStackupDetails: [
          { kind: 'labware', labwareUri: 'labware-uri-1' },
          { kind: 'labware', labwareUri: 'labware-uri-2' },
        ],
      },
    } as any

    vi.mocked(selectSelectedLwOverview).mockImplementation(() => () =>
      multiItemStackup
    )
    vi.mocked(selectLwDisplayName).mockImplementation((runId, uri) => {
      return () =>
        uri === 'labware-uri-1' ? 'First Labware' : 'Second Labware'
    })

    render()

    const listItems = screen.getAllByRole('listitem')

    const firstLabwareItem = listItems.find(
      li =>
        li.textContent?.includes('Place a') &&
        li.textContent?.includes('First Labware')
    )

    const secondLabwareItem = listItems.find(
      li =>
        li.textContent?.includes('Next, place a') &&
        li.textContent?.includes('Second Labware')
    )

    expect(firstLabwareItem).toBeTruthy()
    expect(secondLabwareItem).toBeTruthy()
  })
})
