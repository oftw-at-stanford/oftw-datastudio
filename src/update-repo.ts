import { writeFileSync, readFileSync } from "fs";
import { execSync, spawnSync } from "child_process";
import { chdir } from "process";
import { Stats } from "./statistics";

/**
 * Updates the repo, doing a git pull, a commit, and a git push.
 *
 * @param stats calculated statistics
 */
export async function updateRepo(stats: Stats) {
  chdir("./stanford-1ftw");

  execSync("git pull");

  const dollarFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });
  const numberFormatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  });

  // Replace in file
  // Yes, I commit the cardinal sin.
  writeFileSync(
    "layouts/index.html",
    readFileSync("layouts/index.html")
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

  if (spawnSync("git", ["diff", "--quiet"]).status !== 0) {
    console.log("Modified content detected.");

    execSync('git commit -am "Automated statistics update"');
    execSync("git push");
  } else {
    console.log("No modifications made, exiting");
  }
}
