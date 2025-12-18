const { jsPDF } = require("jspdf");
const fs = require("fs");
const path = require("path");

function generateFullReport() {
    try {
        const doc = new jsPDF();
        let y = 15;
        const margin = 15;
        const pageHeight = 280;

        function addText(text, size = 12, isBold = false) {
            doc.setFontSize(size);
            doc.setFont(undefined, isBold ? 'bold' : 'normal');

            const splitText = doc.splitTextToSize(text, 180);

            if (y + splitText.length * 7 > pageHeight) {
                doc.addPage();
                y = 20;
            }

            doc.text(splitText, margin, y);
            y += splitText.length * 7 + (size > 14 ? 5 : 2);
        }

        // Title
        addText("NoshNurture - Technical Algorithm Documentation", 22, true);
        y += 5;
        addText("Generated on: " + new Date().toLocaleDateString(), 10, false);
        y += 10;

        // Executive Summary
        addText("1. Executive Summary", 16, true);
        addText("NoshNurture utilizes a hybrid intelligence system combining Google's Gemini Pro Vision (Multimodal AI) for unstructured data processing and deterministic algorithms for core business logic like recipe matching and waste calculations.");
        y += 5;

        // Gemini AI Section
        addText("2. Gemini AI Integration (src/lib/gemini-service.ts)", 16, true);

        addText("A. Optical Character Recognition (OCR) & Expiry Detection", 14, true);
        addText("• Input: Base64 Image (Camera capture/Upload)");
        addText("• Model: gemini-flash-latest");
        addText("• Technique: Zero-shot prompting with structured JSON schema enforcement.");
        addText("• Logic: Extracts `productName`, `expiryDate` (normalized to DD-MM-YYYY), and `batchNumber`. Uses regex post-processing to validate date formats.");
        y += 3;

        addText("B. Voice Processing (Speech-to-Inventory)", 14, true);
        addText("• Input: Natural language transcript string.");
        addText("• Logic: Semantic Entity Extraction (NER) to identify Item Name, Quantity, Unit and Dates (relative or absolute).");
        addText("• Rules: Auto-converts 'next week' -> strict date. Defaults 'confidence' score based on ambiguity.");
        y += 3;

        addText("C. Recipe Suggestion Engine (LLM Fallback)", 14, true);
        addText("• Function: `getRecipeSuggestions`");
        addText("• context: Generates 3-5 quick recipes specifically for a single expiring ingredient when deterministic matching fails.");
        y += 5;

        // Recipe Matching Algorithm
        addText("3. Deterministic Recipe Matching Engine", 16, true);
        addText("Located in: src/app/api/recipes/suggestions/route.ts", 10, true);

        addText("A. Ingredient Normalization", 14, true);
        addText("• Library: Custom normalization in `src/lib/ingredients`.");
        addText("• Logic: Converts brand names (e.g., 'Amul Butter') to canonical forms ('butter'). Handles known synonyms and unit variations.");
        y += 3;

        addText("B. Fuzzy Matching Logic", 14, true);
        addText("• Primary: Exact canonical match.");
        addText("• Secondary: Substring/Fuzzy match.");
        addText("• Threshold: A match is valid ONLY IF length_ratio >= 0.6. This prevents false positives like matching 'powder' to 'garlic powder'.");
        y += 3;

        addText("C. Ranking Algorithm", 14, true);
        addText("1. Availability Ratio: (Matched Ingredients / Total Ingredients) - Higher is better.");
        addText("2. Waste Reduction Score: Prioritizes recipes using ingredients that are expiring within 7 days.");
        addText("3. Time Efficiency: Shorter cooking time acts as a tie-breaker.");
        y += 5;

        // OpenFoodFacts
        addText("4. OpenFoodFacts Integration", 16, true);
        addText("• Barcode Lookup: Queries `world.openfoodfacts.org` API v2.");
        addText("• Enrichment: Retrieves Product Name, Front Image, and Nutriments.");
        addText("• Health Analysis: Calculates `is_healthy` boolean based on thresholds:");
        addText("  - Sugar > 10g/100g: High Sugar");
        addText("  - Sat Fat > 5g/100g: High Fat");
        addText("• Diet Inference: Checks ingredients text against regex (milk|egg|meat) to flag Vegan/Vegetarian status.");
        y += 5;

        // Sustainability
        addText("5. Sustainability & Waste Logic", 16, true);
        addText("• Mass Estimation: Converts units (pcs, packets, ml) to kg using heuristic density factors (e.g., 1 pc ≈ 0.2kg).");
        addText("• ROI Calculation: (Waste Reduced Kg) × (Fixed Cost Multiplier) = Money Saved.");

        // Output
        const outputPath = path.resolve(process.cwd(), "NoshNurture_Algorithm_Report.pdf");
        fs.writeFileSync(outputPath, Buffer.from(doc.output('arraybuffer')));
        console.log("PDF generated successfully at:", outputPath);

    } catch (e) {
        console.error("PDF Generation Failed:", e);
        process.exit(1);
    }
}

generateFullReport();
