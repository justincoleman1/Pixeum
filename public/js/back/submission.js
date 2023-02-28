/*eslint-disable*/
import axios from 'axios';
import { showAlert } from '../front/alerts';

export const submit_art = async (data) => {
  try {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    const res = await axios.post('/api/v1/uploads/submission', data, config);

    if (res.data.status === 'success') {
      const { username, slug } = res.data;
      showAlert('success', 'Upload successful!');
      window.setTimeout(() => {
        location.assign(`/${username}/${slug}`);
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const update_art = async (data, username, slug) => {
  try {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    console.log(data, username, slug);

    const res = await axios.patch(
      `/api/v1/uploads/${username}/${slug}/update`,
      data,
      config
    );

    if (res.data.status === 'success') {
      const { username, slug } = res.data;
      showAlert('success', 'Update successful!');
      window.setTimeout(() => {
        location.assign(`/${username}/${slug}`);
      }, 1500);
    }
  } catch (err) {
    // showAlert('error', err.response.data.message);
  }
};
