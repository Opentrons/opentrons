import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FLEX_STACKER_MODULE_TYPE } from '@opentrons/shared-data'
import { makeContext, makeInitialRobotState } from '@opentrons/step-generation'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import {
  getLabwareEntities,
  getModuleEntities,
} from '/protocol-designer/step-forms/selectors'
import { getRobotStateAtActiveItem } from '/protocol-designer/top-selectors/labware-locations'
import { getLabwareNicknamesById } from '/protocol-designer/ui/labware/selectors'
import { getFlexStackerLabwareOptions } from '/protocol-designer/ui/modules/selectors'

import { FlexStackerTools } from '..'

import type { ComponentProps } from 'react'

vi.mock('/protocol-designer/top-selectors/labware-locations')
vi.mock('/protocol-designer/step-forms/selectors')
vi.mock('/protocol-designer/ui/labware/selectors')
vi.mock('/protocol-designer/ui/modules/selectors')

const render = (props: ComponentProps<typeof FlexStackerTools>) => {
  return renderWithProviders(<FlexStackerTools {...props} />, {
    i18nInstance: i18n,
  })[0]
}
const mockStackerId = 'mockStackerId'
const mockInvariantContext = makeContext()
const mockRobotState = makeInitialRobotState({
  invariantContext: mockInvariantContext,
  pipetteLocations: { p300SingleId: { mount: 'left' } },
  labwareLocations: {
    tiprack1Id: { stack: ['tiprack1Id', '2'] },
    sourcePlateId: { stack: ['sourcePlateId', '4'] },
    destPlateId: { stack: ['destPlateId', '5'] },
  },
  moduleLocations: {
    [mockStackerId]: {
      slot: 'D4',
      moduleState: {
        type: FLEX_STACKER_MODULE_TYPE,
        storedLabwareDetails: null,
        labwareInHopper: [],
        labwareOnShuttle: null,
      },
    },
  },
})

describe('FlexStackerTools', () => {
  let props: ComponentProps<typeof FlexStackerTools>
  const makeField = (value: any = null) => ({
    value,
    updateValue: vi.fn(),
    name: '',
    disabled: false,
    errorToShow: null,
    onFieldBlur: vi.fn(),
    onFieldFocus: vi.fn(),
  })

  beforeEach(() => {
    props = {
      propsForFields: {
        fillLabwareUri: makeField(),
        fillLabwareIds: makeField(),
        flexStackerFormType: makeField('fill'),
        interventionMessage: makeField(),
        moduleId: makeField(mockStackerId),
      } as any,
      formData: { moduleId: mockStackerId } as any,
      toolboxStep: 0,
      showFormErrors: false,
      focusHandlers: {} as any,
      tab: 'aspirate',
      setTab: vi.fn(),
      setShowFormErrors: vi.fn(),
    }
    vi.mocked(getRobotStateAtActiveItem).mockReturnValue({
      ...mockRobotState,
      modules: {
        [mockStackerId]: {
          moduleState: {
            type: FLEX_STACKER_MODULE_TYPE,
            storedLabwareDetails: {
              primaryLabwareURI: 'mockLabwareURI',
              lidLabwareURI: 'mockLidLabwareURI',
              adapterLabwareURI: 'mockAdapterLabwareURI',
            },
            labwareInHopper: [
              {
                primaryLabwareId: 'mockLabwareId',
                adapterLabwareId: null,
                lidLabwareId: null,
              },
            ],
            labwareOnShuttle: null,
          },
        },
      },
    } as any)
    vi.mocked(getFlexStackerLabwareOptions).mockReturnValue([])
    vi.mocked(getLabwareEntities).mockReturnValue(
      mockInvariantContext.labwareEntities
    )
    vi.mocked(getModuleEntities).mockReturnValue({
      [mockStackerId]: {
        id: mockStackerId,
        type: FLEX_STACKER_MODULE_TYPE,
        model: 'flexStackerModuleV1' as any,
        pythonName: 'flexStackerModuleV1',
      },
    })
    vi.mocked(getLabwareNicknamesById).mockReturnValue({})
  })

  it('should render view only', () => {
    render(props)
    expect(screen.getByText('Choose option')).toBeInTheDocument()
    expect(screen.getByText('Shuttle')).toBeInTheDocument()
    expect(screen.getByText('Stacker')).toBeInTheDocument()
  })

  it('should render view with labware in hopper', () => {
    vi.mocked(getRobotStateAtActiveItem).mockReturnValue({
      ...mockRobotState,
      modules: {
        [mockStackerId]: {
          moduleState: {
            type: FLEX_STACKER_MODULE_TYPE,
            storedLabwareDetails: {
              primaryLabwareURI: 'fixture/fixture_flex_96_tiprack_1000ul/1',
              lidLabwareURI: null,
              adapterLabwareURI: null,
            },
            labwareInHopper: [
              {
                primaryLabwareId: 'tiprack5Id',
                adapterLabwareId: null,
                lidLabwareId: null,
              },
            ],
            labwareOnShuttle: null,
          },
        },
      } as any,
    } as any)
    render(props)
    expect(screen.getByText('1/6 labware filled')).toBeInTheDocument()
    expect(screen.getByText('Fixture Flex Tiprack 1000 uL')).toBeInTheDocument()
    expect(screen.getByText('Quantity: 1')).toBeInTheDocument()
  })

  it('should render view with no labware in hopper', () => {
    vi.mocked(getRobotStateAtActiveItem).mockReturnValue({
      ...mockRobotState,
      modules: {
        [mockStackerId]: {
          moduleState: {
            type: FLEX_STACKER_MODULE_TYPE,
            storedLabwareDetails: null,
            labwareInHopper: [],
            labwareOnShuttle: null,
          },
        },
      } as any,
    } as any)
    render(props)
    expect(screen.getByText('No labware on stacker')).toBeInTheDocument()
  })

  it('should render view with labware on shuttle', () => {
    vi.mocked(getRobotStateAtActiveItem).mockReturnValue({
      ...mockRobotState,
      modules: {
        [mockStackerId]: {
          moduleState: {
            type: FLEX_STACKER_MODULE_TYPE,
            storedLabwareDetails: null,
            labwareInHopper: [],
            labwareOnShuttle: {
              primaryLabwareId: 'tiprack5Id',
              adapterLabwareId: null,
              lidLabwareId: null,
            },
          },
        },
      } as any,
    } as any)
    render(props)
    expect(screen.getByText('Shuttle')).toBeInTheDocument()
    expect(screen.getByText('Fixture Flex Tiprack 1000 uL')).toBeInTheDocument()
  })

  it('should render view with no labware on shuttle', () => {
    vi.mocked(getRobotStateAtActiveItem).mockReturnValue({
      ...mockRobotState,
      modules: {
        [mockStackerId]: {
          moduleState: {
            type: FLEX_STACKER_MODULE_TYPE,
            storedLabwareDetails: null,
            labwareInHopper: [],
            labwareOnShuttle: null,
          },
        },
      } as any,
    } as any)
    render(props)
    expect(screen.getByText('No labware on shuttle')).toBeInTheDocument()
  })
})
