/*eslint-disable*/
// import '@babel/polyfill';
import Cropper from 'cropperjs';

import { login, logout, googleSignIn } from './back/login';
import {
  initializeGoogleSignIn,
  renderGoogleButton,
} from './back/googleLogin.js';
import { signup } from './back/signup';
import { updateSettings } from './back/updateSettings';
import { submit_art } from './back/uploadArt';
import { update_art } from './back/updateArt';
import comments from './back/comments.js';
import reactions from './back/reactions.js';
import { delete_art } from './back/deleteUpload';
import { showAlert } from './front/alerts';
import { handleFavorite } from './back/favorite.js';
import {
  expandSideNav,
  collapseSideNav,
  overlayActive,
  mainCollapsed,
  sideNavExpanded,
  asideDisappear,
  uploadMainCollapsed,
} from './front/side-nav';
import { windowSize792Changes, ws792 } from './front/window';
import { h, s, w, g, sh, p } from './front/brick';
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
  largeSearchButton,
  smallSearchButton,
} from './front/search-bar';

import {
  togglePasswordVisibillity,
  toggleUpdatePasswordVisibillity,
} from './front/passwordVisibility';
import {
  profileDropDownClosed,
  notificationsDropDownClosed,
  closeProfileDropDown,
  closeNotificationsDropDown,
  openCloseProfileDropDownMenu,
  openCloseNotificationsDropDownList,
} from './front/navbar';

import { disallowBodyScroll, allowBodyScroll } from './front/scroll';

const alertMessage = document.querySelector('body').dataset.alert;

// DOM ELEMENTS
const sideNavBtn = document.querySelector('.btn-side-nav');

const searchBtn = document.querySelector('.btn-search');

const searchInput = document.getElementById('search-input');
const searchClearBtn = document.getElementById('search-clear');
const searchRevert = document.getElementById('search-revert');

const loginForm = document.getElementById('login-form');
const googleButton = document.getElementById('google-login-btn');

const signupForm = document.getElementById('signup-form');

const passShowBtn = document.getElementById('pass-show');
const passHideBtn = document.getElementById('pass-hide');

const updatePassShowBtn = document.getElementById('pass-update-show');
const updatePassHideBtn = document.getElementById('pass-update-hide');

const profileBtn = document.getElementById('profile-menu-trigger');
const notificationsBtn = document.getElementById('notifications-list-trigger');

const logOutBtn = document.getElementById('logoutBtn');

const overlay = document.querySelector('.overlay');

const updatePhotoModal = document.getElementById('update-photo__modal');
const cropPhotoModal = document.getElementById('crop-photo__modal');
const updateNameModal = document.getElementById('update-name__modal');
const updateUsernameModal = document.getElementById('update-username__modal');
const updateBirthdayModal = document.getElementById('update-birthday__modal');
const updateGenderModal = document.getElementById('update-gender__modal');
const updateEmailModal = document.getElementById('update-email__modal');
const updatePasswordModal = document.getElementById('update-password__modal');

const escapePhotoBtn = document.getElementById('btn__escape__update-photo');
const escapeNameBtn = document.getElementById('btn__escape__update-name');
const escapeUsernameBtn = document.getElementById(
  'btn__escape__update-username'
);
const escapeEmailBtn = document.getElementById('btn__escape__update-email');
const escapeBirthdayBtn = document.getElementById(
  'btn__escape__update-birthday'
);
const escapeGenderBtn = document.getElementById('btn__escape__update-gender');
const escapePasswordBtn = document.getElementById(
  'btn__escape__update-password'
);
const escapeCropBtn = document.getElementById('btn__escape__crop-photo');

const updatePhotoBtn = document.getElementById('update-photo-btn');
const cropPhotoBtn = document.getElementById('crop-photo-btn');
const saveCropBtn = document.getElementById('save__crop');
const updateNameBtn = document.getElementById('update-name-btn');
const updateUsernameBtn = document.getElementById('update-username-btn');
const updateBirthdayBtn = document.getElementById('update-birthday-btn');
const updateGenderBtn = document.getElementById('update-gender-btn');
const updateEmailBtn = document.getElementById('update-email-btn');
const updatePasswordBtn = document.getElementById('update-password-btn');

//Get the modal forms
const updatePhotoForm = document.getElementById('form__profile-photo');
const updateNameForm = document.getElementById('form__profile-name');
const updateUsernameForm = document.getElementById('form__profile-username');
const updateEmailForm = document.getElementById('form__profile-email');
const updateBirthdayForm = document.getElementById('form__profile-birthday');
const updateGenderForm = document.getElementById('form__profile-gender');
const updatePasswordForm = document.getElementById('form__profile-password');

