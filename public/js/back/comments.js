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

// Function to toggle bold on selected text in a content-editable editor// Function to toggle bold on selected text in a content-editable editor
function toggleBold(editor) {
  const selection = window.getSelection();
  if (!selection.rangeCount) return; // No selection

  const range = selection.getRangeAt(0);
  const selectedText = range.toString();

  if (!selectedText) return; // No text selected

  // Get the common ancestor and check for existing formatting
  let parent = range.commonAncestorContainer;
  if (parent.nodeType === 3) {
    // Text node
    parent = parent.parentNode;
  }

  const isAlreadyBold = parent.closest('strong') !== null;
  const isItalic = parent.closest('em') !== null;
  const isStrikethrough = parent.closest('s') !== null;
  const isLink = parent.closest('a') !== null;
  const isSpoiler = parent.closest('span.spoiler') !== null;

  if (isAlreadyBold) {
    // If already bold, unwrap the <strong> tag while preserving other formatting
    const strongElement = parent.closest('strong');
    const fragment = document.createDocumentFragment();
    Array.from(strongElement.childNodes).forEach((node) => {
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        (node.nodeName === 'EM' ||
          node.nodeName === 'S' ||
          node.nodeName === 'A' ||
          (node.nodeName === 'SPAN' && node.classList.contains('spoiler')))
      ) {
        fragment.appendChild(node.cloneNode(true));
      } else {
        fragment.appendChild(node.cloneNode(true));
      }
    });
    strongElement.parentNode.replaceChild(fragment, strongElement);
  } else {
    // If not bold, wrap the selection in a <strong> tag while preserving other formatting
    const strongElement = document.createElement('strong');
    const contents = range.extractContents();
    // Reapply existing formatting
    let contentToWrap = contents;
    if (isSpoiler) {
      const spoilerElement = document.createElement('span');
      spoilerElement.className = 'spoiler';
      spoilerElement.appendChild(contentToWrap);
      contentToWrap = spoilerElement;
    }
    if (isLink) {
      const aElement = document.createElement('a');
      aElement.href = parent.closest('a').href;
      aElement.target = '_blank';
      aElement.rel = 'noopener noreferrer';
      aElement.appendChild(contentToWrap);
      contentToWrap = aElement;
    }
    if (isStrikethrough) {
      const sElement = document.createElement('s');
      sElement.appendChild(contentToWrap);
      contentToWrap = sElement;
    }
    if (isItalic) {
      const emElement = document.createElement('em');
      emElement.appendChild(contentToWrap);
      contentToWrap = emElement;
    }
    strongElement.appendChild(contentToWrap);
    range.insertNode(strongElement);
  }

  // Restore the selection
  const newRange = document.createRange();
  newRange.setStart(range.startContainer, range.startOffset);
  newRange.setEnd(range.endContainer, range.endOffset);
  selection.removeAllRanges();
  selection.addRange(newRange);

  // Ensure the editor remains focused
  editor.focus();
}

