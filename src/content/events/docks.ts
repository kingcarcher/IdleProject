import { CharacterIds, EventIds, FlagIds, LocationIds } from '../ids';
import type { EventDef } from '../types';

export const dockEvents = [
  {
    id: EventIds.meridianLetter,
    title: 'A letter for Halden',
    location: LocationIds.meridian,
    character: CharacterIds.ilse,
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
    id: EventIds.ilseInvitation,
    title: 'The same airlock',
    location: LocationIds.meridian,
    character: CharacterIds.ilse,
    availableFrom: 200,
    availableUntil: 100000,
    conditions: [
      { kind: 'eventCompleted', event: EventIds.meridianLetter },
      { kind: 'relationshipAtLeast', character: CharacterIds.ilse, value: 30 },
    ],
    text: 'Ilse finds you at the same airlock, years older than the first time. Her shift is over. She asks if you have anywhere to be tonight, in a voice that already knows the answer.',
    choices: [
      {
        id: 'stay',
        label: 'Stay.',
        effects: [
          { kind: 'setFlag', flag: FlagIds.strayed },
          { kind: 'relationship', character: CharacterIds.ilse, delta: 20 },
        ],
        outcomeText: "The station's night cycle is only eight hours. It feels shorter.",
      },
      {
        id: 'tell-her',
        label: 'Tell her about Mara.',
        effects: [{ kind: 'relationship', character: CharacterIds.ilse, delta: 5 }],
        outcomeText: 'She nods like she expected that too, and walks you back to the dock anyway.',
      },
    ],
  },
  {
    id: EventIds.barFirstRound,
    title: 'The usual',
    location: LocationIds.haldenBar,
    character: CharacterIds.bartender,
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
  {
    id: EventIds.barReflection,
    title: 'Who is waiting',
    location: LocationIds.haldenBar,
    character: CharacterIds.bartender,
    availableFrom: 180,
    availableUntil: 100000,
    text: 'Seven pours without asking and then, unusually, asks something. "Who is still waiting for you, {name}?"',
    choices: [
      {
        id: 'mara',
        label: 'Mara.',
        effects: [{ kind: 'relationship', character: CharacterIds.bartender, delta: 5 }],
        outcomeText:
          '"Then go and be waited for," Seven says. "The bar will be here. It is always here. That is the problem with it."',
      },
      {
        id: 'mother',
        label: 'My mother.',
        effects: [{ kind: 'relationship', character: CharacterIds.bartender, delta: 5 }],
        outcomeText:
          '"Mothers count the ships," Seven says. "I have watched them do it from that window for forty years."',
      },
      {
        id: 'nobody',
        label: 'Nobody, probably.',
        effects: [{ kind: 'relationship', character: CharacterIds.bartender, delta: 3 }],
        outcomeText: 'Seven does not contradict you. It refills the glass.',
      },
    ],
  },
] as const satisfies readonly EventDef[];
