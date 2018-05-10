import islands from 'app/data/islands';
import SoundSource from 'app/components/SoundSource';
import OceanSound from 'app/components/OceanSound';
import { autorun } from 'mobx';
import uiState from 'app/uiState';
import { queue as d3_queue } from 'd3-queue';
import { Volume, Analyser } from 'tone';
import _find from 'lodash/find';

import water_sound from 'app/assets/samples/waves_1.mp3';

export default class SoundManager {
  constructor(map) {
    const queue = d3_queue();
    this.fftAnalyser = new Analyser('waveform', 32);
    this.masterVol = new Volume(6);
    this.islandSounds = islands.map(island => {
      const islandSound = new SoundSource(island);
      islandSound.load(() => {
        uiState.removePendingRequest(island.id);
        islandSound.start();
      });

      uiState.addPendingRequest(island.id);
      islandSound.connect(this.masterVol);
      return islandSound;
    });

    this.waterSound = new OceanSound({
      id: 'water_sound',
      sample: water_sound,
    });
    this.waterSound.connect(this.masterVol);

    this.waterSound.load(() => {
      this.waterSound.start();
    });

    this.masterVol.connect(this.fftAnalyser);
    this.fftAnalyser.toMaster();
    autorun(this.update);
  }

  update = () => {
    const { islands, muted, envParams, relativeMousePos } = uiState;
    this.masterVol.mute = muted;
    this.islandSounds.forEach(source => {
      const { pan, volume, volNormal } = _find(islands, { id: source.id });
      source.update(volume, pan, volNormal);
    });
    this.waterSound.update(envParams.volume, 0, relativeMousePos);
  };

  getFFT = () => {
    return this.fftAnalyser.getValue();
  };
}
