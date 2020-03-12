// @flow

import React from 'react'
import { mount } from 'enzyme'
import { Provider } from 'react-redux'
import {
  MAGNETIC_MODULE_TYPE,
  MAGNETIC_MODULE_V1,
  MAGNETIC_MODULE_V2,
} from '@opentrons/shared-data'
import { selectors as featureFlagSelectors } from '../../../feature-flags'
import { selectors as stepFormSelectors } from '../../../step-forms'
import { SUPPORTED_MODULE_TYPES } from '../../../modules'
import { EditModulesCard } from '../EditModulesCard'
import { CrashInfoBox } from '../CrashInfoBox'
import { ModuleRow } from '../ModuleRow'

import type { BaseState } from '../../../types'
import type { FormPipettesByMount } from '../../../step-forms'

jest.mock('../../../feature-flags')
jest.mock('../../../step-forms/selectors')

const getDisableModuleRestrictionsMock: JestMockFn<[BaseState], ?boolean> =
  featureFlagSelectors.getDisableModuleRestrictions
const getPipettesForEditPipetteFormMock: JestMockFn<
  [BaseState],
  FormPipettesByMount
> = stepFormSelectors.getPipettesForEditPipetteForm

describe('EditModulesCard', () => {
  let store,
    crashableMagneticModule,
    nonCrashableMagneticModule,
    crashablePipette,
    noncrashablePipette,
    props
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
      thermocyclerEnabled: false,
      openEditModuleModal: jest.fn(),
    }
  })

  function render(renderProps) {
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

    expect(wrapper.find(CrashInfoBox)).toHaveLength(0)
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

    expect(wrapper.find(CrashInfoBox)).toHaveLength(0)
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
      wrapper
        .find(ModuleRow)
        .filter({ type: MAGNETIC_MODULE_TYPE })
        .props()
    ).toEqual({
      type: MAGNETIC_MODULE_TYPE,
      module: crashableMagneticModule,
      showCollisionWarnings: true,
      openEditModuleModal: props.openEditModuleModal,
    })
  })

  it('displays module row with module to add when no moduleData', () => {
    props.thermocyclerEnabled = true

    const wrapper = render(props)

    expect(wrapper.find(ModuleRow)).toHaveLength(3)
    SUPPORTED_MODULE_TYPES.forEach(moduleType => {
      expect(
        wrapper
          .find(ModuleRow)
          .filter({ type: moduleType })
          .props()
      ).toEqual({
        type: moduleType,
        openEditModuleModal: props.openEditModuleModal,
      })
    })
  })
})
