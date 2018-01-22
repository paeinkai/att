var GitHub = require('github-api');
var express = require('express');
var app = express(),
    async = require('async');
// basic auth
var gh = new GitHub({
   username: 'paeinkai',
   password: 'reset_password'
});

var stored_repos = [];
var list = [];

async function getAttRepos() {
  // var me = gh.getUser(); // no user specified defaults to the user for whom credentials were provided
  // me.listNotifications(function(err, notifications) {
  //    // do some stuff
  //    console.log('notifications:',notifications);
  // });
  // var limit = gh.getRateLimit();
  // console.log('limit:',limit);
  var att_user = gh.getUser('att');
  att_user.listRepos(function(err, repos) {
     if(err) console.log('listRepos err:',err);
     else {
       // console.log('size:',repos.length,' repos[0]:',repos[0]);
       async.forEachOf(
         repos,
         function(repo, k, inner_callback) {
           // console.log('key:',k,' repo:',repos[k]);
           // console.log(k + ' - ' + repos[k].name,' name:',repos[k].name,' repos[k].open_issues_count:',repos[k].open_issues_count);
           var iss = gh.getIssues('att', repos[k].name);
           if(repos[k].open_issues_count > 0) {
             // console.log('iss:',iss);
             iss.listIssues({}, function(err, issues) {
               if(err) {
                 console.log('err:',err);
               } else {
                 // console.log('type:',typeof(issues),' issues:',issues);
                 async.forEachOf(
                   issues,
                   function(issue, l, callback2) {
                     if(issues[l].state === "open" && issues[l].comments > 0) {
                       // console.log('issues[k].id:',issues[k].number,' issues[k].comments:',issues[k].comments);
                       iss.listIssueComments(issues[l].number, function(err, comments) {
                         issues[l].full_comments = comments
                         // console.log('full_comments l:',l);
                       });
                     }
                     callback2(false);
                   },
                   function(err) {
                     if (err) {
                       console.error('list comment error:',err);
                     } else {
                       console.log('list comment no error');
                     }
                   }
                 );
                 repos[k].full_issues = issues;
                 console.log('push k:',k);
                 stored_repos.push(repos[k]);
                 if(k == 0)
                  console.log('stored_repos:',stored_repos[0]);
                }
             });
           } else {
             console.log('stored_repos push k:',k);
             stored_repos.push(repos[k]);
           }
          inner_callback(false);
         },
         function(err) {
           if (err) {
             console.log('list issues error');
           } else {
             console.log('list issues no error');
             return;
           }
         }
       );
   }
  });

  // No unhandled rejection!
  // await Promise.reject(new Error('test'));
  process.on('unhandledRejection', error => {
    // Will print "unhandledRejection err is not defined"
    console.log('unhandledRejection', error.message);
  });

  new Promise((_, reject) => reject(new Error('woops'))).
    catch(error => {
      // Will not execute
      console.log('caught', err.message);
    });
}

app.get('/list', function(req, res) {
  console.log('size:',stored_repos.length);
  return res.send(stored_repos);
  // async.waterfall(
  //   [
  //     function(done) {
  //       getAttRepos();
  //     },
  //     function(done) {
  //       return res.send(stored_repos);
  //     }
  //   ],
  //   function(err) {
  //     console.log('err');
  //     return res.status(422).json({ message: err });
  //   }
  // );
});

app.get('/', function(req, res) {
  // console.log('size:',stored_repos.length);
  // return res.send(stored_repos);
  var rl = gh.getRateLimit();
  rl.getRateLimit(function(err, res) {
    if(err) console.log('rl err:',err);
    console.log('rl:',rl,' limit:',res);
  });
  return res.send({'hello':'world'});
});

app.listen(process.env.PORT || 5000, function() {
  console.log('att app listening on 0.0.0.0:5000!');
  // getAttRepos();
  getAttRepos().catch(() => {});
});
