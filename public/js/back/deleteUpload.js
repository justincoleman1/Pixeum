import axios from 'axios';

export const delete_art = async (username, slug) => {
  try {
    const response = await axios.delete(`/api/v1/uploads/${username}/${slug}`);
    if (response.data.status === 'success') {
      return response.data;
    } else {
      throw new Error('Failed to delete upload');
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
};
