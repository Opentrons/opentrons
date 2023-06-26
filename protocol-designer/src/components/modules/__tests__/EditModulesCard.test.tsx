import React from 'react'
import { mount } from 'enzyme'
import { Provider } from 'react-redux'
import {
  MAGNETIC_MODULE_TYPE,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
  TEMPERATURE_MODULE_TYPE,
  TEMPERATURE_MODULE_V1,
  OT2_ROBOT_TYPE,
  FLEX_ROBOT_TYPE,
} from '@opentrons/shared-data'
import { TEMPERATURE_DEACTIVATED } from '@opentrons/step-generation'
import { selectors as featureFlagSelectors } from '../../../feature-flags'
import {
  ModuleOnDeck,
  selectors as stepFormSelectors,
} from '../../../step-forms'
import { getRobotType } from '../../../file-data/selectors'
import { FormPipette } from '../../../step-forms/types'
import { getAdditionalEquipment } from '../../../step-forms/selectors'
import { SUPPORTED_MODULE_TYPES } from '../../../modules'
import { EditModulesCard } from '../EditModulesCard'
import { CrashInfoBox } from '../CrashInfoBox'
import { ModuleRow } from '../ModuleRow'
import { GripperRow } from '../GripperRow'

jest.mock('../../../feature-flags')
jest.mock('../../../step-forms/selectors')
jest.mock('../../../file-data/selectors')

const getDisableModuleRestrictionsMock = featureFlagSelectors.getDisableModuleRestrictions as jest.MockedFunction<
  typeof featureFlagSelectors.getDisableModuleRestrictions
>
const getPipettesForEditPipetteFormMock = stepFormSelectors.getPipettesForEditPipetteForm as jest.MockedFunction<
  typeof stepFormSelectors.getPipettesForEditPipetteForm
>
const mockGetRobotType = getRobotType as jest.MockedFunction<
  typeof getRobotType
>
const mockGetAdditionalEquipment = getAdditionalEquipment as jest.MockedFunction<
  typeof getAdditionalEquipment
