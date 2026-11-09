#!/usr/bin/env node
// Prints a bcrypt hash for ADMIN_PASSWORD_HASH. The password is typed without
// being shown, is never written to disk, and only the hash is printed.
// Usage: npm run hash-password
const bcrypt = require('bcryptjs');

function askHidden(prompt) {
  return new Promise((resolve) => {
    const { stdin, stdout } = process;
    if (!stdin.isTTY) {
      console.error('Run this in an interactive terminal so the password stays hidden.');
      process.exit(1);
    }
    stdout.write(prompt);
    let input = '';
    stdin.setRawMode(true);
    stdin.setEncoding('utf8');
    stdin.resume();
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener('data', onData);
          stdout.write('\n');
          resolve(input);
          return;
        }
        if (ch === '\u0003') {
          stdout.write('\n');
          process.exit(130);
        }
        if (ch === '\u007f' || ch === '\b') input = input.slice(0, -1);
        else input += ch;
      }
    };
    stdin.on('data', onData);
  });
}

(async () => {
  const password = await askHidden('New password (12+ characters): ');
  if (password.length < 12) {
    console.error('Too short: use at least 12 characters.');
    process.exit(1);
  }
  if ((await askHidden('Type it again: ')) !== password) {
    console.error('The two entries did not match.');
    process.exit(1);
  }
  console.log('\nSet this as ADMIN_PASSWORD_HASH:\n');
  console.log(bcrypt.hashSync(password, 12));
})();