// Function to toggle italics on selected text in a content-editable editor
function toggleItalics(editor) {
  const selection = window.getSelection();
  if (!selection.rangeCount) return; // No selection

  const range = selection.getRangeAt(0);
  const selectedText = range.toString();

  if (!selectedText) return; // No text selected

  // Get the common ancestor and check for existing formatting
  let parent = range.commonAncestorContainer;
  if (parent.nodeType === 3) {
    // Text node
    parent = parent.parentNode;
  }

  const isAlreadyItalic = parent.closest('em') !== null;
  const isBold = parent.closest('strong') !== null;
  const isStrikethrough = parent.closest('s') !== null;
  const isLink = parent.closest('a') !== null;
  const isSpoiler = parent.closest('span.spoiler') !== null;

  if (isAlreadyItalic) {
    // If already italic, unwrap the <em> tag while preserving other formatting
    const emElement = parent.closest('em');
    const fragment = document.createDocumentFragment();
    Array.from(emElement.childNodes).forEach((node) => {
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        (node.nodeName === 'STRONG' ||
          node.nodeName === 'S' ||
          node.nodeName === 'A' ||
          (node.nodeName === 'SPAN' && node.classList.contains('spoiler')))
      ) {
        fragment.appendChild(node.cloneNode(true));
      } else {
        fragment.appendChild(node.cloneNode(true));
      }
    });
    emElement.parentNode.replaceChild(fragment, emElement);
  } else {
    // If not italic, wrap the selection in an <em> tag while preserving other formatting
    const emElement = document.createElement('em');
    const contents = range.extractContents();
    // Reapply existing formatting
    let contentToWrap = contents;
    if (isSpoiler) {
      const spoilerElement = document.createElement('span');
      spoilerElement.className = 'spoiler';
      spoilerElement.appendChild(contentToWrap);
      contentToWrap = spoilerElement;
    }
    if (isLink) {
      const aElement = document.createElement('a');
      aElement.href = parent.closest('a').href;
      aElement.target = '_blank';
      aElement.rel = 'noopener noreferrer';
      aElement.appendChild(contentToWrap);
      contentToWrap = aElement;
    }
    if (isStrikethrough) {
      const sElement = document.createElement('s');
      sElement.appendChild(contentToWrap);
      contentToWrap = sElement;
    }
    if (isBold) {
      const strongElement = document.createElement('strong');
      strongElement.appendChild(contentToWrap);
      contentToWrap = strongElement;
    }
    emElement.appendChild(contentToWrap);
    range.insertNode(emElement);
  }

  // Restore the selection
  const newRange = document.createRange();
  newRange.setStart(range.startContainer, range.startOffset);
  newRange.setEnd(range.endContainer, range.endOffset);
  selection.removeAllRanges();
  selection.addRange(newRange);

  // Ensure the editor remains focused
  editor.focus();
}

// Function to toggle strikethrough on selected text in a content-editable editor
function toggleStrikethrough(editor) {
  const selection = window.getSelection();
  if (!selection.rangeCount) return; // No selection

  const range = selection.getRangeAt(0);
  const selectedText = range.toString();

  if (!selectedText) return; // No text selected

  // Get the common ancestor and check for existing formatting
  let parent = range.commonAncestorContainer;
  if (parent.nodeType === 3) {
    // Text node
    parent = parent.parentNode;
  }

  const isAlreadyStrikethrough = parent.closest('s') !== null;
  const isBold = parent.closest('strong') !== null;
  const isItalic = parent.closest('em') !== null;
  const isLink = parent.closest('a') !== null;
  const isSpoiler = parent.closest('span.spoiler') !== null;

  if (isAlreadyStrikethrough) {
    // If already strikethrough, unwrap the <s> tag while preserving other formatting
    const sElement = parent.closest('s');
    const fragment = document.createDocumentFragment();
    Array.from(sElement.childNodes).forEach((node) => {
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        (node.nodeName === 'STRONG' ||
          node.nodeName === 'EM' ||
          node.nodeName === 'A' ||
          (node.nodeName === 'SPAN' && node.classList.contains('spoiler')))
      ) {
        fragment.appendChild(node.cloneNode(true));
      } else {
        fragment.appendChild(node.cloneNode(true));
      }
    });
    sElement.parentNode.replaceChild(fragment, sElement);
  } else {
    // If not strikethrough, wrap the selection in an <s> tag while preserving other formatting
    const sElement = document.createElement('s');
    const contents = range.extractContents();
    // Reapply existing formatting
    let contentToWrap = contents;
    if (isSpoiler) {
      const spoilerElement = document.createElement('span');
      spoilerElement.className = 'spoiler';
      spoilerElement.appendChild(contentToWrap);
      contentToWrap = spoilerElement;
    }
    if (isLink) {
      const aElement = document.createElement('a');
      aElement.href = parent.closest('a').href;
      aElement.target = '_blank';
      aElement.rel = 'noopener noreferrer';
      aElement.appendChild(contentToWrap);
      contentToWrap = aElement;
    }
    if (isItalic) {
      const emElement = document.createElement('em');
      emElement.appendChild(contentToWrap);
      contentToWrap = emElement;
    }
    if (isBold) {
      const strongElement = document.createElement('strong');
      strongElement.appendChild(contentToWrap);
      contentToWrap = strongElement;
    }
    sElement.appendChild(contentToWrap);
    range.insertNode(sElement);
  }

  // Restore the selection
  const newRange = document.createRange();
  newRange.setStart(range.startContainer, range.startOffset);
  newRange.setEnd(range.endContainer, range.endOffset);
  selection.removeAllRanges();
  selection.addRange(newRange);

  // Ensure the editor remains focused
  editor.focus();
}

