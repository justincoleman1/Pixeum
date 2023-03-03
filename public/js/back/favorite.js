import axios from 'axios';
import { showAlert } from '../front/alerts';

export const handleFavorite = async (choice) => {
  const headers = {
    Authorization: `Bearer ${localStorage.getItem('jwt')}`,
  };

  const urlParts = window.location.pathname.split('/');
  const username = urlParts[urlParts.length - 2];
  const slug = urlParts[urlParts.length - 1];
  try {
    const response = await axios.get('/me', {}, headers);
    if (response.status === 200) {
      try {
        const res = await axios.post(
          `/api/v1/uploads/${username}/${slug}/favorite`,
          {},
          headers
        );
        if (res.data.status === 'success') {
          showAlert('success', res.data.message);
          return true;
        }
      } catch (err) {
        console.log(err);
      }
    }
  } catch (err) {
    const currentUrl = window.location.href;
    window.location.href = `/login?redirect=${encodeURIComponent(currentUrl)}`;
  }
};
