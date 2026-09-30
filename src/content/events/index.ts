import { CharacterIds, EventIds, FlagIds, LocationIds } from '../ids';
import type { EventDef } from '../types';

export const events = [
  {
    id: EventIds.meridianLetter,
    title: 'A letter for Halden',
    location: LocationIds.meridian,
    availableFrom: 0,
    availableUntil: 400,
    text: 'A dock clerk named Ilse catches you at the airlock. She has a paper letter for her mother on Halden and no money for the courier rates.',
    choices: [
      {
        id: 'accept',
        label: 'Take the letter. No charge.',
        effects: [
          { kind: 'setFlag', flag: FlagIds.carryingLetter },
          { kind: 'relationship', character: CharacterIds.ilse, delta: 15 },
        ],
        outcomeText: 'She thanks you twice and hurries back to her shift.',
      },
      {
        id: 'pay-courier',
        label: 'Pay the courier rate for her (500 cr).',
        conditions: [{ kind: 'moneyAtLeast', amount: 500 }],
        effects: [
          { kind: 'money', delta: -500 },
          { kind: 'relationship', character: CharacterIds.ilse, delta: 25 },
        ],
        outcomeText: 'The courier takes the letter. Ilse looks at you like she does not trust it.',
      },
      {
        id: 'decline',
        label: 'You are not a mail service.',
        effects: [{ kind: 'relationship', character: CharacterIds.ilse, delta: -10 }],
        outcomeText: 'She nods, folds the letter away, and does not look back.',
      },
    ],
  },
  {
    id: EventIds.haldenDeliverLetter,
    title: 'Deliver the letter',
    location: LocationIds.halden,
    availableFrom: 0,
    availableUntil: 1200,
    conditions: [{ kind: 'flagSet', flag: FlagIds.carryingLetter }],
    text: 'The address is a farm block on the outskirts. The woman who opens the door is older than you expected.',
    choices: [
      {
        id: 'deliver',
        label: 'Hand over the letter.',
        effects: [
          { kind: 'clearFlag', flag: FlagIds.carryingLetter },
          { kind: 'setFlag', flag: FlagIds.letterDelivered },
          { kind: 'relationship', character: CharacterIds.ilse, delta: 10 },
        ],
        outcomeText: 'She reads it standing in the doorway and forgets you are there.',
      },
    ],
  },
  {
    id: EventIds.barFirstRound,
    title: 'The usual',
    location: LocationIds.haldenBar,
    availableFrom: 0,
    availableUntil: 100000,
    text: 'Seven sets a glass down before you have said anything.',
    choices: [
      {
        id: 'talk-loan',
        label: 'Talk about the loan.',
        effects: [{ kind: 'relationship', character: CharacterIds.bartender, delta: 5 }],
        outcomeText:
          '"Everyone who sits there owes somebody," Seven says. "The ones who make it back keep the payments boring."',
      },
      {
        id: 'drink',
        label: 'Drink in silence (20 cr).',
        conditions: [{ kind: 'moneyAtLeast', amount: 20 }],
        effects: [{ kind: 'money', delta: -20 }],
        outcomeText: 'Seven polishes a glass that is already clean.',
      },
    ],
  },
] as const satisfies readonly EventDef[];
