/**
 * Composants d'interface réutilisables, sans aucune logique métier.
 * Un seul import suffit côté appelant :
 *
 *   import { Button, Card, FormField } from '@shared/ui';
 */

export { Avatar } from './avatar/avatar';
export type { AvatarSize } from './avatar/avatar';

export { Button } from './button/button';
export type { ButtonSize, ButtonVariant } from './button/button';

export { Card } from './card/card';

export { FormField } from './form-field/form-field';
export type { FormFieldType } from './form-field/form-field';

export { Icon } from './icon/icon';
export type { IconName, IconSize } from './icon/icon';

export { SearchBar } from './search-bar/search-bar';

export { Spinner } from './spinner/spinner';
export type { SpinnerSize } from './spinner/spinner';

export { InteractiveMapComponent } from './interactive-map/interactive-map';
export type { InteractiveMapMarker, MapCoordinates } from './interactive-map/interactive-map';
