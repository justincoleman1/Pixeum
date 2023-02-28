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
