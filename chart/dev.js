import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';

const devUrl = 'https://cetera.com';
let lighthouseScores = [];
(async()=>{
    const chrome = await chromeLauncher.launch({ });
    const flags = {
        onlyCategories: [
            'accessibility',
            'best-practices',
            'seo',
            'performance',
            'pwa'
        ],
        formFactor: "desktop",
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
            pauseAfterFcpMs: 250,
            pauseAfterLoadMs: 250,
            networkQuietThresholdMs: 250,
            cpuQuietThresholdMs: 250,
        },
        maxWaitForFcp:10000,
        maxWaitForLoad:10000,
        port: chrome.port,
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
    }
   runAudit(devUrl,flags);

})();

export const runAudit = async (url, flags) => {
    const newScore = await runLighthouse(url, flags);
    lighthouseScores.push(newScore);

    // Keep only the last 20 scores
    if (lighthouseScores.length > 20) {
        lighthouseScores = lighthouseScores.slice(-20);
    }

    console.log(lighthouseScores);

    // Call runAudit again to start a new audit
    runAudit(url, flags);
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
    const bestPractices = data.categories["best-practices"].score*100;
    const performance = data.categories["performance"].score*100;
    const pwa = data.categories["pwa"].score*100;
    const SEO = data.categories.seo.score*100;
    const time = new Date();
    return {
        url,
        time,
        performance,
        accessibility,
        bestPractices,
        SEO,
        pwa
    }
}
