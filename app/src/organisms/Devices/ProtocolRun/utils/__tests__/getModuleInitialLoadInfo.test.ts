import { describe, it, expect } from 'vitest'
import { transfer_settings } from '@opentrons/shared-data'
import { getModuleInitialLoadInfo } from '../getModuleInitialLoadInfo'
import type {
  LoadModuleRunTimeCommand,
  CompletedProtocolAnalysis,
} from '@opentrons/shared-data'

const protocolWithMagTempTC = (transfer_settings as unknown) as CompletedProtocolAnalysis

describe('getModuleInitialLoadInfo', () => {
  it('should gather protocol module info for tc if id in params', () => {
    const TC_ID: keyof typeof transfer_settings.modules =
      '3e039550-3412-11eb-ad93-ed232a2337cf:thermocyclerModuleType'

    expect(
      getModuleInitialLoadInfo(TC_ID, protocolWithMagTempTC.commands)
    ).toEqual({
      location: {
        slotName: '7',
      },
      protocolLoadOrder: 2,
    })
  })
  it('should gather protocol module info for tc if id not in params', () => {
    const TC_ID: keyof typeof transfer_settings.modules =
      '3e039550-3412-11eb-ad93-ed232a2337cf:thermocyclerModuleType'

    const LOAD_TC_COMMAND: LoadModuleRunTimeCommand = {
      id: '4',
      commandType: 'loadModule',
      params: { location: { slotName: '7' } },
      result: {
        moduleId: '3e039550-3412-11eb-ad93-ed232a2337cf:thermocyclerModuleType',
      },
    } as any

    expect(getModuleInitialLoadInfo(TC_ID, [LOAD_TC_COMMAND])).toEqual({
      location: LOAD_TC_COMMAND.params.location,
      protocolLoadOrder: 0,
    })
  })
})
