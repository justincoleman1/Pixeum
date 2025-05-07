/*eslint-disable*/
import { showAlert } from '../front/alerts';

export const toggleReaction = async (username, slug, reactionType) => {
  try {
    console.log(
      `Toggling reaction: ${reactionType} for upload: ${username}/${slug}`
    );
    const res = await fetch(`/api/v1/uploads/${username}/${slug}/reactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reactionType }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to toggle reaction');
    }

    const data = await res.json();
    if (data.status === 'success') {
      console.log('Reaction toggled successfully:', data.data);
      return data;
    } else {
      throw new Error('Unexpected response from server');
    }
  } catch (err) {
    console.error('Error toggling reaction:', err);
    showAlert('error', err.message);
    throw err;
  }
};

// Initialize reaction button event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize if on the upload page with reactions section
  const reactionsSection = document.querySelector(
    '.comments-section-reactions'
  );
  if (!reactionsSection) return;

  const reactionButtons = document.querySelectorAll(
    '.comments-reaction-button'
  );
  // Extract username and slug from URL (e.g., /api/v1/uploads/:username/:slug)
  const pathParts = window.location.pathname.split('/');
  const username = pathParts[1]; // /api/v1/uploads/:username/:slug -> index 3
  const slug = pathParts[2]; // index 4

  if (!username || !slug) {
    console.error('Failed to extract username or slug from URL');
    return;
  }

  reactionButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      const reactionType = button.dataset.reaction;
      const countElement = document.querySelector(
        `#comment-${reactionType}-count`
      );
      const totalReactionsElement = document.querySelector('.csrp');

      try {
        const response = await toggleReaction(username, slug, reactionType);

        const { action, data } = response;
        const newCount = data[`${reactionType}Count`];
        const newTotal = data.totalReactions;

        // Update the reaction count
        countElement.textContent = newCount;
        countElement.dataset.count = newCount;

        // Update the total reactions
        totalReactionsElement.textContent = `${newTotal} responses`;
        totalReactionsElement.dataset.totalReactions = newTotal;

        // Toggle the 'reacted' class on the button
        if (action === 'added') {
          button.classList.add('reacted');
          showAlert('success', `Added ${reactionType} reaction!`);
        } else {
          button.classList.remove('reacted');
          showAlert('success', `Removed ${reactionType} reaction!`);
        }
      } catch (err) {
        // Error is already handled in toggleReaction with showAlert
      }
    });
  });
});
