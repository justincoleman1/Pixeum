/*eslint-disable*/
// import '@babel/polyfill';
import { login, logout } from './back/login';
import { updateSettings } from './back/updateSettings';
import { showAlert } from './front/alerts';
import { expandSideNav, collapseSideNav } from './front/side-nav';
import { windowSizeBelow792px } from './front/window';

// DOM ELEMENTS
const main = document.getElementById('main');
const sideNavBtn = document.querySelector('.btn-side-nav');
const loginForm = document.querySelector('.form');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const overlay = document.querySelector('.overlay');

//WINDOW RESIZES

window.addEventListener('load', (e) => {
  e.preventDefault();
  windowSizeBelow792px();
});

window.addEventListener('resize', (e) => {
  e.preventDefault();
  windowSizeBelow792px();
});

// DELEGATION
if (sideNavBtn)
  sideNavBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (main.classList.contains('shrink-main')) collapseSideNav();
    else expandSideNav();
  });

if (overlay)
  overlay.addEventListener('click', (e) => {
    e.preventDefault();
    if (overlay.classList.contains('active')) collapseSideNav();
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
