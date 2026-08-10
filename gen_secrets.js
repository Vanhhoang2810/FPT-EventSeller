const crypto = require('crypto');
console.log('ACCESS=' + crypto.randomBytes(32).toString('hex'));
console.log('REFRESH=' + crypto.randomBytes(32).toString('hex'));
console.log('QR=' + crypto.randomBytes(32).toString('hex'));
