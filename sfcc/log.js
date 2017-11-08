const chalk = require('chalk');

const log = {
  timestamp: (message) => {
    const leadingZero = input => (`0${input}`).slice(-2);
    const now = new Date();
    const timestamp = ` ${leadingZero(now.getHours())}:${leadingZero(now.getMinutes())}:${leadingZero(now.getSeconds())} `;

    console.log(`${message} ${chalk.white.bgBlackBright(timestamp)}`);
  },

  error: message => console.log(chalk.red(message)),
};

module.exports = log;
