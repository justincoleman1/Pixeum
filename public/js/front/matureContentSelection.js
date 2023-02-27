const matureContentInput = document.getElementById('mature');
const matureFieldSet = document.getElementById('maturity-field');
const moderateInput = document.getElementById('moderate');
const strictInput = document.getElementById('strict');

// set up event listeners for the maturity checkboxes
matureContentInput.addEventListener('change', (e) => {
  if (!e.target.checked) {
    // if the checkbox is unchecked, hide the associated fieldset and uncheck the strict and moderate checkboxes
    matureFieldSet.classList.add('hidden');
    strictInput.checked = false;
    moderateInput.checked = false;

    document.querySelectorAll('.maturity-option').forEach((option) => {
      option.checked = false;
    });
  } else {
    // if the checkbox is checked, show the associated fieldset and check the moderate checkbox
    matureFieldSet.classList.remove('hidden');
    moderateInput.checked = true;
  }
});

moderateInput.addEventListener('change', (e) => {
  if (!e.target.checked) {
    // if the moderate checkbox is unchecked, check the strict checkbox
    strictInput.checked = true;
  } else {
    // if the moderate checkbox is checked, uncheck the strict checkbox
    strictInput.checked = false;
  }
});

strictInput.addEventListener('change', (e) => {
  if (!e.target.checked) {
    // if the strict checkbox is unchecked, check the moderate checkbox
    moderateInput.checked = true;
  } else {
    // if the strict checkbox is checked, uncheck the moderate checkbox
    moderateInput.checked = false;
  }
});
