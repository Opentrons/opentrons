// @flow
import type { LabwareDefinition2 } from '@opentrons/shared-data'

type LabwareTestProtocolArgs = {|
  pipetteName: string,
  mount: string,
  tiprackLoadName: string,
  definition: LabwareDefinition2,
|}
const labwareTestProtocol = (args: LabwareTestProtocolArgs): string => {
  return 'TODO python protocol here'
}

export default labwareTestProtocol
