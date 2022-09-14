import Puppeteer from 'puppeteer-extra';
import Stealth from 'puppeteer-extra-plugin-stealth';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
import Anon from 'puppeteer-extra-plugin-anonymize-ua';

Puppeteer.use(Stealth());
Puppeteer.use(AdblockerPlugin({ blockTrackers: true }));
Puppeteer.use(Anon());

const findFeed = async (query) => {
  const browser = await Puppeteer.launch({ headless: true, defaultViewport: null });

  const page = await browser.newPage();

  await page.goto(`https://www.rsssearchhub.com/feeds?q=${query}`);

  const elementHandles = await page.$$('a');

  const propertyJsHandles = await Promise.all(
    elementHandles.map((handle) => handle.getProperty('href')),
  );
  const hrefs = await Promise.all(propertyJsHandles.map((handle) => handle.jsonValue()));

  let feedItems = hrefs.filter((str) => {
    return str.includes('https://www.rsssearchhub.com/feed/');
  });

  const feedPage = await browser.newPage();

  for (let i = 0; i < feedItems.length; i++) {
    await feedPage.goto(feedItems[i]);

    const hasItems = await feedPage.$$eval(
      '.___rsssearchhubarticle',
      (elements) => elements.length > 0,
    );

    const _isRecent = async () => {
      const publishDate = await feedPage.$$eval('.published', (elements) =>
        elements.map((el) => el.getAttribute('datetime')),
      );

      var b = new Date(publishDate[0] * 1000);

      var d = new Date();

      d.setMonth(d.getMonth() - 24);

      return b > d;
    };

    const isRecent = await _isRecent();

    if (hasItems && isRecent) {
      const linkToRSS = await feedPage.$$eval(
        'textarea',
        (elements) => elements.map((el) => el.textContent)[0],
      );

      return await linkToRSS;
    } else {
      continue;
    }
  }

  return 'err';
};

export { findFeed };
