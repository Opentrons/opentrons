/// <reference types="react" />
import type { IconProps } from '../icons';
import type { ButtonProps } from './Button';
interface Props extends ButtonProps {
    name: IconProps['name'];
    spin?: IconProps['spin'];
}
/**
 * FlatButton variant for a button that is a single icon. Takes props of
 * both Button _and_ Icon. Use `name` to specify icon name.
 */
export declare function IconButton(props: Props): JSX.Element;
export {};
