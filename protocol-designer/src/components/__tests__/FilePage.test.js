// @flow
import React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import { FilePage } from '../FilePage'
import { EditModules } from '../EditModules'

jest.mock('../../step-forms/utils')
jest.mock('../../step-forms/selectors')
jest.mock('../../feature-flags')

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
  })
  it('renders a file page with Edit Modules closed', () => {
    const wrapper = mount(
      <Provider store={mockStore}>
        <FilePage {...props} />
      </Provider>
    )
    expect(wrapper.find(EditModules)).toHaveLength(0)
  })
})
