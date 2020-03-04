/**
 * Implementation for Purely HR
 */
(function () {
  'use strict';

  const
    evtArgs = {bubbles: true, cancelable: true},
    selectors = {
      dayRows: '.day-data.row',
      timeIn: '.time-input.start',
      timeOut: '.time-input.end',
      dayCommentIcon: '.phr-set-comment-for-day',
      dayCommentField: '.modal-dialog #dailyCommentForm textarea.form-control',
      dayCommentSave: '.modal-dialog .modal-footer button.phr-confirm-btn'
    };

  fmtApi.utils.setMessageProxy({
    [fmtApi.events.timeSheetFill]: onTimeSheetFillRequest
  });

  async function onTimeSheetFillRequest(payload) {
    try {
      if (!window.location.host.match(/.*\.purelyhr.com/)) {
        return;
      }

      await loopThroughSelection(
        payload,
        () => document.querySelectorAll(selectors.dayRows),
        async (row) => {
          await setInputValue(row.querySelector(selectors.timeIn), payload.timeIn);
          await setInputValue(row.querySelector(selectors.timeOut), payload.timeOut);
        }
      );

      if (payload.comment) {
        await loopThroughSelection(
          payload,
          () => document.querySelectorAll(selectors.dayRows),
          (row) => setDayComment(row, payload.comment),
          true
        );
      }

      fmtApi.utils.sendMessage({type: fmtApi.events.timeSheetFillAck});

    } catch (err) {
      console.error(err);
    }
  }

  async function loopThroughSelection(payload, itemsGetter, cb, possibleRerender) {
    const days = new Set(payload.days);
    let rows = itemsGetter();

    rows = Array.isArray(rows)
      ? rows
      : Array.from(rows);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      if (!row.dataset.date) {
        continue;
      }

      const rowDate = new Date(row.dataset.date);

      if (!days.has(rowDate.getDay())) {
        console.log('Skipping', rowDate.toDateString());
        continue;
      }

      if (!possibleRerender) {
        await cb(row);
        continue;
      }

      try {
        // purely HR UI sometimes re-renders the rows after the comment is submitted
        // it leads to timeout when getting the element
        await cb(row);
      } catch (err) {
        if (err.message.match(/timeout for wait/i)) {
          rows = itemsGetter();
          i--;
        }
      }
    }
  }

  async function setInputValue(elt, value) {
    if (!value) {
      return;
    }

    elt.dispatchEvent(new Event('click', evtArgs));
    elt.dispatchEvent(new KeyboardEvent('keydown', {keyCode: 8, which: 8}));
    elt.value = value;
    elt.dispatchEvent(new Event('change', evtArgs));
    elt.dispatchEvent(new KeyboardEvent('keydown', {keyCode: 27, which: 27}));

    // wait for time picker to be hidden
    return fmtApi.utils.waitForIt(() => {
      const list = document.querySelector('.ui-timepicker-list');
      return !list || list.clientHeight === 0;
    });
  }

  async function setDayComment(row, value) {
    if (!value) {
      return;
    }

    row.querySelector(selectors.dayCommentIcon).dispatchEvent(new Event('click', evtArgs));

    // wait for field to be visible in the modal dialog
    await fmtApi.utils.waitForIt(() => {
      const field = document.querySelector(selectors.dayCommentField);
      return field && field.clientHeight !== 0;
    });

    document.querySelector(selectors.dayCommentField).value = value;
    document.querySelector(selectors.dayCommentSave).dispatchEvent(new Event('click', evtArgs));

    return fmtApi.utils.waitForIt(() => document.querySelector(selectors.dayCommentField) === null);
  }

})();
