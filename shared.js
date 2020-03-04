const fmtApi = (() => {

  let subscriptions = {};

  const
    events = {
      timeSheetFormSubmit: 'timesheet-form-submit',
      timeSheetFill: 'timesheet-fill',
      timeSheetFillAck: 'timesheet-fill-ack'
    },
    constants = {
      days: [
        'Sunday',
        'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday',
        'Saturday'
      ]
    },
    utils = {
      setMessageProxy: (options) => {
        subscriptions = Object.keys(options).reduce((acc, key) => ({
          ...acc,
          [key]: acc.hasOwnProperty(key)
            ? [...acc[key], options[key]]
            : [options[key]]
        }), subscriptions);

        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
          if (options.hasOwnProperty(message.type)) {
            return options[message.type](message.payload, sender, sendResponse);
          }
        });
      },
      sendMessage: (message) => {
        if (!subscriptions.hasOwnProperty(message.type)) {
          return;
        }

        subscriptions[message.type].forEach(sub => sub(message.payload));
        chrome.runtime.sendMessage(message);
      },
      getCurrentTab: () => {
        return new Promise(resolve => {
          chrome.tabs.query({currentWindow: true, active: true}, (tabs) => {
            resolve(tabs[0]);
          });
        });
      },
      wait: (delay) => {
        return new Promise((res) => setTimeout(res, delay));
      },
      waitForIt: async (cb, timeout = 2000) => {
        let res = cb();
        const ts = Date.now();

        while (!res) {
          if (Date.now() - ts > timeout) {
            throw new Error('Timeout for wait callback');
          }

          await utils.wait(100);
          res = cb();
        }

        return res;
      }
    },
    storage = {
      read: (key, defaultValue) =>
        new Promise(resolve => {
          chrome.storage.sync.get([key], (res) => resolve(
            res && res.hasOwnProperty(key)
              ? (res[key] || defaultValue)
              : defaultValue
          ));
        }),
      write: (d) =>
        new Promise(resolve => chrome.storage.sync.set(d, resolve))
    },
    reports = {
      renderDays: (days) => {
        return days.map(d => constants.days[d]).join(', ');
      },
      all: () => storage.read('report-list', []),
      save: async (report) => {
        const data = await (async () => {
          const storedReports = await reports.all();

          if (!report.id) {
            return storedReports
              .concat({...report, id: getId()});
          }

          const indexOfEditedReport = storedReports.findIndex(r => r.id === report.id);

          return indexOfEditedReport === -1
            ? storedReports.concat(report)
            : [
              ...storedReports.slice(0, indexOfEditedReport),
              report,
              ...storedReports.slice(indexOfEditedReport + 1)
            ];
        })();

        return storeReports(data);
      },
      remove: async (reportId) => {
        const data = await (async () => {
          const storedReports = await reports.all();
          return storedReports.filter(r => r.id !== reportId);
        })();

        return storeReports(data);
      }
    }
  ;

  // ------------------
  // private API

  function storeReports(data) {
    return storage.write({'report-list': data});
  }

  function getId() {
    return Math.random().toString(16).substring(6);
  }

  return {
    utils,
    events,
    storage,
    reports,
    constants
  };
})();
