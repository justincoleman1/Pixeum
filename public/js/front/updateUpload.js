//esversion: 6
const uploadData = document
  .querySelector('section#upload-main')
  .getAttribute('data-upload');
const upload = JSON.parse(uploadData);

//---------------------Prefill Display Options-----------------------//
const selectElement = document.getElementById('image-display');
const options = selectElement.options;
const imgSource = document.querySelector('.uploaded-img').src;
// set the original image size option
const img = new Image();
img.onload = function () {
  const originalOption = options[0];
  originalOption.textContent = `Original (${this.width} x ${this.height} pixels)`;
  originalOption.value = 'original';
};
img.src = imgSource;

// check if the uploaded width matches one of the option values
let optionIndex = 0;
for (let i = 1; i < options.length; i++) {
  if (options[i].value == upload.width) {
    optionIndex = i;
    break;
  }
}
// pre-select the matching option or the first option
if (optionIndex >= 1) {
  const selectedOption = options[optionIndex];
  selectedOption.selected = true;
} else {
  options[0].selected = true;
}

//---------------------Prefill Maturity Checkbox Fields-----------------------//
const matureContentInput = document.getElementById('mature');
const matureFieldSet = document.getElementById('maturity-field');
const moderateInput = document.getElementById('moderate');
const strictInput = document.getElementById('strict');

matureContentInput.checked = upload.maturity?.length > 0 || false;
matureFieldSet.classList.toggle('hidden', !matureContentInput.checked);

if (upload.maturity?.[0] === 'moderate') {
  moderateInput.checked = true;
} else {
  strictInput.checked = true;
}

document.querySelectorAll('.maturity-option').forEach((option) => {
  option.checked = upload.maturity?.includes(option.value) || false;
});
