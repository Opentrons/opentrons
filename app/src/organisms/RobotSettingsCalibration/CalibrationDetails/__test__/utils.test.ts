import { formatLastCalibrated } from '../utils'

describe('formatLastCalibrated', () => {
  it('should return mm/dd/yyyy hh:mm:ss format', () => {
    const lastModified = '2022-11-10T18:16:29'
    const formatted = formatLastCalibrated(lastModified)
    expect(formatted).toBe('11/10/2022 18:16:29')
  })

  it('should return mm/dd/yyyy hh:mm:ss format remove 0 from month', () => {
    const lastModified = '2022-01-10T18:16:29'
    const formatted = formatLastCalibrated(lastModified)
    expect(formatted).toBe('1/10/2022 18:16:29')
  })
})
