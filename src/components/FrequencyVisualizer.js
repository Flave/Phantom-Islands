import { select as d3_select } from 'd3-selection';
import { timer as d3_timer } from 'd3-timer';
import uiState from 'app/uiState';

const WIDTH = 70;
const HEIGHT = 40;

export default function FrequencyVisualizer(soundManager) {
  let parent;
  let visualizer;
  let visualizerEnter;
  let visualizerUpdate;
  let ctx;

  function _visualizer() {
    parent = d3_select('#header');
    visualizerUpdate = parent.selectAll('.header__visualizer').data([1]);
    visualizerEnter = visualizerUpdate
      .enter()
      .append('canvas')
      .attr('class', 'header__item header__visualizer')
      .style('width', WIDTH)
      .style('height', HEIGHT)
      .attr('width', WIDTH)
      .attr('height', HEIGHT);

    visualizer = visualizerUpdate.merge(visualizerEnter);

    ctx = visualizer.node().getContext('2d');
    visualizerUpdate.exit().remove();
    ctx.fillStyle = '#ff0000';
    d3_timer(update, 1000);
  }

  function update() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgb(0, 0, 0)';
    ctx.beginPath();
    const data = soundManager.getFFT();
    for (let i = 0; i < 32; i++) {
      const x = WIDTH / 32 * i;
      const y = data[i] * HEIGHT * 0.75 + HEIGHT / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  return _visualizer;
}
