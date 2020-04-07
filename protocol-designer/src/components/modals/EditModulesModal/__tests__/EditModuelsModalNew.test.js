// @flow

import React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import { PDAlert } from '../../../alerts/PDAlert'
import { EditModulesModalNew } from '../EditModulesModalNew'
import {
  MAGNETIC_MODULE_TYPE,
  type LabwareDefinition2,
  type ModuleRealType,
} from '@opentrons/shared-data'
import {
  selectors as stepFormSelectors,
  type InitialDeckSetup,
} from '../../../../step-forms'
import fixture_96_plate from '@opentrons/shared-data/labware/fixtures/2/fixture_96_plate'
import { getLabwareIsCompatible } from '../../../../utils/labwareModuleCompatibility'
import type { BaseState } from '../../../../types'

jest.mock('../../../../utils/labwareModuleCompatibility')
jest.mock('../../../../step-forms/selectors')

const getInitialDeckSetupMock: JestMockFn<[BaseState], InitialDeckSetup> =
  stepFormSelectors.getInitialDeckSetup
const getLabwareIsCompatibleMock: JestMockFn<
  [LabwareDefinition2, ModuleRealType],
  boolean
> = getLabwareIsCompatible

describe('Export Modules Modal', () => {
  let mockStore
  let props
  beforeEach(() => {
    props = {
      moduleId: '',
      moduleType: MAGNETIC_MODULE_TYPE,
      onCloseClick: () => null,
    }
    mockStore = {
      dispatch: jest.fn(),
      subscribe: jest.fn(),
      getState: () => ({}),
    }
  })
  const render = props =>
    mount(
      <Provider store={mockStore}>
        <EditModulesModalNew {...props} />
      </Provider>
    )

  describe('PD alert', () => {
    beforeEach(() => {
      mockInitialDeckSetup()
    })
    afterEach(() => {
      jest.clearAllMocks()
    })
    it('does NOT render when labware is incompatible', () => {
      getLabwareIsCompatibleMock.mockReturnValue(true)
      const wrapper = render(props)
      expect(wrapper.find(PDAlert)).toHaveLength(0)
    })

    it('renders when labware is compatible', () => {
      getLabwareIsCompatibleMock.mockReturnValue(false)
      const wrapper = render(props)
      expect(wrapper.find(PDAlert)).toHaveLength(1)
    })
  })
})

function mockInitialDeckSetup() {
  getInitialDeckSetupMock.mockReturnValue({
    labware: {
      well96Id: {
        ...fixture_96_plate,
        slot: '1',
      },
    },
    modules: {},
    pipettes: {},
  })
}
