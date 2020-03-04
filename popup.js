(function () {
  'use strict';

  const
    view = {
      get noReport() {
        return document.querySelector('.no-report');
      },
      get openOption() {
        return document.querySelector('.openOption');
      },
      get form() {
        return document.querySelector('.timesheet-form');
      },
      get reportSelect() {
        return document.getElementById('reportSelect');
      },
      get reportInfo() {
        return document.querySelector('.report-info');
      },
      get days() {
        return document.querySelector('.days');
      },
      get time() {
        return document.querySelector('.time');
      },
      get comment() {
        return document.querySelector('.comment');
      },
      get submit() {
        return document.getElementById('submit');
      }
    },
    reportsById = {},
    values = {
      reportSelect: ''
    };


  document.addEventListener('DOMContentLoaded', onLoad, false);

  fmtApi.utils.setMessageProxy({
    [fmtApi.events.timeSheetFillAck]: onFormFillAck
  });

  async function onLoad() {
    await initializeForm();

    view.openOption.addEventListener('click', () => {
      chrome.tabs.create({url: '/options.html'});
    });
  }

  function onReportSelect(e) {
    e.preventDefault();

    values.reportSelect = reportsById[e.target.value];
    renderReport(values.reportSelect);
  }

  function onSubmit(e) {
    e.preventDefault();
    sendFormData();
  }

  function onFormFillAck() {
    view.submit.disabled = false;
  }

  // ------------------

  async function initializeForm() {
    const reports = await fmtApi.reports.all();

    if (reports.length === 0) {
      const formElt = view.form;
      formElt.parentElement.removeChild(formElt);
      return;
    }

    const noReportElt = view.noReport;
    noReportElt.parentElement.removeChild(noReportElt);

    values.reportSelect = reports[0];
    initializeReportSelect(reports);
    renderReport(values.reportSelect);

    view.submit.addEventListener('click', onSubmit, false);
  }

  function initializeReportSelect(reports) {
    const selectElt = view.reportSelect;

    reports.forEach((report) => {
      const optionElt = document.createElement('option');

      optionElt.value = report.id;
      optionElt.textContent = report.name;

      reportsById[report.id] = report;
      selectElt.appendChild(optionElt);
    });

    selectElt.addEventListener('change', onReportSelect, false);
  }

  function renderReport(report) {
    view.reportInfo.style.display = 'block';
    view.days.textContent = fmtApi.reports.renderDays(report.days);
    view.time.textContent = `Time in: ${report.timeIn}, time out: ${report.timeOut}`;
    view.comment.textContent = report.comment.length > 100
      ? `${report.comment.slice(0, 100)}...`
      : report.comment;
  }

  async function sendFormData() {
    const currentTab = await fmtApi.utils.getCurrentTab();

    view.submit.disabled = true;

    chrome.tabs.sendMessage(currentTab.id, {
      type: fmtApi.events.timeSheetFormSubmit,
      payload: values.reportSelect
    });
  }

})();
