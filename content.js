/**
 * Receives the details from the popup and handles common steps e.g. show backdrop and message.
 * Emits message "timeSheetFill" to be handled by the timesheet automation scripts.
 */
(function () {
  'use strict';

  fmtApi.utils.setMessageProxy({
    [fmtApi.events.timeSheetFormSubmit]: onTimeSheetFormSubmit,
    [fmtApi.events.timeSheetFillAck]: hideModalMessage
  });

  async function onTimeSheetFormSubmit(payload) {
    showModalMessage('Operation in progress');

    // dispatch event for page timesheet automation script
    fmtApi.utils.sendMessage({type: fmtApi.events.timeSheetFill, payload});
  }

  let uiModalElt;

  function showModalMessage(messageStr) {
    if (!uiModalElt) {
      const
        messageElt = document.createElement('div'),
        modalStyles = `
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: rgba(0, 0, 0, .75);
          z-index: 9999;
          color: white;
        `;

      messageElt.textContent = messageStr;
      messageElt.setAttribute('style', 'font-size: 36px;');

      uiModalElt = document.createElement('div');
      uiModalElt.setAttribute('style', modalStyles);
      uiModalElt.appendChild(messageElt);
    }

    document.body.appendChild(uiModalElt);
  }

  function hideModalMessage() {
    if (document.body.contains(uiModalElt)) {
      uiModalElt = document.body.removeChild(uiModalElt);
    }
  }

})();
