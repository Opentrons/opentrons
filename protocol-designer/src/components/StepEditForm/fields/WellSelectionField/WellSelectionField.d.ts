import type { FieldProps } from '../../types';
export type Props = FieldProps & {
    nozzles: string | null;
    pipetteId?: string | null;
    labwareId?: string | null;
};
export declare const WellSelectionField: (props: Props) => JSX.Element;
