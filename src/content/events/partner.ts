import { CharacterIds, EventIds, FlagIds, LocationIds } from '../ids';
import type { EventDef } from '../types';

export const partnerEvents = [
  {
    id: EventIds.partnerFarewell,
    title: 'The freight dock',
    location: LocationIds.halden,
    character: CharacterIds.partner,
    availableFrom: 0,
    availableUntil: 90,
    text: 'Mara walks you to the freight dock because she said she would not, and then did. The {ship} is a dark shape behind the fence. She has your jacket over her arm and does not hand it over yet. "Four months," she says. "Out there. How long for you?" You tell her. She already knows; she did the arithmetic on the co-op terminal the way she does everything, twice.',
    choices: [
      {
        id: 'promise-write',
        label: 'Promise to write from the ship.',
        effects: [
          { kind: 'relationship', character: CharacterIds.partner, delta: 10 },
          { kind: 'setFlag', flag: FlagIds.saidGoodbyePartner },
        ],
        outcomeText:
          '"Every week," she says. "Ship weeks. I will take what I can get." She gives you the jacket.',
      },
      {
        id: 'for-both',
        label: 'Tell her it is for both of you.',
        effects: [
          { kind: 'relationship', character: CharacterIds.partner, delta: 5 },
          { kind: 'setFlag', flag: FlagIds.saidGoodbyePartner },
        ],
        outcomeText:
          '"I know what it is for," she says, not unkindly. "Go on. Go before I say the other thing."',
      },
      {
        id: 'no-scene',
        label: 'Do not make it a scene.',
        effects: [
          { kind: 'relationship', character: CharacterIds.partner, delta: -5 },
          { kind: 'setFlag', flag: FlagIds.saidGoodbyePartner },
        ],
        outcomeText:
          'She hands you the jacket and does not kiss you and walks back through the gate without looking around. You watch her all the way to the road.',
      },
    ],
  },
  {
    id: EventIds.partnerNoGoodbye,
    title: 'The gate',
    location: LocationIds.halden,
    character: CharacterIds.partner,
    availableFrom: 91,
    availableUntil: 100000,
    conditions: [
      { kind: 'flagNotSet', flag: FlagIds.saidGoodbyePartner },
      { kind: 'flagNotSet', flag: FlagIds.partnerLeft },
    ],
    text: 'Mara is at the gate when the {ship} docks. Somebody told her the manifest. She looks at you for a long time before she says anything. "You left," she says. "I went to the dock and the ship was gone. I stood there like an idiot."',
    choices: [
      {
        id: 'could-not',
        label: 'Tell her you could not have done it if you had seen her.',
        effects: [{ kind: 'relationship', character: CharacterIds.partner, delta: -10 }],
        outcomeText:
          '"That is a thing people say," she says. But she takes your arm on the way to the tram.',
      },
      {
        id: 'sorry',
        label: 'Say sorry and mean it.',
        effects: [{ kind: 'relationship', character: CharacterIds.partner, delta: -5 }],
        outcomeText:
          'She lets you say it. Then she says, "Do not do it again," and you both know you will be leaving in a week.',
      },
    ],
  },
  {
    id: EventIds.partnerReturnWarm,
    title: 'The apartment',
    location: LocationIds.halden,
    character: CharacterIds.partner,
    availableFrom: 91,
    availableUntil: 100000,
    conditions: [
      { kind: 'relationshipAtLeast', character: CharacterIds.partner, value: 45 },
      { kind: 'flagNotSet', flag: FlagIds.partnerLeft },
      { kind: 'eventNotCompleted', event: EventIds.partnerReturnDistant },
    ],
    text: 'Mara has cut her hair. She has a new coat, and the apartment has a plant in it that is doing well, and she talks for an hour about the co-op and the neighbours and a storm in the spring, and then stops, and says, "You look exactly the same. That is the strangest part."',
    choices: [
      {
        id: 'the-run',
        label: 'Tell her about the run.',
        effects: [{ kind: 'relationship', character: CharacterIds.partner, delta: 8 }],
        outcomeText:
          'She listens the way she always did, asking the practical questions. Later she takes out the folder of listings and you look at them together, like a ritual.',
      },
      {
        id: 'the-storm',
        label: 'Ask about the storm.',
        effects: [{ kind: 'relationship', character: CharacterIds.partner, delta: 12 }],
        outcomeText:
          'It took the roof off the elevator shed. Teo was on the crew that fixed it. She is pleased you asked; she talks about it until the lights dim.',
      },
      {
        id: 'the-money',
        label: 'Show her the money.',
        effects: [{ kind: 'relationship', character: CharacterIds.partner, delta: 3 }],
        outcomeText:
          'She looks at the number, and then at you, and says, "That is good," and puts the kettle on.',
      },
    ],
  },
  {
    id: EventIds.partnerReturnDistant,
    title: 'The café',
    location: LocationIds.halden,
    character: CharacterIds.partner,
    availableFrom: 91,
    availableUntil: 100000,
    conditions: [
      { kind: 'relationshipAtMost', character: CharacterIds.partner, value: 44 },
      { kind: 'flagNotSet', flag: FlagIds.partnerLeft },
      { kind: 'eventNotCompleted', event: EventIds.partnerReturnWarm },
    ],
    text: 'Mara meets you at a café instead of the apartment. She is polite. She asks about the ship. There is a long minute where neither of you knows whose turn it is to talk.',
    choices: [
      {
        id: 'what-changed',
        label: 'Ask her what has changed.',
        effects: [{ kind: 'relationship', character: CharacterIds.partner, delta: 6 }],
        outcomeText:
          '"Nothing," she says. "That is the thing. Nothing changed here. Everything changed for you." She stirs a cup that is already cold.',
      },
      {
        id: 'someone-else',
        label: 'Ask if she has met someone.',
        effects: [{ kind: 'relationship', character: CharacterIds.partner, delta: -8 }],
        outcomeText:
          'She looks at you as if you had said something in another language. "No, {name}. I have been here."',
      },
      {
        id: 'the-loan',
        label: 'Talk about the loan instead.',
        effects: [{ kind: 'relationship', character: CharacterIds.partner, delta: -4 }],
        outcomeText: 'She knows the numbers. She always knew the numbers. She pays for the coffee.',
      },
    ],
  },
  {
    id: EventIds.partnerPlans,
    title: 'The folder',
    location: LocationIds.halden,
    character: CharacterIds.partner,
    availableFrom: 360,
    availableUntil: 100000,
    conditions: [
      { kind: 'eventCompleted', event: EventIds.partnerReturnWarm },
      { kind: 'relationshipAtLeast', character: CharacterIds.partner, value: 55 },
      { kind: 'flagNotSet', flag: FlagIds.partnerLeft },
    ],
    text: 'The folder of listings has a new section. Meridian, mostly: two-room units on the sunward ring, with a window. Mara has circled one. "It is stupid," she says. "It is a thousand a month and we would both need work there. I just wanted to show you."',
    choices: [
      {
        id: 'week-away',
        label: 'Take her to Meridian for a week (1,500 cr).',
        conditions: [{ kind: 'moneyAtLeast', amount: 1500 }],
        effects: [
          { kind: 'money', delta: -1500 },
          { kind: 'relationship', character: CharacterIds.partner, delta: 15 },
        ],
        outcomeText:
          'You spend it looking at a two-room unit with a window, eating bad station food, and not talking about the loan once. It is the best week you have had in years and it costs two and a half months of payments.',
      },
      {
        id: 'three-years',
        label: 'Tell her: three more years.',
        effects: [{ kind: 'relationship', character: CharacterIds.partner, delta: 6 }],
        outcomeText:
          'She nods and closes the folder and does not look sad, exactly. "Three," she says. "I am writing it down."',
      },
      {
        id: 'not-realistic',
        label: 'Tell her it is not realistic yet.',
        effects: [{ kind: 'relationship', character: CharacterIds.partner, delta: -6 }],
        outcomeText:
          '"I know," she says, too quickly, and puts the folder back in the drawer where it lives.',
      },
    ],
  },
  {
    id: EventIds.partnerGoneDrift,
    title: 'A different name on the door',
    location: LocationIds.halden,
    character: CharacterIds.partner,
    availableFrom: 180,
    availableUntil: 100000,
    conditions: [
      { kind: 'flagNotSet', flag: FlagIds.partnerLeft },
      {
        kind: 'anyOf',
        conditions: [
          { kind: 'relationshipAtMost', character: CharacterIds.partner, value: 25 },
          { kind: 'daysSinceContactAtLeast', character: CharacterIds.partner, days: 540 },
        ],
      },
    ],
    text: 'The apartment door has a different name on it. The neighbour, who knows you, says Mara moved to the north blocks in the winter, and then took a co-op transfer off-world, and then stops talking, because your face is doing something. There is a box for you at the co-op office. Your things. A note, two lines, in her practical handwriting. It does not say where.',
    choices: [
      {
        id: 'take-box',
        label: 'Take the box.',
        effects: [
          { kind: 'relocate', character: CharacterIds.partner, to: null },
          { kind: 'setFlag', flag: FlagIds.partnerLeft },
        ],
        outcomeText: 'You carry it back to the {ship}. It is not heavy. That is the worst part.',
      },
    ],
  },
  {
    id: EventIds.partnerGoneStrayed,
    title: 'She knows',
    location: LocationIds.halden,
    character: CharacterIds.partner,
    availableFrom: 180,
    availableUntil: 100000,
    conditions: [
      { kind: 'flagNotSet', flag: FlagIds.partnerLeft },
      { kind: 'flagSet', flag: FlagIds.strayed },
      { kind: 'relationshipAtMost', character: CharacterIds.partner, value: 50 },
    ],
    text: 'Mara knows. You do not know how; stations talk, freighters talk, somebody\'s cousin works a dock. She has packed already. She is calm, which is worse than anything. "I would have waited," she says. "I was waiting. That was the whole thing I was doing."',
    choices: [
      {
        id: 'say-nothing',
        label: 'Say nothing.',
        effects: [
          { kind: 'relocate', character: CharacterIds.partner, to: null },
          { kind: 'setFlag', flag: FlagIds.partnerLeft },
        ],
        outcomeText:
          'She leaves the key on the table. Later you find she left the folder of listings too.',
      },
      {
        id: 'explain',
        label: 'Try to explain.',
        effects: [
          { kind: 'relationship', character: CharacterIds.partner, delta: -10 },
          { kind: 'relocate', character: CharacterIds.partner, to: null },
          { kind: 'setFlag', flag: FlagIds.partnerLeft },
        ],
        outcomeText:
          'She listens to all of it. Then she says, "Okay," and picks up the bag, and that is the end of the explaining.',
      },
    ],
  },
] as const satisfies readonly EventDef[];
