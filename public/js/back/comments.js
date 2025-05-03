/*eslint-disable*/
import axios from 'axios';
import { showAlert } from '../front/alerts';
import { openGifPicker } from './gifPicker';

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
const mediaItems = []; // Array to store { file, type, fileName, container }
// Track media items for each reply form using a Map
const replyMediaItemsMap = new Map(); // Map<commentId, Array<{ file, type, fileName, container }>>
// Track media items for each edit form using a Map
const editMediaItemsMap = new Map(); // Map<commentId, Array<{ file, type, fileName, container, isExisting, existingValue }>>
// Object to store cleanup functions for GIF pickers
const gifPickerCleanups = {
  main: null, // For gif-picker-main
  reply: new Map(), // Map<commentId, cleanupFunction> for reply forms
  edit: new Map(), // Map<commentId, cleanupFunction> for edit forms
};

// Function to position cursor after an element
function positionCursorAfter(element) {
  const range = document.createRange();
  const selection = window.getSelection();
  range.setStartAfter(element);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  element.focus();
}

// Function to insert a newline after an element
function insertNewlineAfter(element) {
  const br = document.createElement('br');
  element.insertAdjacentElement('afterend', br);
  positionCursorAfter(br);
}

// Function to create trash button for main comment form
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
      console.log(`Removed media item from mediaItems:`, mediaItems);
    }
    editor.focus();
  });
  return trashButton;
}

// Function to create trash button for reply media
function createReplyTrashButton(container, commentId) {
  const trashButton = document.createElement('button');
  trashButton.className = 'trash-button';
  trashButton.innerHTML = `<img src="/img/svg/trash.svg" class="cbsz" alt="Trash icon">`;
  trashButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Remove the container from the DOM
    container.remove();
    // Remove the <br> element following the container if it exists
    const nextSibling = container.nextSibling;
    if (nextSibling && nextSibling.tagName === 'BR') {
      nextSibling.remove();
    }
    // Remove the media item from replyMediaItemsMap
    const mediaItems = replyMediaItemsMap.get(commentId) || [];
    const index = mediaItems.findIndex((item) => item.container === container);
    if (index !== -1) {
      mediaItems.splice(index, 1);
      replyMediaItemsMap.set(commentId, mediaItems);
      console.log(
        `Media item removed from replyMediaItemsMap[${commentId}]:`,
        mediaItems
      );
    }
    container.focus();
  });
  return trashButton;
}

// Function to create trash button for edit media
function createEditTrashButton(container, commentId) {
  const trashButton = document.createElement('button');
  trashButton.className = 'trash-button';
  trashButton.innerHTML = `<img src="/img/svg/trash.svg" class="cbsz" alt="Trash icon">`;
  trashButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Remove the container from the DOM
    container.remove();
    // Remove the <br> element following the container if it exists
    const nextSibling = container.nextSibling;
    if (nextSibling && nextSibling.tagName === 'BR') {
      nextSibling.remove();
    }
    // Remove the media item from editMediaItemsMap
    const mediaItems = editMediaItemsMap.get(commentId) || [];
    const index = mediaItems.findIndex((item) => item.container === container);
    if (index !== -1) {
      mediaItems.splice(index, 1);
      editMediaItemsMap.set(commentId, mediaItems);
      console.log(
        `Media item removed from editMediaItemsMap[${commentId}]:`,
        mediaItems
      );
    }
    container.focus();
  });
  return trashButton;
}

// Function to hide all trash buttons in a specific editor
function hideAllTrashButtons(targetEditor) {
  const trashButtons = targetEditor.querySelectorAll('.trash-button');
  trashButtons.forEach((button) => {
    button.classList.remove('active');
  });
  activeTrashButton = null;
}

