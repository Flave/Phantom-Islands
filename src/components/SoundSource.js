import Tone, { Players, PanVol } from 'tone';
import _every from 'lodash/every';

export default class SoundSource {
  constructor({ samples, test_samples, id }) {
    this.samples = samples;
    this.id = id;
    this.masterPanVol = new PanVol(0, -10);
    // this.filter = new Tone.Filter(600, 'bandpass');
    // this.lfo = new Tone.LFO(0.25, 100, 2000);

    // this.lfo.connect(this.filter.frequency);
    // this.lfo.start();

    // Dictionary to create players object
    this.samplesDict = {};
    samples.forEach(sample => {
      this.samplesDict[sample.id] = `./src/assets/samples/${sample.id}.mp3`;
    });
  }

  load = cb => {
    this.players = new Players(this.samplesDict, (p, y) => {
      cb(null, this.id);
      this.samples.forEach(sample => {
        const player = this.players.get(sample.id);
        player.loop = true;
      });
    }).connect(this.masterPanVol);
    //this.filter.connect(this.masterPanVol);
  };

  connect(node) {
    this.masterPanVol.connect(node);
  }

  start() {
    this.samples.forEach(sample => {
      const player = this.players.get(sample.id);
      if (player.state !== 'started' && player.loaded) {
        player.start();
      }
    });
  }

  get loaded() {
    return _every(this.samples, sample => this.players.get(sample.id).loaded);
  }

  update = (volume, pan, filterVal) => {
    //this.filter.frequency.value = 10000 - filterVal.x * 10000;
    this.masterPanVol.volume.set('value', volume);
    this.masterPanVol.pan.value = pan;
  };
}
