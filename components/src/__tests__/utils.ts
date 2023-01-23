import { truncateString } from '../utils'

describe('truncateString', () => {
  const maxLength = 20
  it('should return the original text if the input length is less than the maxLength', () => {
    const testText = 'opentrons-dev' // 13 letters
    const resp = truncateString(testText, maxLength)
    expect(resp).toEqual('opentrons-dev')
  })

  it('should return the truncated text if the input length is longer than the maxLength', () => {
    const testText = 'opentrons-dev-opentrons' // 23 letters
    const resp = truncateString(testText, maxLength)
    expect(resp).toEqual('opentrons-dev-ope...')
  })
})
