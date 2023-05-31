import { get96ChannelFromModel } from '../utils'

describe('get96ChannelFromModel', () => {
  it('should return true when the model is v1', () => {
    expect(get96ChannelFromModel('p1000_96_v1')).toStrictEqual(true)
  })
  it('should return true when the model is v3.0', () => {
    expect(get96ChannelFromModel('p1000_96_v3.0')).toStrictEqual(true)
  })
  it('should return true when the model is v3.3', () => {
    expect(get96ChannelFromModel('p1000_96_v3.3')).toStrictEqual(true)
  })
  it('should return false when the model is not a 96 channel', () => {
    expect(get96ChannelFromModel('p50_single_v3.3')).toStrictEqual(false)
  })
})
