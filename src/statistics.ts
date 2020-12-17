export type Stats = {
  pledgees: number;
  antimalarialTreatments: number;
  yearlyDollarsPledged: number;
  bednets: number;
};

const DOLLARS_TO_ANTIMALARIAL_TREATMENTS = 1765 / 5000;
const DOLLARS_TO_BEDNETS = 2771 / 5000;

/**
 * Calculates statistics (e.g. antimalarial treatments, bednets) from the raw
 * statistics of dollars pledged.
 */
export default async function calculateStatistics(data: any[]) {
  console.log("Pledgees:", data.length);

  const yearlyDollarsPledged = data.reduce(
    (a, { annualRunRate }) =>
      a + parseInt(annualRunRate.replace(/[^\d\.\-]/g, "")),
    0
  );
  const antimalarialTreatments =
    yearlyDollarsPledged * DOLLARS_TO_ANTIMALARIAL_TREATMENTS;
  const bednets = yearlyDollarsPledged * DOLLARS_TO_BEDNETS;

  // Sanity check: numbers shouldn't be NaN
  if (Number.isNaN(bednets) || Number.isNaN(antimalarialTreatments)) {
    throw new Error("Parse error, numbers shouldn't be NaN");
  }

  console.log("Yearly $ pledged:", yearlyDollarsPledged);
  console.log("Antimalarial treatments:", antimalarialTreatments);
  console.log("Bednets:", bednets);

  return {
    pledgees: data.length,
    yearlyDollarsPledged,
    antimalarialTreatments,
    bednets,
  };
}
