// src/pages/AddSubtractDays.tsx
import React from "react";
import SEOHead from "../components/SEOHead";
import Breadcrumbs from "../components/Breadcrumbs";
import AdBanner from "../components/AdBanner";
import RelatedCalculators from "../components/RelatedCalculators";
import { seoData, generateCalculatorSchema } from "../utils/seoData";

const AddSubtractDays: React.FC = () => {
  return (
    <>
      <SEOHead
        title={seoData?.addSubtractDays?.title ?? "Add/Subtract Days Calculator (Business Days & Holidays)"}
        description={
          seoData?.addSubtractDays?.description ??
          "Add or subtract days from a date—optionally skip weekends and holidays. Rolling rules, notes, history, and CSV export."
        }
        canonical="https://calculatorhub.com/add-subtract-days"
        schemaData={generateCalculatorSchema(
          "Add/Subtract Days Calculator",
          seoData?.addSubtractDays?.description ??
            "Add or subtract days from a date—optionally skip weekends and holidays.",
          "/add-subtract-days",
          seoData?.addSubtractDays?.keywords ?? [
            "add days to date",
            "subtract days",
            "business days calculator",
            "skip weekends",
            "holiday calendar",
          ]
        )}
        breadcrumbs={[
          { name: "Date & Time Tools", url: "/category/date-time-tools" },
          { name: "Add/Subtract Days", url: "/add-subtract-days" },
        ]}
      />

      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <Breadcrumbs
          items={[
            { name: "Date & Time Tools", url: "/category/date-time-tools" },
            { name: "Add/Subtract Days", url: "/add-subtract-days" },
          ]}
        />

        {/* Header */}
        <header className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Add/Subtract Days Calculator</h1>
          <p className="text-slate-300">
            Quickly add or subtract days from a date. Optionally skip weekends and public holidays, and apply rolling rules.
          </p>
        </header>

        {/* ---- MAIN TOOL AREA (replace with full calculator UI/logic) ---- */}
        <section className="rounded-2xl bg-white border border-gray-200 p-6">
          <p className="text-gray-800">
            This is the scaffold. Plug in the UI and logic here (input date, +/- days, business-day toggle, holiday list, results, history, CSV).
          </p>
        </section>

        <AdBanner type="bottom" />

        <RelatedCalculators currentPath="/add-subtract-days" category="date-time-tools" />
      </div>
    </>
  );
};

export default AddSubtractDays;
