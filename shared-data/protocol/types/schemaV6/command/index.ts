import type { PipettingCommand } from './pipetting'
import type { GantryCommand } from './gantry'
import type { ModuleCommand } from './module'
import type { SetupCommand } from './setup'
import type { TimingCommand } from './timing'
import type { SavePositionCommand } from './position'

interface CommonCommand {
  id: string
}

export type Command = CommonCommand &
  (
    | PipettingCommand // involves the pipettes plunger motor
    | GantryCommand // movement that only effects the x,y,z position of the gantry/pipette
    | ModuleCommand // directed at a hardware module
    | SetupCommand // only effecting robot's equipment setup (pipettes, labware, modules, liquid), no hardware side-effects
    | TimingCommand // effecting the timing of command execution
    | SavePositionCommand // save a coordinate vector to be later queried
    | { commandType: 'custom'; params: { [key: string]: any } }
  )