// Function to insert a GIF into the editor
function insertGifIntoEditor(editor, gifUrl, mediaItemsMap, commentId = null) {
  // Create a container div for the GIF
  const container = document.createElement('div');
  container.className = 'media-container';
  container.contentEditable = 'false'; // Prevent typing inside the media container

  // Create the GIF image element
  const img = document.createElement('img');
  img.src = gifUrl;
  img.alt = 'GIF';
  img.dataset.fileName = gifUrl;
  img.classList.add('media-preview');
  container.appendChild(img);

  // Add highlight effect
  container.classList.add('gif-highlight');

  // Add trash button
  const trashButton = commentId
    ? (mediaItemsMap === replyMediaItemsMap
        ? createReplyTrashButton
        : createEditTrashButton)(container, commentId)
    : createTrashButton(container);
  container.appendChild(trashButton);

  // Show trash button on container click
  container.addEventListener('click', (e) => {
    e.stopPropagation();
    hideAllTrashButtons(editor);
    trashButton.classList.add('active');
    const nextSibling = container.nextSibling;
    if (nextSibling && nextSibling.tagName === 'BR') {
      positionCursorAfter(nextSibling);
    } else {
      insertNewlineAfter(container);
    }
  });

  // Add the container to the editor
  editor.appendChild(container);
  insertNewlineAfter(container);

  // Add the GIF to the appropriate mediaItems map
  if (mediaItemsMap) {
    const mediaItems = mediaItemsMap.get(commentId) || [];
    mediaItems.push({
      type: 'gif',
      fileName: gifUrl,
      container,
      file: null, // No file object since it's a URL
      isExisting: false,
      source: 'url', // Indicate this is a URL-based GIF
    });
    mediaItemsMap.set(commentId, mediaItems);
    console.log(
      `Added GIF to ${
        mediaItemsMap === replyMediaItemsMap
          ? 'replyMediaItemsMap'
          : 'editMediaItemsMap'
      }[${commentId}]:`,
      mediaItems
    );
  } else {
    mediaItems.push({
      type: 'gif',
      fileName: gifUrl,
      container,
      file: null,
      source: 'url', // Indicate this is a URL-based GIF
    });
    console.log(`Added GIF to mediaItems:`, mediaItems);
  }

  // Focus the editor
  editor.focus();
}

// Trigger file input click when custom button is clicked
uploadButton.addEventListener('click', () => {
  fileInput.click();
});

// Handle GIF button click for the main comment form
const gifButton = document.getElementById('comment-gif');
gifButton.addEventListener('click', () => {
  const containerId = 'gif-picker-main';
  const container = document.getElementById(containerId);
  const tenorApiKey = form.dataset.tenorApiKey;
  const clientKey = 'pixeum'; // Custom client key for Pixeum
  if (!tenorApiKey) {
    console.error('Tenor API key is missing for main comment form');
    alert('Unable to load GIF picker: API key is missing.');
    return;
  }

  // Toggle the visibility of the GIF picker
  const isVisible = container.style.display === 'block';
  if (isVisible) {
    // If the GIF picker is visible, hide it and clean up
    container.style.display = 'none';
    if (gifPickerCleanups.main) {
      gifPickerCleanups.main(); // Unmount the GIF picker
      gifPickerCleanups.main = null; // Clear the cleanup function
    }
  } else {
    // If the GIF picker is not visible, show it and render the picker
    container.style.display = 'block';
    const cleanup = openGifPicker(
      containerId,
      tenorApiKey,
      clientKey,
      (gifUrl) => {
        insertGifIntoEditor(editor, gifUrl, null);
        container.style.display = 'none'; // Hide the container after selection
        gifPickerCleanups.main = null; // Clear the cleanup function after selection
      }
    );
    gifPickerCleanups.main = cleanup; // Store the cleanup function
  }
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
      hideAllTrashButtons(editor);
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
          source: 'upload', // Indicate this is a file upload
        });
        console.log(`Added Excel to mediaItems:`, mediaItems);
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
        source: 'upload', // Indicate this is a file upload
      });
      console.log(`Added image/GIF to mediaItems:`, mediaItems);
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
  hideAllTrashButtons(editor);
  editor.focus();
});

