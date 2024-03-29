import { autorun } from 'mobx';
import { select as d3_select } from 'd3-selection';
import _template from 'lodash.template';
import template from 'app/templates/hint.hbs';
import uiState from 'app/uiState';

const compiledTemplate = _template(template);

export default function Hints() {
  let parent;
  let hints;
  let hintsEnter;
  let hintsUpdate;

  function _hints(map) {
    parent = d3_select(map.getContainer())
      .append('div')
      .classed('hints', true);
    autorun(update);
  }

  function update() {
    const { islandHints: hintData, surfaces } = uiState;

    hintsUpdate = parent.selectAll('.hint').data(hintData, d => d.id);

    hintsEnter = hintsUpdate
      .enter()
      .append('div')
      .html(d => compiledTemplate(d));

    hints = hintsEnter
      .merge(hintsUpdate)
      .on('click', island => {
        // Slightly offset center so the
        uiState.transitionMap(island.location, 9);
      })
      .attr('class', d => `hint hint--${d.side}`)
      .classed('is-behind-header', d => d.isBehindHeader)
      .style('left', d => `${d.borderPos.x}px`)
      .style('top', d => `${d.borderPos.y}px`)
      .each(function(d) {
        d3_select(this)
          .selectAll('.hint__arrow')
          .style('transform', `rotate(${d.angle}rad)`);
      });

    hintsUpdate.exit().remove();
  }
  return _hints;
}