>
describe('EditModulesCard', () => {
  let store: any
  let crashableMagneticModule: ModuleOnDeck | undefined
  let nonCrashableMagneticModule: ModuleOnDeck | undefined
  let crashablePipette: FormPipette
  let noncrashablePipette: FormPipette
  let props: React.ComponentProps<typeof EditModulesCard>
  beforeEach(() => {
    crashableMagneticModule = {
      id: 'magnet123',
      type: MAGNETIC_MODULE_TYPE,
      model: MAGNETIC_MODULE_V1,
      moduleState: {
        type: MAGNETIC_MODULE_TYPE,
        engaged: false,
      },
      slot: '1',
    }
    nonCrashableMagneticModule = {
      ...crashableMagneticModule,
      model: MAGNETIC_MODULE_V2,
    }

    store = {
      dispatch: jest.fn(),
      subscribe: jest.fn(),
      getState: () => ({}),
    }

    crashablePipette = {
      pipetteName: 'p300_multi',
      tiprackDefURI: 'tiprack300',
    }
    noncrashablePipette = {
      pipetteName: 'p300_multi_test',
      tiprackDefURI: 'tiprack300',
    }
    mockGetAdditionalEquipment.mockReturnValue({})
    mockGetRobotType.mockReturnValue(OT2_ROBOT_TYPE)
    getDisableModuleRestrictionsMock.mockReturnValue(false)
    getPipettesForEditPipetteFormMock.mockReturnValue({
      left: crashablePipette,
      right: {
        pipetteName: null,
        tiprackDefURI: null,
      },
    })

    props = {
      modules: {},
      openEditModuleModal: jest.fn(),
    }
  })

  function render(renderProps: React.ComponentProps<typeof EditModulesCard>) {
    return mount(
      <Provider store={store}>
        <EditModulesCard {...renderProps} />
      </Provider>
    )
  }

  it('does not show crash info box when crashable pipette is used and no module with collision issues and restrictions are not disabled', () => {
    props.modules = {
      [MAGNETIC_MODULE_TYPE]: nonCrashableMagneticModule,
    }

    const wrapper = render(props)

    expect(wrapper.find(CrashInfoBox).props()).toEqual({
      showHeaterShakerLabwareCollisions: false,
      showHeaterShakerModuleCollisions: false,
      showHeaterShakerPipetteCollisions: false,
      showMagPipetteCollisons: false,
      showTempPipetteCollisons: undefined,
    })
  })

  it('displays crash warning info box when crashable pipette is used with module with collision issue and restrictions are not disabled', () => {
    props.modules = {
      [MAGNETIC_MODULE_TYPE]: crashableMagneticModule,
    }

    const wrapper = render(props)

    expect(wrapper.find(CrashInfoBox)).toHaveLength(1)
  })

  it('does not display crash warning when non crashable pipette is used with module with collision issues', () => {
    props.modules = {
      [MAGNETIC_MODULE_TYPE]: crashableMagneticModule,
    }
    getPipettesForEditPipetteFormMock.mockReturnValue({
      left: noncrashablePipette,
      right: {
        pipetteName: null,
        tiprackDefURI: null,
      },
    })

    const wrapper = render(props)

    expect(wrapper.find(CrashInfoBox).props()).toEqual({
      showHeaterShakerLabwareCollisions: false,
      showHeaterShakerModuleCollisions: false,
      showHeaterShakerPipetteCollisions: false,
      showMagPipetteCollisons: false,
      showTempPipetteCollisons: false,
    })
  })

  it('displays crash info text only for the module with issue', () => {
    const crashableTemperatureModule = {
      id: 'temp098',
      type: TEMPERATURE_MODULE_TYPE,
      model: TEMPERATURE_MODULE_V1,
      slot: '3',
      moduleState: {
        type: TEMPERATURE_MODULE_TYPE,
        status: TEMPERATURE_DEACTIVATED,
        targetTemperature: null,
      },
    }
    props.modules = {
      [MAGNETIC_MODULE_TYPE]: nonCrashableMagneticModule,
      [TEMPERATURE_MODULE_TYPE]: crashableTemperatureModule,
    }

    const wrapper = render(props)

    expect(wrapper.find(CrashInfoBox).props()).toEqual({
      showTempPipetteCollisons: true,
      showHeaterShakerLabwareCollisions: false,
      showHeaterShakerModuleCollisions: false,
      showHeaterShakerPipetteCollisions: false,
      showMagPipetteCollisons: false,
    })
  })

  it('does not display crash warnings when restrictions are disabled', () => {
    props.modules = {
      [MAGNETIC_MODULE_TYPE]: crashableMagneticModule,
    }
    getDisableModuleRestrictionsMock.mockReturnValue(true)

    const wrapper = render(props)

    expect(wrapper.find(CrashInfoBox)).toHaveLength(0)
  })

  it('displays module row with added module', () => {
    props.modules = {
      [MAGNETIC_MODULE_TYPE]: crashableMagneticModule,
    }

    const wrapper = render(props)

    expect(
      wrapper.find(ModuleRow).filter({ type: MAGNETIC_MODULE_TYPE }).props()
    ).toEqual({
      robotType: OT2_ROBOT_TYPE,
      type: MAGNETIC_MODULE_TYPE,
      moduleOnDeck: crashableMagneticModule,
      showCollisionWarnings: true,
      openEditModuleModal: props.openEditModuleModal,
    })
  })

  it('displays module row with module to add when no moduleData for OT-2', () => {
    const wrapper = render(props)
    const SUPPORTED_MODULE_TYPES_FILTERED = SUPPORTED_MODULE_TYPES.filter(
      moduleType => moduleType !== 'magneticBlockType'
    )
    expect(wrapper.find(ModuleRow)).toHaveLength(4)
    SUPPORTED_MODULE_TYPES_FILTERED.forEach(moduleType => {
      expect(
        wrapper.find(ModuleRow).filter({ type: moduleType }).props()
      ).toEqual({
        type: moduleType,
        openEditModuleModal: props.openEditModuleModal,
      })
    })
  })
  it('displays module row with module to add when no moduleData for Flex', () => {
    mockGetRobotType.mockReturnValue(FLEX_ROBOT_TYPE)
    const wrapper = render(props)
    const SUPPORTED_MODULE_TYPES_FILTERED = SUPPORTED_MODULE_TYPES.filter(
      moduleType => moduleType !== 'magneticModuleType'
    )
    expect(wrapper.find(ModuleRow)).toHaveLength(4)
    SUPPORTED_MODULE_TYPES_FILTERED.forEach(moduleType => {
      expect(
        wrapper.find(ModuleRow).filter({ type: moduleType }).props()
      ).toEqual({
        type: moduleType,
        openEditModuleModal: props.openEditModuleModal,
      })
    })
  })
  it('displays gripper row with no gripper', () => {
    mockGetRobotType.mockReturnValue(FLEX_ROBOT_TYPE)
    const wrapper = render(props)
    expect(wrapper.find(GripperRow)).toHaveLength(1)
    expect(wrapper.find(GripperRow).props().isGripperAdded).toEqual(false)
  })
  it('displays gripper row with gripper attached', () => {
    const mockGripperId = 'gripeprId'
    mockGetRobotType.mockReturnValue(FLEX_ROBOT_TYPE)
    mockGetAdditionalEquipment.mockReturnValue({
      [mockGripperId]: { name: 'gripper', id: mockGripperId },
    })
    const wrapper = render(props)
    expect(wrapper.find(GripperRow)).toHaveLength(1)
    expect(wrapper.find(GripperRow).props().isGripperAdded).toEqual(true)
  })
})
