import { autorun } from 'mobx';
import { select as d3_select } from 'd3-selection';
import _template from 'lodash.template';
import template from 'app/templates/info.hbs';
import uiState from 'app/uiState';

const compiledTemplate = _template(template);

export default function Info() {
  let parent;
  let info;
  let infoEnter;
  let infoUpdate;
  let cancelAutorun;

  function _info() {
    const { showIntro, showAbout } = uiState;
    parent = d3_select('#app');
    const show = showIntro || showAbout;

    infoUpdate = parent.selectAll('.info').data(show ? [1] : []);

    infoEnter = infoUpdate
      .enter()
      .append('div')
      .classed('info', true);

    info = infoEnter
      .merge(infoUpdate)
      .html(d => compiledTemplate({ loaded: true, isAbout: showAbout }))
      .each(function(d) {
        const inner = d3_select(this)
          .selectAll('.info__inner')
          .node();
        const { offsetWidth, offsetHeight } = inner;
        const width = offsetWidth % 2 === 0 ? offsetWidth : offsetWidth - 1;
        const height = offsetHeight % 2 === 0 ? offsetHeight : offsetHeight - 1;
        inner.style.width = `${width}px`;
        inner.style.height = `${height}px`;
      });

    info.selectAll('.info__start').on('click', () => {
      uiState.setShowIntro(false);
      uiState.transitionMap(
        {
          lng: 150.5,
          lat: 21.0,
        },
        9,
      );
    });

    info.selectAll('.info__close').on('click', () => {
      uiState.setShowAbout(false);
    });

    infoUpdate.exit().remove();
  }

  cancelAutorun = autorun(_info);
  return _info;
}