//Upload page form
const uploadInput = document.getElementById('media');
const uploadForm = document.getElementById('submit-upload');

//Update upload form
const updateUploadForm = document.getElementById('update-upload');

//Upload delete btn
const uploadDeleteBtn = document.getElementById('upload-delete-btn');
const deleteUploadYes = document.getElementById('delete-upload-yes');
const deleteUploadNo = document.getElementById('delete-upload-no');
const deleteUploadModal = document.getElementById('delete-upload-modal');
//Upload edit btn
const uploadEditBtn = document.getElementById('upload-edit-btn');

//favorite Button
const favoriteBtn = document.querySelector('button#favorite-btn');

//Comment form
const commentForm = document.getElementById('comment-form');
const postCommentBtn = document.getElementById('post-comment-btn');
//Get the modal form inputs
const updatePhotoInput = document.getElementById('input__photo');

const originalProfileImage = document.getElementById('img__profile-photo');

//WINDOW RESIZES
window.addEventListener('load', (e) => {
  e.preventDefault();
  windowSize792Changes();
});

window.addEventListener('resize', (e) => {
  e.preventDefault();
  windowSize792Changes();
});

// Initialize Google Sign-In on page load with fallback polling
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize if on the login page
  if (!document.querySelector('.login')) return;

  const gisScript = document.getElementById('gis-script');
  if (!gisScript) {
    showAlert('error', 'Google Sign-In script not found.');
    return;
  }

  // Flag to track if the button has been rendered
  let isRendered = false;

  // Function to attempt rendering the button
  const attemptRender = () => {
    if (isRendered) return; // Prevent multiple renders
    if (window.google && window.google.accounts && window.google.accounts.id) {
      // First, initialize Google Sign-In
      const initialized = initializeGoogleSignIn();
      if (initialized) {
        // Small delay to ensure initialization is complete
        setTimeout(() => {
          // Then, render the button
          const rendered = renderGoogleButton();
          if (rendered) {
            isRendered = true;
          }
        }, 100);
      }
    }
  };

  // Listen for the script load event
  gisScript.addEventListener('load', () => {
    console.log('GIS script loaded');
    attemptRender();
  });

  // Fallback polling in case the load event doesn't fire
  const maxAttempts = 100; // Poll for up to 10 seconds (100 * 100ms)
  let attempts = 0;
  const pollInterval = setInterval(() => {
    attempts++;
    attemptRender();
    if (isRendered || attempts >= maxAttempts) {
      clearInterval(pollInterval);
      if (!isRendered) {
        showAlert(
          'error',
          'Failed to load Google Sign-In. Please try again later.'
        );
      }
    }
  }, 100);

  // Handle script load errors
  gisScript.addEventListener('error', () => {
    clearInterval(pollInterval);
    showAlert(
      'error',
      'Failed to load Google Sign-In. Please try again later.'
    );
  });
});

// DELEGATION
if (sideNavBtn) {
  sideNavBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (mainCollapsed() || uploadMainCollapsed()) collapseSideNav();
    else expandSideNav();
  });
}

if (overlay)
  overlay.addEventListener('click', (e) => {
    e.preventDefault();
    if (overlayActive()) collapseSideNav();
  });

if (searchBtn)
  searchBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!ws792()) {
      makeSearchActive();
      hideNavOptions();
      showSearchBar();
      showRevertBtn();
      smallSearchButton();
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
      largeSearchButton();
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
    togglePasswordVisibillity();
    passShowBtn.classList.add('hidden');
    passHideBtn.classList.remove('hidden');
  });

if (passHideBtn)
  passHideBtn.addEventListener('click', (e) => {
    togglePasswordVisibillity();
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

if (googleButton) {
  googleButton.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('google button clicked');
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

if (updateUploadForm) {
  asideDisappear();
  updateUploadForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const media = uploadInput.files[0];
    const width = document.getElementById('image-display').value;
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const tags = Array.from(document.querySelectorAll('.tag')).map((tag) =>
      tag.textContent.slice(0, -1)
    );
    const checkedMaturityOptions = document.querySelectorAll(
      '.maturity-option:checked'
    );
    const maturity = Array.from(checkedMaturityOptions).map(
      (option) => option.value
    );

    const data = new FormData();
    data.append('media', media);
    data.append('width', width);
    data.append('title', title);
    data.append('description', description);
    data.append('tags', tags);
    data.append('maturity', maturity);

    const urlParts = window.location.pathname.split('/');
    const username = urlParts[urlParts.length - 3];
    const slug = urlParts[urlParts.length - 2];

    await update_art(data, username, slug);
  });
}

if (uploadForm) {
  asideDisappear();
  uploadForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const media = uploadInput.files[0];
    const width = document.getElementById('image-display').value;
    const originalWidthInt =
      width === 'original'
        ? parseInt(
            document
              .getElementById('image-display')
              .textContent.split('(')[1]
              .split(' ')[0]
          )
        : null;
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;

    const tags = Array.from(document.querySelectorAll('.tag')).map((tag) =>
      tag.textContent.slice(0, -1)
    );
    const checkedMaturityOptions = document.querySelectorAll(
      '.maturity-option:checked'
    );
    const maturity = Array.from(checkedMaturityOptions).map(
      (option) => option.value
    );
    console.log(media, width, title, description, tags, maturity);
    const data = new FormData();
    data.append('media', media);
    data.append('width', width);
    data.append('orginalWidthInt', originalWidthInt);
    data.append('title', title);
    data.append('description', description);
    data.append('tags', tags);
    data.append('maturity', maturity);

    await submit_art(data);
  });
}

