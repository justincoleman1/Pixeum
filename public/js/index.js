/*eslint-disable*/
// import '@babel/polyfill';
import { login, logout } from './back/login';
import { signup } from './back/signup';
import { updateSettings } from './back/updateSettings';
import { showAlert } from './front/alerts';
import {
  expandSideNav,
  collapseSideNav,
  overlayActive,
  mainCollapsed,
  sideNavExpanded,
  asideDisappear,
} from './front/side-nav';
import { windowSize792Changes, ws792 } from './front/window';
import {
  clearSearchText,
  hideNavOptions,
  hideRevertBtn,
  hideSearchBar,
  makeSearchActive,
  makeSearchInActive,
  navDisappear,
  showNavOptions,
  showRevertBtn,
  showSearchBar,
  showSearchClearBtn,
  hideSearchClearBtn,
  searchHasText,
} from './front/search-bar';

import { togglePasswordVisibillity } from './front/passwordVisibility';
import {
  profileDropDownClosed,
  closeProfileDropDown,
  closeOnEscape,
  openCloseProfileDropDownMenu,
} from './front/navbar';

// DOM ELEMENTS
const sideNavBtn = document.querySelector('.btn-side-nav');

const searchBtn = document.querySelector('.btn-search');
const searchInput = document.getElementById('search-input');
const searchClearBtn = document.getElementById('search-clear');
const searchRevert = document.getElementById('search-revert');

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');

const passShowBtn = document.getElementById('pass-show');
const passHideBtn = document.getElementById('pass-hide');

const profileBtn = document.getElementById('profile-menu-trigger');

const logOutBtn = document.getElementById('logoutBtn');

const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');

const overlay = document.querySelector('.overlay');

// Get the modal
const updatePhotoModal = document.getElementById('update-photo__modal');
const updateNameModal = document.getElementById('update-name__modal');
const updateUsernameModal = document.getElementById('update-username__modal');
const updateBirthdayModal = document.getElementById('update-birthday__modal');
const updateGenderModal = document.getElementById('update-gender__modal');
const updateEmailModal = document.getElementById('update-email__modal');
const updatePasswordModal = document.getElementById('update-password__modal');
// Get the button that opens the modal
const updatePhotoBtn = document.getElementById('update-photo-btn');
const updateNameBtn = document.getElementById('update-name-btn');
const updateUsernameBtn = document.getElementById('update-username-btn');
const updateBirthdayBtn = document.getElementById('update-birthday-btn');
const updateGenderBtn = document.getElementById('update-gender-btn');
const updateEmailBtn = document.getElementById('update-email-btn');
const updatePasswordBtn = document.getElementById('update-password-btn');
//Get the modal forms
const updatePhotoForm = document.getElementById('form__profile-photo');
//Get the modal form inputs
const updatePhotoInput = document.getElementById('input__photo');

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

if (searchInput) {
  searchInput.addEventListener('click', (e) => {
    if (!ws792() && sideNavExpanded()) collapseSideNav();
  });
  searchInput.addEventListener('input', (e) => {
    if (searchHasText()) showSearchClearBtn();
    else hideSearchClearBtn();
  });
  searchClearBtn.addEventListener('click', (e) => {
    clearSearchText();
    hideSearchClearBtn();
  });
}

if (passShowBtn)
  passShowBtn.addEventListener('click', (e) => {
    console.log('vis clicked');
    togglePasswordVisibillity('password');
    passShowBtn.classList.add('hidden');
    passHideBtn.classList.remove('hidden');
  });

if (passHideBtn)
  passHideBtn.addEventListener('click', (e) => {
    console.log('vis clicked');
    togglePasswordVisibillity('password');
    passHideBtn.classList.add('hidden');
    passShowBtn.classList.remove('hidden');
  });

if (signupForm) {
  asideDisappear();
  navDisappear();
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('submit');
    const name = document.getElementById('name').value;
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;
    signup(name, username, email, password, passwordConfirm);
  });
}

if (loginForm) {
  asideDisappear();
  navDisappear();
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('submit');
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (profileBtn) {
  profileBtn.addEventListener('click', (e) => {
    e.preventDefault;
    openCloseProfileDropDownMenu();
    if (!ws792() && sideNavExpanded()) {
      collapseSideNav();
    }
  });

  document.addEventListener('click', (e) => {
    e.preventDefault;
    if (!profileDropDownClosed()) closeProfileDropDown(e);
  });
  // document.addEventListener('keydown', (e) => {
  //   e.preventDefault;
  //   closeOnEscape(e);
  // });
}

/*----------------------UPDATE INFO -----------------------*/
if (updateNameBtn) {
  updatePhotoBtn.addEventListener('click', (e) => {
    updatePhotoModal.style.display = 'block';
  });
  updateNameBtn.addEventListener('click', (e) => {
    updateNameModal.style.display = 'block';
  });
  updateUsernameBtn.addEventListener('click', (e) => {
    updateUsernameModal.style.display = 'block';
  });
  updateBirthdayBtn.addEventListener('click', (e) => {
    updateBirthdayModal.style.display = 'block';
  });
  updateGenderBtn.addEventListener('click', (e) => {
    updateGenderModal.style.display = 'block';
  });
  updateEmailBtn.addEventListener('click', (e) => {
    updateEmailModal.style.display = 'block';
  });
  updatePasswordBtn.addEventListener('click', (e) => {
    updatePasswordModal.style.display = 'block';
  });
}

window.addEventListener('click', (e) => {
  if (e.target == updatePhotoModal) {
    updatePhotoModal.style.display = 'none';
  }
  if (e.target == updateNameModal) {
    updateNameModal.style.display = 'none';
  }
  if (e.target == updateUsernameModal) {
    updateUsernameModal.style.display = 'none';
  }
  if (e.target == updateBirthdayModal) {
    updateBirthdayModal.style.display = 'none';
  }
  if (e.target == updateGenderModal) {
    updateGenderModal.style.display = 'none';
  }
  if (e.target == updateEmailModal) {
    updateEmailModal.style.display = 'none';
  }
  if (e.target == updatePasswordModal) {
    updatePasswordModal.style.display = 'none';
  }
});
/*----------------------END UPDATE INFO -----------------------*/

if (updatePhotoForm) {
  updatePhotoInput.addEventListener('change', (e) => {
    e.preventDefault();
    let image = document.getElementById('img__profile-photo');
    image.src = URL.createObjectURL(e.target.files[0]);
  });

  updatePhotoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('photo', updatePhotoInput.files[0]);
    updateSettings(form, 'data');
  });
}

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
