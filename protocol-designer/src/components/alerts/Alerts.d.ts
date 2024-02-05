import * as React from 'react';
import { StepFieldName } from '../../steplist/fieldLevel';
/** Errors and Warnings from step-generation are written for developers
 * who are using step-generation as an API for writing Opentrons protocols.
 * These 'overrides' replace the content of some of those errors/warnings
 * in order to make things clearer to the PD user.
 *
 * When an override is not specified in /localization/en/alert/ , the default
 * behavior is that the warning/error `message` gets put into the `title` of the Alert
 */
interface Props {
    componentType: 'Form' | 'Timeline';
    focusedField?: StepFieldName | null;
    dirtyFields?: StepFieldName[];
}
export declare const Alerts: React.MemoExoticComponent<(props: Props) => JSX.Element>;
export {};
