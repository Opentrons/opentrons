import { useIs96ChannelPipetteAttached } from '..'
import type { FetchPipettesResponsePipette } from '../../../../redux/pipettes/types'

describe('useIs96ChannelPipetteAttached hook', () => {
  it('returns false when there is no pipette attached on the left mount', () => {
    const result = useIs96ChannelPipetteAttached(null)
    expect(result).toEqual(false)
  })

  it('returns true when there is a 96 channel pipette attached on the left mount', () => {
    const mockLeftMountAttachedPipette = {
      name: 'p20_96_channel',
    } as FetchPipettesResponsePipette

    const result = useIs96ChannelPipetteAttached(mockLeftMountAttachedPipette)
    expect(result).toEqual(true)
  })

  it('returns false when there is no 96 channel pipette attached on the left mount', () => {
    const mockLeftMountAttachedPipette = {
      name: 'mock single channel',
    } as FetchPipettesResponsePipette

    const result = useIs96ChannelPipetteAttached(mockLeftMountAttachedPipette)
    expect(result).toEqual(false)
  })
})
