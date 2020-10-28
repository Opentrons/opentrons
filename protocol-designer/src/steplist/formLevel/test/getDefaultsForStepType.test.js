// @flow
import {
  DEFAULT_CHANGE_TIP_OPTION,
  DEFAULT_WELL_ORDER_FIRST_OPTION,
  DEFAULT_WELL_ORDER_SECOND_OPTION,
  FIXED_TRASH_ID,
  DEFAULT_MM_FROM_BOTTOM_DISPENSE,
  DEFAULT_MM_FROM_BOTTOM_ASPIRATE,
  DEFAULT_DELAY_SECONDS,
} from '../../../constants'
import { getDefaultsForStepType } from '..'

describe('getDefaultsForStepType', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })
  describe('moveLiquid step', () => {
    it('should get the correct defaults', () => {
      expect(getDefaultsForStepType('moveLiquid')).toEqual({
        pipette: null,
        volume: null,
        changeTip: DEFAULT_CHANGE_TIP_OPTION,
        path: 'single',
        aspirate_wells_grouped: false,

        aspirate_flowRate: null,
        aspirate_labware: null,
        aspirate_wells: [],
        aspirate_wellOrder_first: DEFAULT_WELL_ORDER_FIRST_OPTION,
        aspirate_wellOrder_second: DEFAULT_WELL_ORDER_SECOND_OPTION,
        aspirate_mix_checkbox: false,
        aspirate_mix_times: null,
        aspirate_mix_volume: null,
        aspirate_mmFromBottom: `${DEFAULT_MM_FROM_BOTTOM_ASPIRATE}`,
        aspirate_touchTip_checkbox: false,

        dispense_flowRate: null,
        dispense_labware: null,
        dispense_wells: [],
        dispense_wellOrder_first: DEFAULT_WELL_ORDER_FIRST_OPTION,
        dispense_wellOrder_second: DEFAULT_WELL_ORDER_SECOND_OPTION,
        dispense_mix_checkbox: false,
        dispense_mix_times: null,
        dispense_mix_volume: null,
        dispense_mmFromBottom: `${DEFAULT_MM_FROM_BOTTOM_DISPENSE}`,
        dispense_touchTip_checkbox: false,

        disposalVolume_checkbox: false,
        disposalVolume_volume: null,

        blowout_checkbox: false,
        blowout_location: FIXED_TRASH_ID,
        preWetTip: false,

        aspirate_airGap_checkbox: false,
        aspirate_airGap_volume: null,
        aspirate_delay_checkbox: false,
        aspirate_delay_mmFromBottom: `${DEFAULT_MM_FROM_BOTTOM_ASPIRATE}`,
        aspirate_delay_seconds: `${DEFAULT_DELAY_SECONDS}`,

        dispense_airGap_checkbox: false,
        dispense_airGap_volume: null,
        dispense_delay_checkbox: false,
        dispense_delay_seconds: `${DEFAULT_DELAY_SECONDS}`,
        dispense_delay_mmFromBottom: `${DEFAULT_MM_FROM_BOTTOM_DISPENSE}`,
      })
    })
  })
  describe('mix step', () => {
    it('should get the correct defaults', () => {
      expect(getDefaultsForStepType('mix')).toEqual({
        changeTip: DEFAULT_CHANGE_TIP_OPTION,
        labware: null,
        aspirate_delay_checkbox: false,
        aspirate_delay_seconds: `${DEFAULT_DELAY_SECONDS}`,
        dispense_delay_checkbox: false,
        dispense_delay_seconds: `${DEFAULT_DELAY_SECONDS}`,
        mix_wellOrder_first: DEFAULT_WELL_ORDER_FIRST_OPTION,
        mix_wellOrder_second: DEFAULT_WELL_ORDER_SECOND_OPTION,
        blowout_checkbox: false,
        blowout_location: FIXED_TRASH_ID,
        mix_mmFromBottom: `${DEFAULT_MM_FROM_BOTTOM_DISPENSE}`, // NOTE: mix uses dispense for both asp + disp, for now
        pipette: null,
        volume: undefined,
        wells: [],
      })
    })
  })
  describe('pause step', () => {
    it('should get the correct defaults', () => {
      expect(getDefaultsForStepType('pause')).toEqual({
        pauseAction: null,
        pauseHour: null,
        pauseMinute: null,
        pauseSecond: null,
        pauseMessage: '',
        moduleId: null,
        pauseTemperature: null,
      })
    })
  })
  describe('manual intervention step', () => {
    it('should get the correct defaults', () => {
      expect(getDefaultsForStepType('manualIntervention')).toEqual({
        labwareLocationUpdate: {},
        pipetteLocationUpdate: {},
        moduleLocationUpdate: {},
      })
    })
  })
  describe('magnet step', () => {
    it('should get the correct defaults', () => {
      expect(getDefaultsForStepType('magnet')).toEqual({
        moduleId: null,
        magnetAction: null,
        engageHeight: null,
      })
    })
  })
  describe('temperature step', () => {
    it('should get the correct defaults', () => {
      expect(getDefaultsForStepType('temperature')).toEqual({
        moduleId: null,
        setTemperature: null,
        targetTemperature: null,
      })
    })
  })
  describe('thermocycler step', () => {
    it('should get the correct defaults', () => {
      expect(getDefaultsForStepType('thermocycler')).toEqual({
        thermocyclerFormType: null,
        moduleId: null,
        blockIsActive: false,
        blockTargetTemp: null,
        lidIsActive: false,
        lidTargetTemp: null,
        lidOpen: false,
        profileVolume: null,
        profileTargetLidTemp: null,
        orderedProfileItems: [],
        profileItemsById: {},
        blockIsActiveHold: false,
        blockTargetTempHold: null,
        lidIsActiveHold: false,
        lidTargetTempHold: null,
        lidOpenHold: null,
      })
    })
    it('should default to an empty object', () => {
      expect(getDefaultsForStepType('')).toEqual({})
    })
  })
})
