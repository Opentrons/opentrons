import { EngageMagnetArgs, DisengageMagnetArgs } from '@opentrons/step-generation';
import { HydratedMagnetFormData } from '../../../form-types';
type MagnetArgs = EngageMagnetArgs | DisengageMagnetArgs;
export declare const magnetFormToArgs: (hydratedFormData: HydratedMagnetFormData) => MagnetArgs;
export {};
