import robotSideAnalysis from './mockRobotSideAnalysis.json'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import type { CommandTextData } from '../types'

export const mockRobotSideAnalysis: CompletedProtocolAnalysis = robotSideAnalysis as CompletedProtocolAnalysis

export const mockCommandTextData: CommandTextData = {
  commands: mockRobotSideAnalysis.commands,
  pipettes: mockRobotSideAnalysis.pipettes,
  labware: mockRobotSideAnalysis.labware,
  modules: mockRobotSideAnalysis.modules,
  liquids: mockRobotSideAnalysis.liquids,
}
