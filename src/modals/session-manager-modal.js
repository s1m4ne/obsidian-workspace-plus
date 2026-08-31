'use strict';

// The class lives in session-manager-modal-class.ts. This path stays because
// both the plugin and the Behavior Lock load the modal through it, and the lock
// may not be edited. A CommonJS `module.exports = Class` arrives at `import()`
// as the default export, which is what the lock reads. Commit 34 removes this
// file once every caller imports the class directly.
module.exports = require('./session-manager-modal-class.ts').SessionManagerModal;
