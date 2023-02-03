/*eslint-disable*/
import { addActive, isActive, removeActive } from './active';
import { addHidden, removeHidden } from './hidden';

const searchBar = document.getElementById('search-bar');
const searchInput = document.getElementById('search-input');
const searchRevert = document.getElementById('search-revert');
const nav = document.getElementById('nav');

export const searchHasText = () => {
  return searchInput.value ? true : false;
};

export const searchIsActive = () => {
  return isActive(searchInput);
};

export const revertBtnHidden = () => {
  return searchRevert.classList.contains('hidden') ? true : false;
};

export const showRevertBtn = () => {
  removeHidden(searchRevert);
};

export const hideRevertBtn = () => {
  searchRevert.classList.add('hidden');
};

export const clearSearchActiveCSS = () => {
  removeActive(searchBar.parentElement);
};

export const makeSearchActive = () => {
  addActive(searchInput);
  addActive(searchBar.parentElement);
};

export const makeSearchInActive = () => {
  removeActive(searchInput);
  clearSearchActiveCSS();
};

export const searchBarHidden = () => {
  return searchInput.classList.contains('hidden') ? true : false;
};

export const showSearchBar = () => {
  removeHidden(searchInput);
  removeHidden(searchBar.lastChild);
};

export const hideSearchBar = () => {
  addHidden(searchInput);
  addHidden(searchBar.lastChild);
};

export const navOptionsHidden = () => {
  return nav.lastChild.classList.contains('hidden') ? true : false;
};

export const hideNavOptions = () => {
  addHidden(nav.children[1]);
  addHidden(nav.lastChild);
};

export const showNavOptions = () => {
  removeHidden(nav.children[1]);
  removeHidden(nav.lastChild);
};
