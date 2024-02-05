/// <reference types="react" />
import { ColorResult } from 'react-color';
interface ColorPickerProps {
    value: string;
    onChange: (hex: ColorResult['hex']) => void;
}
export declare function ColorPicker(props: ColorPickerProps): JSX.Element;
export {};
