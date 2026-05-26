export const PRICE_SHEET = 2;
export const PRICE_PAIR = 3;

export const STICKER_SETS = [
  {
    id: 'critters',
    name: 'Cuddly Critters',
    tagline: 'Tiny clay friends from forest & shore.',
    color: '#6ddc8a',
    image: '/images/set-critters.png',
    sheetA: {
      id: 'critters-a',
      name: 'Forest Friends',
      blurb: 'A snow leopard cub, sleepy red panda, singing robin, raccoon and a brave little skunk — plus sunflowers and roses.',
      highlights: ['Snow leopard cub', 'Red panda', 'Robin', 'Skunk', 'Pony', 'Roses'],
    },
    sheetB: {
      id: 'critters-b',
      name: 'Beach Buddies',
      blurb: 'Flamingo, axolotl, chickadee, penguin, sleepy puppy and a yarn-loving kitten by the sea.',
      highlights: ['Pink flamingo', 'Axolotl', 'Penguin', 'Sleeping puppy', 'Lion cub', 'Hydrangeas'],
    },
  },
  {
    id: 'treats',
    name: 'Snack Pack',
    tagline: 'Hungry critters, cookies & cupcakes galore.',
    color: '#ffb84e',
    image: '/images/set-treats.png',
    sheetA: {
      id: 'treats-a',
      name: 'Cookie Crew',
      blurb: 'Mouse in overalls, sprinkle-covered kitty, pie-loving moose and a donut-snatching pup.',
      highlights: ['Cookie mouse', 'Sprinkle kitty', 'Donut pup', 'Moose', 'Pie', 'Cupcakes'],
    },
    sheetB: {
      id: 'treats-b',
      name: 'Tea Party',
      blurb: 'Karate kitten, hiking dog, milkshake mouse and a crayon-riding rascal — all snack time chaos.',
      highlights: ['Karate kitty', 'Hiking dog', 'Milkshake mouse', 'Pig', 'Crayon mouse', 'Sprinkles'],
    },
  },
  {
    id: 'castle',
    name: 'Castle Quest',
    tagline: 'Heroes vs. villains — pick your side.',
    color: '#4ec3ff',
    image: '/images/set-castle.png',
    sheetA: {
      id: 'castle-a',
      name: 'Royal Heroes',
      blurb: 'Brave knights, a wise wizard, a king & queen, and a couple of clanky castle guards.',
      highlights: ['Knights', 'Wizard', 'King & Queen', 'Tank guards', 'Castle tower', 'Crown'],
    },
    sheetB: {
      id: 'castle-b',
      name: 'Wicked Crew',
      blurb: 'A sneaky sorcerer, an evil queen and a whole purple-and-black squad of troublemakers.',
      highlights: ['Evil sorcerer', 'Dark queen', 'Goblins', 'Black tanks', 'Castle', 'Crown'],
    },
  },
  {
    id: 'farm',
    name: 'Sheep vs. Aliens',
    tagline: "The most absurd farm war you'll ever stick.",
    color: '#ff4d8d',
    image: '/images/set-farm.png',
    sheetA: {
      id: 'farm-a',
      name: 'Pasture Patrol',
      blurb: 'Curious aliens, fluffy sheep, crop circles, a barn and a friendly tin robot guarding the field.',
      highlights: ['Fluffy sheep', 'Aliens', 'Crop circles', 'Crown', 'Tin robot', 'Barn'],
    },
    sheetB: {
      id: 'farm-b',
      name: 'Alien Invasion',
      blurb: 'Black sheep, UFOs, lightning aliens, deeper crop circles and a goofy pink mystery creature.',
      highlights: ['Black sheep', 'UFOs', 'Crystal alien', 'Lightning bug', 'Pink critter', 'Barn'],
    },
  },
  {
    id: 'space',
    name: 'Blast Off',
    tagline: 'From Apollo to today — explore the stars.',
    color: '#8b5cf6',
    image: '/images/set-space.png',
    sheetA: {
      id: 'space-a',
      name: 'Apollo Era',
      blurb: 'Astronauts, the shuttle, the lunar lander, the moon and a starry night sky to stick anywhere.',
      highlights: ['Astronauts', 'Space shuttle', 'Lunar lander', 'Moon', 'Hubble', 'Saturn rocket'],
    },
    sheetB: {
      id: 'space-b',
      name: 'Modern Missions',
      blurb: 'New rockets, a Mars rover, the sun, the red planet and a fresh space suit for the next mission.',
      highlights: ['Heavy rockets', 'Mars rover', 'Mars', 'The Sun', 'New space suit', 'Lander'],
    },
  },
];

export function getSet(id) {
  return STICKER_SETS.find(s => s.id === id) ?? null;
}
