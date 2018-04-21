import { autorun } from 'mobx';
import { select as d3_select } from 'd3';

import uiState from 'app/uiState';

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
    const { hintCandidates } = uiState;

    hintsUpdate = parent.selectAll('.hint').data(hintCandidates, d => d.id);

    hintsEnter = hintsUpdate
      .enter()
      .append('div')
      .html(d => `<div></div>`);

    console.log(hintCandidates);

    hints = hintsEnter
      .merge(hintsUpdate)
      .attr('class', d => `hint hint--${d.side}`)
      .style('left', d => `${d.borderPos.x}px`)
      .style('top', d => `${d.borderPos.y}px`);

    hintsUpdate.exit().remove();
  }
  return _hints;
}
