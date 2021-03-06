const routes = require('../../app/routes');
const storage = require('../storage');
const state = require('../state');

function stripEvents(str) {
  // For CSP we need to remove all the event handler placeholders.
  // It's ok, app.js will add them when it attaches to the DOM.
  return str.replace(/\son\w+=""/g, '');
}

module.exports = {
  index: async function(req, res) {
    const appState = await state(req);
    res.send(stripEvents(routes().toString('/blank', appState)));
  },

  blank: async function(req, res) {
    const appState = await state(req);
    res.send(stripEvents(routes().toString('/blank', appState)));
  },

  download: async function(req, res, next) {
    const id = req.params.id;
    try {
      const [
        appState,
        { nonce, pwd, dead, flagged },
      ] = await Promise.all([
        state(req),
        storage.metadata(id),
      ]);
      if (dead && !flagged) {
        return next();
      }
      res.set('WWW-Authenticate', `send-v1 ${nonce}`);
      res.send(
        stripEvents(
          routes().toString(
            `/download/${id}`,
            Object.assign(appState, {
              downloadMetadata: { nonce, pwd, flagged }
            })
          )
        )
      );
    } catch (e) {
      next();
    }
  },

  unsupported: async function(req, res) {
    const appState = await state(req);
    res.send(
      stripEvents(
        routes().toString(`/unsupported/${req.params.reason}`, appState)
      )
    );
  },

  legal: async function(req, res) {
    const appState = await state(req);
    res.send(stripEvents(routes().toString('/legal', appState)));
  },

  notfound: async function(req, res) {
    const appState = await state(req);
    res
      .status(404)
      .send(
        stripEvents(
          routes().toString(
            '/404',
            Object.assign(appState, { downloadMetadata: { status: 404 } })
          )
        )
      );
  }
};
