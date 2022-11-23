import type { FetchPipettesResponsePipette } from '../../../redux/pipettes/types'

export function useIs96ChannelPipetteAttached(
  leftMountAttachedPipette: FetchPipettesResponsePipette | null
): boolean {
  const pipetteName = leftMountAttachedPipette?.name

  //  TODO(jr, 11/22/22): add correct pipette name when we know what it is
  return pipetteName === 'p20_96_channel'
}
