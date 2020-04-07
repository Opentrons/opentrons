import React from 'react'
import { mount } from 'enzyme'
import { EditModules } from '../EditModules'
import { MAGNETIC_MODULE_TYPE } from '@opentrons/shared-data'
import { Provider } from 'react-redux'
import { selectors as stepFormSelectors } from '../../step-forms'
import { selectors as tutorialSelectors } from '../../tutorial'
import { EditModulesModalNew } from '../modals/EditModulesModal/EditModulesModalNew'

jest.mock('../../step-forms/actions')
jest.mock('../../step-forms/selectors')
jest.mock('../../labware-ingred/actions')
jest.mock('../../utils/labwareModuleCompatibility')
jest.mock('../../feature-flags')
jest.mock('../../tutorial')

const getInitialDeckSetupMock: JestMockFn<[BaseState], InitialDeckSetup> =
  stepFormSelectors.getInitialDeckSetup

describe('Edit Modules', () => {
  let props
  let currentModule
  let mockStore
  beforeEach(() => {
    currentModule = {
      moduleId: 'testId',
      moduleType: MAGNETIC_MODULE_TYPE,
    }
    props = { currentModule }
    mockStore = {
      dispatch: jest.fn(),
      subscribe: jest.fn(),
      getState: () => ({}),
    }
  })

  const render = props =>
    mount(
      <Provider store={mockStore}>
        <EditModules {...props} />
      </Provider>
    )
  it('should initially render the edit modules modal', () => {
    stepFormSelectors.getInitialDeckSetup.mockReturnValue({
      modules: { testId: {} },
    })
    tutorialSelectors.getDismissedHints.mockReturnValue([])
    const wrapper = render(props)
    expect(wrapper.find(EditModulesModalNew)).toHaveLength(1)
  })
})
