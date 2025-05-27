import { describe, expect, it } from 'vitest'

import {
  moduleCleanupDuringLPCCommands,
  moduleInitBeforeAnyLPCCommands,
  moduleInitDuringLPCCommands,
  modulePrepCommands,
} from '../modules'

import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import type { OffsetLocationDetails } from '/app/redux/protocol-runs'

describe('module commands', () => {
  describe('modulePrepCommands', () => {
    const MODULE_ID = 'module-123'

    it('should return empty array when no module exists', () => {
      const mockOffsetLocationDetails = {
        closestBeneathModuleId: null,
        closestBeneathModuleModel: null,
      } as any

      const result = modulePrepCommands(mockOffsetLocationDetails)

      expect(result).toEqual([])
    })

    it('should return thermocycler commands when thermocycler module exists', () => {
      const mockOffsetLocationDetails = {
        closestBeneathModuleId: MODULE_ID,
        closestBeneathModuleModel: 'thermocyclerModuleV2',
      } as OffsetLocationDetails

      const result = modulePrepCommands(mockOffsetLocationDetails)

      expect(result).toEqual([
        {
          commandType: 'thermocycler/openLid',
          params: { moduleId: MODULE_ID },
        },
      ])
    })

    it('should return heaterShaker commands when heaterShaker module exists', () => {
      const mockOffsetLocationDetails = {
        closestBeneathModuleId: MODULE_ID,
        closestBeneathModuleModel: 'heaterShakerModuleV1',
      } as OffsetLocationDetails

      const result = modulePrepCommands(mockOffsetLocationDetails)

      expect(result).toEqual([
        {
          commandType: 'heaterShaker/closeLabwareLatch',
          params: { moduleId: MODULE_ID },
        },
        {
          commandType: 'heaterShaker/deactivateShaker',
          params: { moduleId: MODULE_ID },
        },
        {
          commandType: 'heaterShaker/openLabwareLatch',
          params: { moduleId: MODULE_ID },
        },
      ])
    })

    it('should return empty array for unsupported module types', () => {
      const mockOffsetLocationDetails = {
        closestBeneathModuleId: MODULE_ID,
        closestBeneathModuleModel: 'magneticModuleV2',
      } as OffsetLocationDetails

      const result = modulePrepCommands(mockOffsetLocationDetails)

      expect(result).toEqual([])
    })
  })

  describe('moduleInitBeforeAnyLPCCommands', () => {
    const THERMOCYCLER_ID = 'thermocycler-123'
    const HEATERSHAKER_ID = 'heatershaker-123'
    const ABSORBANCE_READER_ID = 'absorbancereader-123'

    it('should return commands for all supported modules', () => {
      const mockAnalysis = {
        modules: [
          {
            id: THERMOCYCLER_ID,
            model: 'thermocyclerModuleV2',
          },
          {
            id: HEATERSHAKER_ID,
            model: 'heaterShakerModuleV1',
          },
          {
            id: ABSORBANCE_READER_ID,
            model: 'absorbanceReaderV1',
          },
        ],
      } as CompletedProtocolAnalysis

      const result = moduleInitBeforeAnyLPCCommands(mockAnalysis)

      expect(result).toEqual([
        {
          commandType: 'thermocycler/openLid',
          params: { moduleId: THERMOCYCLER_ID },
        },
        {
          commandType: 'home',
          params: {},
        },
        {
          commandType: 'absorbanceReader/openLid',
          params: { moduleId: ABSORBANCE_READER_ID },
        },
        {
          commandType: 'heaterShaker/closeLabwareLatch',
          params: { moduleId: HEATERSHAKER_ID },
        },
      ])
    })

    it('should return empty array when no modules exist', () => {
      const mockAnalysis = {
        modules: [],
      } as any

      const result = moduleInitBeforeAnyLPCCommands(mockAnalysis)

      expect(result).toEqual([])
    })

    it('should handle unsupported module types', () => {
      const mockAnalysis = {
        modules: [
          {
            id: 'magnetic-123',
            model: 'magneticModuleV2',
          },
        ],
      } as CompletedProtocolAnalysis

      const result = moduleInitBeforeAnyLPCCommands(mockAnalysis)

      expect(result).toEqual([])
    })
  })

  describe('moduleInitDuringLPCCommands', () => {
    const HEATERSHAKER_ID = 'heatershaker-123'

    it('should return heaterShaker init commands', () => {
      const mockAnalysis = {
        modules: [
          {
            id: HEATERSHAKER_ID,
            model: 'heaterShakerModuleV1',
          },
          {
            id: 'thermocycler-123',
            model: 'thermocyclerModuleV2',
          },
        ],
      } as CompletedProtocolAnalysis

      const result = moduleInitDuringLPCCommands(mockAnalysis)

      expect(result).toEqual([
        {
          commandType: 'heaterShaker/closeLabwareLatch',
          params: { moduleId: HEATERSHAKER_ID },
        },
      ])
    })

    it('should return empty array when no heaterShaker modules exist', () => {
      const mockAnalysis = {
        modules: [
          {
            id: 'thermocycler-123',
            model: 'thermocyclerModuleV2',
          },
        ],
      } as CompletedProtocolAnalysis

      const result = moduleInitDuringLPCCommands(mockAnalysis)

      expect(result).toEqual([])
    })
  })

  describe('moduleCleanupDuringLPCCommands', () => {
    const MODULE_ID = 'module-123'

    it('should return heaterShaker cleanup commands when heaterShaker module exists', () => {
      const mockOffsetLocationDetails = {
        closestBeneathModuleId: MODULE_ID,
        closestBeneathModuleModel: 'heaterShakerModuleV1',
      } as OffsetLocationDetails

      const result = moduleCleanupDuringLPCCommands(mockOffsetLocationDetails)

      expect(result).toEqual([
        {
          commandType: 'heaterShaker/openLabwareLatch',
          params: { moduleId: MODULE_ID },
        },
      ])
    })

    it('should return empty array for non-heaterShaker modules', () => {
      const mockOffsetLocationDetails = {
        closestBeneathModuleId: MODULE_ID,
        closestBeneathModuleModel: 'thermocyclerModuleV2',
      } as OffsetLocationDetails

      const result = moduleCleanupDuringLPCCommands(mockOffsetLocationDetails)

      expect(result).toEqual([])
    })

    it('should return empty array when no module exists', () => {
      const mockOffsetLocationDetails = {
        closestBeneathModuleId: null,
        closestBeneathModuleModel: null,
      } as any

      const result = moduleCleanupDuringLPCCommands(mockOffsetLocationDetails)

      expect(result).toEqual([])
    })
  })
})