if (uploadDeleteBtn) {
  uploadDeleteBtn.addEventListener('click', (e) => {
    e.preventDefault();

    deleteUploadModal.style.display = 'flex';
    deleteUploadModal.style.alignItems = 'center';
    deleteUploadModal.style.justifyContent = 'center';
  });
}

if (deleteUploadYes) {
  deleteUploadYes.addEventListener('click', async (e) => {
    e.preventDefault();
    const urlParts = window.location.pathname.split('/');
    const username = urlParts[urlParts.length - 2];
    const uploadSlug = urlParts[urlParts.length - 1];

    const response = await delete_art(username, uploadSlug);

    if (response.status === 'success') {
      deleteUploadModal.style.display = 'none';
      showAlert('success', 'Successfully deleted your upload!');
      window.setTimeout(() => {
        window.location.href = `/${username}`;
      }, 1500);
    }
  });
}

if (deleteUploadNo) {
  deleteUploadNo.addEventListener('click', (e) => {
    e.preventDefault();
    deleteUploadModal.style.display = 'none';
  });
}

if (favoriteBtn) {
  const favoriteIcon = document.querySelector('.favorite-icon');
  const favoritedData = document
    .querySelector('#imageModal-content')
    .getAttribute('upload-isFavorited');

  let isFavorited = JSON.parse(favoritedData);

  if (isFavorited) {
    favoriteIcon.classList.add('favorited');
  }

  favoriteBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    await handleFavorite('unfavorited');
    if (favoriteIcon.classList.contains('favorited')) {
      favoriteIcon.classList.remove('favorited');
    } else {
      favoriteIcon.classList.add('favorited');
    }
  });
}

if (profileBtn) {
  profileBtn.addEventListener('click', (e) => {
    e.preventDefault;
    openCloseProfileDropDownMenu();
    if (!notificationsDropDownClosed()) openCloseNotificationsDropDownList();
    if (!ws792() && sideNavExpanded()) {
      collapseSideNav();
    }
  });

  document.addEventListener('click', (e) => {
    e.preventDefault;
    if (!profileDropDownClosed()) closeProfileDropDown(e);
  });
}

if (notificationsBtn) {
  notificationsBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openCloseNotificationsDropDownList();
    if (!profileDropDownClosed()) openCloseProfileDropDownMenu();
    if (!ws792() && sideNavExpanded()) {
      collapseSideNav();
    }
  });

  document.addEventListener('click', (e) => {
    e.preventDefault;
    if (!notificationsDropDownClosed()) closeNotificationsDropDown(e);
  });
}

