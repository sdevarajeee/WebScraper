var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');

var START_URL = "https://www.moneycontrol.com";
var SEARCH_WORD = "discriminatory";
var MAX_PAGES_TO_VISIT = 10;

var pagesVisited = {};
var numPagesVisited = 0;
var pagesToVisit = [];
var url = new URL(START_URL);
console.log(url);
var baseUrl = url.protocol + "//" + url.hostname;
console.log(baseUrl);
pagesToVisit.push(START_URL);
crawl();

function crawl() {
    if (numPagesVisited >= MAX_PAGES_TO_VISIT) {
        console.log("Reached max limit of number of pages to visit.");
        return;
    }
    var nextPage = pagesToVisit.pop();
    if (nextPage in pagesVisited) {
        // We've already visited this page, so repeat the crawl
        crawl();
    } else {
        // New page we haven't visited
        visitPage(nextPage, crawl);
    }
}

function visitPage(url, callback) {
    // Add page to our set
    pagesVisited[url] = true;
    numPagesVisited++;

    // Make the request
    console.log("Chaecking page " + url);
    request(url, function (error, response, body) {
        // Check status code (200 is HTTP OK)
        console.log("Status code: " + response.statusCode);
        if (response.statusCode !== 200) {
            callback();
            return;
        }
        // Parse the document body
        var $ = cheerio.load(body);
        var isWordFound = searchForWord($, SEARCH_WORD);
        if (isWordFound) {
            console.log('Word ' + SEARCH_WORD + ' found at page ' + url);
        } else {
            collectInternalLinks($);
            // In this short program, our callback is just calling crawl()
            callback();
        }
    });
}

function searchForWord($, word) {
    var bodyText = $('html > body').text().toLowerCase();
    return (bodyText.indexOf(word.toLowerCase()) !== -1);
}

function collectInternalLinks($) {
    var relativeLinks = $("a[href^='/']");
    console.log("Found " + relativeLinks.length + " relative links on page");
    relativeLinks.each(function () {
        if ($(this).attr('href').includes('http')) {
            var local_url = $(this).attr('href');
            if (local_url.startsWith('/')) local_url = local_url.split('/')[1];
            else pagesToVisit.push(local_url);
        } else pagesToVisit.push(baseUrl + $(this).attr('href'));
    });
    console.log(pagesToVisit);
}