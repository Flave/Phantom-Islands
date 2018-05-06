import islands from 'app/data/islands';
import SoundSource from 'app/components/SoundSource';
import { autorun } from 'mobx';
import uiState from 'app/uiState';
import { queue as d3_queue } from 'd3-queue';
import { Volume, Analyser } from 'tone';
import _find from 'lodash/find';

export default class SoundManager {
  constructor(map) {
    const queue = d3_queue();
    this.fftAnalyser = new Analyser('waveform', 32);
    this.masterVol = new Volume(6);
    this.islandSounds = islands.map(island => {
      const islandSound = new SoundSource(island);
      queue.defer(islandSound.load);
      islandSound.connect(this.masterVol);
      return islandSound;
    });
    //this.waterAmbience = new SoundSource({});
    this.masterVol.connect(this.fftAnalyser);
    this.fftAnalyser.toMaster();

    queue.awaitAll((err, responses) => {
      //console.log(err, responses);
    });

    autorun(this.update);
  }

  update = () => {
    const { islands, muted } = uiState;
    this.masterVol.mute = muted;
    this.islandSounds.forEach(source => {
      const { pan, volume } = _find(islands, { id: source.id });
      source.update(volume, pan, uiState.relativeMousePos);
    });
  };

  getFFT = () => {
    return this.fftAnalyser.getValue();
  };
}
