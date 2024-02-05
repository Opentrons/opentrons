import { Options } from '@opentrons/components';
import { PipetteEntity } from '@opentrons/step-generation';
export declare const pipetteOptions: Options;
export declare function getPipetteCapacity(pipetteEntity: PipetteEntity): number;
export declare function getMinPipetteVolume(pipetteEntity: PipetteEntity): number;
