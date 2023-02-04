//esversion: 6
const profileMenu = document.getElementById('profile-menu');

export const openCloseMenu = () => {
  profileMenu.classList.remove('closed');
};

export const closeOnClickOutside = (e) => {
  if (!e.target.matches('#profile-menu-trigger, .bxs-user, .user')) {
    profileMenu.classList.add('closed');
  }
};

export const closeOnEscape = (e) => {
  if (e.keyCode === 27) {
    profileMenu.classList.add('closed');
  }
};
