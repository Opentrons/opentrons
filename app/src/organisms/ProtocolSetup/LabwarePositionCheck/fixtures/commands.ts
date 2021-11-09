import { LabwarePositionCheckCommand } from '../types'

export const getMockLPCCommands = (): LabwarePositionCheckCommand[] => [
  {
    commandType: 'moveToWell',
    params: {
      pipetteId: 'c235a5a0-0042-11ec-8258-f7ffdf5ad45a',
      labwareId: 'e24818a0-0042-11ec-8258-f7ffdf5ad45a',
      wellName: 'A1',
      wellLocation: [Object],
    },
  },
  {
    commandType: 'moveToWell',
    params: {
      pipetteId: '50d23e00-0042-11ec-8258-f7ffdf5ad45a',
      labwareId:
        '50d3ebb0-0042-11ec-8258-f7ffdf5ad45a:opentrons/opentrons_96_tiprack_300ul/1',
      wellName: 'A1',
      wellLocation: [Object],
    },
  },
  {
    commandType: 'pickUpTip',
    params: {
      pipetteId: '50d23e00-0042-11ec-8258-f7ffdf5ad45a',
      labwareId:
        '50d3ebb0-0042-11ec-8258-f7ffdf5ad45a:opentrons/opentrons_96_tiprack_300ul/1',
      wellName: 'A1',
    },
  },
  {
    commandType: 'moveToWell',
    params: {
      pipetteId: '50d23e00-0042-11ec-8258-f7ffdf5ad45a',
      labwareId:
        '9fbc1db0-0042-11ec-8258-f7ffdf5ad45a:opentrons/nest_12_reservoir_15ml/1',
      wellName: 'A1',
      wellLocation: [Object],
    },
  },
  {
    commandType: 'thermocycler/openLid',
    params: {
      moduleId: '18f0c1b0-0122-11ec-88a3-f1745cf9b36c:thermocyclerModuleType',
    },
  },
  {
    commandType: 'moveToWell',
    params: {
      pipetteId: '50d23e00-0042-11ec-8258-f7ffdf5ad45a',
      labwareId:
        '1dc0c050-0122-11ec-88a3-f1745cf9b36c:opentrons/nest_96_wellplate_100ul_pcr_full_skirt/1',
      wellName: 'A1',
      wellLocation: [Object],
    },
  },
  {
    commandType: 'dropTip',
    params: {
      pipetteId: '50d23e00-0042-11ec-8258-f7ffdf5ad45a',
      labwareId:
        '50d3ebb0-0042-11ec-8258-f7ffdf5ad45a:opentrons/opentrons_96_tiprack_300ul/1',
      wellName: 'A1',
    },
  },
]
