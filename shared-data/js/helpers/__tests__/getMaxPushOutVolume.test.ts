import { describe, expect, it } from 'vitest'

import { getMaxPushOutVolume } from '../getMaxPushOutVolume'

describe('getMaxPushOutVolume', () => {
  const mockPipetteSpec: any = {
    plungerPositionsConfigurations: {
      default: {
        bottom: 10,
        blowout: 15,
      },
      lowVolumeDefault: {
        bottom: 5,
        blowout: 15,
      },
    },
    shaftULperMM: 0.8,
    liquids: {
      default: {
        maxVolume: 50,
        minVolume: 5,
      },
      lowVolumeDefault: {
        maxVolume: 30,
        minVolume: 1,
      },
    },
  }

  it('should calculate correct push out volume for default volume configuration ', () => {
    const result = getMaxPushOutVolume(100, mockPipetteSpec)

    expect(result).toBe(4)
  })

  it('should calculate correct push out volume for low volume configuration ', () => {
    const result = getMaxPushOutVolume(4, mockPipetteSpec)

    expect(result).toBe(8)
  })

  it('should calculate pushout volume for low volume configuration with no low volume mode properties', () => {
    const pipetteSpecNoLowVolume: any = {
      plungerPositionsConfigurations: {
        default: {
          bottom: 10,
          blowout: 15,
        },
      },
      shaftULperMM: 0.8,
      liquids: {
        default: {
          maxVolume: 50,
          minVolume: 5,
        },
      },
    }

    const result = getMaxPushOutVolume(50, pipetteSpecNoLowVolume)

    expect(result).toBe(4)
  })
})
