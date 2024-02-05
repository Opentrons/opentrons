/// <reference types="react" />
import { FormPipette } from '../../../step-forms/types';
interface Props {
    leftPipette?: FormPipette['pipetteName'];
    rightPipette?: FormPipette['pipetteName'];
}
export declare function PipetteDiagram(props: Props): JSX.Element;
export {};
