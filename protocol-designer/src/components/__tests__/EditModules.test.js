// @flow
import React from 'react'
import { act } from 'react-dom/test-utils'
import { mount } from 'enzyme'
import { Provider } from 'react-redux'
import { MAGNETIC_MODULE_TYPE } from '@opentrons/shared-data'
import { EditModules } from '../EditModules'
import { selectors as stepFormSelectors } from '../../step-forms'
import { selectors as tutorialSelectors } from '../../tutorial'
import { BlockingHint } from '../Hints/useBlockingHint'
import { EditModulesModal } from '../modals/EditModulesModal'

jest.mock('../../step-forms/selectors')
jest.mock('../../tutorial')
jest.mock('../modals/EditModulesModal')

const mockEditModulesModal: JestMockFn<any, any> = EditModulesModal

const getInitialDeckSetupMock: JestMockFn<any, any> =
  stepFormSelectors.getInitialDeckSetup

const getDismissedHintsMock: JestMockFn<any, any> =
  tutorialSelectors.getDismissedHints

describe('Edit Modules', () => {
  const TEST_ID = 'testId'
  let props
  let moduleToEdit
  let mockStore
  let onCloseClick

  beforeEach(() => {
    moduleToEdit = {
      moduleId: TEST_ID,
      moduleType: MAGNETIC_MODULE_TYPE,
    }
    onCloseClick = jest.fn()
    props = { moduleToEdit, onCloseClick }
    mockStore = {
      dispatch: jest.fn(),
      subscribe: jest.fn(),
      getState: () => ({}),
    }
    getDismissedHintsMock.mockReturnValue([])
    getInitialDeckSetupMock.mockReturnValue({
      modules: { [TEST_ID]: {} },
    })
    mockEditModulesModal.mockReturnValue(<div>mock edit modules modal</div>)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  const render = props =>
    mount(<EditModules {...props} />, {
      wrappingComponent: Provider,
      wrappingComponentProps: { store: mockStore },
    })

  it('should initially render the edit modules modal', () => {
    const wrapper = render(props)
    expect(wrapper.find(EditModulesModal)).toHaveLength(1)
  })
  it('should render the module change warning when displayModuleWarning is called from EditModulesModal', () => {
    const wrapper = render(props)
    const editModulesModal = wrapper.find(EditModulesModal)
    expect(editModulesModal).toHaveLength(1)

    act(() => {
      editModulesModal.prop('displayModuleWarning')({
        model: 'some_model',
        slot: 'some_slot',
      })
    })

    wrapper.update()
    expect(wrapper.find(EditModulesModal)).toHaveLength(0)
    expect(wrapper.find(BlockingHint)).toHaveLength(1)
  })
})
