//esversion: 6
const profileMenu = document.getElementById('profile-menu');
const notificationsList = document.getElementById('notifications-list');

export const profileDropDownClosed = () => {
  return profileMenu.classList.contains('closed');
};

export const notificationsDropDownClosed = () => {
  return notificationsList.classList.contains('closed');
};

export const openCloseProfileDropDownMenu = () => {
  if (profileDropDownClosed()) profileMenu.classList.remove('closed');
  else profileMenu.classList.add('closed');
};

export const openCloseNotificationsDropDownList = () => {
  if (notificationsDropDownClosed()) {
    notificationsList.classList.remove('closed');
  } else notificationsList.classList.add('closed');
};

export const closeProfileDropDown = (e) => {
  if (
    !e.target.matches(
      '#profile-menu, .profile-menu-item, .profile-item-list, #nav, .nav__user-img, .profile-menu__user-img, .profile-menu__header-name, .profile-menu__header-username, .profile-menu-item__col-r, .profile-menu-item__col-l'
    )
  )
    profileMenu.classList.add('closed');
};

export const closeNotificationsDropDown = (e) => {
  if (
    !e.target.matches(
      '#notifications-list, .notifications-icon, .notifications-list-item, .notifications-item-list, #nav, #notifications-list-trigger'
    )
  ) {
    console.log('closing');
    notificationsList.classList.add('closed');
  }
};

export const closeOnEscape = (e) => {
  if (e.keyCode === 27) {
    profileMenu.classList.add('closed');
  }
};
