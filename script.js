(function () {
  'use strict';

  var dayInput = document.getElementById('dayInput');
  var monthInput = document.getElementById('monthInput');
  var yearInput = document.getElementById('yearInput');
  var daySelect = document.getElementById('daySelect');
  var monthSelect = document.getElementById('monthSelect');
  var yearSelect = document.getElementById('yearSelect');
  var calculateButton = document.getElementById('calculateButton');
  var resetButton = document.getElementById('resetButton');
  var copyButton = document.getElementById('copyButton');
  var errorBox = document.getElementById('errorBox');
  var resultCard = document.getElementById('resultCard');
  var resultText = document.getElementById('resultText');
  var copyStatus = document.getElementById('copyStatus');

  var copyStatusTimer = null;

  if (!dayInput || !monthInput || !yearInput || !daySelect || !monthSelect || !yearSelect || !calculateButton || !resetButton || !copyButton || !errorBox || !resultCard || !resultText || !copyStatus) {
    return;
  }

  function addOption(selectElement, value, text) {
    var option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    selectElement.appendChild(option);
  }

  function populateDaySelect() {
    var day;
    for (day = 1; day <= 31; day += 1) {
      addOption(daySelect, pad2(day), pad2(day));
    }
  }

  function populateMonthSelect() {
    var month;
    for (month = 1; month <= 12; month += 1) {
      addOption(monthSelect, pad2(month), pad2(month));
    }
  }

  function populateYearSelect() {
    var currentYear = new Date().getFullYear();
    var year;
    for (year = currentYear; year >= 1900; year -= 1) {
      addOption(yearSelect, String(year), String(year));
    }
  }

  function pad2(value) {
    var numberValue = parseInt(value, 10);
    if (isNaN(numberValue)) {
      return '';
    }
    return numberValue < 10 ? '0' + numberValue : String(numberValue);
  }

  function sanitizeNumeric(value, maxLength) {
    var cleanValue = String(value || '').replace(/\D/g, '');
    if (typeof maxLength === 'number') {
      cleanValue = cleanValue.slice(0, maxLength);
    }
    return cleanValue;
  }

  function clearCopyStatus() {
    if (copyStatusTimer) {
      window.clearTimeout(copyStatusTimer);
      copyStatusTimer = null;
    }
    copyStatus.textContent = '';
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.remove('hidden');
    resultCard.classList.add('hidden');
    copyButton.disabled = true;
    clearCopyStatus();
  }

  function hideError() {
    errorBox.textContent = '';
    errorBox.classList.add('hidden');
  }

  function showResult(text) {
    resultText.textContent = text;
    resultCard.classList.remove('hidden');
    copyButton.disabled = false;
    clearCopyStatus();
  }

  function clearResult() {
    resultText.textContent = '';
    resultCard.classList.add('hidden');
    copyButton.disabled = true;
    clearCopyStatus();
  }

  function syncSelectFromInput(inputElement, selectElement, type) {
    var rawValue = inputElement.value;
    var numericValue = sanitizeNumeric(rawValue, type === 'year' ? 4 : 2);

    if (numericValue !== rawValue) {
      inputElement.value = numericValue;
    }

    if (numericValue === '') {
      selectElement.value = '';
      return;
    }

    if (type === 'day') {
      if (numericValue.length <= 2) {
        var dayNumber = parseInt(numericValue, 10);
        if (!isNaN(dayNumber) && dayNumber >= 1 && dayNumber <= 31) {
          selectElement.value = pad2(dayNumber);
        } else {
          selectElement.value = '';
        }
      }
      return;
    }

    if (type === 'month') {
      if (numericValue.length <= 2) {
        var monthNumber = parseInt(numericValue, 10);
        if (!isNaN(monthNumber) && monthNumber >= 1 && monthNumber <= 12) {
          selectElement.value = pad2(monthNumber);
        } else {
          selectElement.value = '';
        }
      }
      return;
    }

    if (type === 'year') {
      if (numericValue.length === 4 && selectElement.querySelector('option[value="' + numericValue + '"]')) {
        selectElement.value = numericValue;
      } else {
        selectElement.value = '';
      }
    }
  }

  function syncInputFromSelect(selectElement, inputElement, type) {
    var selectedValue = selectElement.value;
    inputElement.value = selectedValue;

    if (type === 'day' || type === 'month') {
      if (selectedValue !== '') {
        inputElement.value = pad2(selectedValue);
      }
    }
  }

  function formatInputOnBlur(inputElement, type) {
    var cleanValue = sanitizeNumeric(inputElement.value, type === 'year' ? 4 : 2);

    if (cleanValue === '') {
      inputElement.value = '';
      return;
    }

    if (type === 'day' || type === 'month') {
      inputElement.value = pad2(cleanValue);
      return;
    }

    if (type === 'year') {
      inputElement.value = cleanValue;
    }
  }

  function getValidatedDateParts() {
    var dayValue = sanitizeNumeric(dayInput.value, 2);
    var monthValue = sanitizeNumeric(monthInput.value, 2);
    var yearValue = sanitizeNumeric(yearInput.value, 4);

    dayInput.value = dayValue === '' ? '' : pad2(dayValue);
    monthInput.value = monthValue === '' ? '' : pad2(monthValue);
    yearInput.value = yearValue;

    syncSelectFromInput(dayInput, daySelect, 'day');
    syncSelectFromInput(monthInput, monthSelect, 'month');
    syncSelectFromInput(yearInput, yearSelect, 'year');

    if (dayValue === '' || monthValue === '' || yearValue === '') {
      return { valid: false, message: 'Please complete day, month, and year.' };
    }

    if (yearValue.length !== 4) {
      return { valid: false, message: 'Please enter a valid 4-digit year.' };
    }

    var dayNumber = parseInt(dayValue, 10);
    var monthNumber = parseInt(monthValue, 10);
    var yearNumber = parseInt(yearValue, 10);

    if (isNaN(dayNumber) || isNaN(monthNumber) || isNaN(yearNumber)) {
      return { valid: false, message: 'Please enter a valid date.' };
    }

    if (dayNumber < 1 || dayNumber > 31 || monthNumber < 1 || monthNumber > 12) {
      return { valid: false, message: 'Please enter a valid date.' };
    }

    var localDate = new Date(yearNumber, monthNumber - 1, dayNumber);

    if (
      localDate.getFullYear() !== yearNumber ||
      localDate.getMonth() !== monthNumber - 1 ||
      localDate.getDate() !== dayNumber
    ) {
      return { valid: false, message: 'Please enter a valid calendar date.' };
    }

    var today = new Date();
    var todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (localDate.getTime() > todayLocal.getTime()) {
      return { valid: false, message: 'The LMP date cannot be in the future.' };
    }

    return {
      valid: true,
      day: dayNumber,
      month: monthNumber,
      year: yearNumber,
      date: localDate
    };
  }

  function calculatePregnancyAge() {
    hideError();
    clearCopyStatus();

    var validated = getValidatedDateParts();
    if (!validated.valid) {
      showError(validated.message);
      return;
    }

    var now = new Date();
    var todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    var lmpUtc = Date.UTC(validated.year, validated.month - 1, validated.day);
    var diffMilliseconds = todayUtc - lmpUtc;
    var diffDays = Math.floor(diffMilliseconds / 86400000);

    if (diffDays < 0) {
      showError('The LMP date cannot be in the future.');
      return;
    }

    var weeks = Math.floor(diffDays / 7);
    var days = diffDays % 7;
    var dayLabel = days === 1 ? 'day' : 'days';
    var result = String(weeks) + ' weeks ' + String(days) + ' ' + dayLabel;

    showResult(result);
  }

  function resetCalculator() {
    dayInput.value = '';
    monthInput.value = '';
    yearInput.value = '';
    daySelect.value = '';
    monthSelect.value = '';
    yearSelect.value = '';
    hideError();
    clearResult();
    dayInput.focus();
  }

  function fallbackCopyText(text) {
    var textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', 'readonly');
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    var success = false;

    try {
      success = document.execCommand('copy');
    } catch (error) {
      success = false;
    }

    document.body.removeChild(textArea);
    return success;
  }

  function showCopySuccess() {
    clearCopyStatus();
    copyStatus.textContent = 'Copied';
    copyStatusTimer = window.setTimeout(function () {
      copyStatus.textContent = '';
      copyStatusTimer = null;
    }, 1800);
  }

  function copyResultText() {
    var textToCopy = resultText.textContent;

    if (!textToCopy) {
      return;
    }

    clearCopyStatus();

    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(textToCopy).then(function () {
        showCopySuccess();
      }).catch(function () {
        if (fallbackCopyText(textToCopy)) {
          showCopySuccess();
        }
      });
      return;
    }

    if (fallbackCopyText(textToCopy)) {
      showCopySuccess();
    }
  }

  function attachInputHandlers() {
    dayInput.addEventListener('input', function () {
      syncSelectFromInput(dayInput, daySelect, 'day');
    });

    monthInput.addEventListener('input', function () {
      syncSelectFromInput(monthInput, monthSelect, 'month');
    });

    yearInput.addEventListener('input', function () {
      syncSelectFromInput(yearInput, yearSelect, 'year');
    });

    dayInput.addEventListener('blur', function () {
      formatInputOnBlur(dayInput, 'day');
      syncSelectFromInput(dayInput, daySelect, 'day');
    });

    monthInput.addEventListener('blur', function () {
      formatInputOnBlur(monthInput, 'month');
      syncSelectFromInput(monthInput, monthSelect, 'month');
    });

    yearInput.addEventListener('blur', function () {
      formatInputOnBlur(yearInput, 'year');
      syncSelectFromInput(yearInput, yearSelect, 'year');
    });

    daySelect.addEventListener('change', function () {
      syncInputFromSelect(daySelect, dayInput, 'day');
    });

    monthSelect.addEventListener('change', function () {
      syncInputFromSelect(monthSelect, monthInput, 'month');
    });

    yearSelect.addEventListener('change', function () {
      syncInputFromSelect(yearSelect, yearInput, 'year');
    });
  }

  function attachButtonHandlers() {
    calculateButton.addEventListener('click', calculatePregnancyAge);
    resetButton.addEventListener('click', resetCalculator);
    copyButton.addEventListener('click', copyResultText);

    dayInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        calculatePregnancyAge();
      }
    });

    monthInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        calculatePregnancyAge();
      }
    });

    yearInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        calculatePregnancyAge();
      }
    });
  }

  function initialize() {
    populateDaySelect();
    populateMonthSelect();
    populateYearSelect();
    attachInputHandlers();
    attachButtonHandlers();
    clearResult();
    hideError();
  }

  initialize();
}());
