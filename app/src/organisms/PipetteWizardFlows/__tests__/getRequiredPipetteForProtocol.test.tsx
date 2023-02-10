import { LEFT, RIGHT } from '@opentrons/shared-data'
import protocolData from '@opentrons/shared-data/protocol/fixtures/6/simpleV6.json'
import { getRequiredPipetteForProtocol } from '../getRequiredPipetteForProtocol'

import type { PipetteInfo, StoredProtocolAnalysis } from '../../Devices/hooks'

const mockPipetteInfo = {
  requestedPipetteMatch: 'incompatible',
  pipetteCalDate: null,
  pipetteSpecs: {
    displayName: 'pipette 1',
    name: 'p1000_96',
  },
} as PipetteInfo

const mockAttachedPipettesEmpty = {
  left: null,
  right: null,
}
const mockAttachedPipettesNotEmpty = {
  left: { ...mockPipetteInfo, pipetteSpecs: { name: 'p1000_single_gen3' } },
  right: null,
}
const mockAttachedPipette96Channel = {
  left: mockPipetteInfo,
  right: null,
}
describe('getRequiredPipetteForProtocol', () => {
  it('renders the correct pipette name when the gantry is empty', () => {
    expect(
      getRequiredPipetteForProtocol(
        ({
          ...protocolData,
          commands: [
            {
              commandType: 'loadPipette',
              id: '0abc123',
              params: {
                pipetteId: 'pipetteId',
                mount: 'left',
                pipetteName: 'p1000_single_gen3',
              },
            },
          ],
        } as unknown) as StoredProtocolAnalysis,
        mockAttachedPipettesEmpty,
        LEFT
      )
    ).toStrictEqual('p1000_single_gen3')
  })
  it('renders the null when the gantry pipette matches the required pipette', () => {
    expect(
      getRequiredPipetteForProtocol(
        ({
          ...protocolData,
          commands: [
            {
              commandType: 'loadPipette',
              id: '0abc123',
              params: {
                pipetteId: 'pipetteId',
                mount: 'left',
                pipetteName: 'p1000_single_gen3',
              },
            },
          ],
        } as unknown) as StoredProtocolAnalysis,
        mockAttachedPipettesNotEmpty as any,
        LEFT
      )
    ).toStrictEqual(null)
  })
  it('renders the null when the left mount is not empty and there is no required pipette', () => {
    expect(
      getRequiredPipetteForProtocol(
        ({
          ...protocolData,
          commands: [
            {
              commandType: 'loadPipette',
              id: '0abc123',
              params: {
                pipetteId: 'pipetteId',
                mount: 'right',
                pipetteName: 'p1000_single_gen3',
              },
            },
          ],
        } as unknown) as StoredProtocolAnalysis,
        mockAttachedPipettesNotEmpty as any,
        LEFT
      )
    ).toStrictEqual(null)
  })
  it('renders the pipette name when the left mount is not empty and there is no required pipette', () => {
    expect(
      getRequiredPipetteForProtocol(
        ({
          ...protocolData,
          commands: [
            {
              commandType: 'loadPipette',
              id: '0abc123',
              params: {
                pipetteId: 'pipetteId',
                mount: 'right',
                pipetteName: 'p1000_single_gen3',
              },
            },
          ],
        } as unknown) as StoredProtocolAnalysis,
        mockAttachedPipette96Channel,
        RIGHT
      )
    ).toStrictEqual('p1000_single_gen3')
  })
})
