// @flow
import React from 'react'
import { act } from 'react-dom/test-utils'
import { mount } from 'enzyme'
import { EditModules } from '../EditModules'
import { Provider } from 'react-redux'
import { selectors as stepFormSelectors } from '../../step-forms'
import { selectors as tutorialSelectors } from '../../tutorial'
import { EditModulesModalNew } from '../modals/EditModulesModal/EditModulesModalNew'
import {
  getLabwareOnSlot,
  getSlotsBlockedBySpanning,
} from '../../step-forms/utils'
import { BlockingHint } from '../Hints/useBlockingHint'
import { Portal } from '../portals/MainPageModalPortal'
import { MAGNETIC_MODULE_TYPE } from '@opentrons/shared-data'

jest.mock('../../step-forms/actions')
jest.mock('../../step-forms/utils')
jest.mock('../../step-forms/selectors')
jest.mock('../../labware-ingred/actions')
jest.mock('../../utils/labwareModuleCompatibility')
jest.mock('../../feature-flags')
jest.mock('../../tutorial')
jest.mock('../portals/MainPageModalPortal.js')

const mockPortal: JestMockFn<[any], any> = Portal

const getInitialDeckSetupMock: JestMockFn<[any], any> =
  stepFormSelectors.getInitialDeckSetup

const getDismissedHintsMock: JestMockFn<[any], any> =
  tutorialSelectors.getDismissedHints

const getLabwareOnSlotMock: JestMockFn<any, any> = getLabwareOnSlot

const getSlotsBlockedBySpanningMock: JestMockFn<
  any,
  any
> = getSlotsBlockedBySpanning

describe('Edit Modules', () => {
  let props
  let moduleToEdit
  let mockStore
  let onCloseClick
  beforeEach(() => {
    moduleToEdit = {
      moduleId: 'testId',
      moduleType: MAGNETIC_MODULE_TYPE,
    }
    onCloseClick = jest.fn()
    props = { moduleToEdit, onCloseClick }
    mockStore = {
      dispatch: jest.fn(),
      subscribe: jest.fn(),
      getState: () => ({}),
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  const render = props =>
    mount(
      <Provider store={mockStore}>
        <EditModules {...props} />
      </Provider>
    )
  it('should initially render the edit modules modal', () => {
    getInitialDeckSetupMock.mockReturnValue({
      modules: { testId: {} },
    })
    getLabwareOnSlotMock.mockReturnValue({})
    getSlotsBlockedBySpanningMock.mockReturnValue([])
    getDismissedHintsMock.mockReturnValue([])
    const wrapper = render(props)
    expect(wrapper.find(EditModulesModalNew)).toHaveLength(1)
  })
  it('should render the module change warning when setChangeModuleWarningInfo is called from EditModulesModal', () => {
    getInitialDeckSetupMock.mockReturnValue({
      modules: { testId: {} },
    })
    getLabwareOnSlotMock.mockReturnValue({})
    getSlotsBlockedBySpanningMock.mockReturnValue([])
    getDismissedHintsMock.mockReturnValue([])
    mockPortal.mockReturnValue(<div></div>)
    const wrapper = render(props)
    const editModulesModal = wrapper.find(EditModulesModalNew)
    expect(editModulesModal).toHaveLength(1)

    act(() => {
      editModulesModal.prop('setChangeModuleWarningInfo')({
        model: 'some_model',
        slot: 'some_slot',
      })
    })
    wrapper.update()
    expect(wrapper.find(EditModulesModalNew)).toHaveLength(0)
    expect(wrapper.find(BlockingHint)).toHaveLength(1)
  })
})
