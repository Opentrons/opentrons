import { describe, expect, it } from 'vitest'
import { sanitizeFileName } from '../utils'

describe('sanitizeFileName', () => {
  it('returns original alphanumeric file name', () => {
    expect(sanitizeFileName('an0ther_otie_logo.png')).toEqual(
      'an0ther_otie_logo.png'
    )
  })

  it('sanitizes a file name', () => {
    expect(
      sanitizeFileName(
        `otie's birthday/party - (& the bouncy castle cost ~$100,000).jpeg`
      )
    ).toEqual(
      'otie_s_birthday_party_-____the_bouncy_castle_cost___100_000_.jpeg'
    )
  })
})
