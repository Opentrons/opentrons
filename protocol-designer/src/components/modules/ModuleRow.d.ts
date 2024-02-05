/// <reference types="react" />
import { ModuleOnDeck } from '../../step-forms';
import type { ModuleType, RobotType } from '@opentrons/shared-data';
interface Props {
    robotType?: RobotType;
    moduleOnDeck?: ModuleOnDeck;
    showCollisionWarnings?: boolean;
    type: ModuleType;
    openEditModuleModal: (moduleType: ModuleType, moduleId?: string) => unknown;
}
export declare function ModuleRow(props: Props): JSX.Element;
export {};
