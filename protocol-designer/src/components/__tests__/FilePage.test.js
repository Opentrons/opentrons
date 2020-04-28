// @flow
import React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import { FilePage } from '../FilePage'
import { EditModules } from '../EditModules'
import { EditModulesCard } from '../modules'

jest.mock('../EditModules')
jest.mock('../../step-forms/utils')
jest.mock('../../step-forms/selectors')
jest.mock('../../feature-flags')

const editModulesMock: JestMockFn<any, any> = EditModules

describe('File Page', () => {
  let props
  let mockStore
  beforeEach(() => {
    props = {
      formValues: { metadata: {} },
      instruments: {},
      goToNextPage: () => null,
      saveFileMetadata: () => null,
      swapPipettes: () => null,
      thermocyclerEnabled: false,
      modules: {},
    }
    mockStore = {
      dispatch: jest.fn(),
      subscribe: jest.fn(),
      getState: () => ({ mock: 'this is a mocked out getState' }),
    }
    editModulesMock.mockImplementation(props => <div>mock edit modules</div>)
  })

  const render = props =>
    mount(<FilePage {...props} />, {
      wrappingComponent: Provider,
      wrappingComponentProps: { store: mockStore },
    })

  it('renders a file page with Edit Modules closed', () => {
    const wrapper = render(props)
    expect(wrapper.find(EditModules)).toHaveLength(0)
  })
  it('opens and closes Edit Modules when appropriate handlers are called', () => {
    const wrapper = render(props)
    wrapper
      .find(EditModulesCard)
      .at(0)
      .prop('openEditModuleModal')()
    wrapper.update()
    expect(wrapper.find(EditModules)).toHaveLength(1)

    wrapper
      .find(EditModules)
      .at(0)
      .prop('onCloseClick')()
    wrapper.update()
    expect(wrapper.find(EditModules)).toHaveLength(0)
  })
})
