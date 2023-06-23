import React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import { ModuleType } from '@opentrons/shared-data'
import { FilePage, Props } from '../FilePage'
import { EditModules } from '../EditModules'
import { EditModulesCard } from '../modules'
import { ModulesForEditModulesCard } from '../../step-forms'
import { getAdditionalEquipment } from '../../step-forms/selectors'

jest.mock('../EditModules')
jest.mock('../../step-forms/utils')
jest.mock('../../step-forms/selectors')
jest.mock('../../feature-flags')
jest.mock('../../file-data/selectors')

const editModulesMock: jest.MockedFunction<any> = EditModules
const editGetAdditionalEquipment: jest.MockedFunction<any> = getAdditionalEquipment

describe('File Page', () => {
  let props: Props
  let mockStore: any
  beforeEach(() => {
    props = {
      formValues: { metadata: {} } as any,
      instruments: {},
      goToNextPage: () => null,
      saveFileMetadata: () => null,
      swapPipettes: () => null,
      modules: {} as ModulesForEditModulesCard,
    }
    mockStore = {
      dispatch: jest.fn(),
      subscribe: jest.fn(),
      getState: () => ({ mock: 'this is a mocked out getState' }),
    }
    editModulesMock.mockImplementation(() => <div>mock edit modules</div>)
    editGetAdditionalEquipment.mockReturnValue({})
  })

  const render = (props: Props) =>
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
    wrapper.find(EditModulesCard).invoke('openEditModuleModal')(
      {} as ModuleType
    )
    expect(wrapper.find(EditModules)).toHaveLength(1)

    wrapper.find(EditModules).invoke('onCloseClick')()
    expect(wrapper.find(EditModules)).toHaveLength(0)
  })
})
