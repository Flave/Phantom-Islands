import lonely_waters from 'app/assets/samples/lonely_waters.mp3';
import synthetic_bird_song from 'app/assets/samples/synthetic_bird_song.mp3';
import water_particles from 'app/assets/samples/water_particles.mp3';

export default [
  {
    id: 'island_1',
    name: 'Island 1',
    location: { lat: 10, lng: 160 },
    samples: [{ id: 'lonely_waters', url: lonely_waters }],
  },
  {
    id: 'island_2',
    name: 'Island 2',
    location: { lat: 3, lng: 179 },
    samples: [{ id: 'synthetic_bird_song', url: synthetic_bird_song }],
  },
  {
    id: 'island_3',
    name: 'Island 3',
    location: { lat: -20, lng: 10 },
    samples: [{ id: 'water_particles', url: water_particles }],
  },
  {
    id: 'island_4',
    name: 'Island 4',
    location: { lat: 13, lng: -60 },
    samples: [{ id: 'lonely_waters', url: lonely_waters }],
  },
  {
    id: 'island_5',
    name: 'Island 5',
    location: { lat: -16, lng: -14 },
    samples: [{ id: 'synthetic_bird_song', url: synthetic_bird_song }],
  },
  {
    id: 'island_6',
    name: 'Island 6',
    location: { lat: 1, lng: 1 },
    samples: [{ id: 'water_particles', url: water_particles }],
  },
];
