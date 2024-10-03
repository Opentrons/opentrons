import { describe, it, expect } from 'vitest'
import {
  ANONYMOUS_RESOURCE,
  BRANDED_RESOURCE,
} from '../../../LocalizationProvider'
import { resources } from '..'

describe('branded copy', () => {
  it('branded and anonymous resources contain the same translation keys', () => {
    const brandedKeys = Object.keys(resources.en[BRANDED_RESOURCE])
    const anonymousKeys = Object.keys(resources.en[ANONYMOUS_RESOURCE])

    brandedKeys.forEach((brandedKey, i) => {
      const anonymousKey = anonymousKeys[i]
      expect(brandedKey).toEqual(anonymousKey)
    })
  })

  it('non-branded copy does not contain "Opentrons" or "Flex"', () => {
    const nonBrandedResources = Object.entries(resources.en).filter(
      resource =>
        resource[0] !== BRANDED_RESOURCE && resource[0] !== ANONYMOUS_RESOURCE
    )

    const nonBrandedCopy = nonBrandedResources
      .map(resource => Object.values(resource[1]))
      .flat()

    nonBrandedCopy.forEach(phrase => {
      expect(phrase.match(/opentrons/i)).toBeNull()
      expect(phrase.match(/flex/i)).toBeNull()
    })
  })
})
