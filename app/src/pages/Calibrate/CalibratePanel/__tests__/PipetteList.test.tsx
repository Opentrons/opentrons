import * as React from 'react'
import { StaticRouter } from 'react-router-dom'
import { mountWithProviders } from '@opentrons/components/__utils__'

import { i18n } from '../../../../i18n'
import * as PipettesSelectors from '../../../../redux/pipettes/selectors'
import * as robotSelectors from '../../../../redux/robot/selectors'
import * as calibrateSelectors from '../../../../redux/nav/calibrate-selectors'

import type { BaseProtocolLabware } from '../../../../redux/calibration/types'
import tiprack300Def from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import { fetchTipLengthCalibrations } from '../../../../redux/calibration/'
import { PipetteListComponent } from '../PipetteList'

import type { PipetteListComponentProps } from '../PipetteList'

jest.mock('../../../../redux/robot/selectors')
jest.mock('../../../../redux/nav/calibrate-selectors')
jest.mock('../../../../redux/pipettes/selectors')

const mockGetProtocolPipettes = robotSelectors.getPipettes as jest.MockedFunction<
  typeof robotSelectors.getPipettes
>

const mockGetCalibratePipetteLocations = calibrateSelectors.getCalibratePipettesLocations as jest.MockedFunction<
  typeof calibrateSelectors.getCalibratePipettesLocations
>

const mockGetAttachedPipettes = PipettesSelectors.getAttachedPipettes as jest.MockedFunction<
  typeof PipettesSelectors.getAttachedPipettes
>

const mockLeftSpecs: any = {
  displayName: 'Left Pipette',
  name: 'mock_left',
  backCompatNames: ['mock_left_legacy'],
}

const mockLeftProtoPipette: any = {
  mount: 'left',
  name: 'mock_left_model',
  modelSpecs: mockLeftSpecs,
}

const stubTipRacks: BaseProtocolLabware[] = [
  {
    type: 'some_tiprack',
    definition: tiprack300Def,
    slot: '3',
    name: 'some tiprack',
    calibratorMount: 'left',
    isTiprack: true,
    confirmed: true,
    parent: null,
    calibrationData: null,
  } as any,
  {
    type: 'some_other_tiprack',
    definition: null,
    slot: '1',
    name: 'some other tiprack',
    calibratorMount: 'left',
    isTiprack: true,
    confirmed: true,
    parent: null,
    calibrationData: null,
  } as any,
]

const mockPipetteLocations = {
  left: {
    default: {
      path: '/path/left',
      disabledReason: null,
    },
    'hash-1': {
      path: '/path/left/hash-1',
      disabledReason: null,
    },
    'hash-2': {
      path: '/path/left/hash-2',
      disabledReason: null,
    },
  },
  right: {
    default: {
      path: '/path/right',
      disabledReason: null,
    },
    'hash-3': {
      path: '/path/right/hash-3',
      disabledReason: null,
    },
    'hash-2': {
      path: '/path/right/hash-2',
      disabledReason: null,
    },
  },
}

const mockAttachedPipettes: ReturnType<
  typeof PipettesSelectors.getAttachedPipettes
> = {
  left: { model: 'p300_single_v2.0' },
  right: null,
} as any

describe('PipetteListComponent', () => {
  let render: (
    props: PipetteListComponentProps,
    location?: string | undefined
  ) => ReturnType<typeof mountWithProviders>

  beforeEach(() => {
    mockGetProtocolPipettes.mockReturnValue([mockLeftProtoPipette])
    mockGetCalibratePipetteLocations.mockReturnValue(mockPipetteLocations)
    mockGetAttachedPipettes.mockReturnValue(mockAttachedPipettes)

    render = (props, location = '/') => {
      return mountWithProviders(
        <StaticRouter context={{}} location={location}>
          <PipetteListComponent {...props} />,
        </StaticRouter>,
        { i18n }
      )
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('dispatches fetch tip length calibration action on render', () => {
    const { store } = render({
      robotName: 'robotName',
      tipracks: stubTipRacks,
    } as any)

    expect(store.dispatch).toHaveBeenCalledWith(
      fetchTipLengthCalibrations('robotName')
    )
  })

  it('renders tip length calibration', () => {
    const { wrapper } = render({
      robotName: 'robotName',
      tipracks: stubTipRacks,
    } as any)
    const component = wrapper.find(PipetteListComponent)

    expect(
      component.find('TitledList[title="Tip Length Calibration"]').exists()
    ).toBe(true)

    stubTipRacks.forEach(tr => {
      expect(
        component.find(`PipetteTiprackListItem[name="${tr.name}"]`).exists()
      ).toBe(true)
    })
  })
})
