import type { PipettingCommand } from './pipetting'
import type { GantryCommand } from './gantry'
import type { ModuleCommand } from './module'
import type { SetupCommand } from './setup'
import type { TimingCommand } from './timing'

interface CommonCommand {
  id: string
}

export type V6Command = CommonCommand &
  (
    | PipettingCommand // involves the pipettes plunger motor
    | GantryCommand // movement that only effects the x,y,z position of the gantry/pipette
    | ModuleCommand // directed at a hardware module
    | SetupCommand // only effecting robot's equipment setup (pipettes, labware, modules, liquid), no hardware side-effects
    | TimingCommand // effecting the timing of command execution
    | { commandType: 'custom'; params: { [key: string]: any } }
  )
