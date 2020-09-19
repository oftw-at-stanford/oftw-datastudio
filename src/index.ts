import * as puppeteer from 'puppeteer';
import {writeFileSync, readFileSync, stat} from 'fs';
import * as process from 'process';
import {execSync, spawnSync} from 'child_process';
import {chdir} from 'process';
import * as config from '../config.json';

// https://github.com/puppeteer/puppeteer/issues/6214
declare module 'puppeteer' {
  export interface Page {
    waitForTimeout(duration: number): Promise<void>;
  }
}

console.log('Data Studio Scraper');

async function savePledges() {
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

    writeFileSync('pledges.json', JSON.stringify(data));
  } finally {
    await browser.close();
  }
}

type Stats = {
  pledgees: number;
  antimalarialTreatments: number;
  yearlyDollarsPledged: number;
  bednets: number;
};

const DOLLARS_TO_ANTIMALARIAL_TREATMENTS = 1765 / 5000;
const DOLLARS_TO_BEDNETS = 2771 / 5000;

async function calculateStatistics() {
  const data: any[] = JSON.parse(readFileSync('pledges.json').toString());
  console.log('Pledgees:', data.length);

  const yearlyDollarsPledged = data.reduce(
    (a, {annualRunRate}) =>
      a + parseInt(annualRunRate.replace(/[^\d\.\-]/g, '')),
    0
  );
  const antimalarialTreatments =
    yearlyDollarsPledged * DOLLARS_TO_ANTIMALARIAL_TREATMENTS;
  const bednets = yearlyDollarsPledged * DOLLARS_TO_BEDNETS;

  // Sanity check: numbers shouldn't be NaN
  if (Number.isNaN(bednets) || Number.isNaN(antimalarialTreatments)) {
    throw new Error("Parse error, numbers shouldn't be NaN");
  }

  console.log('Yearly $ pledged:', yearlyDollarsPledged);
  console.log('Antimalarial treatments:', antimalarialTreatments);
  console.log('Bednets:', bednets);

  return {
    pledgees: data.length,
    yearlyDollarsPledged,
    antimalarialTreatments,
    bednets,
  };
}

async function updateRepo(stats: Stats) {
  chdir('./stanford-1ftw');

  execSync('git pull');

  const dollarFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  const numberFormatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  });

  // Replace in file
  // Yes, I commit the cardinal sin.
  writeFileSync(
    'layouts/index.html',
    readFileSync('layouts/index.html')
      .toString()
      .replace(
        /<span data-stat="pledgees">(?:.+)<\/span>/g,
        `<span data-stat="pledgees">${numberFormatter.format(
          stats.pledgees
        )}</span>`
      )
      .replace(
        /<span data-stat="antimalarialTreatments">(?:.+)<\/span>/g,
        `<span data-stat="antimalarialTreatments">${numberFormatter.format(
          stats.antimalarialTreatments
        )}</span>`
      )
      .replace(
        /<span data-stat="bednets">(?:.+)<\/span>/g,
        `<span data-stat="bednets">${numberFormatter.format(
          stats.bednets
        )}</span>`
      )
      .replace(
        /<span data-stat="yearlyDollarsPledged">(?:.+)<\/span>/g,
        `<span data-stat="yearlyDollarsPledged">${dollarFormatter.format(
          stats.yearlyDollarsPledged
        )}</span>`
      )
  );

  if (spawnSync('git', ['diff', '--quiet']).status !== 0) {
    console.log('Modified content detected.');

    execSync('git commit -am "Automated statistics update"');
    execSync('git push');
  } else {
    console.log('No modifications made, exiting');
  }
}

(async () => {
  await savePledges();
  const stats = await calculateStatistics();
  if (process.env.UPDATE_REPO) {
    await updateRepo(stats);
  } else {
    console.log('Skipping repo update');
  }
})().catch(e => {
  console.error(e);
  process.exit(1);
});