// Function to toggle link on selected text in a content-editable editor
function toggleLink(editor) {
  const selection = window.getSelection();
  if (!selection.rangeCount) return; // No selection

  const range = selection.getRangeAt(0);
  const selectedText = range.toString();

  if (!selectedText) return; // No text selected

  // Get the common ancestor and check for existing formatting
  let parent = range.commonAncestorContainer;
  if (parent.nodeType === 3) {
    // Text node
    parent = parent.parentNode;
  }

  const isAlreadyLink = parent.closest('a') !== null;
  const isBold = parent.closest('strong') !== null;
  const isItalic = parent.closest('em') !== null;
  const isStrikethrough = parent.closest('s') !== null;
  const isSpoiler = parent.closest('span.spoiler') !== null;

  if (isAlreadyLink) {
    // If already a link, unwrap the <a> tag while preserving other formatting
    const linkElement = parent.closest('a');
    const fragment = document.createDocumentFragment();
    Array.from(linkElement.childNodes).forEach((node) => {
      fragment.appendChild(node.cloneNode(true));
    });
    linkElement.parentNode.replaceChild(fragment, linkElement);
  } else {
    // Create the <a> tag with href set to the selected text
    const linkElement = document.createElement('a');
    let hrefValue = selectedText.trim();
    // Prepend "https://" if the selected text doesn't start with a protocol
    if (!hrefValue.startsWith('http://') && !hrefValue.startsWith('https://')) {
      hrefValue = 'https://' + hrefValue;
    }
    linkElement.href = hrefValue;
    linkElement.target = '_blank'; // Open in new tab
    linkElement.rel = 'noopener noreferrer'; // Security best practice

    // Extract the selected content and preserve nested formatting
    const contents = range.extractContents();
    let contentToWrap = contents;

    // Reapply existing formatting inside the <a> tag
    if (isSpoiler) {
      const spoilerElement = document.createElement('span');
      spoilerElement.className = 'spoiler';
      spoilerElement.appendChild(contentToWrap);
      contentToWrap = spoilerElement;
    }
    if (isStrikethrough) {
      const sElement = document.createElement('s');
      sElement.appendChild(contentToWrap);
      contentToWrap = sElement;
    }
    if (isItalic) {
      const emElement = document.createElement('em');
      emElement.appendChild(contentToWrap);
      contentToWrap = emElement;
    }
    if (isBold) {
      const strongElement = document.createElement('strong');
      strongElement.appendChild(contentToWrap);
      contentToWrap = strongElement;
    }

    linkElement.appendChild(contentToWrap);
    range.insertNode(linkElement);

    // Add a double-click event listener to edit the href
    linkElement.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const newUrl = prompt(
        'Enter the URL for this link (e.g., https://example.com):',
        linkElement.href
      );
      if (newUrl) {
        let validUrl = newUrl.trim();
        if (
          !validUrl.startsWith('http://') &&
          !validUrl.startsWith('https://')
        ) {
          validUrl = 'https://' + validUrl; // Default to HTTPS if no protocol is specified
        }
        linkElement.href = validUrl;
      }
    });
  }

  // Restore the selection to the original range
  const newRange = document.createRange();
  newRange.setStart(range.startContainer, range.startOffset);
  newRange.setEnd(range.endContainer, range.endOffset);
  selection.removeAllRanges();
  selection.addRange(newRange);

  // Ensure the editor remains focused
  editor.focus();
}
// Function to toggle spoiler on selected text in a content-editable editor
function toggleSpoiler(editor) {
  const selection = window.getSelection();
  if (!selection.rangeCount) return; // No selection

  const range = selection.getRangeAt(0);
  const selectedText = range.toString();

  if (!selectedText) return; // No text selected

  // Get the common ancestor and check for existing formatting
  let parent = range.commonAncestorContainer;
  if (parent.nodeType === 3) {
    // Text node
    parent = parent.parentNode;
  }

  const isAlreadySpoiler = parent.closest('span.spoiler') !== null;
  const isBold = parent.closest('strong') !== null;
  const isItalic = parent.closest('em') !== null;
  const isStrikethrough = parent.closest('s') !== null;
  const isLink = parent.closest('a') !== null;

  if (isAlreadySpoiler) {
    // If already a spoiler, unwrap the <span class="spoiler"> tag while preserving other formatting
    const spoilerElement = parent.closest('span.spoiler');
    const fragment = document.createDocumentFragment();
    Array.from(spoilerElement.childNodes).forEach((node) => {
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        (node.nodeName === 'STRONG' ||
          node.nodeName === 'EM' ||
          node.nodeName === 'S' ||
          node.nodeName === 'A')
      ) {
        fragment.appendChild(node.cloneNode(true));
      } else {
        fragment.appendChild(node.cloneNode(true));
      }
    });
    spoilerElement.parentNode.replaceChild(fragment, spoilerElement);
  } else {
    // If not a spoiler, wrap the selection in a <span class="spoiler"> tag while preserving other formatting
    const spoilerElement = document.createElement('span');
    spoilerElement.className = 'spoiler';
    const contents = range.extractContents();
    // Reapply existing formatting
    let contentToWrap = contents;
    if (isLink) {
      const aElement = document.createElement('a');
      aElement.href = parent.closest('a').href;
      aElement.target = '_blank';
      aElement.rel = 'noopener noreferrer';
      aElement.appendChild(contentToWrap);
      contentToWrap = aElement;
    }
    if (isStrikethrough) {
      const sElement = document.createElement('s');
      sElement.appendChild(contentToWrap);
      contentToWrap = sElement;
    }
    if (isItalic) {
      const emElement = document.createElement('em');
      emElement.appendChild(contentToWrap);
      contentToWrap = emElement;
    }
    if (isBold) {
      const strongElement = document.createElement('strong');
      strongElement.appendChild(contentToWrap);
      contentToWrap = strongElement;
    }
    spoilerElement.appendChild(contentToWrap);
    range.insertNode(spoilerElement);
  }

  // Restore the selection
  const newRange = document.createRange();
  newRange.setStart(range.startContainer, range.startOffset);
  newRange.setEnd(range.endContainer, range.endOffset);
  selection.removeAllRanges();
  selection.addRange(newRange);

  // Ensure the editor remains focused
  editor.focus();
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
const editMediaItemsMap = new Map(); // Map<commentId, Array<{ file, type, fileName, container, isExisting, existingValue, source }>>

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

