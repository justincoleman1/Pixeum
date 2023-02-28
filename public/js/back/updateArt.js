import axios from 'axios';
import { showAlert } from '../front/alerts';

export const update_art = async (data, username, slug) => {
  try {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    for (const [key, value] of data.entries()) {
      console.log(key, value);
    }

    const res = await axios.patch(
      `/api/v1/uploads/${username}/${slug}/update`,
      data,
      config
    );

    if (res.data.status === 'success') {
      console.log(res.data);
      // const { slug: resSlug } = res.data;
      showAlert('success', 'Update successful!');
      window.setTimeout(() => {
        location.assign(`/${username}/${res.data.resSlug}`);
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
