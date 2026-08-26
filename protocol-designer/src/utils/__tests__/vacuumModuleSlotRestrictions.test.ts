import { describe, expect, it } from 'vitest'

import {
  doesVacuumModuleBlockModuleSlot,
  getSlotsBlockedForModulesByVacuumModule,
  getStandardColumn3Slot,
  isCutoutBlockedByExistingVacuumModule,
  wouldVacuumModuleBlockExistingModule,
} from '../vacuumModuleSlotRestrictions'

import type { ModuleLocationForVacuumRestriction } from '../vacuumModuleSlotRestrictions'

const vacuumOnA3: Record<string, ModuleLocationForVacuumRestriction> = {
  vm: {
    slot: 'A3',
    cutoutId: 'cutoutA3',
    type: 'vacuumModuleType',
    model: 'vacuumModuleV1',
  },
}

const heaterShakerOnB3: Record<string, ModuleLocationForVacuumRestriction> = {
  hs: {
    slot: 'B3',
    cutoutId: 'cutoutB3',
    type: 'heaterShakerModuleType',
    model: 'heaterShakerModuleV1',
  },
}

const stackerOnB4: Record<string, ModuleLocationForVacuumRestriction> = {
  stacker: {
    slot: 'B4',
    cutoutId: 'cutoutB3',
    type: 'flexStackerModuleType',
    model: 'flexStackerModuleV1',
  },
}

describe('getStandardColumn3Slot', () => {
  it('extracts column-3 slots from cutouts and addressable areas', () => {
    expect(getStandardColumn3Slot('A3')).toBe('A3')
    expect(getStandardColumn3Slot('cutoutB3')).toBe('B3')
    expect(getStandardColumn3Slot('cutoutD3')).toBe('D3')
    expect(getStandardColumn3Slot('temperatureModuleV2B3')).toBe('B3')
  })

  it('returns null for staging slots and other locations', () => {
    expect(getStandardColumn3Slot('C4')).toBe(null)
    expect(getStandardColumn3Slot('B4')).toBe(null)
    expect(getStandardColumn3Slot('A1')).toBe(null)
    expect(getStandardColumn3Slot(null)).toBe(null)
  })
})

describe('getSlotsBlockedForModulesByVacuumModule', () => {
  it('blocks the inboard neighbor standard slot when the vacuum module is on A3', () => {
    expect(getSlotsBlockedForModulesByVacuumModule('A3')).toEqual(['B3'])
    expect(getSlotsBlockedForModulesByVacuumModule('cutoutA3')).toEqual(['B3'])
  })

  it('blocks the inboard neighbor standard slot when the vacuum module is on D3', () => {
    expect(getSlotsBlockedForModulesByVacuumModule('D3')).toEqual(['C3'])
    expect(getSlotsBlockedForModulesByVacuumModule('cutoutD3')).toEqual(['C3'])
  })

  it('returns no blocked slots for unsupported vacuum module locations', () => {
    expect(getSlotsBlockedForModulesByVacuumModule('A1')).toEqual([])
  })
})

describe('doesVacuumModuleBlockModuleSlot', () => {
  it('blocks the neighboring standard slot', () => {
    expect(doesVacuumModuleBlockModuleSlot('A3', 'B3')).toBe(true)
    expect(doesVacuumModuleBlockModuleSlot('A3', 'cutoutB3')).toBe(true)
    expect(doesVacuumModuleBlockModuleSlot('D3', 'C3')).toBe(true)
  })

  it('does not block staging slots or unrelated slots', () => {
    expect(doesVacuumModuleBlockModuleSlot('A3', 'B4')).toBe(false)
    expect(doesVacuumModuleBlockModuleSlot('D3', 'C4')).toBe(false)
    expect(doesVacuumModuleBlockModuleSlot('A3', 'C3')).toBe(false)
    expect(doesVacuumModuleBlockModuleSlot('A3', 'A2')).toBe(false)
    expect(doesVacuumModuleBlockModuleSlot('D3', 'B3')).toBe(false)
  })
})

describe('existing-module checks', () => {
  it('blocks B3 when a vacuum module is already on A3', () => {
    expect(isCutoutBlockedByExistingVacuumModule('cutoutB3', vacuumOnA3)).toBe(
      true
    )
    expect(isCutoutBlockedByExistingVacuumModule('cutoutC3', vacuumOnA3)).toBe(
      false
    )
  })

  it('does not block staging slot B4 when a vacuum module is on A3', () => {
    expect(isCutoutBlockedByExistingVacuumModule('B4', vacuumOnA3)).toBe(false)
  })

  it('blocks adding a vacuum module to A3 when B3 already has a module', () => {
    expect(
      wouldVacuumModuleBlockExistingModule('cutoutA3', heaterShakerOnB3)
    ).toBe(true)
    expect(wouldVacuumModuleBlockExistingModule('cutoutA3', stackerOnB4)).toBe(
      false
    )
    expect(wouldVacuumModuleBlockExistingModule('cutoutA3', {})).toBe(false)
  })

  it('blocks adding a vacuum module to D3 when C3 already has a module', () => {
    expect(
      wouldVacuumModuleBlockExistingModule('cutoutD3', {
        mag: {
          slot: 'C3',
          cutoutId: 'cutoutC3',
          type: 'magneticBlockType',
          model: 'magneticBlockV1',
        },
      })
    ).toBe(true)
  })
})
