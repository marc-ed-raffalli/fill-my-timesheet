(function () {
  'use strict';

  const
    view = {
      list: {
        get element() {
          return document.querySelector('.time-reports');
        },
        get message() {
          return document.querySelector('.message');
        },
        get items() {
          return document.querySelectorAll('.time-report');
        },
        name(item) {
          return item.querySelector('.name');
        },
        days(item) {
          return item.querySelector('.days');
        },
        time(item) {
          return item.querySelector('.time');
        },
        comment(item) {
          return item.querySelector('.comment');
        },
        edit(item) {
          return item.querySelector('.edit');
        },
        remove(item) {
          return item.querySelector('.remove');
        }
      },
      reportForm: {
        get name() {
          return document.getElementById('name');
        },
        get timeIn() {
          return document.getElementById('timeIn');
        },
        get timeOut() {
          return document.getElementById('timeOut');
        },
        get comment() {
          return document.getElementById('comment');
        },
        get daySelectContainer() {
          return document.querySelector('.day-select-container');
        },
        get daySelect() {
          return document.querySelectorAll('.day-select');
        },
        get submit() {
          return document.getElementById('addReport');
        },
        get cancel() {
          return document.getElementById('cancelReport');
        }
      }
    },
    weekDays = fmtApi.constants.days,
    defaultValues = {
      name: '',
      timeIn: '', timeOut: '', comment: '',
      days: [1, 2, 3, 4, 5]
    };

  let
    templateItem,
    emptyItemListMessage,
    values;

  document.addEventListener('DOMContentLoaded', onLoad, false);

  async function onLoad() {
    templateItem = view.list.element.removeChild(view.list.items[0]);
    emptyItemListMessage = view.list.element.removeChild(view.list.message);

    initializeReportForm();

    setFormValues(defaultValues);
    await populateReportList();
  }

  async function onEditClick(e) {
    const reports = await fmtApi.reports.all();

    const editedReport = reports.find(r => r.id === e.target.dataset.reportId);

    if (!editedReport) {
      await populateReportList();
      return;
    }

    setFormValues(editedReport);
  }

  async function onSubmit(e) {
    e.preventDefault();

    await fmtApi.reports.save({
      ...values,
      days: Array.from(values.days)
    });

    setFormValues(defaultValues);
    await populateReportList();
  }

  function onCancelClick() {
    setFormValues(defaultValues);
  }

  async function onRemoveClick(e) {
    await fmtApi.reports.remove(e.target.dataset.reportId);
    await populateReportList();
  }

  function onDaySelect(e) {
    if (e.target.checked) {
      values.days.add(parseInt(e.target.value));
    } else {
      values.days.delete(parseInt(e.target.value));
    }

    setButtonStatus();
  }

  // ------------------

  function initializeReportForm() {
    buildDaySelect();

    const fieldSetter = (field) =>
      (e) => {
        values[field] = e.target.value;
        setButtonStatus();
      };

    view.reportForm.name.addEventListener('input', fieldSetter('name'), false);
    view.reportForm.timeIn.addEventListener('input', fieldSetter('timeIn'), false);
    view.reportForm.timeOut.addEventListener('input', fieldSetter('timeOut'), false);
    view.reportForm.comment.addEventListener('input', fieldSetter('comment'), false);
    view.reportForm.submit.addEventListener('click', onSubmit, false);
    view.reportForm.cancel.addEventListener('click', onCancelClick, false);
  }

  function setButtonStatus() {
    const
      nameProvided = !!values.name,
      timeOrCommentProvided = values.timeIn || values.timeOut || values.comment,
      atLeastOneDaySelected = values.days.size !== 0
    ;

    view.reportForm.submit.disabled = !nameProvided || !timeOrCommentProvided || !atLeastOneDaySelected;
  }

  async function populateReportList() {
    const
      listElt = view.list.element,
      existingNodes = Array.from(view.list.items)
        .map(node => listElt.removeChild(node)),
      reports = await fmtApi.reports.all();

    if (reports.length === 0) {
      listElt.appendChild(emptyItemListMessage);
      return;
    }

    if (view.list.element.contains(emptyItemListMessage)) {
      view.list.element.removeChild(emptyItemListMessage);
    }

    for (let i = 0; i < reports.length; i++) {
      const
        report = reports[i],
        node = existingNodes[i]
          ? existingNodes[i]
          : templateItem.cloneNode(true),
        editBtn = view.list.edit(node),
        removeBtn = view.list.remove(node)
      ;

      view.list.name(node).textContent = report.name;
      view.list.days(node).textContent = fmtApi.reports.renderDays(report.days);
      view.list.time(node).textContent = `From ${report.timeIn} to ${report.timeOut}`;
      view.list.comment(node).textContent = report.comment;

      editBtn.dataset.reportId = report.id;
      removeBtn.dataset.reportId = report.id;

      editBtn.addEventListener('click', onEditClick);
      removeBtn.addEventListener('click', onRemoveClick);

      listElt.appendChild(node);
    }
  }

  function buildDaySelect() {
    const daySelectContainer = view.reportForm.daySelectContainer;

    weekDays
      .slice(1, 7)
      .concat(weekDays[0])
      .forEach((day, i) => {
        const
          label = document.createElement('label'),
          span = document.createElement('span'),
          chkBx = document.createElement('input');

        chkBx.value = `${(i + 1) % 7}`;
        chkBx.type = 'checkbox';
        chkBx.classList.add('day-select');
        chkBx.addEventListener('change', onDaySelect);

        span.textContent = day;

        label.appendChild(chkBx);
        label.appendChild(span);
        daySelectContainer.appendChild(label);
      });
  }

  function setFormValues(report) {
    values = {
      ...report,
      days: new Set(report.days)
    };

    view.reportForm.name.value = values.name;
    view.reportForm.timeIn.value = values.timeIn;
    view.reportForm.timeOut.value = values.timeOut;
    view.reportForm.comment.value = values.comment;

    view.reportForm.daySelect.forEach(chkBx => {
      chkBx.checked = values.days.has(parseInt(chkBx.value));
    });

    setButtonStatus();

    view.reportForm.submit.textContent = report.id
      ? 'Save changes'
      : 'Add a time report';

    view.reportForm.cancel.style.display = report.id
      ? 'inline-block'
      : 'none';
  }

})();
