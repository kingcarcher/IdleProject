import {
  allBulletins,
  allEvents,
  getEvent,
  type BulletinDef,
  type Condition,
  type Effect,
  type EventDef,
  type EventId,
  type GameDay,
  type TimeWindow,
} from '@/content';
import { contact, daysSinceContact, relocate } from './relationships';
import { appendLog, getRelationship, hasFlag, type GameState } from './state';
import { fillFromState } from './text';

export function isWithinWindow(window: TimeWindow, day: GameDay): boolean {
  return day >= window.availableFrom && day <= window.availableUntil;
}

export function isExpired(window: TimeWindow, day: GameDay): boolean {
  return day > window.availableUntil;
}

export function evaluateCondition(state: GameState, condition: Condition): boolean {
  switch (condition.kind) {
    case 'flagSet':
      return hasFlag(state, condition.flag);
    case 'flagNotSet':
      return !hasFlag(state, condition.flag);
    case 'relationshipAtLeast':
      return getRelationship(state, condition.character) >= condition.value;
    case 'relationshipAtMost':
      return getRelationship(state, condition.character) <= condition.value;
    case 'daysSinceContactAtLeast': {
      const days = daysSinceContact(state, condition.character);
      return days === null || days >= condition.days;
    }
    case 'moneyAtLeast':
      return state.money >= condition.amount;
    case 'eventCompleted':
      return state.completedEvents.includes(condition.event);
    case 'eventNotCompleted':
      return !state.completedEvents.includes(condition.event);
    case 'dateBetween':
      return state.day >= condition.from && state.day <= condition.until;
    case 'anyOf':
      return condition.conditions.some((inner) => evaluateCondition(state, inner));
  }
}

export function conditionsMet(state: GameState, conditions?: readonly Condition[]): boolean {
  return (conditions ?? []).every((condition) => evaluateCondition(state, condition));
}

export function isEventAvailable(state: GameState, event: EventDef): boolean {
  return (
    event.location === state.location &&
    isWithinWindow(event, state.day) &&
    !state.completedEvents.includes(event.id) &&
    conditionsMet(state, event.conditions)
  );
}

export function availableEvents(state: GameState): readonly EventDef[] {
  return allEvents.filter((event) => isEventAvailable(state, event));
}

/** Events the player can no longer reach: window closed without completion. */
export function missedEvents(state: GameState): readonly EventDef[] {
  return allEvents.filter(
    (event) => isExpired(event, state.day) && !state.completedEvents.includes(event.id),
  );
}

export function availableBulletins(state: GameState): readonly BulletinDef[] {
  return allBulletins.filter(
    (bulletin) => bulletin.location === state.location && isWithinWindow(bulletin, state.day),
  );
}

/**
 * Applies one effect. Journey-only effects (`shortenJourney`, `deliveryBonus`, `journal`) are
 * handled by the journey module and ignored here.
 */
export function applyEffect(state: GameState, effect: Effect): GameState {
  switch (effect.kind) {
    case 'money':
      return { ...state, money: state.money + effect.delta };
    case 'relationship':
      return contact(state, effect.character, effect.delta);
    case 'setFlag':
      return hasFlag(state, effect.flag)
        ? state
        : { ...state, flags: [...state.flags, effect.flag] };
    case 'clearFlag':
      return { ...state, flags: state.flags.filter((flag) => flag !== effect.flag) };
    case 'relocate':
      return relocate(state, effect.character, effect.to);
    case 'shortenJourney':
    case 'deliveryBonus':
    case 'journal':
      return state;
  }
}

export function applyEffects(state: GameState, effects: readonly Effect[]): GameState {
  return effects.reduce(applyEffect, state);
}

export function resolveEvent(state: GameState, eventId: EventId, choiceId: string): GameState {
  if (state.phase !== 'station' && state.phase !== 'bar') return state;
  const event = getEvent(eventId);
  if (!isEventAvailable(state, event)) return state;

  const choice = event.choices.find((candidate) => candidate.id === choiceId);
  if (choice === undefined || !conditionsMet(state, choice.conditions)) return state;

  let next = applyEffects(state, choice.effects);
  // Any scene with someone counts as seeing them, even if no choice moved the relationship.
  if (event.character !== undefined) next = contact(next, event.character, 0);
  next = { ...next, completedEvents: [...next.completedEvents, event.id] };
  return appendLog(
    next,
    fillFromState(next, `${event.title} — ${choice.label} ${choice.outcomeText}`),
  );
}
