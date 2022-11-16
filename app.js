const fetch = require('node-fetch');
const express = require('express');
const app = express();

// OAuth 2.0 單一簽入流程 - 步驟 0
const clientId = 'e07f29f27b365e1649946f370d3f25e1';
const clientSecret =
  '07ee7e630195050e66ea69adfe5d3173c84e04b8abd3ea340746726393dcf0bc';
const redirectUri = 'http://localhost:3000/auth/callback';

app.use('/auth/signIn', (req, res) => {
  // OAuth 2.0 單一簽入流程 - 步驟 1
  const signInUrl = [
    'https://auth.ischool.com.tw/oauth/authorize.php',
    `?client_id=${clientId}`,
    `&redirect_uri=${redirectUri}`,
    '&response_type=code',
    '&scope=User.Mail,User.BasicInfo',
    '&state=我是一個自訂的變數',
  ].join('');

  console.log('signInUrl => ', signInUrl);
  return res.redirect(signInUrl);
});

app.use('/auth/callback', async (req, res) => {
  if (req.query.code) {
    // OAuth 2.0 單一簽入流程 - 步驟 2
    const tokenUrl = [
      'https://auth.ischool.com.tw/oauth/token.php',
      `?client_id=${clientId}`,
      `&client_secret=${clientSecret}`,
      `&redirect_uri=${redirectUri}`,
      '&grant_type=authorization_code',
      `&code=${req.query.code}`,
    ].join('');

    const token = await (await fetch(tokenUrl)).json();
    console.log('token => ', token);

    if (!token.error) {
      // OAuth 2.0 單一簽入流程 - 步驟 3
      const profileUrl = [
        'https://auth.ischool.com.tw/services/me.php',
        `?access_token=${token.access_token}`,
      ].join('');

      const profile = await (await fetch(profileUrl)).json();
      console.log('profile => ', profile);

      if (!profile.error) {
        // OAuth 2.0 單一簽入流程 - 步驟 4
        return res.send({
          status: 'Success',
          state: req.query.state,
          profile,
        });
      }

      // OAuth 2.0 單一簽入流程 - 步驟 5
      return res.send({ status: 'Error', state: req.query.state, profile });
    }

    // OAuth 2.0 單一簽入流程 - 步驟 5
    return res.send({ status: 'Error', state: req.query.state, token });
  }

  // OAuth 2.0 單一簽入流程 - 步驟 5
  return res.send({
    status: 'Error',
    state: req.query.state,
    error: 'Missing code variable',
  });
});

app.listen(process.env.PORT || 3000);

module.exports = app;
