import type { StyleProps, PrimitiveComponent } from './types';
export interface LinkProps extends StyleProps {
    /** render link with target="_blank" */
    external?: boolean;
}
/**
 * Link primitive
 *
 * @component
 */
export declare const Link: PrimitiveComponent<'a'>;
