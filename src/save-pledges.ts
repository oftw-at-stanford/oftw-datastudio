import puppeteer from "puppeteer";
import * as config from '../config.json';

// There are mor properties than this, we just don't use them
export type Pledgees = {
  annualRunRate: string,
  email: string;
}[];

export default async function savePledges(): Promise<Pledgees> {
  const browser = await puppeteer.launch({
    headless: process.env.HEADLESS === 'true',
    userDataDir: './chrome_data',
  });
  try {
    const page = await browser.newPage();
    await page.goto(config.url);

    await page.waitForSelector('lego-table');

    console.log('Page loaded!');

    await page.click('.lego-control-section.label');

    await page.type(
      "[placeholder='Type to search'] input",
      'Stanford University (UG)'
    );
    await page.waitForTimeout(2000);
    await page.$eval('.only', el => (el as any).click());

    // Wait for page to reload
    await page.waitForFunction(
      () => document.querySelector('[ng-if=isLoading]') === null
    );

    const data = await page.evaluate(() => {
      const rows = Array.from(
        document.querySelectorAll('.row:not(:first-child)')!
      );

      if (rows.length === 100) {
        throw new Error('Pagination not impl');
      }

      return rows.map(row => {
        const children = Array.from(row.childNodes);

        if (children.length !== 15) {
          throw new Error('New fields added?');
        }

        // Dynamically map columns to field names
        // This seems to be necessary because the columns change order??
        const fields: {
          [col: string]: string;
        } = {
          School: 'school',
          'Pledge Date': 'pledgeDate',
          Class: 'class',
          'Start Date': 'startDate',
          'Post-Grad Start Delay (Months)': 'postGradStartDelay',
          'End Date': 'endDate',
          Status: 'status',
          Amount: 'amount',
          Frequency: 'frequency',
          Portfolio: 'portfolio',
          'Annual Run Rate': 'annualRunRate',
          'First Name': 'firstName',
          'Last Name': 'lastName',
          Email: 'email',
        };

        const columns = Array.from(document.querySelectorAll('.colName')).map(
          el => el.textContent!
        );

        const out: any = {};

        for (let i = 1; i < children.length; i++) {
          const fieldName = fields[columns[i]];
          // Skip [0] which is the number
          out[fieldName] = children[i].textContent;
        }

        return out;
      });
    });

    return data;
  } finally {
    await browser.close();
  }
}
