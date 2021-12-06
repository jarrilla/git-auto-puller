/**
 * Quick tool to auto-pull when a watched repository is updated.
 * Currently using a webhook that just posts to / when that happens.
 * 
 * TODO:
 * - It might be possible to automatically start ngrok from here (https://github.com/bubenshchykov/ngrok)
 * - We should alert dev (send email) when an action fails.
 * - We should alert dev (send email) when app is re-started (at least for now, since this means we have to reset the webhook with new ngrok addr)
 * - We should add a secret to ensure payload is coming from a trusted source
 */

require('dotenv').config();

const { spawn } = require('child_process');
const { json } = require('express');
const express = require('express');
const { createTransport } = require('nodemailer');
const bat = require.resolve('./_pull.bat');
const app = express();

app.use( json() );

app.post('/', (req, res) => {
  const event = req.headers['x-github-event'];

  // turns out that after a successful merge from PR close, git sends another push request
  // so we only have to check for push
  if (event === 'push') {
    pullSpawn();
    res.sendStatus(200);
  }
  else {
    res.sendStatus(400);
  }

});

// dump all other calls
app.all('*', (_req, res) => {
  res.sendStatus(404);
});

// initialize
let TRANSPORTER;
(() => {
  TRANSPORTER = createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAILER_ACCT,
      pass: process.env.MAILER_PW
    }
  });

  reportRestart();

  app.listen(process.env.PORT);
})();

// ---------------------
// ---------------------
// helpers
// ---------------------
// ---------------------

const stream_out = (s, m) => console.log(`${s}: ${m}`);

/**
 * run pull.bat which just does a 'git pull' call
 */
function pullSpawn() {

  try {
    const ls = spawn(bat);
    ls.stdout.on('data', d => stream_out('stdout', d));
    ls.stderr.on('data', d => stream_out('stderr', d));
    ls.on('exit', code => console.log('child process exited with code ' + code));
  }
  catch (e) {
    reportError(e);
  }
}

/**
 * Report error to dev
 * @param {Error} error 
 */
function reportError(error={}) {
  const html =
`<b>Error:</b>
${ error.name } -- ${ error.message }
<hr>
<b>Stacktrace:</b>
${ (error.stack).split('\n').join('<br>') }`;

  sendMail('[ERROR] cnc-posts auto-puller', html);
}

/**
 * Report a restart to dev
 */
function reportRestart() {
  const html = '<p>Auto-puller has been restarted.</p><p>Please check ngrok output for new endpoint</p>';
  sendMail('[RESTART] cnc-posts auto-puller', html);
}

/**
 * Send mail to dev
 * @param {string} subject 
 * @param {string} html 
 * @param {number?} maxTries 
 */
function sendMail(subject, html, maxTries=50) {
  const { MAILER_ACCT, DEV_ADDR } = process.env;

  const mailOpts = {
    subject,
    html,
    from: MAILER_ACCT,
    to:   DEV_ADDR,
  };

  TRANSPORTER.sendMail( mailOpts, (ee, _info) => {
    if (ee) {

      // If this failed -> wait 5s then try again up to maxTries; after that just log to console
      if (maxTries > 0) return setTimeout( () => mailDev(error, maxTries-1), 5000 );
      else console.error(ee);
    }
  } );
}