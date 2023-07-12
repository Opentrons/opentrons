import {
  mockHeaterShaker,
  mockMagneticModule,
  mockMagneticModuleGen2,
  mockTemperatureModule,
  mockTemperatureModuleGen2,
  mockThermocycler,
  mockThermocyclerGen2,
} from '../../../redux/modules/__fixtures__'
import { getModuleCardImage } from '../utils'

const mockThermocyclerGen2ClosedLid = {
  id: 'thermocycler_id2',
  moduleModel: 'thermocyclerModuleV2',
  moduleType: 'thermocyclerModuleType',
  data: {
    lidStatus: 'closed',
  },
} as any

const mockThermocyclerGen1ClosedLid = {
  id: 'thermocycler_id',
  moduleModel: 'thermocyclerModuleV1',
  moduleType: 'thermocyclerModuleType',
  data: {
    lidStatus: 'closed',
  },
} as any

describe('getModuleCardImage', () => {
  it('should render the correct image string when there is a magnetic module gen 2 attached', () => {
    const result = getModuleCardImage(mockMagneticModuleGen2)
    expect(result).toEqual('magnetic_module_gen_2_transparent.png')
  })
  it('should render the correct image string when there is a magnetic module gen 1 attached', () => {
    const result = getModuleCardImage(mockMagneticModule)
    expect(result).toEqual('magnetic_module_gen_2_transparent.png')
  })
  it('should render the correct image string when there is a temperature module gen 1 attached', () => {
    const result = getModuleCardImage(mockTemperatureModule)
    expect(result).toEqual('temp_deck_gen_2_transparent.png')
  })
  it('should render the correct image string when there is a temperature module gen 2 attached', () => {
    const result = getModuleCardImage(mockTemperatureModuleGen2)
    expect(result).toEqual('temp_deck_gen_2_transparent.png')
  })
  it('should render the correct image string when there is a heater shaker gen 1 attached', () => {
    const result = getModuleCardImage(mockHeaterShaker)
    expect(result).toEqual('heater_shaker_module_transparent.png')
  })
  it('should render the correct image string when there is a thermocycler gen 1 attached with opened lid', () => {
    const result = getModuleCardImage(mockThermocycler)
    expect(result).toEqual('thermocycler_open_transparent.png')
  })
  it('should render the correct image string when there is a thermocycler gen 1 attached with closed lid', () => {
    const result = getModuleCardImage(mockThermocyclerGen1ClosedLid)
    expect(result).toEqual('thermocycler_closed.png')
  })
  it('should render the correct image string when there is a thermocycler gen 2 with opened lid is attached', () => {
    const result = getModuleCardImage(mockThermocyclerGen2)
    expect(result).toEqual('thermocycler_gen_2_opened.png')
  })
  it('should render the correct image string when there is a thermocycler gen 2 with closed lid is attached', () => {
    const result = getModuleCardImage(mockThermocyclerGen2ClosedLid)
    expect(result).toEqual('thermocycler_gen_2_closed.png')
  })
})
