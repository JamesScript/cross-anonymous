/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

const testText = "This is a test";
const testPassword = "absurdlySecure";
let idForDeleteThread;
let idForReportThread;

const replyThreadID = "T2-pz_iIb";
let idForDeleteReply;
let idForReportReply;

suite('Functional Tests', function() {

  suite('API ROUTING FOR /api/threads/:board', function() {
    
    suite('POST', function() {
      test('Post Thread For Deletion', done => {
        // Normal test post
        chai.request(server)
        .post('/api/threads/test')
        .type('form')
        .send({
          text: testText,
          delete_password: testPassword
        })
        .end((err, res) => {
          if (err) return console.error(err);
          assert.equal(res.status, 200);
          done();
        });
      });      
      
      test('Post Thread For Reporting', done => {
        // Normal test post
        chai.request(server)
        .post('/api/threads/test')
        .type('form')
        .send({
          text: "report me",
          delete_password: testPassword
        })
        .end((err, res) => {
          if (err) return console.error(err);
          assert.equal(res.status, 200);
          done();
        });
      });      
    });
        
    suite('GET', function() {
      test('Get Threads of Test Board', done => {
        chai.request(server)
        .get('/api/threads/test')
        .end((err, res) => {
          if (err) return console.error(err);
          assert.equal(res.status, 200);
          assert.property(res.body[0], 'bumped_on');
          assert.property(res.body[0], 'created_on');
          assert.property(res.body[0], '_id');
          assert.isArray(res.body[0].replies, "Replies is an array");
          assert.isString(res.body[0].text, "Text is a string");
          assert.isString(res.body[0]._id);
          idForDeleteThread = res.body[0]._id;
          idForReportThread = res.body[1]._id;
          done();
        });
      }); 
    });
    
    suite('DELETE', function() {
      test('Delete Thread - incorrect password', done => {
        chai.request(server)
        .delete('/api/threads/test')
        .type('form')
        .send({
          thread_id: idForDeleteThread,
          delete_password: "overflow"
        })
        .end((err, res) => {
          if (err) return console.error(err);
          assert.equal(res.status, 200);
          assert.equal(res.text, "incorrect password");
          done();
        });
      }); 
      
      test('Delete Thread - correct password', done => {
        chai.request(server)
        .delete('/api/threads/test')
        .type('form')
        .send({
          thread_id: idForDeleteThread,
          delete_password: testPassword
        })
        .end((err, res) => {
          if (err) return console.error(err);
          assert.equal(res.status, 200);
          assert.equal(res.text, "success");
          done();
        });
      }); 
    });
    
    suite('PUT', function() {
      test('Report Thread', done => {
        chai.request(server)
        .put('/api/threads/test')
        .type('form')
        .send({
          thread_id: idForReportThread,
        })
        .end((err, res) => {
          if (err) return console.error(err);
          assert.equal(res.status, 200);
          assert.equal(res.text, "success");
          done();
        });
      }); 
    });

  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST', function() {
      test('Post Reply To Thread For Deletion', done => {
        // Normal test post
        chai.request(server)
        .post('/api/replies/testReplies')
        .type('form')
        .send({
          board: "testReplies",
          thread_id: replyThreadID,
          text: testText,
          delete_password: testPassword
        })
        .end((err, res) => {
          if (err) return console.error(err);
          assert.equal(res.status, 200);
          done();
        });
      });    
      
      test('Post Reply To Thread For Reporting', done => {
        // Normal test post
        chai.request(server)
        .post('/api/replies/testReplies')
        .type('form')
        .send({
          board: "testReplies",
          thread_id: replyThreadID,
          text: "report me",
          delete_password: testPassword
        })
        .end((err, res) => {
          if (err) return console.error(err);
          assert.equal(res.status, 200);
          done();
        });
      });    
    });
    
    suite('GET', function() {
      test('Get Replies', done => {
        chai.request(server)
        .get('/api/replies/' + replyThreadID)
        .query({board: "testReplies", thread: replyThreadID})
        .end((err, res) => {
          if (err) return console.error(err);
          assert.equal(res.status, 200);
          assert.isString(res.body.replies[0]._id);
          assert.isString(res.body.replies[1]._id);
          assert.isString(res.body.replies[0].text);
          idForDeleteReply = res.body.replies[0]._id;
          idForReportReply = res.body.replies[1]._id;
          done();
        });
      });  
    });
    
    suite('PUT', function() {
      test('Report Thread Reply', done => {
        chai.request(server)
        .put('/api/replies/testReplies')
        .type('form')
        .send({
          thread_id: replyThreadID,
          reply_id: idForReportReply
        })
        .end((err, res) => {
          if (err) return console.error(err);
          assert.equal(res.status, 200);
          assert.equal(res.text, "success");
          done();
        });
      }); 
    });
    
    suite('DELETE', function() {
      test('Delete Thread', done => {
        chai.request(server)
        .delete('/api/replies/testReplies')
        .type('form')
        .send({
          thread_id: replyThreadID,
          reply_id: idForDeleteReply,
          delete_password: testPassword
        })
        .end((err, res) => {
          if (err) return console.error(err);
          assert.equal(res.status, 200);
          assert.equal(res.text, "success");
          done();
        });
      }); 
    });
    
  });

});
