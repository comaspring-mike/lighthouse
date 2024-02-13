import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const devUrl = 'https://cetera.com';

app.use(express.static('chart')); // serve static files from 'chart' directory

io.on('connection', (socket) => {
    console.log('a user connected');
    (async()=>{
      const chrome = await chromeLauncher.launch({ });
      runAudit(devUrl, getFlags(chrome.port), socket);
      setTimeout(async () => {
        const chrome2 = await chromeLauncher.launch({ });
        runAudit(devUrl, getFlags(chrome2.port), socket);
      }, 3000);
    })();
  });

server.listen(3000, () => {
  console.log('listening on *:3000');
});


let lighthouseScores = [];

const getFlags = (port) => ({
    onlyCategories: [
      'accessibility',
      'best-practices',
      'seo',
      'performance',
      'pwa'
    ],
    formFactor: "desktop",
    disableStorageReset: false,
    throttlingMethod:"provided",
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
    emulatedUserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    throttling:{
      pauseAfterFcpMs: 0,
      pauseAfterLoadMs: 0,
      networkQuietThresholdMs: 0,
      cpuQuietThresholdMs: 0,
    },
    maxWaitForFcp:10000,
    maxWaitForLoad:10000,
    port: port,
    skipAboutBlank:true,
    gatherMode:false,
    blockedUrlPatterns:[
      '*google*',
      '*driftt*',
      '*bam.nr-data*',
      '*metrics.api.drift*',
      '*newrelic*',
      '*visitor-scoring*'
    ]
  });


const runAudit = async (url, flags,socket) => {
    const newScore = await runLighthouse(url, flags);
    lighthouseScores.push(newScore);
    if (lighthouseScores.length > 20) {lighthouseScores = lighthouseScores.slice(-20);}
    console.log(lighthouseScores.length)
    socket.emit('scores', lighthouseScores)
    runAudit(url, flags, socket);
}


const runLighthouse = async function (url,flags){
    const result = await lighthouse(url,flags)
    return parseScores(result.lhr);
}

const parseScores = function(
    data
){
    const url = data.finalUrl;
    const accessibility = data.categories.accessibility.score*100;
    const bestpractices = data.categories["best-practices"].score*100;
    const performance = data.categories["performance"].score*100;
    const pwa = data.categories["pwa"].score*100;
    const seo = data.categories.seo.score*100;
    const time = new Date();
    return {
        url,
        time,
        performance,
        accessibility,
        bestpractices,
        seo,
        pwa
    }
}
