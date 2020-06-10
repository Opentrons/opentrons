// @flow
import * as Cfg from '@opentrons/app/src/config'
import { shouldUpdate, getNextValue } from '../update'

import type { Config } from '../types'

const CONFIG: $Shape<Config> = {
  devtools: false,
  alerts: { ignored: ['someAlert'] },
  devInternal: {},
}

describe('config updates', () => {
  describe('shouldUpdate', () => {
    it('should return true if value is not overridden', () => {
      const path = 'foo'
      const overrides = {}

      expect(shouldUpdate(path, overrides)).toBe(true)
    })

    it('should return false if value is overridden', () => {
      expect(shouldUpdate('foo', { foo: 'value' })).toBe(false)
      expect(shouldUpdate('bar.baz', { bar: { baz: false } })).toBe(false)
    })
  })

  it('should handle an update action', () => {
    const action = Cfg.updateConfigValue('devtools', true)
    const nextValue = getNextValue(action, CONFIG)

    expect(nextValue).toEqual(true)
  })

  it('should handle a reset action', () => {
    const action = Cfg.resetConfigValue('devtools')
    const nextValue = getNextValue(action, { ...CONFIG, devtools: true })

    expect(nextValue).toEqual(false)
  })

  it('should handle a toggle action', () => {
    const action = Cfg.toggleConfigValue('devtools')
    const nextValue = getNextValue(action, CONFIG)

    expect(nextValue).toEqual(true)
  })

  it('should handle a toggle action for a missing setting', () => {
    const action = Cfg.toggleConfigValue('devInteral.someFeatureFlag')
    const nextValue = getNextValue(action, CONFIG)

    expect(nextValue).toEqual(true)
  })

  it('should handle a toggle action for an invalid setting', () => {
    const action = Cfg.toggleConfigValue('alerts.ignored')
    const nextValue = getNextValue(action, CONFIG)

    expect(nextValue).toEqual(CONFIG.alerts.ignored)
  })

  it('should handle an add unique action', () => {
    const action = Cfg.addUniqueConfigValue('alerts.ignored', 'anotherAlert')
    const nextValue = getNextValue(action, CONFIG)

    expect(nextValue).toEqual(['someAlert', 'anotherAlert'])
  })

  it('should handle an add unique action if value is already in set', () => {
    const action = Cfg.addUniqueConfigValue('alerts.ignored', 'someAlert')
    const nextValue = getNextValue(action, CONFIG)

    expect(nextValue).toEqual(['someAlert'])
  })

  it('should handle an add unique action for an invalid setting', () => {
    const action = Cfg.addUniqueConfigValue('devtools', 'invalid')
    const nextValue = getNextValue(action, CONFIG)

    expect(nextValue).toEqual(false)
  })

  it('should handle a subtract action', () => {
    const action = Cfg.subtractConfigValue('alerts.ignored', 'someAlert')
    const nextValue = getNextValue(action, CONFIG)

    expect(nextValue).toEqual([])
  })

  it('should handle a subtract if value is not in set', () => {
    const action = Cfg.subtractConfigValue('alerts.ignored', 'anotherAlert')
    const nextValue = getNextValue(action, CONFIG)

    expect(nextValue).toEqual(['someAlert'])
  })

  it('should handle a subtract action for an invalid setting', () => {
    const action = Cfg.subtractConfigValue('devtools', 'invalid')
    const nextValue = getNextValue(action, CONFIG)

    expect(nextValue).toEqual(false)
  })
})
