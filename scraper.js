const requestPromise = require("request-promise");
const cherio = require("cheerio");
const table = require("cli-table");
fs = require("fs");

const allShows = [];

run();

async function run() {
  //65, 91
  for (let letterCode = 65; letterCode < 91; letterCode++) {
    const letter = String.fromCharCode(letterCode);

    const firstPageForLetter = await requestPromise({
      url: `https://myanimelist.net/anime.php?letter=${letter}`,
    });

    const shows = firstPageForLetter.match(/(?<=<strong>).+(?=<\/strong>)/g);
    for (const show of shows) {
      allShows.push(show);
    }

    const pagesForLetter = new Set(
      firstPageForLetter.match(
        new RegExp(`anime\.php\\?letter=${letter}\\&amp;show=\\d+`, "g")
      )
    );

    let min = 9999999;
    let max = 0;
    for (const link of pagesForLetter) {
      const pageStartShowNumber = parseInt(link.match(/(?<=show=).+/g)[0], 10);

      if (pageStartShowNumber < min) {
        min = pageStartShowNumber;
      }

      if (pageStartShowNumber > max) {
        max = pageStartShowNumber;
      }
    }

    for (let pageStart = min; pageStart <= max; pageStart += 50) {
      const page = await requestPromise({
        url: `https://myanimelist.net/anime.php?letter=${letter}&show=${pageStart}`,
      });

      const showsOnPage = page.match(/(?<=<strong>).+(?=<\/strong>)/g);
      for (const show of showsOnPage) {
        allShows.push(show);
      }
    }
  }

  const animeNamesFile = fs.createWriteStream("anime-names.txt", {
    flags: "a",
  });
  for (const show of allShows) {
    animeNamesFile.write(show + "\n");
  }

  animeNamesFile.end();
}
