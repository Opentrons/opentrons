import { SetTemperatureArgs, DeactivateTemperatureArgs } from '@opentrons/step-generation';
import { HydratedTemperatureFormData } from '../../../form-types';
type TemperatureArgs = SetTemperatureArgs | DeactivateTemperatureArgs;
export declare const temperatureFormToArgs: (hydratedFormData: HydratedTemperatureFormData) => TemperatureArgs;
export {};
