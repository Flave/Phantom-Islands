import Tone, { Players, PanVol } from 'tone';
import _every from 'lodash/every';

export default class SoundSource {
  constructor({ samples, id, distanceFilter }) {
    this.samples = samples;
    this.id = id;
    this.masterPanVol = new PanVol(0, -10);
    if (distanceFilter) {
      this.distanceFilter = this.createFilter(distanceFilter);
      this.distanceFilter.connect(this.masterPanVol);
    }
    // this.filter = new Tone.Filter(600, 'bandpass');
    // this.lfo = new Tone.LFO(0.25, 100, 2000);

    // this.lfo.connect(this.filter.frequency);
    // this.lfo.start();

    // Dictionary to create players object
    this.samplesDict = {};
    samples.forEach(sample => {
      this.samplesDict[sample.id] = `./assets/${sample.id}.mp3`;
    });
  }

  load = cb => {
    this.players = new Players(this.samplesDict, (p, y) => {
      cb(null, this.id);
      this.eachPlayer((player, sample) => {
        player.loop = true;
        player.playbackRate = sample.playbackRate || 1;
        player.reverse = !!sample.reverse;

        if (sample.filter) {
          const filterNode = this.createFilter(sample.filter);
          player.connect(filterNode);
          filterNode.connect(this.distanceFilter || this.masterPanVol);
        } else {
          player.connect(this.distanceFilter || this.masterPanVol);
        }

        // if (sample.volumeLfo) {
        //   const { rate, type, min, max } = sample.volumeLfo;
        //   const lfo = new Tone.LFO(rate, min, max);
        //   lfo.type = type;
        //   lfo.connect(player.volume);
        // }
      });
    });
  };

  connect(node) {
    this.masterPanVol.connect(node);
  }

  createFilter({ frequency: frequencySpec, type, Q, gain }) {
    const frequency = typeof frequencySpec === 'number' ? frequencySpec : 100;
    const filter = new Tone.Filter(frequency, type);
    filter.Q.value = Q !== undefined ? Q : 0;
    filter.gain.value = gain !== undefined ? gain : 0;

    if (typeof frequencySpec === 'object') {
      const { rate, type, min, max } = frequencySpec;
      const lfo = new Tone.LFO(rate, min, max);
      lfo.type = type;
      lfo.connect(filter.frequency);
      lfo.start();
    }
    return filter;
  }

  start() {
    this.eachPlayer((player, sample) => {
      if (player.state !== 'started' && player.loaded) {
        player.start();
      }
    });
  }

  get loaded() {
    return _every(this.samples, sample => this.players.get(sample.id).loaded);
  }

  eachPlayer(fn) {
    this.samples.forEach(sample => {
      const player = this.players.get(sample.id);
      fn(player, sample);
    });
  }

  update = (volume, pan, filterVal) => {
    //this.filter.frequency.value = 10000 - filterVal.x * 10000;
    this.masterPanVol.volume.set('value', volume);
    this.masterPanVol.pan.value = pan;
    this.eachPlayer((player, sample) => {
      const offset = sample.volumeOffset ? sample.volumeOffset : 0;
      player.volume.set('value', offset);
    });
  };
}
