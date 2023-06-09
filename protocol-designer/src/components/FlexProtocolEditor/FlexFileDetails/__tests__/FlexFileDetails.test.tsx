import React from 'react'
import { ReactWrapper, mount, shallow } from 'enzyme'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import {
  EditButton,
  FileProtocolInformation,
  FileProtocolNameAndDescription,
  FlexFileDetailsComponent,
  SelectedModules,
  getModuleData,
} from '../FlexFileDetails'

const mockStore = configureMockStore([thunk])

describe('FlexFileDetailsComponent', () => {
  let store: any
  let wrapper: ReactWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>

  beforeEach(() => {
    store = mockStore({})
    wrapper = mount(
      <Provider store={store}>
        <FlexFileDetailsComponent />
      </Provider>
    )
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('renders without crashing', () => {
    expect(wrapper).toHaveLength(1)
  })

  it('returns an array of module data without null values', () => {
    const modules = {
      module1: { type: 'temperature', slot: 1 },
      module2: null,
      module3: { type: 'thermocycler', slot: 3 },
    }
    const moduleData = getModuleData(modules)
    expect(moduleData).toHaveLength(2)
    expect(moduleData[0]).toEqual({ type: 'temperature', slot: 1 })
    expect(moduleData[1]).toEqual({ type: 'thermocycler', slot: 3 })
  })

  it('renders NoFileSelection when formValues is empty', () => {
    const props = {
      formValues: null,
      handleSubmit: jest.fn(),
      instruments: {},
    }
    const wrapper = shallow(<FlexFileDetailsComponent {...props} />)
    expect(wrapper.find('NoFileSelection')).toHaveLength(1)
  })

  it('renders FileProtocolInformation component', () => {
    const component = shallow(
      <Provider store={store}>
        <FileProtocolInformation />
      </Provider>
    )
    expect(component.exists()).toBe(true)
  })

  it('do not render FileProtocolInformation and InstrumentGroup when formValues and instruments are not provided', () => {
    const props = {
      formValues: {},
      handleSubmit: jest.fn(),
      instruments: {
        instrument1: {},
        instrument2: {},
      },
    }
    const wrapper = shallow(<FlexFileDetailsComponent {...props} />)
    expect(wrapper.find('FileProtocolInformation')).toHaveLength(0)
    expect(wrapper.find('InstrumentGroup')).toHaveLength(0)
  })

  it('does not render SelectedModules when formValues and instruments are not provided', () => {
    const props = {
      formValues: {},
      handleSubmit: jest.fn(),
      instruments: {},
    }
    const wrapper = shallow(<FlexFileDetailsComponent {...props} />)
    expect(wrapper.find('SelectedModules')).toHaveLength(0)
  })

  it('does not render FlexProtocolEditorComponent when addItems or isEdit is false', () => {
    const props = {
      formValues: {},
      handleSubmit: jest.fn(),
      instruments: {},
    }
    const wrapper = shallow(<FlexFileDetailsComponent {...props} />)
    expect(wrapper.find('FlexProtocolEditorComponent')).toHaveLength(0)
  })

  it('should render the FileProtocolNameAndDescription component', () => {
    const nameDescriptionData = {
      protocolName: 'Test Protocol',
      author: 'John Doe',
      description: 'This is a test protocol',
      created: new Date(),
      lastModified: new Date(),
    }

    render(
      <FileProtocolNameAndDescription
        nameDescriptionData={nameDescriptionData}
      />
    )

    expect(screen.getByText('Test Protocol')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('This is a test protocol')).toBeInTheDocument()
  })

  it('should render the EditButton component', () => {
    render(<EditButton editProps={jest.fn()} setTab={1} setTabId={jest.fn()} />)

    expect(screen.getByText('Edit')).toBeInTheDocument()
  })

  it('should render the message when selected module is empty', () => {
    const moduleData = {}

    render(<SelectedModules propsData={moduleData} />)

    expect(screen.getByText('No modules found.')).toBeInTheDocument()
  })

  it('should return the module data from getModuleData', () => {
    const modules = {
      module1: { type: 'moduleType1', slot: 1 },
      module2: { type: 'moduleType2', slot: 4 },
    }

    const result = getModuleData(modules)

    expect(result).toEqual([
      { slot: 1, type: 'moduleType1' },
      { slot: 4, type: 'moduleType2' },
    ])
  })
})
