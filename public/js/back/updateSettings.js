/* eslint-disable */
import axios from 'axios';
import { showAlert } from '../front/alerts';

// type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
  console.log('trying to update');
  try {
    const url =
      type === 'password'
        ? '/api/v1/users/updatePassword'
        : '/api/v1/users/updateMe';

    const res =
      type === 'password'
        ? await axios({ method: 'PATCH', url, data })
        : await axios({
            method: 'PATCH',
            url,
            data,
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

    if (res.data.status === 'success')
      showAlert('success', `${type.toUpperCase()} updated successfully!`);
    setTimeout(window.location.reload(), 12000);
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
