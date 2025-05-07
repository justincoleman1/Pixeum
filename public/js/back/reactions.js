/*eslint-disable*/
import { showAlert } from '../front/alerts';

// Fetch the user's reaction state for the upload
export const getReactionState = async (username, slug) => {
  try {
    console.log(`Fetching reaction state for upload: ${username}/${slug}`);
    const res = await fetch(
      `/api/v1/uploads/${username}/${slug}/reaction-state`
    );
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to fetch reaction state');
    }

    const data = await res.json();
    if (data.status === 'success') {
      console.log('Reaction state fetched successfully:', data.data);
      return data.data;
    } else {
      throw new Error('Unexpected response from server');
    }
  } catch (err) {
    console.error('Error fetching reaction state:', err);
    showAlert('error', err.message);
    throw err;
  }
};

// Toggle a reaction (add or remove)
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
document.addEventListener('DOMContentLoaded', async () => {
  // Only initialize if on the upload page with reactions section
  const reactionsSection = document.querySelector(
    '.comments-section-reactions'
  );
  if (!reactionsSection) return;

  const reactionButtons = document.querySelectorAll(
    '.comments-reaction-button'
  );
  const countElements = document.querySelectorAll('.hidden-count');
  // Extract username and slug from URL (e.g., /api/v1/uploads/:username/:slug)
  const pathParts = window.location.pathname.split('/');
  const username = pathParts[1]; // /api/v1/uploads/:username/:slug -> index 3
  const slug = pathParts[2]; // index 4

  if (!username || !slug) {
    console.error('Failed to extract username or slug from URL');
    return;
  }

  // Fetch the user's reaction state
  let hasReacted = false;
  const reactionState = {};
  try {
    const state = await getReactionState(username, slug);
    hasReacted = state.hasReacted;
    Object.assign(reactionState, state.reactionState);
  } catch (err) {
    // If fetching fails (e.g., user not authenticated), assume hasReacted is false
    hasReacted = false;
  }

  // Show counts if the user has reacted
  if (hasReacted) {
    countElements.forEach((element) => {
      element.classList.remove('hidden-count');
    });
  }

  // Set initial reacted state for buttons
  reactionButtons.forEach((button) => {
    const reactionType = button.dataset.reaction;
    if (reactionState[reactionType]) {
      button.classList.add('reacted');
    }

    button.addEventListener('click', async () => {
      const reactionType = button.dataset.reaction;
      const countElement = document.querySelector(
        `#comment-${reactionType}-count`
      );
      const totalReactionsElement = document.querySelector('.csrp');

      try {
        // Create and animate a duplicate of the reaction image
        const reactionImage = button.querySelector('img');
        const duplicateImage = reactionImage.cloneNode(true);
        duplicateImage.classList.add('animated-reaction');
        button.appendChild(duplicateImage);

        // Remove the duplicate image after the animation completes (0.8s)
        setTimeout(() => {
          duplicateImage.remove();
        }, 800);

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

        // Show all reaction counts if this is the user's first reaction
        if (action === 'added' && !hasReacted) {
          countElements.forEach((element) => {
            element.classList.remove('hidden-count');
          });
          hasReacted = true;
        }
      } catch (err) {
        // Error is already handled in toggleReaction with showAlert
      }
    });
  });
});