if (updateNameBtn) {
  let image = document.getElementById('img__profile-photo');
  let crop_image = document.getElementById('img__crop-profile-photo');

  let cropper = new Cropper(crop_image, {
    dragMode: 'none',
    aspectRatio: 4 / 4,
    viewMode: 0,
    minCropBoxWidth: 300,
    minCropBoxHeight: 300,
    minContainerWidth: 358,
    minContainerHeight: 400,
  });

  updatePhotoBtn.addEventListener('click', (e) => {
    updatePhotoModal.style.display = 'block';
    disallowBodyScroll();
  });

  cropPhotoBtn.addEventListener('click', (e) => {
    cropPhotoModal.style.display = 'block';
    disallowBodyScroll();
  });

  updateNameBtn.addEventListener('click', (e) => {
    updateNameModal.style.display = 'block';
    disallowBodyScroll();
  });

  updateUsernameBtn.addEventListener('click', (e) => {
    updateUsernameModal.style.display = 'block';
    disallowBodyScroll();
  });

  updateBirthdayBtn.addEventListener('click', (e) => {
    updateBirthdayModal.style.display = 'block';
    disallowBodyScroll();
  });

  updateGenderBtn.addEventListener('click', (e) => {
    updateGenderModal.style.display = 'block';
    disallowBodyScroll();
  });

  updateEmailBtn.addEventListener('click', (e) => {
    updateEmailModal.style.display = 'block';
    disallowBodyScroll();
  });

  updatePasswordBtn.addEventListener('click', (e) => {
    updatePasswordModal.style.display = 'block';
    disallowBodyScroll();
  });

  escapePhotoBtn.addEventListener('click', (e) => {
    updatePhotoModal.style.display = 'none';

    image.src = originalProfileImage.src;
    crop_image.src = originalProfileImage.src;
    cropper.replace(originalProfileImage.src);

    allowBodyScroll();
  });

  escapeCropBtn.addEventListener('click', (e) => {
    cropPhotoModal.style.display = 'none';
  });

  escapeNameBtn.addEventListener('click', (e) => {
    updateNameModal.style.display = 'none';
    allowBodyScroll();
  });

  escapeUsernameBtn.addEventListener('click', (e) => {
    updateUsernameModal.style.display = 'none';
    allowBodyScroll();
  });

  escapeBirthdayBtn.addEventListener('click', (e) => {
    updateBirthdayModal.style.display = 'none';
    allowBodyScroll();
  });

  escapeGenderBtn.addEventListener('click', (e) => {
    updateGenderModal.style.display = 'none';
    allowBodyScroll();
  });

  escapeEmailBtn.addEventListener('click', (e) => {
    updateEmailModal.style.display = 'none';
    allowBodyScroll();
  });

  escapePasswordBtn.addEventListener('click', (e) => {
    updatePasswordModal.style.display = 'none';
    allowBodyScroll();
  });

  updatePhotoInput.addEventListener('change', (e) => {
    e.preventDefault();

    console.log(e.target.files[0]);

    image.src = URL.createObjectURL(e.target.files[0]);
    crop_image.src = URL.createObjectURL(e.target.files[0]);
    cropper.replace(crop_image.src);
  });

  saveCropBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const croppedImage = cropper.getCroppedCanvas().toDataURL('image/png');
    image.src = croppedImage;
    crop_image.src = croppedImage;
    cropPhotoModal.style.display = 'none';
  });

  updatePhotoForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    let form = new FormData();
    await toDataURL(image.src).then((dataUrl) => {
      var fileData = dataURLtoFile(dataUrl, 'croppedImage.png');
      form.append('photo', fileData);
      updateSettings(form, 'data');
    });
  });

  updateNameForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    let form = new FormData();
    form.append('name', document.getElementById('update-name').value);
    await updateSettings(form, 'data');
  });

  updateUsernameForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    let form = new FormData();
    form.append('username', document.getElementById('update-username').value);
    await updateSettings(form, 'data');
  });

  updateEmailForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    let form = new FormData();
    form.append('email', document.getElementById('update-email').value);
    await updateSettings(form, 'data');
  });

  updateBirthdayForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const month = document.getElementById('update-birthday-month').value;
    let day = document.getElementById('update-birthday-day').value;
    const year = document.getElementById('update-birthday-year').value;

    day++;
    const formatedDate = `${year}-${month}-${day.toString()}T00:00:00Z`;

    let form = new FormData();
    form.append('birthday', formatedDate);
    await updateSettings(form, 'data');
  });

  updateGenderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    let form = new FormData();
    form.append('gender', document.getElementById('update-gender').value);
    await updateSettings(form, 'data');
  });
}

if (updatePasswordForm) {
  updatePassShowBtn.addEventListener('click', (e) => {
    toggleUpdatePasswordVisibillity();
    updatePassShowBtn.classList.add('hidden');
    updatePassHideBtn.classList.remove('hidden');
  });

  updatePassHideBtn.addEventListener('click', (e) => {
    toggleUpdatePasswordVisibillity();
    updatePassHideBtn.classList.add('hidden');
    updatePassShowBtn.classList.remove('hidden');
  });

  updatePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById('password-current').value;
    const newPassword = document.getElementById('update-password').value;
    const newPasswordConfirm =
      document.getElementById('password-confirm').value;
    await updateSettings(
      { currentPassword, newPassword, newPasswordConfirm },
      'password'
    );
  });
}

if (alertMessage) showAlert('success', alertMessage, 20);

const toDataURL = (url) =>
  fetch(url)
    .then((response) => response.blob())
    .then(
      (blob) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
    );

// ***Here is code for converting "Base64" to javascript "File Object".***

const dataURLtoFile = (dataurl, filename) => {
  var arr = dataurl.split(','),
    mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]),
    n = bstr.length,
    u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};
