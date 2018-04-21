import AudioSampleLoader from 'app/utils/AudioSampleLoader';

function loadAudio(ctx, samples, cb) {
  const audioLoader = new AudioSampleLoader();
  audioLoader.src = samples.map(instrument => instrument.sample);
  audioLoader.ctx = ctx;

  audioLoader.onload = function() {
    cb(
      null,
      audioLoader.response.map((buffer, i) => ({
        buffer,
        id: samples[i].id,
      })),
    );
  };

  audioLoader.onerror = function(err) {
    cb(err);
  };

  audioLoader.send();
}

export default loadAudio;
