const express = require('express');
const path = require('path'); // 라이브러리 불러오기
const request = require('request');
const app = express();

// json 타입의 데이터 전송을 허용
app.use(express.json());

// form 타입의 데이터 전송을 허용
app.use(express.urlencoded({ extended:false }));

app.use(express.static(path.join(__dirname, 'public'))); //to use static asset (정적 리소스 공개)

app.set('views', __dirname + '/views'); // 뷰 파일이 있는 디렉토리를 설정
app.set('view engine', 'ejs'); // 뷰 엔진으로 EJS 사용 선언

app.get('/', function (req, res) {
  res.send('Hello World');
})

app.get('/signup', function(req, res) {
  res.render('signup');
})

app.get('/authResult', function(req, res) {
  var authCode = req.query.code;
  var option = {
      method : "POST",
      url : "https://testapi.openbanking.or.kr/oauth/2.0/token",
      header : {
          'Content-Type' : 'application/x-www-form-urlencoded'
      },
      form : {
        code : authCode,
        client_id : "05b0e8dd-1423-48d3-adcb-caa220a0d316",
        client_secret : "3fb7ad52-239b-4be2-9388-d0c152733e48",
        redirect_uri : "http://localhost:3000/authResult",
        grant_type : "authorization_code"
      }
  }
  request(option, function(err, response, body){
      if(err){
          console.error(err);
          throw err;
      }
      else {
          var accessRequestResult = JSON.parse(body);
          console.log(accessRequestResult);
          res.render('resultChild', {data : accessRequestResult});
      }
  })
});

var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '19980815',
  database : 'fintech'
});
connection.connect(); 
//connection.end();
 
app.listen(3000);