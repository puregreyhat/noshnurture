export interface OFFProduct {
    code: string;
    product_name?: string;
    brands?: string;
    quantity?: string;
    image_url?: string;
    ingredients_text?: string;
    nutriments?: any;
}

export interface NutritionAnalysis {
    is_healthy: string;
    warnings: string[];
    diet_suitability: {
        bulking: string;
        cutting: string;
        diabetic: string;
        keto: string;
        vegan: string;
    };
}

export interface NutritionIntelligenceResponse {
    found: boolean;
    name: string;
    barcode: string;
    brand: string;
    image: string;
    nutriments: any;
    nutri_score: string;
    nova_group: string;
    ingredients: string;
    allergens: string;
    labels: string;
    error?: string;
    analysis?: NutritionAnalysis;
    quantity?: string;
}

const USER_AGENT = "NoshNurture/1.0 (akash73195@gmail.com)";

/**
 * Legacy function for backward compatibility with OCRScanner
 */
export async function getProductByBarcode(barcode: string): Promise<OFFProduct | null> {
    const data = await getNutritionIntelligence(barcode, 'barcode');
    if (data.found) {
        return {
            code: data.barcode,
            product_name: data.name,
            brands: data.brand,
            image_url: data.image,
            ingredients_text: data.ingredients,
            nutriments: data.nutriments,
            quantity: data.quantity
        };
    }
    return null;
}

export async function getNutritionIntelligence(query: string, type: 'barcode' | 'name'): Promise<NutritionIntelligenceResponse> {
    try {
        let url = '';
        if (type === 'barcode') {
            url = `https://world.openfoodfacts.org/api/v2/product/${query}.json`;
        } else {
            url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&json=1`;
        }

        const response = await fetch(url, {
            headers: {
                'User-Agent': USER_AGENT
            }
        });

        if (!response.ok) {
            console.error('OpenFoodFacts API error:', response.statusText);
            return { found: false, name: "", barcode: "", brand: "", image: "", nutriments: {}, nutri_score: "", nova_group: "", ingredients: "", allergens: "", labels: "", error: "API connection failed" };
        }

        const data = await response.json();
        let product: any = null;

        if (type === 'barcode') {
            if (data.status === 1 && data.product) {
                product = data.product;
            }
        } else {
            if (data.count > 0 && data.products && data.products.length > 0) {
                product = data.products[0];
            }
        }

        if (!product) {
            return { found: false, name: "", barcode: "", brand: "", image: "", nutriments: {}, nutri_score: "", nova_group: "", ingredients: "", allergens: "", labels: "", error: "Product not found in database." };
        }

        // Analysis Logic
        const nutriments = product.nutriments || {};
        const sugar = nutriments['sugars_100g'] || 0;
        const satFat = nutriments['saturated-fat_100g'] || 0;
        const salt = nutriments['salt_100g'] || 0;
        const protein = nutriments['proteins_100g'] || 0;
        const carbs = nutriments['carbohydrates_100g'] || 0;
        const ingredientsText = (product.ingredients_text || "").toLowerCase();

        const warnings: string[] = [];
        if (sugar > 10) warnings.push("High sugar");
        if (satFat > 5) warnings.push("High saturated fat");
        if (salt > 1) warnings.push("High salt");

        const analysis: NutritionAnalysis = {
            is_healthy: warnings.length === 0 ? "Yes" : "Moderation advised",
            warnings: warnings,
            diet_suitability: {
                bulking: protein > 10 ? "Good" : "Average",
                cutting: (sugar < 5 && satFat < 3) ? "Good" : "Limit intake", // Inferring logical defaults for missing logic
                diabetic: (sugar < 5 && carbs < 15) ? "Friendly" : "Avoid",
                keto: carbs < 10 ? "Friendly" : "Avoid",
                vegan: (ingredientsText.match(/milk|egg|meat|gelatin/)) ? "Not vegan" : "Likely vegan"
            }
        };

        return {
            found: true,
            name: product.product_name || "Unknown Product",
            barcode: product.code || product._id || "",
            brand: product.brands || "",
            image: product.image_front_url || "",
            nutriments: nutriments,
            nutri_score: product.nutriscore_grade || "",
            nova_group: product.nova_group?.toString() || "",
            ingredients: product.ingredients_text || "",
            allergens: product.allergens || "",
            labels: product.labels || "",
            analysis: analysis,
            quantity: product.quantity || ""
        };

    } catch (error) {
        console.error('Error fetching product from OpenFoodFacts:', error);
        return { found: false, name: "", barcode: "", brand: "", image: "", nutriments: {}, nutri_score: "", nova_group: "", ingredients: "", allergens: "", labels: "", error: "Internal error" };
    }
}
