import { CharacterIds, EventIds, FlagIds, LocationIds } from '../ids';
import type { EventDef } from '../types';

export const motherEvents = [
  {
    id: EventIds.motherFarewell,
    title: 'The kitchen',
    location: LocationIds.halden,
    character: CharacterIds.mother,
    availableFrom: 0,
    availableUntil: 90,
    text: 'Your mother does not come to the dock. She says goodbye in the kitchen, the way she said goodbye to your father, with the radio on so it is not too quiet. There is a bag of food on the table that you will not be able to keep fresh and will take anyway.',
    choices: [
      {
        id: 'promise-money',
        label: 'Promise you will send money for the house.',
        effects: [
          { kind: 'relationship', character: CharacterIds.mother, delta: 6 },
          { kind: 'setFlag', flag: FlagIds.saidGoodbyeMother },
        ],
        outcomeText:
          '"Send yourself," she says. "The house has waited twenty years. It can wait for you." She means it, and she also means the money.',
      },
      {
        id: 'not-worry',
        label: 'Tell her not to worry.',
        effects: [
          { kind: 'relationship', character: CharacterIds.mother, delta: 8 },
          { kind: 'setFlag', flag: FlagIds.saidGoodbyeMother },
        ],
        outcomeText:
          '"I am your mother," she says. "It is not a thing I do or do not do." She holds your face for a second, the way she did when you were small.',
      },
      {
        id: 'look-in',
        label: 'Ask her to look in on Mara.',
        effects: [
          { kind: 'relationship', character: CharacterIds.mother, delta: 5 },
          { kind: 'relationship', character: CharacterIds.partner, delta: 3 },
          { kind: 'setFlag', flag: FlagIds.saidGoodbyeMother },
        ],
        outcomeText: '"I already do," she says. "Who do you think she has dinner with on Sundays?"',
      },
    ],
  },
  {
    id: EventIds.motherMoney1,
    title: 'The statement',
    location: LocationIds.halden,
    character: CharacterIds.mother,
    availableFrom: 91,
    availableUntil: 100000,
    conditions: [
      { kind: 'moneyAtLeast', amount: 2000 },
      { kind: 'flagNotSet', flag: FlagIds.mortgagePaid },
    ],
    text: 'The mortgage statement is on the kitchen table, where she leaves everything she does not want to talk about. Eleven years left. She has been paying it since before you could read the numbers.',
    choices: [
      {
        id: 'send',
        label: 'Send 2,000 cr against the house.',
        effects: [
          { kind: 'money', delta: -2000 },
          { kind: 'relationship', character: CharacterIds.mother, delta: 12 },
        ],
        outcomeText:
          'She argues for a while, out of habit, and then does not. That night she sleeps through, which she has not done in years.',
      },
    ],
  },
  {
    id: EventIds.motherMoney2,
    title: 'The statement, again',
    location: LocationIds.halden,
    character: CharacterIds.mother,
    availableFrom: 91,
    availableUntil: 100000,
    conditions: [
      { kind: 'eventCompleted', event: EventIds.motherMoney1 },
      { kind: 'daysSinceContactAtLeast', character: CharacterIds.mother, days: 30 },
      { kind: 'moneyAtLeast', amount: 2000 },
      { kind: 'flagNotSet', flag: FlagIds.mortgagePaid },
    ],
    text: 'The statement is on the table again. Fewer years on it now. She pretends not to notice you looking.',
    choices: [
      {
        id: 'send',
        label: 'Send another 2,000 cr.',
        effects: [
          { kind: 'money', delta: -2000 },
          { kind: 'relationship', character: CharacterIds.mother, delta: 10 },
        ],
        outcomeText:
          '"You will need that," she says, and puts the statement in the drawer, which is where the things she has decided to accept go.',
      },
    ],
  },
  {
    id: EventIds.motherMoney3,
    title: 'The last statement',
    location: LocationIds.halden,
    character: CharacterIds.mother,
    availableFrom: 91,
    availableUntil: 100000,
    conditions: [
      { kind: 'eventCompleted', event: EventIds.motherMoney2 },
      { kind: 'daysSinceContactAtLeast', character: CharacterIds.mother, days: 30 },
      { kind: 'moneyAtLeast', amount: 2000 },
      { kind: 'flagNotSet', flag: FlagIds.mortgagePaid },
    ],
    text: 'The last statement. The number on it is smaller than a single run pays now. She has kept every one of them, in order, in a folder older than you.',
    choices: [
      {
        id: 'pay-off',
        label: 'Pay it off.',
        effects: [
          { kind: 'money', delta: -2000 },
          { kind: 'relationship', character: CharacterIds.mother, delta: 15 },
          { kind: 'setFlag', flag: FlagIds.mortgagePaid },
        ],
        outcomeText:
          'She does not say anything for a long time. Then she says she is going to sit outside for a minute, and does, and you leave her to it.',
      },
    ],
  },
  {
    id: EventIds.motherMortgageDone,
    title: 'A quiet house',
    location: LocationIds.halden,
    character: CharacterIds.mother,
    availableFrom: 91,
    availableUntil: 100000,
    conditions: [
      { kind: 'flagSet', flag: FlagIds.mortgagePaid },
      { kind: 'daysSinceContactAtLeast', character: CharacterIds.mother, days: 30 },
    ],
    text: 'The house is quiet in a new way. She has painted the kitchen. The folder of statements is gone from the drawer, and in its place there is a photograph of you at the dock that you did not know anyone had taken.',
    choices: [
      {
        id: 'sit',
        label: 'Sit with her.',
        effects: [{ kind: 'relationship', character: CharacterIds.mother, delta: 10 }],
        outcomeText: 'You talk about nothing. It is the best conversation you have had in years.',
      },
    ],
  },
] as const satisfies readonly EventDef[];
