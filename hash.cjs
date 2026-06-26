const { scryptSync, randomBytes } = require('crypto');

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = scryptSync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

console.log(hashPassword('doctor123'));