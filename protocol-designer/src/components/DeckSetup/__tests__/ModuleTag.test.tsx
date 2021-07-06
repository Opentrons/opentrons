import {
  LabwareDefinition2,
  MAGNETIC_MODULE_TYPE,
  TEMPERATURE_MODULE_TYPE,
  TEMPERATURE_MODULE_V1,
} from '@opentrons/shared-data'
import React from 'react'
import { Provider } from 'react-redux'
import { render, mount } from 'enzyme'
import fixture_tiprack_10_ul from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_10_ul.json'
import {
  TEMPERATURE_APPROACHING_TARGET,
  TEMPERATURE_AT_TARGET,
  TEMPERATURE_DEACTIVATED,
} from '@opentrons/step-generation'
import { ModuleStatus, ModuleTag, ModuleTagProps } from '../ModuleTag'

import * as timelineFramesSelectors from '../../../top-selectors/timelineFrames'
import { selectors as stepFormSelectors } from '../../../step-forms'
import * as uiSelectors from '../../../ui/steps'

jest.mock('../../../ui/steps')
jest.mock('../../../top-selectors/timelineFrames')
jest.mock('../../../step-forms')

const timelineFrameBeforeActiveItemMock = timelineFramesSelectors.timelineFrameBeforeActiveItem as jest.MockedFunction<
  typeof timelineFramesSelectors.timelineFrameBeforeActiveItem
>

const getModuleEntitiesMock = stepFormSelectors.getModuleEntities as jest.MockedFunction<
  typeof stepFormSelectors.getModuleEntities
>

const getHoveredStepLabwareMock = uiSelectors.getHoveredStepLabware as jest.MockedFunction<
  typeof uiSelectors.getHoveredStepLabware
>

const getInitialDeckSetup = stepFormSelectors.getInitialDeckSetup as jest.MockedFunction<
  typeof stepFormSelectors.getInitialDeckSetup
>

describe('ModuleTag', () => {
  describe('ModuleStatus', () => {
    describe('magnet module', () => {
      it('displays engaged when magent is engaged', () => {
        const props = {
          engaged: true,
          type: MAGNETIC_MODULE_TYPE,
        }

        const component = render(<ModuleStatus moduleState={props} />)

        expect(component.text()).toBe('engaged')
      })

      it('displays disengaged when magnet is not engaged', () => {
        const moduleState = {
          engaged: false,
          type: MAGNETIC_MODULE_TYPE,
        }

        const component = render(<ModuleStatus moduleState={moduleState} />)

        expect(component.text()).toBe('disengaged')
      })
    })

    describe('temperature module', () => {
      it('deactivated is shown when module is deactivated', () => {
        const moduleState = {
          type: TEMPERATURE_MODULE_TYPE,
          status: TEMPERATURE_DEACTIVATED,
          targetTemperature: null,
        }

        const component = render(<ModuleStatus moduleState={moduleState} />)

        expect(component.text()).toBe('deactivated')
      })

      it('target temperature is shown when module is at target', () => {
        const moduleState = {
          type: TEMPERATURE_MODULE_TYPE,
          status: TEMPERATURE_AT_TARGET,
          targetTemperature: 45,
        }

        const component = render(<ModuleStatus moduleState={moduleState} />)

        expect(component.text()).toBe('45 °C')
      })

      it('going to X is shown when temperature is approaching target', () => {
        const moduleState = {
          type: TEMPERATURE_MODULE_TYPE,
          status: TEMPERATURE_APPROACHING_TARGET,
          targetTemperature: 45,
        }

        const component = render(<ModuleStatus moduleState={moduleState} />)

        expect(component.text()).toBe('Going to 45 °C')
      })
    })
  })

  describe('ModuleTagComponent', () => {
    const moduleId = 'abcdef'
    let store: any
    let props: ModuleTagProps
    beforeEach(() => {
      props = {
        x: 1,
        y: 2,
        orientation: 'left',
        id: moduleId,
      }

      store = {
        subscribe: jest.fn(),
        dispatch: jest.fn(),
        getState: () => ({}),
      }

      timelineFrameBeforeActiveItemMock.mockReturnValue({
        commands: [],
        robotState: {
          labware: {},
          liquidState: {
            pipettes: {},
            labware: {},
          },
          pipettes: {},
          tipState: {
            tipracks: {},
            pipettes: {},
          },
          modules: {
            abcdef: {
              slot: '3',
              moduleState: {
                type: TEMPERATURE_MODULE_TYPE,
                status: TEMPERATURE_DEACTIVATED,
                targetTemperature: null,
              },
            },
          },
        },
        warnings: [],
      })
      getModuleEntitiesMock.mockReturnValue({
        abcdef: {
          id: moduleId,
          type: TEMPERATURE_MODULE_TYPE,
          model: TEMPERATURE_MODULE_V1,
        },
      })
      getInitialDeckSetup.mockReturnValue({
        labware: {
          labwareId: {
            id: 'labwareId',
            slot: '3',
            labwareDefURI: 'url',
            def: fixture_tiprack_10_ul as LabwareDefinition2,
          },
        },
        pipettes: {},
        modules: {},
      })
      getHoveredStepLabwareMock.mockReturnValue(['labwareId'])
    })

    function render() {
      return mount(
        <Provider store={store}>
          <svg>
            <ModuleTag {...props} />
          </svg>
        </Provider>
      )
    }

    it('adds a border when the step is is a module step type', () => {
      getInitialDeckSetup.mockReturnValue({
        labware: {
          labwareId: {
            id: 'labwareId',
            slot: moduleId,
            labwareDefURI: 'url',
            def: fixture_tiprack_10_ul as LabwareDefinition2,
          },
        },
        pipettes: {},
        modules: {},
      })

      const wrapper = render()

      expect(
        wrapper.find('RobotCoordsForeignDiv').prop<any>('innerDivProps')
          .className
      ).toContain('highlighted_border_right_none')
    })

    it('does not add a border when the step is not a module step', () => {
      const wrapper = render()

      expect(
        wrapper.find('RobotCoordsForeignDiv').prop<any>('innerDivProps')
          .className
      ).not.toContain('highlighted_border_right_none')
    })

    it('does not add a border when no labware on module', () => {
      getHoveredStepLabwareMock.mockReturnValue([])

      const wrapper = render()

      expect(
        wrapper.find('RobotCoordsForeignDiv').prop<any>('innerDivProps')
          .className
      ).not.toContain('highlighted_border_right_none')
    })
  })
})
