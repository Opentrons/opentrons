import { describe, expect, it } from 'vitest'

import { resources } from '..'

describe('branded copy', () => {
  it('branded and anonymous resources contain the same translation keys', () => {
    const brandedKeys = Object.keys(resources.en['branded'])
    const anonymousKeys = Object.keys(resources.en['anonymous'])

    brandedKeys.forEach((brandedKey, i) => {
      const anonymousKey = anonymousKeys[i]
      expect(brandedKey).toEqual(anonymousKey)
    })
  })

  it('non-branded copy does not contain "Opentrons" or "Flex"', () => {
    const nonBrandedResources = Object.entries(resources.en).filter(
      resource => resource[0] !== 'branded' && resource[0] !== 'anonymous'
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
