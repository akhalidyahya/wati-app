require('dotenv').config();
var Twit = require('twit');
var config = require('./config/config');
var request = require('request').defaults({ encoding: null });
var fs = require('fs');
var path = require('path');
var fetch = require('node-fetch');
let wikiApi = 'https://id.wikipedia.org/w/rest.php/v1/search/page?q=(:param)&limit=1';
var T = new Twit(config);
console.log('bot start');
// const fs = require('fs');

var stream = T.stream('statuses/filter', { track: '@akhalidyahya !cari' });

stream.on('tweet', function (tweet) {
  getWiki(tweet).then((data)=>{
    getImageAndTweet(data);
  })
});

// let url = 'https://id.wikipedia.org/w/api.php?action=opensearch&format=json&search=(:param)&namespace=0&limit=10';

async function getWiki(tweet) {
  let search_param = tweet.text.replace('@akhalidyahya !cari ','');
  let idSource  = tweet.id_str;
  let data = await fetch(wikiApi.replace('(:param)',search_param))
          .then(res=>{
            return res.json();
          })
          .then(data=>{
            // console.log(data.pages);
            let sourceImgUrl = '//upload.wikimedia.org/wikipedia/commons/thumb/d/de/Wikipedia_Logo_1.0.png/800px-Wikipedia_Logo_1.0.png';
            let imgUrl = '';
            let desc = '';
            let mainUrl = '';
            if(data.pages.length > 0){
              if(data.pages[0].thumbnail != null) {
                if(data.pages[0].thumbnail.url != null) {
                  sourceImgUrl = data.pages[0].thumbnail.url;
                }
              }
              imgUrl = 'https:'+sourceImgUrl;
              desc = (data.pages[0].description != null) ? data.pages[0].description : data.pages[0].title;
              mainUrl = 'https://id.wikipedia.org/wiki/'+data.pages[0].key;
            } else {
              imgUrl = 'https://cdn.freebiesupply.com/blog/23-11-2018/jepygq-x5.png';
              desc = 'Aku nggak nemu di wikipedia :( coba cari sendiri ya di ';
              mainUrl = 'https://www.google.com/';
            }
            return {imgUrl:imgUrl,desc:desc,mainUrl:mainUrl}
            // console.log(imgUrl);
            // console.log(desc);
            // console.log(mainUrl);
          });
  data['idSource'] = idSource;
  console.log(data);
  return data;
}


function postTweet(wikiData) {
  let tweetStr = wikiData.desc+' '+wikiData.mainUrl;
  T.post('statuses/update', { status: tweetStr }, function(err, data, response) {
    console.log(data)
  })
}

async function getImageAndTweet(wikiData) {
  const uri = wikiData.imgUrl;
  // let a = request.head(uri, async function (err, res, body) {
  //   return request(uri).pipe(fs.createWriteStream('./img/abc.jpg')).on('close', () => {
  //     let b64content = fs.readFileSync('./img/abc.jpg', { encoding: 'base64' })
  //     return b64content;
  //   });
  // });
  let a = await request(uri).pipe(fs.createWriteStream('./img/abc.jpg')).on('close', async () => {
    let b64content = fs.readFileSync('./img/abc.jpg', { encoding: 'base64' })
    // console.log(b64content);
    // return b64content;
    postMedia(b64content,wikiData)
  });

}

async function postMedia(media,wikiData) {

  T.post('media/upload', { media_data: media }, function (err, data, response) {
    // now we can assign alt text to the media, for use by screen readers and
    // other text-based presentations and interpreters
    var mediaIdStr = data.media_id_string
    var meta_params = { media_id: mediaIdStr }

    // console.log(mediaIdStr);
    if (err) {
      console.log(err)
    }

    T.post('media/metadata/create', meta_params, function (err, data, response) {
      if (!err) {
        // now we can reference the media and post a tweet (media will attach to the tweet)
        let statusStr = '';
        let statusStrCount = wikiData.desc.length + wikiData.mainUrl.length;
        if(statusStrCount < 281) {
          statusStr = wikiData.desc+' '+wikiData.mainUrl;
        } else {
          let urlCount = wikiData.mainUrl.length;
          let maxCount = 281 - urlCount;
          let newDesc = wikiData.desc.slice(0,maxCount-5);
          statusStr = newDesc+'... '+wikiData.mainUrl;
        }
        // if(wiki)
        var params = { 
          status: statusStr, 
          media_ids: [mediaIdStr],
          in_reply_to_status_id: wikiData.idSource,
        }

        T.post('statuses/update', params, function (err, data, response) {
          console.log(data);
          // reply(data);
          fs.unlinkSync('./img/abc.jpg');
        })
      } else {
        console.log(err);
      }
    })
  });
}

