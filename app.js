const express = require('express');
const fetch = require('node-fetch');
const session = require('express-session');

const app = express();
app.use(
  session({
    secret: '1campus-auth-template',
    cookie: { maxAge: 60000 },
  })
);
app.use(express.static('public'));

// OAuth 2.0 單一簽入流程 - 步驟 0
const clientId = 'e07f29f27b365e1649946f370d3f25e1';
const clientSecret =
  '07ee7e630195050e66ea69adfe5d3173c84e04b8abd3ea340746726393dcf0bc';
const redirectUri = 'http://localhost:3000/auth/callback';

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

    const tokenRsp = await fetch(tokenUrl);
    const token = await tokenRsp.json();

    /*
     {
      access_token: '45612316f93a878d073f9ca91196baa5',
      expires_in: 3600,
      token_type: 'bearer',
      scope: 'User.Mail,User.BasicInfo',
      refresh_token: '48f0a83ddb57e1347b37873648010bc1',
     }
    */
    console.log('token => ', token);

    if (!token.error) {
      // OAuth 2.0 單一簽入流程 - 步驟 3
      const profileUrl = [
        'https://auth.ischool.com.tw/services/me.php',
        `?access_token=${token.access_token}`,
      ].join('');

      const profileRsp = await fetch(profileUrl);
      const profile = await profileRsp.json();

      /* 
       {
        uuid: '2be1ee2e-2982-4b19-af67-044b13a78a45',
        firstName: '展示帳號',
        lastName: '',
        language: 'English',
        mail: 'teacher01@1campus.net',
       }
      */
      console.log('profile => ', profile);

      if (!profile.error) {
        // OAuth 2.0 單一簽入流程 - 步驟 4
        req.session.profile = profile;
        return res.redirect('/profile');
      }

      // OAuth 2.0 單一簽入流程 - 步驟 5
      return res.send({ error: profile.error });
    }

    // OAuth 2.0 單一簽入流程 - 步驟 5
    return res.send({ error: token.error });
  }

  // OAuth 2.0 單一簽入流程 - 步驟 5
  return res.send({ erro: 'something is wrong' });
});

/*
  google => Google
  apple => Apple
  windowslive => Microsoft
  facebook => Facebook
  TwEdu => 教育部 openid connect
  ntpc => 新北市
  edu_opkh => 高雄市
  hlc => 花蓮縣
  oidc_hc => 新竹市 OIDC
  oidc_cy => 嘉義市 OIDC
  oidc_ttct => 台東縣 OIDC
  oidc_matsu => 連江縣 OIDC
*/
app.use('/auth/signIn', (req, res) => {
  const { partner } = req.query;

  if (partner === 'ntpc') {
    const url = `https://sso.ntpc.edu.tw/logout.aspx?ReturnUrl=https%3A%2F%2Fauth.ntpc.edu.tw%2Flogout.php%3Fnext%3Dhttps%253A%252F%252Fauth.ischool.com.tw%252Flogout.php%253Fnext%253Dhttps%25253A%25252F%25252Fpts.ntpc.edu.tw%25252Foauth%25252Fntpc_entry_point%25253Fstate%25253D_GUID_`;
    return res.redirect(url);
  }

  if (
    partner &&
    ![
      'google',
      'apple',
      'windowslive',
      'facebook',
      'TwEdu',
      'edu_opkh',
      'hlc',
      'oidc_hc',
      'oidc_cy',
      'oidc_ttct',
      'oidc_matsu',
    ].includes(partner)
  ) {
    return res.send({ error: 'something is wrong' });
  }

  // OAuth 2.0 單一簽入流程 - 步驟 1
  const signInUrl =
    'https://auth.ischool.com.tw/logout.php?next=' +
    encodeURIComponent(
      [
        'https://auth.ischool.com.tw/oauth/authorize.php',
        `?client_id=${clientId}`,
        `&redirect_uri=${redirectUri}`,
        '&response_type=code',
        '&scope=User.Mail,User.BasicInfo',
        partner ? `&linkSignIn=${partner}` : '',
      ].join('')
    );

  console.log('signInUrl => ', signInUrl);
  return res.redirect(signInUrl);
});

app.use('/auth/signOut', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.use('/profile', (req, res) => {
  if (req.session.profile) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.write(
      [
        `<pre>${JSON.stringify(req.session.profile, null, 4)}</pre>`,
        `<button onclick="window.location.assign('/auth/signOut')">Signout</button>`,
      ].join('')
    );
    res.end();
  } else {
    res.redirect('/auth/signOut');
  }
});
app.listen(process.env.PORT || 3000);

module.exports = app;
