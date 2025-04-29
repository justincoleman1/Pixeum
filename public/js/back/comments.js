/*eslint-disable*/
import axios from 'axios';
import { showAlert } from '../front/alerts';

const postComment = async (formData, username, slug, parentComment) => {
  try {
    const res = await axios({
      method: 'POST',
      url: `/api/v1/uploads/${username}/${slug}/comments`,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', parentComment ? 'Reply Posted!' : 'Comment Posted!');
      window.setTimeout(() => {
        location.reload();
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

const updateComment = async (commentId, formData, username, slug) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: `/api/v1/uploads/${username}/${slug}/comments/${commentId}`,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Comment Updated!');
      window.setTimeout(() => {
        location.reload();
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

const deleteComment = async (commentId, username, slug) => {
  try {
    const res = await axios({
      method: 'DELETE',
      url: `/api/v1/uploads/${username}/${slug}/comments/${commentId}`,
    });

    if (res.status === 204) {
      showAlert('success', 'Comment Deleted!');
      window.setTimeout(() => {
        location.reload();
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

const likeComment = async (commentId, uploadPath) => {
  try {
    const res = await fetch(
      `/api/v1${uploadPath}/comments/${commentId}/likeComment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await res.json();
    if (data.status === 'success') {
      document.querySelector(`#comment-like_count-${commentId}`).textContent =
        data.data.like_count;
      document.querySelector(
        `#comment-dislike_count-${commentId}`
      ).textContent = data.data.dislike_count;
    } else {
      console.error('Error liking comment:', data.message);
    }
  } catch (err) {
    console.error('Error:', err);
  }
};

const dislikeComment = async (commentId, uploadPath) => {
  try {
    const res = await fetch(
      `/api/v1${uploadPath}/comments/${commentId}/dislikeComment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await res.json();
    if (data.status === 'success') {
      document.querySelector(`#comment-like_count-${commentId}`).textContent =
        data.data.like_count;
      document.querySelector(
        `#comment-dislike_count-${commentId}`
      ).textContent = data.data.dislike_count;
    } else {
      console.error('Error disliking comment:', data.message);
    }
  } catch (err) {
    console.error('Error:', err);
  }
};

var gk_isXlsx = false;
var gk_xlsxFileLookup = {};
var gk_fileData = {};

function filledCell(cell) {
  return cell !== '' && cell != null;
}

function loadFileData(filename) {
  if (gk_isXlsx && gk_xlsxFileLookup[filename]) {
    try {
      var workbook = XLSX.read(gk_fileData[filename], { type: 'base64' });
      var firstSheetName = workbook.SheetNames[0];
      var worksheet = workbook.Sheets[firstSheetName];

      var jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        blankrows: false,
        defval: '',
      });
      var filteredData = jsonData.filter((row) => row.some(filledCell));

      var headerRowIndex = filteredData.findIndex(
        (row, index) =>
          row.filter(filledCell).length >=
          filteredData[index + 1]?.filter(filledCell).length
      );
      if (headerRowIndex === -1 || headerRowIndex > 25) {
        headerRowIndex = 0;
      }

      var csv = XLSX.utils.aoa_to_sheet(filteredData.slice(headerRowIndex));
      csv = XLSX.utils.sheet_to_csv(csv, { header: 1 });
      return csv;
    } catch (e) {
      console.error(e);
      return '';
    }
  }
  return gk_fileData[filename] || '';
}

const form = document.getElementById('comment-form');
const fileInput = document.getElementById('media-upload');
const uploadButton = document.getElementById('comment-image');
const editor = document.getElementById('comment-editor');
let activeTrashButton = null;
// Track media files and their DOM nodes separately
const mediaItems = []; // Array to store { file, container }

// Function to position cursor after an element
function positionCursorAfter(element) {
  const range = document.createRange();
  const selection = window.getSelection();
  range.setStartAfter(element);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  editor.focus();
}

// Function to insert a newline after an element
function insertNewlineAfter(element) {
  const br = document.createElement('br');
  element.insertAdjacentElement('afterend', br);
  positionCursorAfter(br);
}

// Function to create trash button
function createTrashButton(container) {
  const trashButton = document.createElement('button');
  trashButton.className = 'trash-button';
  trashButton.innerHTML = `<img src="/img/svg/trash.svg" class="cbsz" alt="Trash icon">`;
  trashButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Remove the container from the DOM
    container.remove();
    activeTrashButton = null;
    // Remove the <br> element following the container if it exists
    const nextSibling = container.nextSibling;
    if (nextSibling && nextSibling.tagName === 'BR') {
      nextSibling.remove();
    }
    // Remove the media item from mediaItems
    const index = mediaItems.findIndex((item) => item.container === container);
    if (index !== -1) {
      mediaItems.splice(index, 1);
    }
    editor.focus();
  });
  return trashButton;
}

// Function to hide all trash buttons
function hideAllTrashButtons() {
  const trashButtons = editor.querySelectorAll('.trash-button');
  trashButtons.forEach((button) => {
    button.classList.remove('active');
  });
  activeTrashButton = null;
}

// Trigger file input click when custom button is clicked
uploadButton.addEventListener('click', () => {
  fileInput.click();
});

// Handle file selection and embed in editor
fileInput.addEventListener('change', () => {
  const files = fileInput.files;

  for (const file of files) {
    // Create a container div for each media item
    const container = document.createElement('div');
    container.className = 'media-container';
    container.contentEditable = 'false'; // Prevent typing inside the media container

    // Add trash button
    const trashButton = createTrashButton(container);
    container.appendChild(trashButton);

    // Show trash button on container click
    container.addEventListener('click', (e) => {
      e.stopPropagation();
      hideAllTrashButtons();
      trashButton.classList.add('active');
      activeTrashButton = trashButton;
      // Position cursor after the container (after the <br>)
      const nextSibling = container.nextSibling;
      if (nextSibling && nextSibling.tagName === 'BR') {
        positionCursorAfter(nextSibling);
      } else {
        insertNewlineAfter(container);
      }
    });

    // Handle Excel files
    if (file.name.endsWith('.xlsx')) {
      gk_isXlsx = true;
      gk_xlsxFileLookup[file.name] = true;
      const reader = new FileReader();
      reader.onload = (event) => {
        gk_fileData[file.name] = event.target.result.split(',')[1];
        const csv = loadFileData(file.name);
        const pre = document.createElement('pre');
        pre.textContent = csv || 'Error processing Excel file';
        pre.dataset.fileName = file.name; // Store file name for matching
        container.appendChild(pre);
        editor.appendChild(container);
        mediaItems.push({
          file,
          type: 'excel',
          fileName: file.name,
          container,
        });
        insertNewlineAfter(container);
      };
      reader.readAsDataURL(file);
    }
    // Handle images and GIFs
    else if (file.type.startsWith('image/') || file.type === 'image/gif') {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.alt = file.name;
      img.dataset.fileName = file.name;
      img.classList.add('media-preview');
      container.appendChild(img);
      editor.appendChild(container);
      mediaItems.push({
        file,
        type: file.type.includes('gif') ? 'gif' : 'image',
        fileName: file.name,
        container,
      });
      insertNewlineAfter(container);
    } else {
      alert('Please upload only images, GIFs, or Excel (.xlsx) files.');
    }
  }

  // Clear file input
  fileInput.value = '';
});

// Hide trash button when clicking outside media
editor.addEventListener('click', () => {
  hideAllTrashButtons();
  editor.focus();
});

// Recursive function to process nodes and their children
// Recursive function to process nodes and their children
// Recursive function to process nodes and their children
function processNode(node, elements, mediaItems, currentTextState) {
  let currentText = currentTextState.text;

  if (node.nodeType === Node.TEXT_NODE) {
    currentText += node.textContent;
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    if (node.nodeName === 'BR') {
      if (currentText.trim()) {
        elements.push({
          type: 'text',
          value: currentText.trim(),
          order: elements.length,
        });
        currentText = '';
      }
    } else if (
      node.nodeName === 'DIV' &&
      node.classList.contains('media-container')
    ) {
      if (currentText.trim()) {
        elements.push({
          type: 'text',
          value: currentText.trim(),
          order: elements.length,
        });
        currentText = '';
      }
      // Find the matching media item (select the media-preview img, not the trash button img)
      const mediaNode =
        node.querySelector('img.media-preview') || node.querySelector('pre');
      const fileName = mediaNode ? mediaNode.dataset.fileName : null;
      console.log('Found media-container with fileName:', fileName);
      if (fileName) {
        const matchingMedia = mediaItems.find(
          (item) => item.fileName === fileName
        );
        if (matchingMedia) {
          console.log('Matching media found:', matchingMedia);
          elements.push({
            type: matchingMedia.type,
            value: matchingMedia.fileName,
            file: matchingMedia.file,
            order: elements.length,
          });
        } else {
          console.error('No matching media item found for fileName:', fileName);
        }
      } else {
        console.error('No fileName found in media-container');
      }
    } else {
      // If the node has children, treat accumulated text as a separate element
      if (currentText.trim()) {
        elements.push({
          type: 'text',
          value: currentText.trim(),
          order: elements.length,
        });
        currentText = '';
      }
      // Recursively process child nodes
      const children = Array.from(node.childNodes);
      for (let i = 0; i < children.length; i++) {
        const childState = processNode(children[i], elements, mediaItems, {
          text: currentText,
        });
        currentText = childState.text;
      }
    }
  }

  return { text: currentText };
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Build the elements array by parsing editor.innerHTML
  const elements = [];
  let currentText = '';

  // Parse the innerHTML into a DOM structure
  const parser = new DOMParser();
  const doc = parser.parseFromString(
    `<div>${editor.innerHTML}</div>`,
    'text/html'
  );
  const parsedChildren = Array.from(doc.body.firstChild.childNodes); // Get children of the wrapper div

  console.log('Parsed innerHTML:', editor.innerHTML);
  console.log('Parsed children:', parsedChildren);

  // Process each parsed child recursively
  for (let i = 0; i < parsedChildren.length; i++) {
    const state = processNode(parsedChildren[i], elements, mediaItems, {
      text: currentText,
    });
    currentText = state.text;
  }

  // Add any remaining text
  if (currentText.trim()) {
    elements.push({
      type: 'text',
      value: currentText.trim(),
      order: elements.length,
    });
  }

  // Log the ordered elements before sending
  console.log('Ordered Elements Before Sending:', elements);

  // Prepare FormData for Axios request with a separate mediaIndex
  const formData = new FormData();
  formData.append('elements', JSON.stringify(elements));
  let mediaIndex = 0; // Separate counter for media elements
  elements.forEach((element) => {
    if (
      element.type === 'image' ||
      element.type === 'gif' ||
      element.type === 'excel'
    ) {
      formData.append(`media-${mediaIndex}`, element.file);
      mediaIndex++;
    }
  });

  // Get username and slug from URL
  const urlParts = window.location.pathname.split('/');
  const username = urlParts[1];
  const slug = urlParts[2];
  const parentComment = form.dataset.parentId || '';

  // Post Comment to backend
  await postComment(formData, username, slug, parentComment);

  // Reset editor
  editor.innerHTML = '';
  mediaItems.length = 0; // Clear media items
  form.dataset.parentId = ''; // Reset parent ID
});

// Maintain cursor focus after inserting content
editor.addEventListener('click', () => {
  editor.focus();
});

document.addEventListener('DOMContentLoaded', () => {
  const urlParts = window.location.pathname.split('/');
  const username = urlParts[1];
  const slug = urlParts[2];

  // Handle reply buttons
  document.querySelectorAll('.comment-reply-button').forEach((button) => {
    button.addEventListener('click', () => {
      const commentId = button.dataset.commentId;
      const replyForm = document.getElementById(`reply-section-${commentId}`);
      if (replyForm) {
        replyForm.classList.toggle('hidden');
        form.dataset.parentId = commentId;
        document.getElementById(`reply-comment-editor-${commentId}`).focus();
      }
    });
  });

  // Handle reply form submissions
  document.querySelectorAll('.reply-form').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const commentId = form.dataset.commentId;
      const replyEditor = form.querySelector(
        `#reply-comment-editor-${commentId}`
      );
      const replyElements = [];

      // Capture text from reply editor
      const children = Array.from(replyEditor.childNodes);
      let currentText = '';
      for (let i = 0; i < children.length; i++) {
        const node = children[i];
        if (node.nodeType === Node.TEXT_NODE) {
          currentText += node.textContent;
        } else if (node.tagName === 'BR') {
          if (currentText.trim()) {
            replyElements.push({
              type: 'text',
              value: currentText.trim(),
              order: replyElements.length,
            });
            currentText = '';
          }
        }
      }
      if (currentText.trim()) {
        replyElements.push({
          type: 'text',
          value: currentText.trim(),
          order: replyElements.length,
        });
      }

      // Prepare FormData for reply
      const formData = new FormData();
      formData.append('elements', JSON.stringify(replyElements));

      await postComment(formData, username, slug, commentId);

      // Reset reply editor
      replyEditor.innerHTML = '';
      form.classList.add('hidden');
    });
  });

  // Handle edit buttons
  document.querySelectorAll('.comment-edit-button').forEach((button) => {
    button.addEventListener('click', () => {
      const commentId = button.dataset.commentId;
      const editSection = document.getElementById(`edit-section-${commentId}`);
      if (editSection) {
        editSection.classList.toggle('hidden');
        const editEditor = editSection.querySelector(
          `#edit-comment-editor-${commentId}`
        );
        editEditor.focus();
      }
    });
  });

  // Handle edit form submissions
  document.querySelectorAll('.edit-comment-form').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const commentId = form.dataset.commentId;
      const editEditor = form.querySelector(
        `#edit-comment-editor-${commentId}`
      );
      const editElements = [];

      // Capture text from edit editor
      const children = Array.from(editEditor.childNodes);
      let currentText = '';
      for (let i = 0; i < children.length; i++) {
        const node = children[i];
        if (node.nodeType === Node.TEXT_NODE) {
          currentText += node.textContent;
        } else if (node.tagName === 'BR') {
          if (currentText.trim()) {
            editElements.push({
              type: 'text',
              value: currentText.trim(),
              order: editElements.length,
            });
            currentText = '';
          }
        }
      }
      if (currentText.trim()) {
        editElements.push({
          type: 'text',
          value: currentText.trim(),
          order: editElements.length,
        });
      }

      // Prepare FormData for edit
      const formData = new FormData();
      formData.append('elements', JSON.stringify(editElements));

      await updateComment(commentId, formData, username, slug);

      // Reset edit editor
      editEditor.innerHTML = '';
      form.classList.add('hidden');
    });
  });

  // Handle delete buttons
  document.querySelectorAll('.comment-delete-button').forEach((button) => {
    button.addEventListener('click', async () => {
      if (confirm('Are you sure you want to delete this comment?')) {
        const commentId = button.dataset.commentId;
        await deleteComment(commentId, username, slug);
      }
    });
  });

  // Handle click on comment media to open modal and comment-editor clicks
  document.addEventListener('click', (e) => {
    const media = e.target.closest('.comment-media');
    if (media) {
      const modal = document.getElementById('comment-media-modal');
      const modalImage = document.getElementById('comment-media-modal-image');
      const overlay = document.getElementById('comment-media-modal-overlay');

      modalImage.src = media.src;
      modal.classList.remove('hidden');
      overlay.classList.remove('hidden');
    }

    const closeButton = e.target.closest('#comment-media-modal-close-btn');
    const overlay = e.target.closest('#comment-media-modal-overlay');
    if (closeButton || overlay) {
      const modal = document.getElementById('comment-media-modal');
      const modalImage = document.getElementById('comment-media-modal-image');
      const overlay = document.getElementById('comment-media-modal-overlay');

      modal.classList.add('hidden');
      overlay.classList.add('hidden');
      modalImage.src = '';
    }

    // Handle comment bar clicks
    const commentEditor = e.target.closest('.comment-editor');
    if (commentEditor) {
      e.preventDefault();
      commentEditor.style.minHeight = '200px';
    }
  });

  // Upvote and Downvote Functionality
  const likeButtons = document.querySelectorAll('.comment-like-button');
  likeButtons.forEach((button) => {
    button.addEventListener('click', async (e) => {
      console.log('Like Button Clicked');
      const commentId = e.target.closest('button').dataset.commentId;
      const uploadPath = window.location.pathname;
      await likeComment(commentId, uploadPath);
    });
  });

  const dislikeButtons = document.querySelectorAll('.comment-dislike-button');
  dislikeButtons.forEach((button) => {
    button.addEventListener('click', async (e) => {
      const commentId = e.target.closest('button').dataset.commentId;
      const uploadPath = window.location.pathname;
      await dislikeComment(commentId, uploadPath);
    });
  });
});
