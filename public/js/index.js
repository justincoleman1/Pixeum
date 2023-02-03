/*eslint-disable*/
// import '@babel/polyfill';
import { login, logout } from './back/login';
import { updateSettings } from './back/updateSettings';
import { showAlert } from './front/alerts';
import {
  expandSideNav,
  collapseSideNav,
  overlayActive,
  mainCollapsed,
  sideNavExpanded,
} from './front/side-nav';
import { windowSize792Changes, ws792 } from './front/window';
import {
  hideNavOptions,
  hideRevertBtn,
  hideSearchBar,
  makeSearchActive,
  makeSearchInActive,
  showNavOptions,
  showRevertBtn,
  showSearchBar,
} from './front/search-bar';
import { removeHidden } from './front/hidden';

// DOM ELEMENTS
const main = document.getElementById('main');
const sideNavBtn = document.querySelector('.btn-side-nav');
const searchBtn = document.querySelector('.btn-search');
const searchInput = document.getElementById('search-input');
const searchRevert = document.getElementById('search-revert');
const loginForm = document.querySelector('.form');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const overlay = document.querySelector('.overlay');

//WINDOW RESIZES

window.addEventListener('load', (e) => {
  e.preventDefault();
  windowSize792Changes();
});

window.addEventListener('resize', (e) => {
  e.preventDefault();
  windowSize792Changes();
});

// DELEGATION
if (sideNavBtn)
  sideNavBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (mainCollapsed()) collapseSideNav();
    else expandSideNav();
  });

if (overlay)
  overlay.addEventListener('click', (e) => {
    e.preventDefault();
    if (overlayActive()) collapseSideNav();
  });

if (searchBtn)
  searchBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!ws792()) {
      console.log('Search Btn clicked');
      makeSearchActive();
      hideNavOptions();
      showSearchBar();
      showRevertBtn();
    }
  });

if (searchRevert)
  searchRevert.addEventListener('click', (e) => {
    e.preventDefault();
    if (!ws792()) {
      console.log('Search revert clicked');
      makeSearchInActive();
      showNavOptions();
      hideSearchBar();
      hideRevertBtn();
    }
  });

if (searchInput)
  searchInput.addEventListener('click', (e) => {
    if (!ws792() && sideNavExpanded()) collapseSideNav();
  });

if (loginForm)
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });

if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (userDataForm)
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    updateSettings(form, 'data');
  });

if (userPasswordForm)
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating...';

    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );

    document.querySelector('.btn--save-password').textContent = 'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });

const alertMessage = document.querySelector('body').dataset.alert;
if (alertMessage) showAlert('success', alertMessage, 20);
