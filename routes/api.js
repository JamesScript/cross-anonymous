/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

const expect = require('chai').expect;
const shortid = require('shortid');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

mongoose.connect(process.env.DB);

const ThreadSchema = new mongoose.Schema({
  text: String,
  replies: Array,
  _id: String,
  delete_password: String,
  created_on: Date,
  bumped_on: Date,
  reported: Boolean
});

const BoardSchema = new mongoose.Schema({
  name: String,
  threads: [ThreadSchema]
});

const Thread = new mongoose.model('Thread', ThreadSchema);

const Board = new mongoose.model('Board', BoardSchema);

module.exports = function (app) {
  app.route('/api/boards')
  .get((req, res) => {
    Board.find((err, docs) => {
      if (err) return console.error(err);
      const boardNames = docs.map(doc => doc.name);
      return res.send(boardNames);
    });
  });
  
  // ROUTES
  app.route('/api/threads/:board')
  // GET REQUEST
  .get((req, res) => {
    Board.find({name: req.params.board}, (err, docs) => {
      if (err) return console.error(err);
      if (docs.length === 0) return res.send([]);
      return res.send(docs[0].threads);
    });
  // POST REQUEST
  }).post((req, res) => {
    // Board information differs depending on where you submit the information from:
    const currentBoard = req.body.board || req.params.board;
    const redirectUser = () => {
       res.redirect("https://cross-anonymous.glitch.me/b/" + currentBoard);
    };
    const query = {name: currentBoard};
    // If XSS attack is attempted
    if (/<script>/.test(req.body.text)) return res.redirect("https://www.youtube.com/watch?v=K7Hn1rPQouU");
    // If other HTML code is inserted
    req.body.text = req.body.text.replace(/<\w+>/g, "");
    Board.find(query, (err, docs) => {
      if (err) return console.error(err);
      // HASHING PASSWORD
      const salt = bcrypt.genSaltSync(Number(process.env.SALT_ROUNDS));
      const hash = bcrypt.hashSync(req.body.delete_password, salt);
      const newThread = new Thread({
        text: req.body.text,
        replies: [],
        _id: shortid.generate(),
        delete_password: hash,
        created_on: new Date(),
        bumped_on: new Date(),
        reported: false
      });
      // If board doesn't exist, create new one for database
      if (docs.length === 0) {
        const newBoard = new Board({
          name: currentBoard,
          threads: [newThread]
        });
        newBoard.save(err => {
          if (err) return console.error(err);
          // console.log("SAVED");
          return redirectUser();
        });
      } else {
      // Update current board
        // Get current threads so we can push to it
        let currentThreads = docs[0].threads.slice();
        // update
        Board.findOneAndUpdate(query, {threads: [newThread, ...currentThreads]} , err => {
          if (err) return console.error(err);
          return redirectUser();
        });
      }
    });
  // PUT REQUEST - reporting a thread
  }).put((req, res) => {
    // sample req.body from index.html => {"board":"general","thread_id":"123"}
    const query = {name: req.body.board || req.params.board};
    Board.find(query, (err, docs) => {
      if (err) return console.error(err);
      // Go through all threads and find the matching id
      let threadsOfBoard = docs[0].threads;
      threadsOfBoard.map(doc => {
        if (doc.id === req.body.thread_id) {
          doc.reported = true;
        }
      });
      // Update board with reported thread
      Board.findOneAndUpdate(query, {threads: threadsOfBoard}, err => {
        if (err) return console.error(err);
        return res.send("success");
      });
    });
  // DELETE REQUEST
  }).delete((req, res) => {
    const query = {name: req.body.board || req.params.board};
    // console.log(req.body);
    // console.log("PARAMS");
    // console.log(req.params);
    Board.find(query, (err, docs) => {
      if (err) return console.error(err);
      // Go through all threads and find the matching id
      let threadsOfBoard = docs[0].threads;
      for (let i = 0; i < threadsOfBoard.length; i++) {
        if (threadsOfBoard[i].id === req.body.thread_id) {
          // Compare password hashes
          if (bcrypt.compareSync(req.body.delete_password, threadsOfBoard[i].delete_password)) {
            threadsOfBoard.splice(i, 1);
            Board.findOneAndUpdate(query, {threads: threadsOfBoard}, err => {
              if (err) return console.error(err);
              return res.send("success");
            });
            // break;
          } else {
            return res.send("incorrect password");
          }
        }
      }
    });
  });
    
  app.route('/api/replies/:thread')
  // GET REQUEST
  .get((req, res) => {
    const currentBoard = req.query.board;
    Board.find({name: currentBoard}, (err, docs) => {
      if (err) return console.error(err);
      // Loop through the threads until we find the one that matches ID
      // if (docs.length === 0) return res.send([]);
      docs[0].threads.map(thread => {
        if (thread._id === req.params.thread) {
          return res.send(thread);
        }
      });
    });
  // POST REQUEST
  }).post((req, res) => {
    const query = {name: req.body.board || req.params.thread};
    if (/<script>/.test(req.body.text)) return res.redirect("https://www.youtube.com/watch?v=K7Hn1rPQouU");
    Board.find(query, (err, docs) => {
      if (err) return console.error(err);
      // Loop through threads to find the right one then push reply to replies array
      docs[0].threads.map(thread => {
        if (thread._id === req.body.thread_id) {
          thread.bumped_on = new Date();
          // HASHING PASSWORD
          const salt = bcrypt.genSaltSync(Number(process.env.SALT_ROUNDS));
          const hash = bcrypt.hashSync(req.body.delete_password, salt);
          thread.replies.push({
            _id: shortid.generate(),
            text: req.body.text,
            delete_password: hash,
            created_on: new Date(),
            reported: false
          });
        }
      });
      Board.findOneAndUpdate(query, {threads: docs[0].threads}, err => {
        if (err) return console.error(err);
        return res.redirect("https://cross-anonymous.glitch.me/b/" + (req.body.board || req.params.thread) + "/" + req.body.thread_id + "/");
      });
    });
  // PUT REQUEST
  }).put((req, res) => {
    // console.log(req.body);
//     { board: 'general',
//       thread_id: 'moUY_Fd5T',
//       reply_id: 'oWo9fJGfb' }
    const query = {name: req.body.board || req.params.thread};
    Board.find(query, (err, docs) => {
      if (err) return console.error(err);
      // Loop through threads to find the right one then push reply to replies array
      docs[0].threads.map(thread => {
        if (thread._id === req.body.thread_id) {
          // Loop through replies
          thread.replies.map(reply => {
            if (reply._id === req.body.reply_id) {
              reply.reported = true;
            }
          });
        }
      });
      // Update new thread here
      Board.findOneAndUpdate(query, {threads: docs[0].threads}, err => {
        if (err) return console.error(err);
        return res.send("success");
      });
    });
  // DELETE REQUEST
  }).delete((req, res) => {
    // console.log(req.body);
//     { board: 'general',
//       thread_id: 'WGXiqqD6E',
//       reply_id: 'oWo9fJGfb',
//       delete_password: 'password' }
    const query = {name: req.body.board || req.params.thread};
    Board.find(query, (err, docs) => {
      if (err) return console.error(err);
      // Go through all threads and find the matching id
      let threadsOfBoard = docs[0].threads;
      for (let i = 0; i < threadsOfBoard.length; i++) {
        if (threadsOfBoard[i]._id === req.body.thread_id) {
          for (let j = 0; j < threadsOfBoard[i].replies.length; j++) {
            if (threadsOfBoard[i].replies[j]._id === req.body.reply_id) {
              if (bcrypt.compareSync(req.body.delete_password, threadsOfBoard[i].replies[j].delete_password)) {
                threadsOfBoard[i].replies.splice(j, 1);
                Board.findOneAndUpdate(query, {threads: threadsOfBoard}, err => {
                  if (err) return console.error(err);
                  return res.send("success");
                });
                // break;
              } else {
                return res.send("incorrect password");
              }
            }
          }
        }
      }
    });
  });
  
  // END OF MODULE EXPORTS
}