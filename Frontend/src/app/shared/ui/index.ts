/**
 * Composants d'interface réutilisables, sans aucune logique métier.
 * Un seul import suffit côté appelant :
 *
 *   import { Button, Card, Spinner } from '@shared/ui';
 */

export { Button } from './button/button';
export type { ButtonSize, ButtonVariant } from './button/button';

export { Card } from './card/card';

export { Spinner } from './spinner/spinner';
export type { SpinnerSize } from './spinner/spinner';
