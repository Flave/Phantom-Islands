import Tone, { Players, PanVol } from 'tone';

export default class SoundSource {
  constructor({ samples, id }) {
    this.samples = samples;
    this.id = id;
    this.masterPanVol = new PanVol(0, -10);
    this.effect = new Tone.Filter(600, 'highpass');

    // Dictionary to create players object
    this.samplesDict = {};
    samples.forEach(sample => {
      this.samplesDict[sample.id] = sample.url;
    });
  }

  load = cb => {
    this.players = new Players(this.samplesDict, (p, y) => {
      cb(null, this.id);
      const player = this.players.get(this.samples[0].id);
      player.loop = true;
      player.start();
    }).connect(this.masterPanVol);

    //this.effect.connect(this.masterPanVol);
  };

  connect(node) {
    this.masterPanVol.connect(node);
  }

  update = (volume, pan, filterVal) => {
    //this.effect.frequency.value = 10000 - filterVal.x * 10000;
    this.masterPanVol.volume.set('value', volume);
    this.masterPanVol.pan.value = pan;
  };
}