// Handle bold button click for the main comment form
const boldButton = document.getElementById('comment-bold');
boldButton.addEventListener('click', (e) => {
  e.preventDefault(); // Prevent any default button behavior
  const selection = window.getSelection();
  const isBold =
    selection.rangeCount > 0 &&
    selection
      .getRangeAt(0)
      .commonAncestorContainer.parentNode.closest('strong');
  boldButton.classList.toggle('active', !!isBold);
  toggleBold(editor);
});

// Handle italics button click for the main comment form
const italicsButton = document.getElementById('comment-italics');
italicsButton.addEventListener('click', (e) => {
  e.preventDefault(); // Prevent any default button behavior
  const selection = window.getSelection();
  const isItalic =
    selection.rangeCount > 0 &&
    selection.getRangeAt(0).commonAncestorContainer.parentNode.closest('em');
  italicsButton.classList.toggle('active', !!isItalic);
  toggleItalics(editor);
});

// Handle strikethrough button click for the main comment form
const strikethroughButton = document.getElementById('comment-strikethrough');
strikethroughButton.addEventListener('click', (e) => {
  e.preventDefault(); // Prevent any default button behavior
  const selection = window.getSelection();
  const isStrikethrough =
    selection.rangeCount > 0 &&
    selection.getRangeAt(0).commonAncestorContainer.parentNode.closest('s');
  strikethroughButton.classList.toggle('active', !!isStrikethrough);
  toggleStrikethrough(editor);
});

// Handle link button click for the main comment form
const linkButton = document.getElementById('comment-link');
linkButton.addEventListener('click', (e) => {
  e.preventDefault(); // Prevent any default button behavior
  const selection = window.getSelection();
  const isLink =
    selection.rangeCount > 0 &&
    selection.getRangeAt(0).commonAncestorContainer.parentNode.closest('a');
  linkButton.classList.toggle('active', !!isLink);
  toggleLink(editor);
});

