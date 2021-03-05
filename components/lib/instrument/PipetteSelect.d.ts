/// <reference types="react" />
export interface PipetteSelectProps {
    /** currently selected value, optional in case selecting triggers immediate action */
    pipetteName?: string | null;
    /** react-select change handler */
    onPipetteChange: (pipetteName: string | null) => unknown;
    /** list of pipette names to omit */
    nameBlocklist?: string[];
    /** whether or not "None" shows up as the default option */
    enableNoneOption?: boolean;
    /** input tabIndex */
    tabIndex?: number;
    /** classes to apply to the top-level component */
    className?: string;
    /** custom id to be applied. likely to be used as a data test id for e2e testing */
    id?: string;
}
export declare const PipetteSelect: (props: PipetteSelectProps) => JSX.Element;
