/*eslint-disable*/

import { addHidden, removeHidden } from './hidden';
import { turnOffOverlay, turnOnOverlay } from './side-nav';

const aside = document.getElementById('aside');
const searchBar = document.getElementById('search-bar');
const searchInput = document.getElementById('search-input');
const overlay = document.querySelector('.overlay');

const wsmw792 = window.matchMedia('(min-width: 792px)');

export const windowSizeBelow792px = () => {
  //if screen equal or greater than threshold size
  if (wsmw792.matches) {
    //if the overlay is active: turn off overlay
    if (overlay.classList.contains('active')) turnOffOverlay();
    //if sidenav is hidden: remove hidden
    if (aside.classList.contains('hidden')) removeHidden(aside);
    if (searchInput.classList.contains('hidden')) {
      removeHidden(searchInput);
      removeHidden(searchBar.lastChild);
    }
  } else {
    //screen is less than target threshold
    //If sidenav is active: turn on overlay
    if (aside.classList.contains('expand-aside')) {
      turnOnOverlay();
      removeHidden(aside);
    } else {
      addHidden(aside);
    }
    //If search input has text
    if (searchInput.value) {
      removeHidden(searchInput);
      removeHidden(searchBar.lastChild);
    } else {
      addHidden(searchInput);
      addHidden(searchBar.lastChild);
    }
  }
};
