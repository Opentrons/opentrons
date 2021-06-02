import type { AttachedPipette } from '../../../../redux/pipettes/types'

export const mockAttachedPipette: AttachedPipette = {
  id: '1234_pip_id',
  name: 'Opentrons Test Pipette',
  model: 'opentrons_test_pipette',
  tip_length: 55,
  mount_axis: 'Z',
  plunger_axis: 'B',
  modelSpecs: {
    model: 'opentrons_test_pipette',
    name: 'Opentrons Test Pipette',
    tipLength: { value: 55 },
    displayName: 'Opentrons Good Ol Test Pipette',
    displayCategory: 'GEN2',
    minVolume: 10,
    maxVolume: 100,
    channels: 1,
    defaultAspirateFlowRate: { max: 2, min: 1, value: 2 },
    defaultDispenseFlowRate: { max: 2, min: 1, value: 2 },
    defaultBlowOutFlowRate: { max: 2, min: 1, value: 2 },
    smoothieConfigs: {
      stepsPerMM: 10,
      homePosition: 0,
      travelDistance: 100,
    },
    defaultTipracks: ['opentrons/my_fav_tiprack_200ul/1'],
  },
}
