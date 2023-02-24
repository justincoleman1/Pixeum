//esversion: 6
// Get the modal container, modal content, and close button
const modalContainer = document.getElementById('imageModal');
const modalContent = document.getElementById('imageModal-content');
const modalCloseBtn = document.getElementById('imageModal-close-btn');
const modalImage = document.getElementById('modal-image');

const mImage = document.getElementById('main-image');

const imageWidth = document
  .querySelector('.image-details')
  .textContent.split(' ')[0];

const zoomInOnMax = (image, maxZoomFactor) => {
  image.onclick = function () {
    if (image.classList.contains('W8uuV')) {
      image.classList.remove('W8uuV');
      image.classList.add('_28Iam');
      image.style.maxWidth = maxZoomFactor + 'px';
    } else {
      image.classList.add('W8uuV');
      image.classList.remove('_28Iam');
      image.style.maxWidth = null;
    }
  };
};

// Add a click event listener to the open modal button
mImage.addEventListener('click', function () {
  // Show the modal container
  modalContainer.style.display = 'block';
  document.body.classList.add('modal-open');
});

// Add a click event listener to the modal close button
modalCloseBtn.addEventListener('click', function () {
  // Hide the modal container
  modalContainer.style.display = 'none';
  document.body.classList.remove('modal-open');
});

zoomInOnMax(modalImage, imageWidth);