// Handle spoiler button click for the main comment form
const spoilerButton = document.getElementById('comment-spoiler');
spoilerButton.addEventListener('click', (e) => {
  e.preventDefault(); // Prevent any default button behavior
  const selection = window.getSelection();
  const isSpoiler =
    selection.rangeCount > 0 &&
    selection
      .getRangeAt(0)
      .commonAncestorContainer.parentNode.closest('span.spoiler');
  spoilerButton.classList.toggle('active', !!isSpoiler);
  toggleSpoiler(editor);
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
          elements.push({
            type: matchingMedia.type,
            value: matchingMedia.isExisting
              ? matchingMedia.existingValue
              : matchingMedia.fileName,
            file: matchingMedia.file,
            order: elements.length,
            isExisting: matchingMedia.isExisting || false,
            source: matchingMedia.source || 'upload',
          });
        } else {
          const img = node.querySelector('img.media-preview');
          if (img && img.src) {
            console.log(
              `No matching media item, using URL for GIF: ${img.src}`
            );
            elements.push({
              type: 'gif',
              value: img.src,
              file: null,
              order: elements.length,
              isExisting: false,
              source: 'url',
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
    } else if (
      node.nodeName === 'STRONG' ||
      node.nodeName === 'EM' ||
      node.nodeName === 'S' ||
      node.nodeName === 'A' ||
      (node.nodeName === 'SPAN' && node.classList.contains('spoiler'))
    ) {
      // If there's accumulated text before this formatting tag, push it
      if (currentText.trim()) {
        elements.push({
          type: 'text',
          value: currentText.trim(),
          order: elements.length,
        });
        currentText = '';
      }

      // Process children recursively and build the nested tag structure
      const childElements = [];
      let childText = '';
      const children = Array.from(node.childNodes);
      children.forEach((child) => {
        const childState = processNode(
          child,
          childElements,
          mediaItems,
          { text: childText },
          commentId,
          isEditForm
        );
        childText += childState.text;
      });

      // Combine child elements and text
      let formattedText = childText.trim();
      if (childElements.length > 0) {
        // If child elements exist (nested tags), use their values
        formattedText = childElements.map((el) => el.value).join('');
      }

      if (formattedText) {
        const tagName = node.nodeName.toLowerCase();
        if (tagName === 'a') {
          const href = node.getAttribute('href') || '#';
          formattedText = `<a href="${href}" target="_blank" rel="noopener noreferrer">${formattedText}</a>`;
        } else if (tagName === 'span' && node.classList.contains('spoiler')) {
          formattedText = `<span class="spoiler">${formattedText}</span>`;
        } else {
          formattedText = `<${tagName}>${formattedText}</${tagName}>`;
        }
        elements.push({
          type: 'text',
          value: formattedText,
          order: elements.length,
        });
      }

      // Since we've processed the children and wrapped them, do not accumulate their text again
      return { text: currentText };
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
    const boldButton = form.querySelector(`#reply-comment-bold-${commentId}`);
    const italicsButton = form.querySelector(
      `#reply-comment-italics-${commentId}`
    );
    const strikethroughButton = form.querySelector(
      `#reply-comment-strikethrough-${commentId}`
    );
    const linkButton = form.querySelector(`#reply-comment-link-${commentId}`);
    const spoilerButton = form.querySelector(
      `#reply-comment-spoiler-${commentId}`
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

    // Handle bold button click for reply form
    boldButton.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent any default button behavior
      const selection = window.getSelection();
      const isBold =
        selection.rangeCount > 0 &&
        selection
          .getRangeAt(0)
          .commonAncestorContainer.parentNode.closest('strong');
      boldButton.classList.toggle('active', !!isBold);
      toggleBold(replyEditor);
    });

    // Handle italics button click for reply form
    italicsButton.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent any default button behavior
      const selection = window.getSelection();
      const isItalic =
        selection.rangeCount > 0 &&
        selection
          .getRangeAt(0)
          .commonAncestorContainer.parentNode.closest('em');
      italicsButton.classList.toggle('active', !!isItalic);
      toggleItalics(replyEditor);
    });

    // Handle strikethrough button click for reply form
    strikethroughButton.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent any default button behavior
      const selection = window.getSelection();
      const isStrikethrough =
        selection.rangeCount > 0 &&
        selection.getRangeAt(0).commonAncestorContainer.parentNode.closest('s');
      strikethroughButton.classList.toggle('active', !!isStrikethrough);
      toggleStrikethrough(replyEditor);
    });

    // Handle link button click for reply form
    linkButton.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent any default button behavior
      const selection = window.getSelection();
      const isLink =
        selection.rangeCount > 0 &&
        selection.getRangeAt(0).commonAncestorContainer.parentNode.closest('a');
      linkButton.classList.toggle('active', !!isLink);
      toggleLink(replyEditor);
    });

    // Handle spoiler button click for reply form
    spoilerButton.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent any default button behavior
      const selection = window.getSelection();
      const isSpoiler =
        selection.rangeCount > 0 &&
        selection
          .getRangeAt(0)
          .commonAncestorContainer.parentNode.closest('span.spoiler');
      spoilerButton.classList.toggle('active', !!isSpoiler);
      toggleSpoiler(replyEditor);
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
        // Toggle the visibility of the edit form
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

        // Reset media items for this edit form to avoid duplicates
        // Initialize media items for this edit form
        if (!editMediaItemsMap.has(commentId)) {
          editMediaItemsMap.set(commentId, []);
        }
        console.log(`Reset editMediaItemsMap[${commentId}] before populating`);

        // Get the comment elements from the DOM
        const commentElement = document.getElementById(`comment-${commentId}`);
        const elements = JSON.parse(commentElement.dataset.elements);

        // Populate the editor with the comment's elements
        elements.forEach((element) => {
          if (element.type === 'text') {
            // Parse the HTML content to preserve nested tags
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = element.value;

            // Recursively append the parsed nodes to the editor
            const appendNodes = (nodes, target) => {
              nodes.forEach((node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                  target.appendChild(document.createTextNode(node.textContent));
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                  if (node.nodeName === 'STRONG') {
                    const strongElement = document.createElement('strong');
                    appendNodes(Array.from(node.childNodes), strongElement);
                    target.appendChild(strongElement);
                  } else if (node.nodeName === 'EM') {
                    const emElement = document.createElement('em');
                    appendNodes(Array.from(node.childNodes), emElement);
                    target.appendChild(emElement);
                  } else if (node.nodeName === 'S') {
                    const sElement = document.createElement('s');
                    appendNodes(Array.from(node.childNodes), sElement);
                    target.appendChild(sElement);
                  } else if (node.nodeName === 'A') {
                    const aElement = document.createElement('a');
                    aElement.href = node.getAttribute('href') || '#';
                    aElement.target = '_blank';
                    aElement.rel = 'noopener noreferrer';
                    appendNodes(Array.from(node.childNodes), aElement);
                    target.appendChild(aElement);
                    // Add double-click event listener for editing href in the editor
                    aElement.addEventListener('dblclick', (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const newUrl = prompt(
                        'Enter the URL for this link (e.g., https://example.com):',
                        aElement.href
                      );
                      if (newUrl) {
                        let validUrl = newUrl.trim();
                        if (
                          !validUrl.startsWith('http://') &&
                          !validUrl.startsWith('https://')
                        ) {
                          validUrl = 'https://' + validUrl;
                        }
                        aElement.href = validUrl;
                      }
                    });
                  } else if (
                    node.nodeName === 'SPAN' &&
                    node.classList.contains('spoiler')
                  ) {
                    const spoilerElement = document.createElement('span');
                    spoilerElement.className = 'spoiler';
                    appendNodes(Array.from(node.childNodes), spoilerElement);
                    target.appendChild(spoilerElement);
                  }
                }
              });
            };

            appendNodes(Array.from(tempDiv.childNodes), editEditor);

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
                source: element.source || 'upload', // Preserve the source if available
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
                source: element.source || 'upload', // Preserve the source if available
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
    const editBoldButton = form.querySelector(
      `#edit-comment-bold-${commentId}`
    );
    const editItalicsButton = form.querySelector(
      `#edit-comment-italics-${commentId}`
    );
    const editStrikethroughButton = form.querySelector(
      `#edit-comment-strikethrough-${commentId}`
    );
    const editLinkButton = form.querySelector(
      `#edit-comment-link-${commentId}`
    );
    const editSpoilerButton = form.querySelector(
      `#edit-comment-spoiler-${commentId}`
    );
    const editGifButton = form.querySelector(`#edit-comment-gif-${commentId}`);

    // Handle media upload button click
    editUploadButton.addEventListener('click', () => {
      console.log('clicked image button');
      editFileInput.click();
    });

    // Handle bold button click for edit form
    editBoldButton.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent any default button behavior
      const selection = window.getSelection();
      const isBold =
        selection.rangeCount > 0 &&
        selection
          .getRangeAt(0)
          .commonAncestorContainer.parentNode.closest('strong');
      editBoldButton.classList.toggle('active', !!isBold);
      toggleBold(editEditor);
    });

    // Handle italics button click for edit form
    editItalicsButton.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent any default button behavior
      const selection = window.getSelection();
      const isItalic =
        selection.rangeCount > 0 &&
        selection
          .getRangeAt(0)
          .commonAncestorContainer.parentNode.closest('em');
      editItalicsButton.classList.toggle('active', !!isItalic);
      toggleItalics(editEditor);
    });

    // Handle strikethrough button click for edit form
    editStrikethroughButton.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent any default button behavior
      const selection = window.getSelection();
      const isStrikethrough =
        selection.rangeCount > 0 &&
        selection.getRangeAt(0).commonAncestorContainer.parentNode.closest('s');
      editStrikethroughButton.classList.toggle('active', !!isStrikethrough);
      toggleStrikethrough(editEditor);
    });

    // Handle link button click for edit form
    editLinkButton.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent any default button behavior
      const selection = window.getSelection();
      const isLink =
        selection.rangeCount > 0 &&
        selection.getRangeAt(0).commonAncestorContainer.parentNode.closest('a');
      editLinkButton.classList.toggle('active', !!isLink);
      toggleLink(editEditor);
    });

    // Handle spoiler button click for reply form
    editSpoilerButton.addEventListener('click', (e) => {
      e.preventDefault(); // Prevent any default button behavior
      const selection = window.getSelection();
      const isSpoiler =
        selection.rangeCount > 0 &&
        selection
          .getRangeAt(0)
          .commonAncestorContainer.parentNode.closest('span.spoiler');
      editSpoilerButton.classList.toggle('active', !!isSpoiler);
      toggleSpoiler(editEditor);
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

  // Handle click on comment media to open modal, comment-editor clicks, spoiler reveal, and media download
  document.addEventListener('click', (e) => {
    // Skip if the click is on an <a> tag to allow default navigation
    if (e.target.closest('a')) {
      return; // Let the browser handle the link navigation
    }

    // Handle spoiler reveal
    const spoiler = e.target.closest('span.spoiler');
    if (spoiler) {
      spoiler.classList.toggle('revealed');
      return; // Prevent other handlers from firing
    }

    const media = e.target.closest('.comment-media');
    if (media) {
      const modal = document.getElementById('comment-media-modal');
      const modalImage = document.getElementById('comment-media-modal-image');
      const overlay = document.getElementById('comment-media-modal-overlay');
      const modalAvatar = document.querySelector('.modal-commentor-avatar');
      const modalTime = document.querySelector('.modal-commentor-time');
      const modalUsername = document.querySelector('.modal-commentor-username'); // Add this if you want to display the username

      if (!modalAvatar || !modalTime) {
        console.error('Modal elements not found:', { modalAvatar, modalTime });
        return;
      }

      // Populate the modal with the media
      modalImage.src = media.src;

      // Populate commentor info
      const avatarUrl =
        media.dataset.commentorAvatar || '/img/default-avatar.jpg'; // Fallback if avatar is missing
      modalAvatar.src = avatarUrl;

      const username = media.dataset.commentorUsername || 'Unknown User';
      if (modalUsername) {
        modalUsername.textContent = username;
      }

      const sentTime = media.dataset.commentSentTime;
      if (sentTime) {
        const date = new Date(sentTime);
        modalTime.textContent = date.toLocaleString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true,
        }); // e.g., "May 3, 2025, 2:30 PM"
      } else {
        modalTime.textContent = 'Unknown time';
      }

      // Show the modal
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

    // Handle media download
    const downloadButton = e.target.closest(
      '#comment-media-modal-download-btn'
    );
    if (downloadButton) {
      const modalImage = document.getElementById('comment-media-modal-image');
      const imageUrl = modalImage.src;

      // Fetch the image as a blob
      fetch(imageUrl)
        .then((response) => response.blob())
        .then((blob) => {
          // Create a temporary URL for the blob
          const url = window.URL.createObjectURL(blob);
          // Create a temporary link element to trigger the download
          const link = document.createElement('a');
          link.href = url;
          link.download = imageUrl.split('/').pop() || 'media'; // Use the filename from the URL or a default name
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url); // Clean up
        })
        .catch((err) => {
          console.error('Error downloading media:', err);
          showAlert('error', 'Failed to download media. Please try again.');
        });
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
