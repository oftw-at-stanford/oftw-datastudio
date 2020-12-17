# One for the World Data Studio Scraper

An automated script to scrape One for the World HQ's pledgee dashboard and update the statistics on the [One for the World at Stanford website](https://onefortheworld.su.domains).

## System requirements

- [Latest Node.js LTS release](https://nodejs.org)
- The [pnpm package manager](https://pnpm.js.org/)

## Running

1. Run `pnpm install` to install all dependencies
2. Create a `config.json` file with the following content:

   ```json
   {
     "url": "[The URL of the Data Studio dashboard]",
     "email": {
       "user": "...",
       "pass": "...",
       "host": "..."
     }
   }
   ```

3. Run `pnpm start` to run the scraper.

## Configuration options

Configuration is set through [environment variables](https://www.twilio.com/blog/2017/01/how-to-set-environment-variables.html).

- `UPDATE_REPO`: Default: false. Whether or not to auto-commit and update the repository with new stats.
- `SEND_ONBOARDING`: Default: false. Whether or not to send onboarding emails.
- `HEADLESS`: Default: false. Whether or not to hide the Chrome window that appears during scraping.
