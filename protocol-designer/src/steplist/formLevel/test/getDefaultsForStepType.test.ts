import {
  DEFAULT_CHANGE_TIP_OPTION,
  DEFAULT_DELAY_SECONDS,
  DEFAULT_MM_FROM_BOTTOM_DISPENSE,
  DEFAULT_WELL_ORDER_FIRST_OPTION,
  DEFAULT_WELL_ORDER_SECOND_OPTION,
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
        dropTip_location: null,
        aspirate_wells_grouped: false,

        aspirate_flowRate: null,
        aspirate_labware: null,
        aspirate_wells: [],
        aspirate_wellOrder_first: DEFAULT_WELL_ORDER_FIRST_OPTION,
        aspirate_wellOrder_second: DEFAULT_WELL_ORDER_SECOND_OPTION,
        aspirate_mix_checkbox: false,
        aspirate_mix_times: null,
        aspirate_mix_volume: null,
        aspirate_mmFromBottom: null,
        aspirate_touchTip_checkbox: false,
        aspirate_touchTip_mmFromBottom: null,

        dispense_flowRate: null,
        dispense_labware: null,
        dispense_wells: [],
        dispense_wellOrder_first: DEFAULT_WELL_ORDER_FIRST_OPTION,
        dispense_wellOrder_second: DEFAULT_WELL_ORDER_SECOND_OPTION,
        dispense_mix_checkbox: false,
        dispense_mix_times: null,
        dispense_mix_volume: null,
        dispense_mmFromBottom: null,
        dispense_touchTip_checkbox: false,
        dispense_touchTip_mmFromBottom: null,

        disposalVolume_checkbox: false,
        disposalVolume_volume: null,

        blowout_checkbox: false,
        blowout_location: null,
        preWetTip: false,

        aspirate_airGap_checkbox: false,
        aspirate_airGap_volume: null,
        aspirate_delay_checkbox: false,
        aspirate_delay_mmFromBottom: null,
        aspirate_delay_seconds: `${DEFAULT_DELAY_SECONDS}`,

        dispense_airGap_checkbox: false,
        dispense_airGap_volume: null,
        dispense_delay_checkbox: false,
        dispense_delay_seconds: `${DEFAULT_DELAY_SECONDS}`,
        dispense_delay_mmFromBottom: null,
      })
    })
  })
  describe('mix step', () => {
    it('should get the correct defaults', () => {
      expect(getDefaultsForStepType('mix')).toEqual({
        changeTip: DEFAULT_CHANGE_TIP_OPTION,
        labware: null,
        dropTip_location: null,
        aspirate_delay_checkbox: false,
        aspirate_delay_seconds: `${DEFAULT_DELAY_SECONDS}`,
        dispense_delay_checkbox: false,
        dispense_delay_seconds: `${DEFAULT_DELAY_SECONDS}`,
        mix_wellOrder_first: DEFAULT_WELL_ORDER_FIRST_OPTION,
        mix_wellOrder_second: DEFAULT_WELL_ORDER_SECOND_OPTION,
        blowout_checkbox: false,
        blowout_location: null,
        mix_mmFromBottom: DEFAULT_MM_FROM_BOTTOM_DISPENSE,
        mix_touchTip_mmFromBottom: null,
        mix_touchTip_checkbox: false,
        pipette: null,
        volume: undefined,
        times: null,
        wells: [],
        aspirate_flowRate: null,
        dispense_flowRate: null,
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
  describe('heater shaker step', () => {
    it('should get the correct defaults', () => {
      expect(getDefaultsForStepType('heaterShaker')).toEqual({
        moduleId: null,
        setHeaterShakerTemperature: null,
        targetHeaterShakerTemperature: null,
        setShake: null,
        targetSpeed: null,
        latchOpen: false,
        heaterShakerSetTimer: null,
        heaterShakerTimerMinutes: null,
        heaterShakerTimerSeconds: null,
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
      // @ts-expect-error(sa, 2021-6-15): this case can never actually happen beacuse '' is not a StepType
      expect(getDefaultsForStepType('')).toEqual({})
    })
  })
})
