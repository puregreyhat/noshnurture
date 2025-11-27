'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  ChefHat,
  Flame,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface RecipeTemplate {
  title: string;
  time: number;
  servings: number;
  ingredients: string[];
  instructions: string[];
}

export default function TemplateRecipePage() {
  const params = useParams();
  
  const recipeId = params.id as string;

  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [recipe, setRecipe] = useState<RecipeTemplate | null>(null);

  useEffect(() => {
    // If the incoming id looks like a numeric Spoonacular id, a local id
    // (`local-123`) or a legacy `recipes-site:123` id, redirect to the
    // main recipe detail page. This avoids accidentally rendering the
    // generic template view when a detailed/local recipe was intended.
    if (/^\d+$/.test(recipeId) || /^local-\d+$/.test(recipeId) || /^recipes-site:\d+$/.test(recipeId)) {
      router.replace(`/recipes/${encodeURIComponent(recipeId)}`);
      return;
    }
    // Parse template ID to extract recipe type and ingredients
    const parts = recipeId.split('-');
    const recipeType = parts[0];
    const ingredients = parts.slice(1);

    // Generate basic recipe based on type
    const templates: Record<string, RecipeTemplate> = {
      curry: {
        title: 'Simple Curry',
        time: 30,
        servings: 4,
        ingredients: ingredients.map(i => capitalize(i.replace(/_/g, ' '))),
        instructions: [
          'Heat oil in a large pan over medium heat',
          'Add onions and garlic, sauté until golden',
          'Add your vegetables/protein and cook for 5 minutes',
          'Mix in curry powder, turmeric, and garam masala',
          'Add water or coconut milk and simmer for 15 minutes',
          'Season with salt and pepper to taste',
          'Serve hot with rice or naan bread'
        ]
      },
      stirfry: {
        title: 'Veggie Stir-Fry',
        time: 20,
        servings: 4,
        ingredients: ingredients.map(i => capitalize(i.replace(/_/g, ' '))),
        instructions: [
          'Heat oil in a wok or large pan over high heat',
          'Add garlic and ginger, stir for 30 seconds',
          'Add harder vegetables first (carrots, broccoli)',
          'Stir-fry for 3-4 minutes until slightly tender',
          'Add softer vegetables and protein',
          'Add soy sauce, sesame oil, and seasonings',
          'Toss everything together for 2 minutes',
          'Serve immediately with rice or noodles'
        ]
      },
      pasta: {
        title: 'Quick Pasta',
        time: 25,
        servings: 4,
        ingredients: ingredients.map(i => capitalize(i.replace(/_/g, ' '))),
        instructions: [
          'Boil pasta in salted water according to package directions',
          'Heat olive oil in a large pan',
          'Sauté garlic until fragrant',
          'Add vegetables and cook until tender',
          'Drain pasta, reserving 1 cup pasta water',
          'Toss pasta with vegetables and sauce',
          'Add pasta water if needed for consistency',
          'Top with cheese and fresh herbs'
        ]
      },
      omelet: {
        title: 'Veggie Omelet',
        time: 15,
        servings: 2,
        ingredients: ingredients.map(i => capitalize(i.replace(/_/g, ' '))),
        instructions: [
          'Beat eggs in a bowl with a pinch of salt and pepper',
          'Chop vegetables into small pieces',
          'Heat butter in a non-stick pan over medium heat',
          'Add vegetables and sauté for 2-3 minutes',
          'Pour beaten eggs over vegetables',
          'Cook until edges set, then gently fold in half',
          'Cook for another minute until fully set',
          'Slide onto plate and serve hot'
        ]
      },
      friedrice: {
        title: 'Fried Rice',
        time: 20,
        servings: 4,
        ingredients: ingredients.map(i => capitalize(i.replace(/_/g, ' '))),
        instructions: [
          'Use day-old cooked rice (or cool fresh rice)',
          'Heat oil in a wok over high heat',
          'Add beaten eggs, scramble and set aside',
          'Add more oil, then garlic and ginger',
          'Add vegetables and stir-fry for 3 minutes',
          'Add rice, breaking up clumps',
          'Add soy sauce, sesame oil, and mix well',
          'Return eggs, toss everything together'
        ]
      },
      salad: {
        title: 'Fresh Salad',
        time: 15,
        servings: 4,
        ingredients: ingredients.map(i => capitalize(i.replace(/_/g, ' '))),
        instructions: [
          'Wash and dry all vegetables thoroughly',
          'Chop vegetables into bite-sized pieces',
          'Arrange greens in a large bowl as base',
          'Add other vegetables on top',
          'Prepare dressing: mix olive oil, lemon juice, salt, pepper',
          'Drizzle dressing over salad just before serving',
          'Toss gently to combine',
          'Top with nuts, seeds, or cheese if desired'
        ]
      },
      soup: {
        title: 'Comfort Soup',
        time: 35,
        servings: 6,
        ingredients: ingredients.map(i => capitalize(i.replace(/_/g, ' '))),
        instructions: [
          'Heat oil in a large pot over medium heat',
          'Sauté onions, garlic, and celery until soft',
          'Add your vegetables and cook for 5 minutes',
          'Pour in vegetable or chicken broth',
          'Add herbs (thyme, bay leaf) and seasonings',
          'Bring to boil, then simmer for 20 minutes',
          'Blend if you want a smooth soup',
          'Adjust seasoning and serve hot'
        ]
      },
      wrap: {
        title: 'Quick Wrap',
        time: 10,
        servings: 2,
        ingredients: ingredients.map(i => capitalize(i.replace(/_/g, ' '))),
        instructions: [
          'Warm tortillas or flatbreads slightly',
          'Prepare your filling ingredients',
          'Spread hummus, mayo, or sauce on tortilla',
          'Layer vegetables and protein in center',
          'Add cheese, herbs, or seasonings',
          'Fold in sides, then roll tightly from bottom',
          'Cut in half diagonally',
          'Serve immediately or wrap in foil'
        ]
      },
      traybake: {
        title: 'Roasted Veg Traybake',
        time: 40,
        servings: 4,
        ingredients: ingredients.map(i => capitalize(i.replace(/_/g, ' '))),
        instructions: [
          'Preheat oven to 200°C (400°F)',
          'Chop vegetables into similar-sized pieces',
          'Toss vegetables with olive oil, salt, and pepper',
          'Add herbs like rosemary or thyme',
          'Spread in single layer on baking tray',
          'Roast for 30-35 minutes, stirring halfway',
          'Vegetables should be golden and tender',
          'Serve as side dish or with protein'
        ]
      },
      smoothie: {
        title: 'Fresh Smoothie',
        time: 5,
        servings: 2,
        ingredients: ingredients.map(i => capitalize(i.replace(/_/g, ' '))),
        instructions: [
          'Gather all fruits and vegetables',
          'Wash and chop into smaller pieces',
          'Add to blender with liquid (milk, juice, or water)',
          'Add ice cubes for a cold smoothie',
          'Blend on high until completely smooth',
          'Taste and adjust sweetness if needed',
          'Pour into glasses',
          'Drink immediately for best nutrition'
        ]
      }
    };

    const recipeData = templates[recipeType] || {
      title: 'Recipe Idea',
      time: 30,
      servings: 4,
      ingredients: ingredients.map(i => capitalize(i.replace(/_/g, ' '))),
      instructions: [
        'This is a quick recipe suggestion based on your ingredients',
        'Use your creativity and cooking knowledge',
        'Cook ingredients together in a way that makes sense',
        'Season to taste with salt, pepper, and your favorite spices'
      ]
    };

    setRecipe(recipeData);
    setLoading(false);
  }, [recipeId]);

  function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading recipe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-100">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Back button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Recipes
        </Link>

        {/* Hero section */}
        <div className="bg-white/70 backdrop-blur-xl border border-emerald-100 rounded-3xl shadow-xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-8 text-white">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-sm font-medium">
                Quick Idea
              </span>
            </div>
            <h1 className="text-4xl font-bold mb-4">{recipe?.title}</h1>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full">
                <Clock className="w-5 h-5" />
                <span>{recipe?.time} mins</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full">
                <ChefHat className="w-5 h-5" />
                <span>{recipe?.servings} servings</span>
              </div>
            </div>
          </div>

          {/* Info banner */}
          <div className="p-4 bg-purple-50 border-b border-purple-100">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-purple-900">
                This is a quick recipe idea generated from your ingredients. Feel free to adapt it to your taste and cooking style!
              </p>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Ingredients */}
          <div className="md:col-span-1">
            <div className="bg-white/70 backdrop-blur-xl border border-emerald-100 rounded-3xl shadow-xl p-6 sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Flame className="w-6 h-6 text-emerald-600" />
                Your Ingredients
              </h2>
              <ul className="space-y-2">
                {recipe?.ingredients.map((ingredient: string, i: number) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg"
                  >
                    <span className="w-2 h-2 bg-emerald-600 rounded-full"></span>
                    <span className="text-gray-800 font-medium">{ingredient}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-6 p-4 bg-amber-50 rounded-xl">
                <p className="text-sm text-amber-900">
                  <strong>Note:</strong> You may need additional staples like oil, salt, pepper, and spices.
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="md:col-span-2">
            <div className="bg-white/70 backdrop-blur-xl border border-emerald-100 rounded-3xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Cooking Instructions
              </h2>
              <ol className="space-y-4">
                {recipe?.instructions.map((step: string, i: number) => (
                  <li key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                      {i + 1}
                    </div>
                    <p className="text-gray-700 leading-relaxed pt-1">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>

              <div className="mt-8 p-6 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl">
                <h3 className="font-bold text-gray-900 mb-2">💡 Cooking Tips:</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Prep all ingredients before you start cooking</li>
                  <li>• Taste and adjust seasonings as you go</li>
                  <li>• Don&apos;t be afraid to add your own twist!</li>
                  <li>• Cook times may vary based on your stove and quantities</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
