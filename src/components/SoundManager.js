import SoundSource from 'app/components/SoundSource';
import OceanSound from 'app/components/OceanSound';
import { autorun } from 'mobx';
import uiState from 'app/uiState';
import { queue as d3_queue } from 'd3-queue';
import { Volume, Analyser } from 'tone';
import _find from 'lodash/find';

import islands from 'app/data/islands';
import oceans from 'app/data/oceans';

export default class SoundManager {
  constructor(map) {
    this.fftAnalyser = new Analyser('waveform', 32);
    this.fftAnalyser.toMaster();
    this.masterVol = new Volume(6);
    this.masterVol.connect(this.fftAnalyser);

    this.initWaterSounds();
    this.initIslandSounds();
    autorun(this.update);
  }

  initWaterSounds = () => {
    this.oceanSounds = oceans.map(ocean => {
      const oceanSound = new OceanSound(ocean);

      oceanSound.load(() => {
        uiState.removePendingRequest('ocean');
        oceanSound.start();
      });

      uiState.addPendingRequest('ocean');
      oceanSound.connect(this.masterVol);
      return oceanSound;
    });
  };

  initIslandSounds = () => {
    this.islandSounds = islands.map(island => {
      const islandSound = new SoundSource(island);

      islandSound.load(() => {
        uiState.removePendingRequest(island.id);
        // Make sure buddy islands start at the same time
        if (island.buddy) {
          const buddyIsland = _find(this.islandSounds, { id: island.buddy });
          if (buddyIsland.loaded) {
            islandSound.start();
            buddyIsland.start();
          }
        } else {
          islandSound.start();
        }
      });

      uiState.addPendingRequest(island.id);
      islandSound.connect(this.masterVol);
      return islandSound;
    });
  };

  update = () => {
    const { islands, muted, envParams, readyToPlay } = uiState;

    this.masterVol.mute = !readyToPlay || muted;

    this.islandSounds.forEach(source => {
      const { pan, loaded, volume, volNormal } = _find(islands, {
        id: source.id,
      });
      source.update(volume, pan, volNormal);
    });

    this.oceanSounds.forEach(source => {
      const { volume } = _find(envParams.oceanValues, { id: source.id });
      source.update(volume, envParams.latNormal);
    });
  };

  getFFT = () => {
    return this.fftAnalyser.getValue();
  };
}
