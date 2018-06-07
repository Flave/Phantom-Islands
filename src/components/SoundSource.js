import Tone, { Players, PanVol } from 'tone';
import _every from 'lodash.every';
import { scaleLinear as d3ScaleLinear } from 'd3-scale';

export default class SoundSource {
  constructor({ samples, id, distanceFilter }) {
    this.samples = samples;
    this.id = id;
    this.masterPanVol = new PanVol(0, -10);
    if (distanceFilter) {
      this.distanceFilter = this.createFilter({
        ...distanceFilter,
        type: 'highpass',
      });
      this.distanceFilter.connect(this.masterPanVol);
      const min = distanceFilter.min !== undefined ? distanceFilter.min : 30;
      const max = distanceFilter.max !== undefined ? distanceFilter.max : 1500;
      this.distanceFilterScale = d3ScaleLinear()
        .domain([1, 0])
        .range([min, max]);
    }

    const lfo = new Tone.LFO(1, 100, 500);

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
      });
    });
  };

  connect(node) {
    this.masterPanVol.connect(node);
  }

  createFilter({ frequency: frequencySpec, type, Q, gain }) {
    const frequency = typeof frequencySpec === 'number' ? frequencySpec : 100;
    const filter = new Tone.Filter(frequency, type);
    filter.Q.value = Q !== undefined ? Q : 1;
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

  stop() {
    this.eachPlayer((player, sample) => {
      if (player.state === 'started') {
        player.stop();
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

  update = (volume, pan, normalDistance, play) => {
    if (play) this.start();
    else this.stop();

    if (this.distanceFilter) {
      this.distanceFilter.frequency.value = this.distanceFilterScale(
        normalDistance,
      );
    }
    this.masterPanVol.volume.set('value', volume);
    this.masterPanVol.pan.value = pan;
    this.eachPlayer((player, sample) => {
      const offset = sample.volumeOffset ? sample.volumeOffset : 0;
      player.volume.set('value', offset);
    });
  };
}
