import fs from 'fs';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { createObjectCsvWriter } from 'csv-writer';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';

const csvWriter = createObjectCsvWriter({
    path: 'out.csv',
    header: [
        {id: 'url', title: 'URL'},
        {id: 'date', title: 'DATE'},
        {id: 'accessibility', title: 'ACCESSIBILITY'},
        {id: 'bestPractices', title: 'BEST_PRACTICES'},
        {id: 'SEO', title: 'seo'},
        {id: 'lighthouseVersion', title: 'LIGHTHOUSE_VERSION'}
    ],
    append: true // This option enables appending
})

const csvWriterHeader = createObjectCsvWriter({
    path: 'out.csv',
    header: [
        {id: 'url', title: 'URL'},
        {id: 'date', title: 'DATE'},
        {id: 'accessibility', title: 'ACCESSIBILITY'},
        {id: 'bestPractices', title: 'BEST_PRACTICES'},
        {id: 'SEO', title: 'seo'},
        {id: 'lighthouseVersion', title: 'LIGHTHOUSE_VERSION'}
    ],
    append: false // This option enables appending
});
csvWriterHeader.writeRecords([])
const date = getFormattedDate(new Date());
(async ()=>{
    const urls = await getSitemapUrls('https://cetera.com/sitemap.xml');
    const chrome = await chromeLauncher.launch({ });
    for (let i = 0; i < urls.length; i++) {
        const lighthouseScores = await runLighthouse(chrome,urls[i]);
        console.log(lighthouseScores);
    }
    await chrome.kill();
})();

const flags = {
    onlyCategories: ['accessibility','best-practices','seo'],
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
    port: browser.port,
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
const runLighthouse = async function (browser,url){
    const result = await lighthouse(url,flags)
    const scores = parseScores(result.lhr);
    await csvWriter.writeRecords([scores]);
    return result.lhr.finalUrl;
}

const parseScores = function(
    data
){
    const url = data.finalUrl;
    const accessibility = data.categories.accessibility.score;
    const bestPractices = data.categories["best-practices"].score;
    const SEO = data.categories.seo.score;
    const lighthouseVersion = data.lighthouseVersion;
    return {
        url,
        date,
        accessibility,
        bestPractices,
        SEO,
        lighthouseVersion
    }
}

function getFormattedDate(dateString) {
    let date = new Date(dateString);
    let year = date.getFullYear();
    let month = ("0" + (date.getMonth() + 1)).slice(-2); // Months are 0 based, so add 1 and format as 2 digits
    let day = ("0" + date.getDate()).slice(-2); // Format as 2 digits
    return `${year}-${month}-${day}`;
}

async function getSitemapUrls(sitemapUrl) {
    try {
        const response = await axios.get(sitemapUrl);
        const sitemap = await parseStringPromise(response.data);
        const urls = sitemap.urlset.url.map(url => url.loc[0]);
        return urls;
    } catch (error) {
        console.error(error);
    }
}
