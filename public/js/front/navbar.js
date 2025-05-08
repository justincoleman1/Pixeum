//esversion: 6
import { showAlert } from './alerts.js';
const profileMenu = document.getElementById('profile-menu');
const notificationsList = document.getElementById('notifications-list');
const notificationCountElement = document.getElementById('notification-count');
const markAllSeenButton = document.getElementById('mark-all-seen');
const subscribeButtons = document.querySelectorAll(
  '.btn-subscribe, .btn__subscribe-upload'
);

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
    // Fetch notifications when opening the dropdown
    fetchNotifications();
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

// Fetch the count of unseen notifications
const fetchUnseenCount = async () => {
  try {
    const res = await fetch('/api/v1/notifications/unseen-count');
    const data = await res.json();
    if (data.status === 'success') {
      const count = data.data.count;
      notificationCountElement.textContent = count;
      notificationCountElement.classList.toggle('hidden', count === 0);
    }
  } catch (err) {
    console.error('Error fetching unseen notification count:', err);
  }
};

// Fetch notifications and display them
const fetchNotifications = async () => {
  try {
    const res = await fetch('/api/v1/notifications');
    const data = await res.json();
    if (data.status === 'success') {
      const notifications = data.data.notifications;
      const notificationsUl = notificationsList.querySelector(
        '.notifications-item-list'
      );
      notificationsUl.innerHTML = '';

      if (notifications.length === 0) {
        notificationsUl.innerHTML = '<li>No notifications</li>';
        return;
      }

      notifications.forEach((notification) => {
        const li = document.createElement('li');
        li.className = notification.seen ? 'seen' : 'unseen';
        li.dataset.notificationId = notification._id;

        let message = '';
        const fromUsername = notification.fromUser.username;
        switch (notification.type) {
          case 'like':
            message = `${fromUsername} liked your comment on "${notification.upload.title}"`;
            break;
          case 'reply':
            message = `${fromUsername} replied to your comment on "${notification.upload.title}"`;
            break;
          case 'thread_reply':
            message = `${fromUsername} replied to a comment thread you're in on "${notification.upload.title}"`;
            break;
          case 'mention':
            message = `${fromUsername} mentioned you in a comment on "${notification.upload.title}"`;
            break;
          case 'subscription':
            message = `${fromUsername} subscribed to you`;
            break;
        }

        li.innerHTML = `
          <a class="notification-link" href="${
            notification.upload
              ? `/${notification.upload.user.username}/${notification.upload.slug}#comment-${notification.comment._id}`
              : '#'
          }">
            <img src="/img/users/${
              notification.fromUser.photo || 'default.jpg'
            }" alt="${fromUsername}" class="notification-avatar">
            <div class="notification-text">
              <p><strong>${fromUsername}</strong> ${message}</p>
              <small>${new Date(
                notification.createdAt
              ).toLocaleString()}</small>
            </div>
          </a>
        `;

        // Mark as seen when clicked
        li.addEventListener('click', async (e) => {
          e.preventDefault(); // Prevent immediate navigation
          if (!notification.seen) {
            try {
              await fetch(`/api/v1/notifications/${notification._id}/seen`, {
                method: 'PATCH',
              });
              li.classList.remove('unseen');
              li.classList.add('seen');
              fetchUnseenCount();
            } catch (err) {
              console.error('Error marking notification as seen:', err);
            }
          }
          // Navigate to the link
          const href = li.querySelector('a').getAttribute('href');
          if (href !== '#') {
            window.location.href = href;
          }
        });

        notificationsUl.appendChild(li);
      });
    }
  } catch (err) {
    console.error('Error fetching notifications:', err);
  }
};

// Mark all notifications as seen
const markAllAsSeen = async () => {
  try {
    const res = await fetch('/api/v1/notifications/mark-all-seen', {
      method: 'PATCH',
    });
    const data = await res.json();
    if (data.status === 'success') {
      const notificationItems =
        notificationsList.querySelectorAll('.notification-item');
      notificationItems.forEach((item) => {
        item.classList.remove('unseen');
        item.classList.add('seen');
      });
      fetchUnseenCount();
      showAlert('success', 'All notifications marked as seen');
    }
  } catch (err) {
    console.error('Error marking all notifications as seen:', err);
    showAlert('error', 'Failed to mark notifications as seen');
  }
};

// Handle subscription/unsubscription
const handleSubscription = async (button) => {
  const userId = button.dataset.userId;
  const action = button.dataset.action;

  try {
    const endpoint =
      action === 'subscribe'
        ? `/api/v1/subscriptions/${userId}/subscribe`
        : `/api/v1/subscriptions/${userId}/unsubscribe`;
    const method = action === 'subscribe' ? 'POST' : 'DELETE';

    const res = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();
    if (data.status === 'success') {
      button.dataset.action =
        action === 'subscribe' ? 'unsubscribe' : 'subscribe';
      button.textContent = action === 'subscribe' ? 'Unsubscribe' : 'Subscribe';
      showAlert('success', data.message);
      fetchUnseenCount(); // Refresh notification count in case a subscription notification was added
    } else {
      showAlert('error', data.message);
    }
  } catch (err) {
    console.error(`Error ${action}scribing:`, err);
    showAlert(
      'error',
      `Failed to ${action === 'subscribe' ? 'subscribe' : 'unsubscribe'}`
    );
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (notificationCountElement) {
    fetchUnseenCount();
    // Periodically refresh the count every 30 seconds
    setInterval(fetchUnseenCount, 30000);
  }
  // Mark all notifications as seen
  if (markAllSeenButton) {
    markAllSeenButton.addEventListener('click', markAllAsSeen);
  }

  // Handle subscription buttons
  subscribeButtons.forEach((button) => {
    button.addEventListener('click', () => handleSubscription(button));
  });
});
