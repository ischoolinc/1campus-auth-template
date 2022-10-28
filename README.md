# 1Campus Auth 帳號整合範例

本範例程式說明如何透過 1Campus Auth 整合其它帳號認證服務。

- 下載本範例程式碼
  ```
  git clone https://github.com/ischoolinc/1campus-auth-template.git
  ```

- 安裝及啟動範例程式
  ```
  yarn install; yarn start
  ```

- 查看認證流程資訊
  ```
  yarn watch
  ```

- 瀏覽器開啟以下網址
  ```
  http://localhost:3000
  ```

- 結束範例程式請執行
  ```
  yarn stop
  ```

## 本範例程式包含以下各項整合認證服務

如果你本身已經有以下各服務的登入帳號，即可馬上登入測試

1. Google
2. Apple
3. Microsoft
4. Facebook
5. 新北市政府教育局單一簽入 `(此服務需先向新北市教育局提出申請，本範例僅提供程式邏輯，並無法確實完成登入流程)`
6. 高雄市政府教育局 OpenID 服務
7. 花蓮縣政府教育雲端帳號認證服務
8. 新竹市政府教育雲端帳號認證服務
9. 嘉義市政府教育雲端帳號認證服務
10. 臺東縣政府教育雲端帳號認證服務
11. 連江縣政府教育雲端帳號認證服務

## OAuth 2.0 單一簽入流程

0. 整理傳入參數及設定參數：

- 系統參數：`client_id`、`client_secret`、`redirect_uri`，此為 oauth 主機發給各系統的設定參數；`client_id`、`client_secret` 為此系統的帳號及密碼，`redirect_uri` 為本網頁在網路上可被呼叫的網址，並經同意紀錄於 oauth 系統之中。
- 傳入參數：`code`、`state`，本網頁在呼叫時透過 query 傳入 `code` 參數，代表使用者已登入並授權存取帳號資料，若有傳入 `code` 則進行步驟 2，否則進入步驟 1。

1. 請求使用者登入並授權帳號存取：將參數填入下列網址後使用 `http redirect` 轉頁至請求登入頁 `https://auth.ischool.com.tw/oauth/authorize.php?response_type=code&client_id=...&redirect_uri=...&scope=...[&state=...]` 其中 state 參數會被完整的帶回到步驟 0 ，可作為特殊邏輯判斷使用。`scope` 參數可以空白或者傳入 `User.EMail`，若為空白則系統不會取得帳號的 `email`、若為 `User.Email` 則於步驟 3 取得 `email` 欄位。

2. 取得 access_token：將參數填入以下網址 `https://auth.ischool.com.tw/oauth/token.php?grant_type=authorization_code&client_id=...&client_secret=...&redirect_uri=...&code=...` 後從 server 端直接呼叫，取得 `access_token`，系統將以 `json` 格式回傳資料，如果回傳包含 `access_token` 欄位，則進入步驟 3 否則進入步驟 5。

    ```
    {
      access_token: '45612316f93a878d073f9ca91196baa5',
      expires_in: 3600,
      token_type: 'bearer',
      scope: 'User.Mail,User.BasicInfo',
      refresh_token: '48f0a83ddb57e1347b37873648010bc1',
    }
    ```

3. 取得 user_info：將參數填入以下網址 `https://auth.ischool.com.tw/services/me.php?access_token=...` 後從 server 端直接呼叫，取得登入使用者的帳號資訊，系統將以 `json` 格式回傳資料，如果資料驗證正確，則進入步驟 4 否則進入步驟 5。

    ```
    {
      uuid: '2be1ee2e-2982-4b19-af67-044b13a78a45',
      firstName: '展示帳號',
      lastName: '',
      language: 'English',
      mail: 'teacher01@1campus.net',
    }
    ```

4. 登入系統：使用取得的使用者帳號資訊，比對系統許可的使用者，如果允許使用則進行登入，並轉入系統登入後的頁面。如果不允許使用則進入步驟 5。
5. 顯示錯誤訊息：在預期執行的情況下，本頁面應該會由步驟 1 或步驟 4 的流程，以 `http redirect` 導向已登入或請求登入的頁面，此頁面的內容並不會出現在使用者的畫面中。建議於實做時將整個流程中的每一個步驟，分別記錄資訊到頁面中，假如發生未預期的錯誤，直接將此頁面內容呈現，以利工程端釐清問題(亦可將錯誤紀錄於主機 LOG 中，此頁僅簡短說明發生錯誤的步驟)。

## 1Campus Auth 整合開發重點流程

可以使用你熟悉的 Server 架構或參考本範例的 Express 架構開發。

- 登入以下網址，註冊要整合的應用程式資訊 (步驟 0)
  ```
  https://auth.ischool.com.tw/1campus/manage
  ```
  ```
  // 此組僅做為測試使用
  const clientId = 'e07f29f27b365e1649946f370d3f25e1';
  const clientSecret = '07ee7e630195050e66ea69adfe5d3173c84e04b8abd3ea340746726393dcf0bc';
  const redirectUri = 'http://localhost:3000/auth/callback';
  ```

- 建立 EntryPoint 網址 (步驟 1)
  ```
  http://localhost:3000/auth/signIn
  ```
  ```
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
  ```

- 建立 Callback 網址 (步驟 2、3、4、5)
  ```
  http://localhost:3000/auth/callback
  ```
  ```
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
  ```
