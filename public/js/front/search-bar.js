/*eslint-disable*/
import { addActive, isActive, removeActive } from './active';
import { addHidden, removeHidden } from './hidden';

const searchBar = document.getElementById('search-bar');
const searchInput = document.getElementById('search-input');
const searchRevert = document.getElementById('search-revert');
const searchClearBtn = document.getElementById('search-clear');
const searchBtn = document.querySelector('.btn-search');
const searchIcon = document.querySelector('.search-icon');
const nav = document.getElementById('nav');

export const navDisappear = () => {
  nav.classList.add('disappear');
};

export const hideNav = () => {
  nav.classList.add('hidden');
};

export const searchHasText = () => {
  return searchInput.value ? true : false;
};

export const clearSearchText = () => {
  searchInput.value = '';
};

export const showSearchClearBtn = () => {
  searchClearBtn.classList.remove('hidden');
};

export const hideSearchClearBtn = () => {
  searchClearBtn.classList.add('hidden');
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
  if (nav.children[4]) {
    console.log('5');
    addHidden(nav.children[1]);
    addHidden(nav.children[3]);
    addHidden(nav.children[4]);
  } else {
    console.log('4');
    addHidden(nav.children[1]);
    addHidden(nav.children[3]);
  }
};

export const showNavOptions = () => {
  if (nav.children[4]) {
    removeHidden(nav.children[1]);
    removeHidden(nav.children[3]);
    removeHidden(nav.children[4]);
  } else {
    removeHidden(nav.children[1]);
    removeHidden(nav.children[3]);
  }
};

export const largeSearchButton = () => {
  searchBtn.style.left = 0;
  searchIcon.style.width = '28px';
};

export const smallSearchButton = () => {
  searchBtn.style.left = '8px';
  searchIcon.style.width = '20px';
};

export const lrgSearchButtonMargin = () => {
  searchBtn.style.left = '8px';
};

export const smSearchButtonMargin = () => {
  searchBtn.style.left = 0;
};
