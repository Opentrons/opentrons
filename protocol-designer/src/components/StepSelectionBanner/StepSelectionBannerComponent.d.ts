import { CountPerStepType } from '../../form-types';
export declare const ExitBatchEditButton: (props: {
    handleExitBatchEdit: StepSelectionBannerProps['handleExitBatchEdit'];
}) => JSX.Element;
export interface StepSelectionBannerProps {
    countPerStepType: CountPerStepType;
    handleExitBatchEdit: () => unknown;
}
export declare const StepSelectionBannerComponent: (props: StepSelectionBannerProps) => JSX.Element;
