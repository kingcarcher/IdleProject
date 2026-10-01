import type { IntroPage } from './types';

/** Used when the player signs without typing a name. */
export const DEFAULT_NAME = 'Ash';
export const MAX_NAME_LENGTH = 24;

/** Text may use `{name}` and `{ship}`; the last page is the loan office where the name is chosen. */
export const introPages = [
  {
    title: 'Halden, 2201',
    paragraphs: [
      'Halden was the third world anyone settled and the first one anyone regretted. Grey soil, long winters, a co-op that owns the combines and most of the people who drive them. The ships that leave here are full. The ships that come back are not.',
      'The economy has been slow your whole life. Work exists, at the elevators and in the fields, and it pays enough to stay. A place of your own, a room with a window somewhere the sky is not the colour of the road: that is a different amount of money, the kind nobody on Halden has.',
      'There is exactly one way off-planet for someone with your bank balance, and it is the freight lanes.',
    ],
  },
  {
    title: 'You',
    paragraphs: [
      'You grew up on a farm block on the outskirts with your mother, Ruth, and a mortgage older than you are. She has paid on it every month for twenty-two years. Lately you have been paying too, and the number still does not move the way it should.',
      'There is Mara, who fixes irrigation controllers for the co-op and keeps a folder of apartment listings from stations neither of you has seen. You want to give her one of them. You have said so, out loud, which was probably a mistake.',
      'There is Teo, who has been your friend since the school bus and who talks about leaving the way other people talk about weather.',
      'And there is you: bored in a way that has started to feel like a medical condition, and about to do something about it.',
    ],
  },
  {
    title: 'How this works',
    paragraphs: [
      'Freighters cross the lanes at a fraction below light. For you, a run takes weeks of ship time. For everyone at home it takes months, and as the drives get better the gap gets wider, not smaller.',
      'You will take contracts from the freight board, deliver them, and get paid on arrival. The bank drafts its payment on the first of every month you are gone. Miss three and they take the ship.',
      'People will be waiting for you, or they will not. Letters from the ship help. Coming home helps more. Some things only happen at certain places at certain times, and if you are not there, they happen without you.',
      'The bar on Halden is where you go to think. The map fills in as the years pass. Everything is saved automatically, and the ship pauses whenever you close this page.',
    ],
  },
  {
    title: 'The loan office',
    paragraphs: [
      'The loan officer is younger than you and does not look up. The ship is called the {ship}; it is thirty years old and has been repossessed twice before, which is why you can afford it, in the sense that you cannot.',
      'The terms are on the tablet. Below them there is a line for your name.',
    ],
  },
] as const satisfies readonly IntroPage[];

export const howToPlay = [
  'Take a contract from the Freight board. The ship leaves at once, and the outside world moves while you travel.',
  "While underway, spend the ship's time: maintenance shortens the run, letters keep people close, study raises delivery pay, and the journal fills in who you were.",
  'Loan payments are drafted automatically on the first of each in-game month. Three missed payments and the bank takes the ship.',
  'Pay extra against the loan at the Bank on any station to shrink the interest.',
  'Scenes with people expire. If you are not there, they happen without you.',
  'Relationships fade while you are away. Writing or visiting resets the clock.',
  'The bar on Halden is a place to reflect; Seven remembers.',
  'The map fills in as colonies are founded. Hover or tap a speck to see its catalogue name.',
  'Travel only advances while this tab is open and visible. The game saves itself.',
] as const satisfies readonly string[];

export const loanSignedLog =
  '{name} signs for the {ship}. It is yours, on paper. The bank owns the paper, and the first payment is due in a month.';

/** First-person pages revealed one at a time by the journal activity. */
export const journalPages = [
  'The cabin is smaller than my room at the farm and I have never been happier to close a door. The drive is loud. I am told I will stop hearing it. I am writing this down so that I remember how loud it was.',
  'Mom kept a folder of every mortgage statement since before I was born. I found it once, looking for scissors. She had written the running total on the front in pencil, then erased it and written it again, smaller, every year. I think about that folder more than I think about the house.',
  'Mara does arithmetic on everything. Journeys, rent, how many Sundays there are in eleven years. When I told her about the ship she did the sums on the co-op terminal, twice, and then said yes. She did not say yes to the ship. I know what she said yes to.',
  'Teo and I used to climb the grain elevator at night to watch the freighters lift. He named them. Bad names, on purpose. He is the only person who has ever made Halden feel like a place worth staying in, and I still could not.',
  'Nobody tells you that the dilation is the point. The bank knows. Every month I am gone is a month of interest and a month of everyone at home getting older, and I am supposed to feel that as a cost, and mostly I feel it as quiet.',
  'I keep a list of what I will do when the loan is paid. It gets shorter every trip. Not because I do the things. Because I stop believing the earlier versions of me who wrote them down.',
] as const satisfies readonly string[];
