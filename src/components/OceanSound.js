import Tone, { Player, PanVol } from 'tone';

export default class OceanSound {
  constructor({ sample, id }) {
    this.sample = sample;
    this.id = id;
    this.masterPanVol = new PanVol(0, -10);
    this.effect = new Tone.Filter(600, 'highpass');
  }

  load = cb => {
    this.player = new Player('./assets/waves_1.mp3', (p, y) => {
      cb(null, this.id);
    }).connect(this.masterPanVol);
    this.player.loop = true;
    //this.player.reverse = true;
    //this.effect.connect(this.masterPanVol);
  };

  connect(node) {
    this.masterPanVol.connect(node);
  }

  start() {
    this.player.start();
  }

  update = (volume, latNormal) => {
    this.player.playbackRate = 1 + latNormal * 2;
    this.masterPanVol.volume.set('value', volume);
  };
}
