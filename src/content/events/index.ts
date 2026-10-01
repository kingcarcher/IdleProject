import type { EventDef } from '../types';
import { dockEvents } from './docks';
import { friendEvents } from './friend';
import { motherEvents } from './mother';
import { partnerEvents } from './partner';

export const events: readonly EventDef[] = [
  ...dockEvents,
  ...partnerEvents,
  ...motherEvents,
  ...friendEvents,
];
