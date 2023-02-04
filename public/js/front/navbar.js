//esversion: 6
const profileMenu = document.getElementById('profile-menu');

export const profileDropDownClosed = () => {
  return profileMenu.classList.contains('closed');
};

export const openCloseProfileDropDownMenu = () => {
  if (profileDropDownClosed()) profileMenu.classList.remove('closed');
  else profileMenu.classList.add('closed');
};

export const closeProfileDropDown = (e) => {
  console.log(e.target);
  if (
    !e.target.matches(
      '#profile-menu, .profile-menu-item, .profile-item-list, #nav, .nav__user-img, .profile-menu__user-img, .profile-menu__header-name, .profile-menu__header-username, .profile-menu-item__col-r, .profile-menu-item__col-l'
    )
  )
    profileMenu.classList.add('closed');
};

export const closeOnEscape = (e) => {
  if (e.keyCode === 27) {
    profileMenu.classList.add('closed');
  }
};
