import { autorun } from 'mobx';
import { select as d3_select } from 'd3';
import _template from 'lodash/template';
import template from 'app/templates/intro.hbs';
import uiState from 'app/uiState';

const compiledTemplate = _template(template);

export default function Intro() {
  let parent;
  let intro;
  let introEnter;
  let introUpdate;
  let cancelAutorun;

  function _intro() {
    const { showIntro } = uiState;
    parent = d3_select('#app');

    introUpdate = parent.selectAll('.intro').data(showIntro ? [1] : []);

    introEnter = introUpdate
      .enter()
      .append('div')
      .classed('intro', true);

    intro = introEnter
      .merge(introUpdate)
      .html(d => compiledTemplate({ loaded: true }))
      .each(function(d) {
        const inner = d3_select(this)
          .selectAll('.intro__inner')
          .node();
        const { offsetWidth, offsetHeight } = inner;
        const width = offsetWidth % 2 === 0 ? offsetWidth : offsetWidth - 1;
        const height = offsetHeight % 2 === 0 ? offsetHeight : offsetHeight - 1;
        inner.style.width = `${width}px`;
        inner.style.height = `${height}px`;
      });

    intro.selectAll('.intro__start').on('click', () => {
      uiState.setShowIntro(false);
      uiState.setMapZoom(6);
    });

    introUpdate.exit().remove();
  }

  cancelAutorun = autorun(_intro);
  return _intro;
}
