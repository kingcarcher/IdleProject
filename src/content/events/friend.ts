import { CharacterIds, EventIds, FlagIds, LocationIds } from '../ids';
import type { EventDef } from '../types';

export const friendEvents = [
  {
    id: EventIds.friendFarewell,
    title: 'Two coffees',
    location: LocationIds.halden,
    character: CharacterIds.friend,
    availableFrom: 0,
    availableUntil: 90,
    text: 'Teo is at the dock an hour early with two coffees and a list of things he wants from Meridian, none of which exist. He keeps looking at the {ship}. "You are actually doing it," he says. "You absolute lunatic."',
    choices: [
      {
        id: 'come-with',
        label: 'Tell him to come with you next time.',
        effects: [
          { kind: 'relationship', character: CharacterIds.friend, delta: 8 },
          { kind: 'setFlag', flag: FlagIds.saidGoodbyeFriend },
        ],
        outcomeText:
          '"Next time," he says, and you both know that is a thing people say, and he grins anyway.',
      },
      {
        id: 'bring-back',
        label: 'Promise to bring something back.',
        effects: [
          { kind: 'relationship', character: CharacterIds.friend, delta: 6 },
          { kind: 'setFlag', flag: FlagIds.saidGoodbyeFriend },
        ],
        outcomeText:
          '"Something from the station. Anything. A bolt." He means it. He wants proof it is real.',
      },
    ],
  },
  {
    id: EventIds.friendGoneNote,
    title: 'The elevators',
    location: LocationIds.halden,
    character: CharacterIds.friend,
    availableFrom: 360,
    availableUntil: 100000,
    conditions: [{ kind: 'eventNotCompleted', event: EventIds.friendMeetMeridian }],
    text: 'Teo is not at the elevators. The foreman says he took a dock contract on Meridian months ago; he left a note for you at the bar, folded small, in the handwriting he only used for important things. "Got tired of watching ships. Going to go stand under some. Find me on the sunward ring. — T"',
    choices: [
      {
        id: 'keep-note',
        label: 'Keep the note.',
        effects: [{ kind: 'relationship', character: CharacterIds.friend, delta: 4 }],
        outcomeText:
          'You put it in the jacket pocket, with the other things you do not throw away.',
      },
    ],
  },
  {
    id: EventIds.friendMeetMeridian,
    title: 'The cargo floor',
    location: LocationIds.meridian,
    character: CharacterIds.friend,
    availableFrom: 360,
    availableUntil: 100000,
    text: 'A dock hand with Teo\'s walk turns around and it is Teo, heavier, with a beard and a Meridian union badge, shouting your name across the cargo floor like you are both twelve. "Years," he says. "You look like you left last week. That is horrible. That is genuinely horrible, {name}."',
    choices: [
      {
        id: 'drinks',
        label: 'Drinks, like old times (60 cr).',
        conditions: [{ kind: 'moneyAtLeast', amount: 60 }],
        effects: [
          { kind: 'money', delta: -60 },
          { kind: 'relationship', character: CharacterIds.friend, delta: 14 },
        ],
        outcomeText:
          'He knows a bar on the sunward ring. He talks about Halden as if it were a place he had read about. You do not correct him.',
      },
      {
        id: 'quick-hello',
        label: 'Just a quick hello; the ship is loading.',
        effects: [{ kind: 'relationship', character: CharacterIds.friend, delta: 4 }],
        outcomeText:
          '"Sure," he says. "Sure. The ship." He claps you on the shoulder and goes back to work. You watch him from the ramp.',
      },
    ],
  },
] as const satisfies readonly EventDef[];
