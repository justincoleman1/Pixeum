/*eslint-disable*/
import axios from 'axios';
import { showAlert } from '../front/alerts';

export const submit_art = async (media, title, description, tags, maturity) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/uploads/submission',
      data: {
        media,
        title,
        description,
        tags,
        maturity,
      },
      headers: {
        'Content-Type': 'multipart/form-data',
        // 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Upload successful!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
