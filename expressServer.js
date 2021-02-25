const express = require('express');
const path = require('path'); // 라이브러리 불러오기
const request = require('request');
var jwt = require('jsonwebtoken');
var auth = require('./lib/auth');
const app = express();

// json 타입의 데이터 전송을 허용
app.use(express.json());

// form 타입의 데이터 전송을 허용
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public'))); //to use static asset (정적 리소스 공개)

app.set('views', __dirname + '/views'); // 뷰 파일이 있는 디렉토리를 설정
app.set('view engine', 'ejs'); // 뷰 엔진으로 EJS 사용 선언

app.get('/', function (req, res) {
  res.send('Hello World');
})

app.get('/signup', function (req, res) {
  res.render('signup');
})

app.get('/login', function (req, res) {
  res.render('login');
})

app.get('/authTest', auth, function(req, res) {
  res.send("정상적으로 로그인 하셨다면 해당 화면이 보여집니다.");
})

app.get('/balance', function(req, res) {
  res.render('balance');
})

app.get('/authResult', function (req, res) {
  var authCode = req.query.code;
  var option = {
    method: "POST",
    url: "https://testapi.openbanking.or.kr/oauth/2.0/token",
    header: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    form: {
      code: authCode,
      client_id: "05b0e8dd-1423-48d3-adcb-caa220a0d316",
      client_secret: "3fb7ad52-239b-4be2-9388-d0c152733e48",
      redirect_uri: "http://localhost:3000/authResult",
      grant_type: "authorization_code"
    }
  }
  request(option, function (err, response, body) {
    if (err) {
      console.error(err);
      throw err;
    }
    else {
      var accessRequestResult = JSON.parse(body);
      console.log(accessRequestResult);
      res.render('resultChild', { data: accessRequestResult });
    }
  })
});

app.post('/signup', function (req, res) {
  var userName = req.body.userName;
  var userEmail = req.body.userEmail;
  var userPassword = req.body.userPassword;
  var userAccessToken = req.body.userAccessToken;
  var userRefreshToken = req.body.userRefreshToken;
  var userSeqNo = req.body.userSeqNo;

  console.log(userName, userEmail, userPassword);

  var sql = "INSERT INTO user (name, email, password, accesstoken, refreshtoken, userseqno) VALUES (?,?,?,?,?,?)"
  connection.query(sql, [userName, userEmail, userPassword, userAccessToken, userRefreshToken, userSeqNo], function (err, result) {
    if (err) {
      console.error(err);
      throw err; // 프로세스 종료
    }
    else {
      res.json();
    }
  });
})

app.post('/login', function (req, res) {
  var userEmail = req.body.userEmail;
  var userPassword = req.body.userPassword;
  console.log(userEmail, userPassword)
  var sql = "SELECT * FROM user WHERE email = ?";
  connection.query(sql, [userEmail], function (err, result) {
    if (err) {
      console.error(err);
      res.json(0);
      throw err;
    }
    else {
      console.log(result);
      if (result.length == 0) {
        res.json(3)
      }
      else {
        var dbPassword = result[0].password;
        if (dbPassword == userPassword) {
          var tokenKey = "f@i#n%tne#ckfhlafkd0102test!@#%"
          jwt.sign(
            {
              userId: result[0].id,
              userEmail: result[0].email
            },
            tokenKey, // ex) 도장찍기, 위조 신분을 못 만들게 하는 역할
            {
              expiresIn: '10d',
              issuer: 'fintech.admin',
              subject: 'user.login.info'
            },
            function (err, token) {
              console.log('로그인 성공', token)
              res.json(token)
            }
          )
        }
        else {
          res.json(2);
        }
      }
    }
  })
})

app.get('/main', function(req, res){
  res.render('main');
})

app.post('/list', auth, function(req, res){
  var user = req.decoded;
  console.log(user);
  var sql = "SELECT * FROM user WHERE id = ?";
  connection.query(sql,[user.userId], function(err, result){
      if(err) throw err;
      else { // 레코드에서 조회 후 요청 전송해야한다. [비동기 방식]
          var dbUserData = result[0];
          console.log(dbUserData);
          var option = {
              method : "GET",
              url : "https://testapi.openbanking.or.kr/v2.0/user/me",
              headers : {
                  Authorization : "Bearer " + dbUserData.accesstoken
              },
              qs : {
                  user_seq_no : dbUserData.userseqno
              }
          }
          request(option, function(err, response, body){
              if(err){
                  console.error(err);
                  throw err;
              }
              else {
                  var listRequestResult = JSON.parse(body);

                  res.json(listRequestResult)
                  console.log(listRequestResult)
              }
          })        
      }
  })
})

var mysql = require('mysql');
var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '19980815',
  database: 'fintech'
});
connection.connect();
//connection.end();

app.listen(3000);