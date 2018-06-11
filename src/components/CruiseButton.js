import { autorun } from 'mobx';
import { select as d3_select } from 'd3-selection';
import uiState from 'app/uiState';

export default function CruiseButton() {
  function _cruiseButon() {
    let className = 'header__cruise header__item';

    const update = d3_select('#header')
      .selectAll('.header__cruise')
      .data([1]);

    const enter = update
      .enter()
      .append('div')
      .attr('class', className)
      .on('click', () => uiState.setCruiseMode(!uiState.cruiseMode));

    enter.merge(update).html(uiState.cruiseMode ? 'Stop Cruise' : 'Cruise');
  }

  autorun(_cruiseButon);
  return _cruiseButon;
}