// Recursive function to process nodes and their children
function processNode(
  node,
  elements,
  mediaItems,
  currentTextState,
  commentId = null,
  isEditForm = false
) {
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
        // Determine which mediaItems to use based on context
        let mediaItemsToUse;
        if (isEditForm) {
          mediaItemsToUse = editMediaItemsMap.get(commentId) || [];
        } else if (commentId) {
          mediaItemsToUse = replyMediaItemsMap.get(commentId) || [];
        } else {
          mediaItemsToUse = mediaItems;
        }
        console.log(
          `Using mediaItemsToUse for ${
            isEditForm ? 'edit' : commentId ? 'reply' : 'main'
          } form:`,
          mediaItemsToUse
        );
        const matchingMedia = mediaItemsToUse.find(
          (item) => item.fileName === fileName
        );
        if (matchingMedia) {
          console.log('Matching media found:', matchingMedia);
          // For edit form, include existingValue for existing media to preserve the server-side path
          elements.push({
            type: matchingMedia.type,
            value: matchingMedia.isExisting
              ? matchingMedia.existingValue
              : matchingMedia.fileName,
            file: matchingMedia.file, // Will be null for existing media or URL-based GIFs
            order: elements.length,
            isExisting: matchingMedia.isExisting || false,
            source: matchingMedia.source || 'upload', // Include source (url or upload)
          });
        } else {
          // If no matching media item is found, treat it as a URL-based GIF (e.g., from the GIF picker)
          const img = node.querySelector('img.media-preview');
          if (img && img.src) {
            console.log(
              `No matching media item, using URL for GIF: ${img.src}`
            );
            elements.push({
              type: 'gif',
              value: img.src, // Use the GIF URL directly
              file: null, // No file object since it's a URL
              order: elements.length,
              isExisting: false,
              source: 'url', // Indicate this is a URL-based GIF
            });
          } else {
            console.warn(
              `No matching media item found for fileName: ${fileName}. Skipping this media element.`
            );
          }
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
        const childState = processNode(
          children[i],
          elements,
          mediaItems,
          { text: currentText },
          commentId,
          isEditForm
        );
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
  const parsedChildren = Array.from(doc.body.firstChild.childNodes);

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
      (element.type === 'image' ||
        element.type === 'gif' ||
        element.type === 'excel') &&
      element.source === 'upload'
    ) {
      if (element.file) {
        formData.append(`media-${mediaIndex}`, element.file);
        mediaIndex++;
      }
    }
  });

  // Get username and slug from URL
  const urlParts = window.location.pathname.split('/');
  const username = urlParts[1];
  const slug = urlParts[2];
  const parentComment = form.dataset.parentId || '';

  // Append parentComment to formData
  if (parentComment) {
    formData.append('parentComment', parentComment);
  }

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
    const commentId = form.dataset.commentId;
    const replyEditor = form.querySelector(
      `#reply-comment-editor-${commentId}`
    );
    const fileInput = form.querySelector(`#reply-media-upload-${commentId}`);
    const uploadButton = form.querySelector(
      `#reply-comment-image-${commentId}`
    );
    const gifButton = form.querySelector(`#reply-comment-gif-${commentId}`);

    // Initialize media items for this reply form
    if (!replyMediaItemsMap.has(commentId)) {
      replyMediaItemsMap.set(commentId, []);
    }

    // Handle media upload button click
    uploadButton.addEventListener('click', () => {
      fileInput.click();
    });

    // Handle GIF button click for reply form
    gifButton.addEventListener('click', () => {
      const containerId = `gif-picker-reply-${commentId}`;
      const container = document.getElementById(containerId);
      const tenorApiKey = form.dataset.tenorApiKey;
      const clientKey = 'pixeum'; // Custom client key for Pixeum
      if (!tenorApiKey) {
        console.error('Tenor API key is missing for reply form');
        alert('Unable to load GIF picker: API key is missing.');
        return;
      }

      // Toggle the visibility of the GIF picker
      const isVisible = container.style.display === 'block';
      if (isVisible) {
        // If the GIF picker is visible, hide it and clean up
        container.style.display = 'none';
        const cleanup = gifPickerCleanups.reply.get(commentId);
        if (cleanup) {
          cleanup(); // Unmount the GIF picker
          gifPickerCleanups.reply.delete(commentId); // Clear the cleanup function
        }
      } else {
        // If the GIF picker is not visible, show it and render the picker
        container.style.display = 'block';
        const cleanup = openGifPicker(
          containerId,
          tenorApiKey,
          clientKey,
          (gifUrl) => {
            insertGifIntoEditor(
              replyEditor,
              gifUrl,
              replyMediaItemsMap,
              commentId
            );
            container.style.display = 'none'; // Hide the container after selection
            gifPickerCleanups.reply.delete(commentId); // Clear the cleanup function after selection
          }
        );
        gifPickerCleanups.reply.set(commentId, cleanup); // Store the cleanup function
      }
    });

    // Handle file selection and embed in reply editor
    fileInput.addEventListener('change', () => {
      const files = fileInput.files;
      const mediaItems = replyMediaItemsMap.get(commentId);

      for (const file of files) {
        // Create a container div for each media item
        const container = document.createElement('div');
        container.className = 'media-container';
        container.contentEditable = 'false'; // Prevent typing inside the media container

        // Add trash button
        const trashButton = createReplyTrashButton(container, commentId);
        container.appendChild(trashButton);

        // Show trash button on container click
        container.addEventListener('click', (e) => {
          e.stopPropagation();
          hideAllTrashButtons(replyEditor);
          trashButton.classList.add('active');
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
            replyEditor.appendChild(container);
            mediaItems.push({
              file,
              type: 'excel',
              fileName: file.name,
              container,
              source: 'upload', // Indicate this is a file upload
            });
            replyMediaItemsMap.set(commentId, mediaItems);
            console.log(
              `Added Excel to replyMediaItemsMap[${commentId}]:`,
              mediaItems
            );
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
          replyEditor.appendChild(container);
          mediaItems.push({
            file,
            type: file.type.includes('gif') ? 'gif' : 'image',
            fileName: file.name,
            container,
            source: 'upload', // Indicate this is a file upload
          });
          replyMediaItemsMap.set(commentId, mediaItems);
          console.log(
            `Added image/GIF to replyMediaItemsMap[${commentId}]:`,
            mediaItems
          );
          insertNewlineAfter(container);
        } else {
          alert('Please upload only images, GIFs, or Excel (.xlsx) files.');
        }
      }

      // Clear file input
      fileInput.value = '';
    });

    // Hide trash buttons when clicking outside media
    replyEditor.addEventListener('click', () => {
      hideAllTrashButtons(replyEditor);
      replyEditor.focus();
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const replyElements = [];

      // Parse the reply editor's innerHTML into a DOM structure
      const parser = new DOMParser();
      const doc = parser.parseFromString(
        `<div>${replyEditor.innerHTML}</div>`,
        'text/html'
      );
      const parsedChildren = Array.from(doc.body.firstChild.childNodes);

      console.log(
        `Parsed reply innerHTML for comment ${commentId}:`,
        replyEditor.innerHTML
      );
      console.log(
        `Parsed reply children for comment ${commentId}:`,
        parsedChildren
      );

      let currentText = '';
      // Process each parsed child recursively, passing the commentId
      for (let i = 0; i < parsedChildren.length; i++) {
        const state = processNode(
          parsedChildren[i],
          replyElements,
          mediaItems,
          { text: currentText },
          commentId
        );
        currentText = state.text;
      }

      // Add any remaining text
      if (currentText.trim()) {
        replyElements.push({
          type: 'text',
          value: currentText.trim(),
          order: replyElements.length,
        });
      }

      // Prepare FormData for reply with a separate mediaIndex
      const formData = new FormData();
      formData.append('elements', JSON.stringify(replyElements));
      let mediaIndex = 0; // Separate counter for media elements
      replyElements.forEach((element) => {
        if (
          (element.type === 'image' ||
            element.type === 'gif' ||
            element.type === 'excel') &&
          element.source === 'upload'
        ) {
          if (element.file) {
            formData.append(`media-${mediaIndex}`, element.file);
            mediaIndex++;
          }
        }
      });

      // Append parentComment to formData
      if (commentId) {
        formData.append('parentComment', commentId);
      }

      await postComment(formData, username, slug, commentId);

      // Reset reply editor
      replyEditor.innerHTML = '';
      replyMediaItemsMap.set(commentId, []); // Clear media items for this reply form
      form.classList.add('hidden');
    });
  });

  // Handle edit buttons
  document.querySelectorAll('.comment-edit-button').forEach((button) => {
    button.addEventListener('click', () => {
      console.log('EDIT BUTTON CLICKED');
      const commentId = button.dataset.commentId;
      const editSection = document.getElementById(`edit-section-${commentId}`);
      if (editSection) {
        editSection.classList.toggle('hidden');
        // If the form is being hidden, clear the editMediaItemsMap for this comment
        if (editSection.classList.contains('hidden')) {
          editMediaItemsMap.set(commentId, []);
          console.log(`Cleared editMediaItemsMap[${commentId}] on form close`);
          // Clean up any open GIF picker for this edit form
          const editGifContainer = document.getElementById(
            `gif-picker-edit-${commentId}`
          );
          if (editGifContainer && editGifContainer.style.display === 'block') {
            editGifContainer.style.display = 'none';
            const cleanup = gifPickerCleanups.edit.get(commentId);
            if (cleanup) {
              cleanup(); // Unmount the GIF picker
              gifPickerCleanups.edit.delete(commentId); // Clear the cleanup function
            }
          }
          return; // Exit early since we're closing the form
        }
        const editEditor = editSection.querySelector(
          `#edit-comment-editor-${commentId}`
        );

        // Clear the editor before populating
        editEditor.innerHTML = '';

        // Initialize media items for this edit form
        if (!editMediaItemsMap.has(commentId)) {
          editMediaItemsMap.set(commentId, []);
        }

        // Get the comment elements from the DOM
        const commentElement = document.getElementById(`comment-${commentId}`);
        const elements = JSON.parse(commentElement.dataset.elements);

        // Populate the editor with the comment's elements
        elements.forEach((element) => {
          if (element.type === 'text') {
            // Add text element
            const textNode = document.createTextNode(element.value);
            editEditor.appendChild(textNode);
            const br = document.createElement('br');
            editEditor.appendChild(br);
          } else if (
            element.type === 'image' ||
            element.type === 'gif' ||
            element.type === 'excel'
          ) {
            // Add media element
            const container = document.createElement('div');
            container.className = 'media-container';
            container.contentEditable = 'false';

            // Add trash button
            const trashButton = createEditTrashButton(container, commentId);
            container.appendChild(trashButton);

            // Show trash button on container click
            container.addEventListener('click', (e) => {
              e.stopPropagation();
              hideAllTrashButtons(editEditor);
              trashButton.classList.add('active');
              const nextSibling = container.nextSibling;
              if (nextSibling && nextSibling.tagName === 'BR') {
                positionCursorAfter(nextSibling);
              } else {
                insertNewlineAfter(container);
              }
            });

            // Add media content
            if (element.type === 'image' || element.type === 'gif') {
              const img = document.createElement('img');
              img.src = element.value;
              img.alt = element.value.split('/').pop();
              img.dataset.fileName = element.value.split('/').pop();
              img.classList.add('media-preview');
              container.appendChild(img);
              editEditor.appendChild(container);
              // Add to editMediaItemsMap as an existing media item
              editMediaItemsMap.get(commentId).push({
                file: null, // No file object for existing media; server already has it
                type: element.type,
                fileName: element.value.split('/').pop(),
                container,
                isExisting: true, // Flag to indicate this is from the original comment
                existingValue: element.value, // Store the full server-side path
                source: 'upload', // Existing media is assumed to be an upload unless specified
              });
            } else if (element.type === 'excel') {
              const pre = document.createElement('pre');
              pre.textContent = element.value;
              pre.dataset.fileName = 'existing-excel-' + commentId; // Unique identifier for existing Excel
              container.appendChild(pre);
              editEditor.appendChild(container);
              editMediaItemsMap.get(commentId).push({
                file: null,
                type: 'excel',
                fileName: 'existing-excel-' + commentId,
                container,
                isExisting: true,
                existingValue: element.value,
                source: 'upload', // Existing media is assumed to be an upload
              });
            }
            insertNewlineAfter(container);
          }
        });

        console.log(
          `Populated editMediaItemsMap[${commentId}]:`,
          editMediaItemsMap.get(commentId)
        );
        editEditor.focus();
      }
    });
  });

  // Handle edit form submissions
  document.querySelectorAll('.edit-comment-form').forEach((form) => {
    const commentId = form.dataset.commentId;
    const editEditor = form.querySelector(`#edit-comment-editor-${commentId}`);
    const editFileInput = form.querySelector(`#edit-media-upload-${commentId}`);
    const editUploadButton = form.querySelector(
      `#edit-comment-image-${commentId}`
    );
    const editGifButton = form.querySelector(`#edit-comment-gif-${commentId}`);

    // Handle media upload button click
    editUploadButton.addEventListener('click', () => {
      console.log('clicked image button');
      editFileInput.click();
    });

    // Handle GIF button click for edit form
    editGifButton.addEventListener('click', () => {
      const containerId = `gif-picker-edit-${commentId}`;
      const container = document.getElementById(containerId);
      const tenorApiKey = form.dataset.tenorApiKey;
      const clientKey = 'pixeum'; // Custom client key for Pixeum
      if (!tenorApiKey) {
        console.error('Tenor API key is missing for edit form');
        alert('Unable to load GIF picker: API key is missing.');
        return;
      }

      // Toggle the visibility of the GIF picker
      const isVisible = container.style.display === 'block';
      if (isVisible) {
        // If the GIF picker is visible, hide it and clean up
        container.style.display = 'none';
        const cleanup = gifPickerCleanups.edit.get(commentId);
        if (cleanup) {
          cleanup(); // Unmount the GIF picker
          gifPickerCleanups.edit.delete(commentId); // Clear the cleanup function
        }
      } else {
        // If the GIF picker is not visible, show it and render the picker
        container.style.display = 'block';
        const cleanup = openGifPicker(
          containerId,
          tenorApiKey,
          clientKey,
          (gifUrl) => {
            insertGifIntoEditor(
              editEditor,
              gifUrl,
              editMediaItemsMap,
              commentId
            );
            container.style.display = 'none'; // Hide the container after selection
            gifPickerCleanups.edit.delete(commentId); // Clear the cleanup function after selection
          }
        );
        gifPickerCleanups.edit.set(commentId, cleanup); // Store the cleanup function
      }
    });

    // Handle file selection and embed in edit editor
    editFileInput.addEventListener('change', () => {
      const files = editFileInput.files;
      const mediaItems = editMediaItemsMap.get(commentId);

      for (const file of files) {
        // Create a container div for each media item
        const container = document.createElement('div');
        container.className = 'media-container';
        container.contentEditable = 'false'; // Prevent typing inside the media container

        // Add trash button
        const trashButton = createEditTrashButton(container, commentId);
        container.appendChild(trashButton);

        // Show trash button on container click
        container.addEventListener('click', (e) => {
          e.stopPropagation();
          hideAllTrashButtons(editEditor);
          trashButton.classList.add('active');
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
            editEditor.appendChild(container);
            mediaItems.push({
              file,
              type: 'excel',
              fileName: file.name,
              container,
              isExisting: false, // New media added during editing
              source: 'upload', // Indicate this is a file upload
            });
            editMediaItemsMap.set(commentId, mediaItems);
            console.log(
              `Added Excel to editMediaItemsMap[${commentId}]:`,
              mediaItems
            );
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
          editEditor.appendChild(container);
          mediaItems.push({
            file,
            type: file.type.includes('gif') ? 'gif' : 'image',
            fileName: file.name,
            container,
            isExisting: false,
            source: 'upload', // Indicate this is a file upload
          });
          editMediaItemsMap.set(commentId, mediaItems);
          console.log(
            `Added image/GIF to editMediaItemsMap[${commentId}]:`,
            mediaItems
          );
          insertNewlineAfter(container);
        } else {
          alert('Please upload only images, GIFs, or Excel (.xlsx) files.');
        }
      }

      // Clear file input
      editFileInput.value = '';
    });

    // Hide trash buttons when clicking outside media
    editEditor.addEventListener('click', () => {
      hideAllTrashButtons(editEditor);
      editEditor.focus();
    });

    // Handle form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const editElements = [];

      // Parse the edit editor's innerHTML into a DOM structure
      const parser = new DOMParser();
      const doc = parser.parseFromString(
        `<div>${editEditor.innerHTML}</div>`,
        'text/html'
      );
      const parsedChildren = Array.from(doc.body.firstChild.childNodes);

      console.log(
        `Parsed edit innerHTML for comment ${commentId}:`,
        editEditor.innerHTML
      );
      console.log(
        `Parsed edit children for comment ${commentId}:`,
        parsedChildren
      );

      let currentText = '';
      // Process each parsed child recursively, passing the commentId and indicating this is an edit form
      for (let i = 0; i < parsedChildren.length; i++) {
        const state = processNode(
          parsedChildren[i],
          editElements,
          mediaItems,
          { text: currentText },
          commentId,
          true
        );
        currentText = state.text;
      }

      // Add any remaining text
      if (currentText.trim()) {
        editElements.push({
          type: 'text',
          value: currentText.trim(),
          order: editElements.length,
        });
      }

      // Log the ordered elements before sending
      console.log('Ordered Edit Elements Before Sending:', editElements);

      // Prepare FormData for edit with a separate mediaIndex
      const formData = new FormData();
      formData.append('elements', JSON.stringify(editElements));
      let mediaIndex = 0; // Separate counter for media elements
      editElements.forEach((element) => {
        if (
          (element.type === 'image' ||
            element.type === 'gif' ||
            element.type === 'excel') &&
          element.source === 'upload'
        ) {
          if (element.file) {
            formData.append(`media-${mediaIndex}`, element.file);
            mediaIndex++;
          }
        }
      });

      await updateComment(commentId, formData, username, slug);

      // Reset edit editor
      editEditor.innerHTML = '';
      editMediaItemsMap.set(commentId, []); // Clear media items for this edit form
      form.classList.add('hidden');
    });
  });

  // Handle delete buttons
  document.querySelectorAll('.comment-delete-button').forEach((button) => {
    button.addEventListener('click', async () => {
      if (confirm('Are you sure you want to delete this comment?')) {
        const commentId = button.dataset.commentId;
        await deleteComment(commentId, username, slug);
        // Clean up editMediaItemsMap and GIF picker cleanup for this comment
        editMediaItemsMap.delete(commentId);
        console.log(`Removed editMediaItemsMap[${commentId}] after deletion`);
        const cleanup = gifPickerCleanups.edit.get(commentId);
        if (cleanup) {
          cleanup();
          gifPickerCleanups.edit.delete(commentId);
        }
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
