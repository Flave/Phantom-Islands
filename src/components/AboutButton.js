import { autorun } from 'mobx';
import { select as d3_select } from 'd3-selection';
import uiState from 'app/uiState';

export default function Muter() {
  let parent;

  function _muter() {
    let className = 'header__about header__item';

    d3_select('#header')
      .selectAll('.header__about')
      .data([1])
      .enter()
      .append('div')
      .attr('class', className)
      .html('Info')
      .on('click', () => uiState.setShowAbout(true));
  }

  autorun(_muter);
  return _muter;
}
