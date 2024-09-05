import express from "express";
import bodyParser from "body-parser";
import puppeteer from "puppeteer";
import * as cheerio from "cheerio"; // Import all of cheerio's exports
import time from "console";
import dotenv from "dotenv";

// define the browser to do the scraping
dotenv.config();
let browser;

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', './views');
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Steps in web scraping
// 1. open the browser via chromium
// 2. get the data from the website and do processing
// 3. close the browser

const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.render('search');
})

app.get('/results', async (req, res) => {

    // get the url
    let url = req.query.search;

    let data = await scrapeData(url)

    res.render('results', { data: data });
})

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeData(url) {
    let browser = await puppeteer.launch({ headless: true });
    let page = await browser.newPage();

    try {
        await page.goto(url, { waitUntil: 'load', timeout: 0 });
        const pageHtml = await page.evaluate(() => document.body.innerHTML);
        const $ = cheerio.load(pageHtml);
        sleep(2000)

        // from the html find the data
        // title
        let title = $('.title > h2 > a').text();
        //console.log("title ", title)

        // release date
        let releaseDate = $('.release').text();
        //console.log("release date ", releaseDate)

        // over view
        let overview = $('.overview > p').text();
        //console.log("overview ", overview)

        // userscore
        let userScore = $('.user_score_chart').attr('data-percent');
        //console.log("user score ", userScore)

        // imageUrl
        let imageUrl = $('.poster > img').attr('src');
        imageUrl = imageUrl.replace('_filter(blur)', '');
        //console.log("image url ", imageUrl)

        // crew details
        let crewLength = $("div.header_info > ol > li").length
        let crewList = []

        while (crewLength--) {
            let name = $("div.header_info > ol > li:nth-child(" + crewLength.toString() + ") > p:nth-child(1)").text()
            //console.log("name ", name)

            let role = $("div.header_info > ol > li:nth-child(" + crewLength.toString() + ") > p.character").text()
            //console.log("role ", role)

            crewList.push({
                "name": name,
                "role": role
            })
        }
        // console.log("crew list ", crewList)
        browser.close();
        return {
            title: title,
            releaseDate: releaseDate,
            overview: overview,
            userScore: userScore,
            imageUrl: imageUrl,
            crew: crewList
        }
    } catch (err) {
        console.log(err)
    }
}

async function openBrowser() {
    browser = await puppeteer.launch({ headless: true });
}

app.listen(port, () => {
    openBrowser()
    console.log(`Server is running on port ${port}`);
})
