# Project Context

This document contains stable project knowledge for PantryLuto.

It describes why the product exists, who it serves, how it is expected to behave, and which product rules must be preserved. Technical implementation details belong in `architecture.md`.

The project is currently in planning. Statements marked as planned describe approved product requirements that have not yet been implemented.

Do not store secrets, passwords, API keys, tokens, or other sensitive credentials in this document.

---

# 1. Project Overview

## Project Name

PantryLuto

## Purpose

PantryLuto helps people decide what they can cook with ingredients they already have.

Users photograph available ingredients, review and correct the detected items, and receive suitable Filipino and international recipe recommendations. Each recommendation explains which ingredients are available, which ingredients are missing, and how to prepare the dish.

## Problem Being Solved

People often have ingredients at home but do not know which dishes they can make with them. Searching recipe websites manually requires users to identify every ingredient, compare many recipes, and determine what they still need to buy.

This is especially difficult for users looking for Filipino dishes because general recipe services may not recognize local ingredient names, regional names, or common substitutions.

PantryLuto reduces this effort by turning visible ingredients into a confirmed pantry list and matching that list against structured recipes.

## Expected Outcome

The system should allow users to:

- Photograph ingredients they currently have.
- Review, correct, remove, or add detected ingredients.
- Receive ranked recipe recommendations.
- Prioritize Filipino recipes while still discovering dishes from other countries.
- Understand which ingredients are available and which are missing.
- Review possible ingredient substitutions.
- Follow clear, ordered cooking instructions.
- Apply dietary, allergy, preparation-time, and difficulty preferences.
- Save recipes and scan history when signed in.

The application should help users make practical cooking decisions. It should not depend on AI-generated guesses for trusted recipe quantities or cooking instructions.

## Current Status

Planning / Pre-development

No PantryLuto application behavior has been implemented yet.

---

# 2. Users

## User Types

### 1. Guest User

**Who they are:**

A person using PantryLuto without creating or signing into an account.

**What they need to accomplish:**

- Scan ingredients.
- Correct detected ingredients.
- Enter ingredients manually.
- Receive recipe recommendations.
- Read recipe details and cooking instructions.

**What they can access:**

- Ingredient scanning
- Manual ingredient entry
- Ingredient confirmation
- Public recipe recommendations
- Public recipe details

**What they cannot access:**

- Persistent saved recipes
- Persistent scan history
- Account-based preferences
- Data belonging to another user

Guest data should remain temporary unless a later requirement explicitly allows local device storage.

### 2. Authenticated User

**Who they are:**

A person with an active PantryLuto account and authenticated session.

**What they need to accomplish:**

- Perform all guest workflows.
- Save recipes for later.
- Maintain dietary and cuisine preferences.
- Review personal scan history.
- Reopen previously saved recipes.

**What they can access:**

- All guest features
- Their profile
- Their preferences
- Their saved recipes
- Their scan history
- Their private uploaded scan images while retained by the system

**What they cannot access:**

- Another user's profile
- Another user's preferences
- Another user's saved recipes
- Another user's scan history or private images
- Administrative recipe-management functions

### 3. Recipe Curator or Administrator

An administrative role is not part of the initial MVP.

A future curation workflow may be needed to import, review, correct, approve, and retire recipe records. Its permissions and interface must be defined before implementation.

---

# 3. Core Domain Concepts

## Ingredient

An edible item or cooking component that a user has or that a recipe requires.

Important attributes include:

- Canonical name
- Filipino name
- English name
- Alternate names
- Category
- Estimated or confirmed quantity

An ingredient may have several names but should resolve to one canonical PantryLuto ingredient when possible.

## Ingredient Alias

An alternate, regional, translated, or commonly used name for an ingredient.

Examples include:

- `sayote` and `chayote`
- `kamote` and `sweet potato`
- `pechay` and `bok choy`
- `sitaw` and `yardlong bean`
- `calamansi` and `calamondin`

Aliases allow user input, AI detections, and recipe data to match even when they use different names.

## Ingredient Scan

A user action and resulting record created from one or more ingredient photographs.

A scan may contain raw AI detections, confidence values, user corrections, and the final confirmed ingredient list.

## Detected Ingredient

An ingredient suggested by the image-recognition system.

A detected ingredient is not considered confirmed until the user has had an opportunity to review it.

## Confirmed Ingredient

An ingredient accepted or manually entered by the user for the current recommendation request.

Recipe recommendations must use confirmed ingredients rather than unreviewed AI output.

## Recipe

A structured cooking record containing a name, cuisine, ingredients, quantities, preparation information, and ordered cooking steps.

A recipe may originate from an approved dataset or source, but it must be normalized and reviewed before being treated as trusted cooking content.

## Filipino Recipe

A recipe identified as part of Philippine cuisine. It may also include a region of origin when that information is available and reliable.

## International Recipe

A recipe associated with a cuisine outside the Philippines.

## Required Ingredient

An ingredient considered necessary for the identity or successful preparation of a recipe.

Missing required ingredients reduce a recipe's suitability and must be shown clearly.

## Optional Ingredient

An ingredient that can be omitted without preventing the recipe from being prepared.

Optional ingredients should not penalize a recommendation as heavily as required ingredients.

## Missing Ingredient

A recipe ingredient that is not present in the user's confirmed ingredient list.

Missing ingredients must be shown before the user starts cooking.

## Substitution

An alternative ingredient that may replace a recipe ingredient.

Substitutions must be presented as suggestions. When known, the application should explain how the substitution may change flavor, texture, appearance, or authenticity.

## Recipe Match

A calculated relationship between a user's confirmed ingredients and a recipe.

A match considers available required ingredients, missing required ingredients, preferences, restrictions, preparation time, and difficulty.

## Cooking Guide

The ordered instructions, ingredient quantities, preparation notes, and optional timers used to prepare a selected recipe.

## Reviewed Recipe

A recipe whose ingredients, quantities, steps, and source information have passed the project's content-review requirements.

The exact review process remains to be defined before production.

---

# 4. Business Rules

## Ingredient Detection

1. AI-detected ingredients are suggestions rather than confirmed facts.
2. Users must be able to correct, remove, and add ingredients before requesting recommendations.
3. Low-confidence detections should be identified clearly.
4. A failed image scan must not prevent manual ingredient entry.
5. Quantity estimates from photographs are approximate unless confirmed by the user.
6. The system must normalize recognized aliases when a reliable mapping exists.

## Recipe Recommendations

1. Recommendations must use the user's confirmed ingredient list.
2. Recipes that conflict with confirmed allergies must be excluded when reliable allergen data is available.
3. Dietary restrictions must be applied before recipes are ranked.
4. Required and optional ingredients must affect matching differently.
5. Missing required ingredients must be displayed clearly.
6. A recipe with fewer missing required ingredients should generally rank above a similar recipe with more missing required ingredients.
7. Filipino recipes should receive appropriate priority according to the user's cuisine preference.
8. International recipes remain eligible unless excluded by the user's preferences.
9. Recommendation results should explain why each recipe is suitable.
10. Recommendation scoring must remain predictable and explainable.

## Recipe Content

1. Trusted quantities and cooking instructions must come from stored, reviewed recipe records.
2. AI-generated explanations must not silently replace stored recipe instructions.
3. A recipe must preserve its source and required attribution.
4. Unreviewed or incomplete recipes must not be presented as fully trusted cooking guides.
5. The application must distinguish required ingredients from optional ingredients.
6. Cooking steps must remain in their intended order.

## Substitutions

1. Substitutions are suggestions and must be labeled as such.
2. A substitution must not be suggested when it conflicts with the user's allergies or dietary restrictions.
3. Known effects on taste, texture, cooking time, or authenticity should be disclosed.
4. A substitution should not automatically change the stored original recipe.

## Accounts and Ownership

1. Guest users may use the core discovery workflow without an account.
2. An account is required for persistent saved recipes, preferences, and scan history.
3. Users may access only their own private account data.
4. Authentication failure must not expose private records.
5. Signing out must remove access to protected information on the device.

## Images and Privacy

1. Ingredient photographs are private user data unless explicitly designated otherwise.
2. Scan images must not become public by default.
3. Images should be retained only as long as required for the defined product workflow.
4. Users must be able to understand whether a scan image is stored.
5. A final retention and deletion policy must be approved before production.

## Language

1. The application must support English and Filipino content.
2. Local ingredient names must not be discarded during normalization.
3. Translation must preserve quantities, units, safety instructions, and cooking meaning.

---

# 5. User Workflows

## Scan Ingredients and Receive Recommendations

1. The workflow starts when a user chooses to scan ingredients.
2. The user takes or selects one or more photographs.
3. The system validates the images and attempts to identify ingredients.
4. The system displays detected ingredients with confidence information where available.
5. The user confirms, removes, corrects, or adds ingredients.
6. The user may provide cuisine, dietary, allergy, time, or difficulty preferences.
7. The system validates that at least one usable ingredient is present.
8. The system filters and ranks matching recipes.
9. The system shows available ingredients, missing ingredients, and a match explanation for each result.

The workflow can stop when:

- An image is invalid or too large.
- Ingredient recognition fails and the user chooses not to enter ingredients manually.
- No confirmed ingredients remain.
- No eligible recipe satisfies the user's restrictions.

The user should receive a clear recovery action for each recoverable failure.

## Enter Ingredients Manually

1. The user opens manual ingredient entry.
2. The user searches for or types ingredient names.
3. The system resolves known aliases to canonical ingredients.
4. The user reviews the completed list.
5. The confirmed list enters the normal recommendation workflow.

## View a Recipe

1. The user selects a recommendation.
2. The system loads the reviewed recipe record.
3. The user sees recipe information, available ingredients, missing ingredients, quantities, preparation time, difficulty, and ordered steps.
4. Any suggested substitutions are displayed separately from the original ingredients.
5. The user may start cooking or save the recipe when authenticated.

## Follow the Cooking Guide

1. The user starts cooking mode from a recipe.
2. The system displays one ordered step or a small set of steps at a time.
3. The user advances and returns between steps.
4. Timers may be offered when a reviewed step provides a duration.
5. The original recipe quantities and instructions remain accessible throughout the workflow.

## Register or Sign In

1. The user starts registration or sign-in.
2. The user completes the supported identity flow.
3. The system validates the session.
4. The user gains access to persistent preferences, saved recipes, and personal scan history.
5. Invalid or expired sessions return the user to an authentication state without exposing protected data.

## Save a Recipe

1. An authenticated user selects Save.
2. The system validates the user and recipe.
3. The recipe is added to the user's saved recipes if it is not already present.
4. The interface confirms the saved state.
5. Selecting the action again may remove the saved relationship after clear user intent.

## Manage Preferences

1. An authenticated user opens preferences.
2. The user selects cuisines, dietary restrictions, allergies, maximum cooking time, language, or skill level.
3. The system validates and stores the preferences.
4. Future recommendations apply the saved preferences unless the user overrides them for a specific request.

## Review Scan History

1. An authenticated user opens scan history.
2. The system displays only that user's retained scans.
3. The user can view the confirmed ingredient list and resulting recommendations when retained.
4. Deletion behavior must follow the final retention policy.

## Import and Review Recipes

This is a planned internal workflow rather than an MVP end-user workflow.

1. An approved source dataset is imported.
2. Ingredient names are normalized.
3. Incomplete or invalid records are flagged.
4. Quantities, steps, source, attribution, cuisine, and region are reviewed.
5. Approved recipes become eligible for recommendations.
6. Rejected or incomplete recipes remain unavailable as trusted cooking guides.

---

# 6. Data Behavior

## Recipe Data

- Imported recipes begin as unreviewed records.
- A recipe becomes eligible as a trusted cooking guide only after required content is reviewed.
- Source and attribution information must remain associated with each recipe.
- Correcting a normalized recipe must not erase its source information.
- Removing a recipe from recommendations should preserve it when historical references require it.

## Ingredient Data

- Ingredient aliases resolve to a canonical ingredient when a reviewed mapping exists.
- The original detected or entered term may be retained for traceability and display.
- Alias changes can affect matching and therefore require review.
- Ambiguous ingredient names should not be normalized silently when multiple mappings are plausible.

## Scan Data

- A scan begins when images are submitted for recognition.
- Raw detections are separate from the user's confirmed ingredient list.
- Corrections must not be overwritten by later AI output.
- Guest scan persistence is not guaranteed.
- Authenticated scan history belongs only to the user who created it.
- Image retention and deletion behavior must follow the approved privacy policy once defined.

## Recommendation Data

- Recommendations are calculated from the confirmed ingredient list and active preferences.
- Recommendation results may change when recipe data, ingredient aliases, scoring rules, or preferences change.
- A saved recipe remains saved even if it later ranks differently.
- Match explanations must correspond to the ingredients and rules used for that result.

## Preference Data

- Saved preferences apply to future recommendation requests.
- A temporary preference override must not permanently change saved preferences unless the user chooses to save it.
- Allergy settings receive stronger treatment than cuisine preferences.

## Deletion

- Removing a saved recipe deletes the user's saved relationship, not the shared recipe.
- Account-data deletion requirements must be defined before production.
- Scan image deletion must also address associated storage objects.

---

# 7. Permissions and Access Rules

```text
Guest User
├── Scan ingredients
├── Enter ingredients manually
├── Correct detected ingredients
├── View recommendations
└── Read public recipes

Authenticated User
├── All guest actions
├── View and update own profile
├── View and update own preferences
├── Save and unsave recipes
├── View own saved recipes
├── View own scan history
└── Access own retained scan images

Future Recipe Curator
├── Import candidate recipes
├── Review recipe content
├── Correct normalized data
├── Approve trusted recipes
└── Retire unsuitable recipes
```

The future recipe-curator role is not approved for MVP implementation until its workflow and permissions are defined.

No user may access another user's private profile, preferences, scan history, or scan images.

---

# 8. Important System Behaviors

- Users must be able to correct every ingredient-recognition result.
- Manual ingredient entry must remain available when image recognition is unavailable.
- Recommendations must use confirmed ingredients rather than raw detections.
- Allergy and dietary exclusions must be applied before ranking preferences.
- Missing required ingredients must be visible before cooking begins.
- Available and missing ingredients must be visually distinguishable.
- Recipe instructions must remain tied to the reviewed recipe record.
- AI explanations must not silently alter ingredient quantities or cooking steps.
- A failure in AI explanation generation must not prevent structured recommendations from being displayed.
- A failure in an optional nutrition service must not prevent recipe use.
- Filipino and international names should resolve to the same ingredient when they refer to the same item.
- The original local ingredient name should remain available for user-facing display where useful.
- Guest users must be able to experience the core scan-to-recipe workflow.
- Private user data must remain isolated by ownership.
- Source attribution must remain attached to imported recipe content.

---

# 9. External Dependencies

## Filipino Recipes Dataset

**Purpose:** Provide the starting collection of Philippine dishes.

**Why the project depends on it:** PantryLuto needs Philippine-focused recipe coverage that general recipe services may not provide.

**Important business behavior:** Imported recipes must be normalized, enriched, attributed, and reviewed before being treated as trusted cooking content.

**Failure considerations:** Incomplete records must be flagged rather than presented as complete recipes.

## Ollama Vision Model

**Purpose:** Suggest ingredients visible in user photographs.

**Why the project depends on it:** It reduces the work required to enter ingredients manually while supporting an open-source AI approach.

**Important business behavior:** Results remain editable and require user confirmation.

**Failure considerations:** Manual entry must remain available.

## Neon

**Purpose:** Support persistent application data, user identity, and private scan-image storage.

**Why the project depends on it:** Authenticated users need saved recipes, preferences, history, and protected data.

**Important business behavior:** Private records must remain isolated by user ownership.

**Failure considerations:** Temporary service failures should not expose data or create partial user actions.

## Open Food Facts

**Purpose:** Support packaged-food recognition through barcodes and product information.

**Why the project may depend on it:** Some ingredients are easier to identify by packaging than by appearance.

**Important business behavior:** Product data must be treated as external and potentially incomplete.

**Failure considerations:** The application should fall back to image recognition, label reading, or manual entry.

## USDA FoodData Central

**Purpose:** Provide optional nutrition information.

**Why the project may depend on it:** Nutrition estimates can improve recipe information without becoming part of core matching.

**Important business behavior:** Nutrition values must be labeled appropriately when estimated or matched approximately.

**Failure considerations:** Recipes remain usable without nutrition information.

## International Recipe Source

**Purpose:** Expand recommendations beyond Philippine cuisine.

**Why the project may depend on it:** Users should be able to discover recipes from other countries.

**Important business behavior:** Imported or displayed content must preserve licensing and attribution requirements.

**Failure considerations:** Philippine recipe recommendations should continue to work when the international source is unavailable.

The final international recipe source has not been selected.

---

# 10. User Experience Expectations

- The experience is designed for mobile devices first.
- A guest should be able to reach recipe recommendations without creating an account.
- The path from opening the camera to viewing recommendations should be short and understandable.
- Ingredient detection must feel collaborative: the system suggests and the user confirms.
- Users must receive visible progress during uploads, scanning, and recommendation generation.
- Recoverable failures must include a clear retry or manual alternative.
- Ingredient chips or list items must be easy to add, edit, and remove.
- Available and missing ingredients must use more than color alone to communicate status.
- Allergy conflicts must be prominent.
- Cooking instructions must be readable at a normal kitchen viewing distance.
- Cooking mode should minimize interaction and support easy movement between steps.
- Controls should be usable with one hand where practical.
- The interface must support English and Filipino text without breaking layouts.
- Destructive actions involving saved data or history require clear confirmation.
- The application should avoid claiming certainty when an ingredient or substitution is uncertain.

---

# 11. Terminology

**Term: PantryLuto**  
**Meaning:** The recipe recommendation application described by this project.

**Term: Ingredient Scan**  
**Meaning:** One or more ingredient images submitted for recognition, along with their detection and confirmation results.

**Term: Detected Ingredient**  
**Meaning:** An ingredient suggested by the vision model but not necessarily accepted by the user.

**Term: Confirmed Ingredient**  
**Meaning:** An ingredient accepted or manually entered by the user for recipe matching.

**Term: Canonical Ingredient**  
**Meaning:** The normalized PantryLuto record representing one ingredient across alternate names and languages.

**Term: Ingredient Alias**  
**Meaning:** An alternate, translated, or regional term mapped to a canonical ingredient.

**Term: Required Ingredient**  
**Meaning:** An ingredient considered necessary for the recipe's identity or successful preparation.

**Term: Optional Ingredient**  
**Meaning:** An ingredient that may be omitted without preventing the recipe from being prepared.

**Term: Missing Ingredient**  
**Meaning:** A recipe ingredient absent from the user's confirmed ingredient list.

**Term: Recipe Match**  
**Meaning:** A scored relationship between confirmed ingredients, user preferences, restrictions, and a recipe.

**Term: Match Explanation**  
**Meaning:** A user-facing explanation of why a recipe was recommended, including available and missing ingredients.

**Term: Reviewed Recipe**  
**Meaning:** A recipe that has passed the project's content-quality requirements and can be used as a trusted cooking guide.

**Term: Substitution**  
**Meaning:** A suggested alternative for an ingredient that may alter the result and does not replace the original stored recipe.

**Term: Cooking Guide**  
**Meaning:** The quantities, preparation notes, ordered steps, and optional timers used while cooking a recipe.

---

# 12. Important Constraints

- The product is intended for Android and iOS users.
- Philippine cuisine is a primary product focus.
- International recipes must also be supported.
- The initial project should minimize paid services and APIs.
- Open-source image recognition through Ollama is a confirmed requirement.
- Ingredient recognition must tolerate Filipino, English, regional, and common market names.
- Users cannot be expected to own AI-capable mobile hardware.
- Internet access is required for scanning and server-generated recommendations in the initial version.
- Core recipe content requires a lawful source and preserved attribution.
- Dataset records may require manual enrichment before production use.
- Allergy handling depends on complete, reviewed ingredient data.
- The system cannot guarantee that every ingredient in a photograph will be detected.
- The application must remain useful when optional external food or nutrition services are unavailable.
- The first version does not require realtime collaboration or push notifications.

---

# 13. Historical Context

## Previous Process

Users normally inspect their available ingredients, think of possible dishes, search recipe websites, and manually compare required ingredients.

## Reason for Change

The project was proposed to reduce the effort of deciding what to cook and to improve recipe discovery for Philippine ingredients and dishes.

Image recognition was selected to simplify ingredient entry. A user-confirmation step was retained because vision models can misidentify food or miss hidden items.

The Filipino Recipes Dataset was selected as the initial recipe source because Philippine cuisine is the primary focus. The data must be enriched because a recommendation product needs complete ingredient lists, quantities, and cooking instructions.

Neon was selected for persistent backend data in place of the previously considered Supabase database.

## Important Legacy Requirement

There is no legacy application behavior to preserve because PantryLuto has not been implemented.

---

# 14. Known Ambiguities

## Recipe Review Process

**Question:** What exact checks make a recipe reviewed and trusted?

**Affected area:** Dataset import, recipe publication, and cooking guides.

**Current understanding:** Complete ingredients, quantities, ordered instructions, source information, and attribution must be reviewed.

**Required clarification:** Define the reviewer, checklist, approval states, and correction workflow before production import.

## Default Cuisine Ranking

**Question:** How strongly should Filipino recipes be prioritized when the user does not select a cuisine?

**Affected area:** Recommendation scoring.

**Current understanding:** Philippine cuisine is the primary focus, but international recipes remain supported.

**Required clarification:** Confirm the default ranking weight and whether the user chooses a country during onboarding.

## Recommendation Score

**Question:** What exact weights and thresholds define a suitable recipe?

**Affected area:** Recipe ranking and match percentage.

**Current understanding:** Required ingredient coverage, missing ingredients, cuisine, time, difficulty, and restrictions affect ranking.

**Required clarification:** Approve and test the scoring formula against representative recipes.

## Allergy Handling

**Question:** Which allergies must the MVP support and how should uncertain ingredient data be handled?

**Affected area:** Recipe filtering and safety messaging.

**Current understanding:** Known conflicts must be excluded before ranking.

**Required clarification:** Define supported allergen categories and behavior for incomplete data.

## Image Retention

**Question:** How long should ingredient photographs remain stored?

**Affected area:** Privacy, history, account deletion, and storage cost.

**Current understanding:** Images are private and should be retained only when needed.

**Required clarification:** Approve automatic expiration, deletion, and user-control rules.

## Guest Data

**Question:** Should guest scans or saved recipes persist locally on the device?

**Affected area:** Guest experience and offline behavior.

**Current understanding:** Server-side persistence requires authentication.

**Required clarification:** Decide whether limited local guest history is part of the MVP.

## Offline Support

**Question:** Which functions must work without an internet connection?

**Affected area:** Saved recipes and cooking mode.

**Current understanding:** Previously saved recipes may support limited offline access. Ingredient scanning requires server access.

**Required clarification:** Define the offline recipe cache and update behavior.

## International Recipe Source

**Question:** Which source will provide international recipes?

**Affected area:** Recipe coverage, licensing, and attribution.

**Current understanding:** TheMealDB is a possible prototype source, but the final production source is not approved.

**Required clarification:** Select a source after reviewing coverage, licensing, limits, and production terms.

## Recipe Administration

**Question:** Will recipe review use an administrative application, scripts, or a manual database workflow?

**Affected area:** Content quality and maintenance.

**Current understanding:** A review process is required, but an administration interface is outside the initial MVP.

**Required clarification:** Define the first operational curation process before importing production recipes.

## Language Content

**Question:** Will Filipino recipe content be manually authored, translated automatically, or use both approaches?

**Affected area:** Recipe quality and localization.

**Current understanding:** English and Filipino are required, and cooking meaning must be preserved.

**Required clarification:** Define translation review requirements.

## Account Deletion

**Question:** What information must be deleted immediately versus retained for legal or operational reasons when an account is deleted?

**Affected area:** Profiles, scans, images, preferences, and saved recipes.

**Current understanding:** Private user data requires a defined deletion policy before production.

**Required clarification:** Approve the deletion and retention policy.

---

# 15. Important Decisions

- The product is named PantryLuto.
- PantryLuto is a cross-platform mobile application.
- The primary experience starts with ingredients rather than a recipe name.
- Users can photograph ingredients or enter them manually.
- Users must confirm AI-detected ingredients before recommendations are calculated.
- Philippine cuisine is the primary content focus.
- International recipes are also supported.
- The Filipino Recipes Dataset is the initial recipe-data source.
- Dataset recipes require normalization, enrichment, and review.
- Recipe recommendations use structured matching rather than unrestricted AI generation.
- AI may explain recommendations and suggest substitutions.
- Stored, reviewed recipe records remain the source for quantities and instructions.
- Guests can use the core scan-to-recommendation workflow.
- Authentication is required for persistent saved recipes, preferences, and history.
- English and Filipino content are required.
- Allergy and dietary filtering occur before preference-based ranking.
- Optional nutrition and packaged-food services must not become dependencies for core recipe use.

Detailed technical decisions belong in `architecture.md`. Detailed decision history belongs in `decisions.md` when that file is introduced for the PantryLuto project.

---

# 16. Context Maintenance

Update this document when:

- A business rule changes.
- A major workflow changes.
- A user role changes.
- A domain concept changes.
- A product requirement changes.
- An important system behavior changes.
- A terminology definition changes.
- A significant product constraint changes.
- A known ambiguity is resolved.

Do not update this document for temporary debugging information, individual coding tasks, minor implementation details, test results, or Git history.

---

# 17. Source of Truth

When determining expected project behavior, use this hierarchy:

```text
Explicit Current Requirements
          |
          v
Confirmed Business Rules
          |
          v
Actual System Behavior
          |
          v
context.md
          |
          v
Historical Documentation
          |
          v
Assumptions
```

If this document conflicts with confirmed requirements or implemented behavior:

1. Identify the conflict.
2. Do not silently choose an interpretation.
3. Clarify the requirement when necessary.
4. Update this document when the correct behavior is established.

Never treat assumptions as confirmed requirements.

---

# 18. Context Principle

The purpose of this document is to answer:

> What does PantryLuto need to accomplish, and what rules govern its behavior?

It does not define how the code is technically implemented.

For technical architecture, refer to:

```text
architecture.md
```

For AI behavior and development rules, refer to the project's AI harness rules when present.

For task-specific requirements, refer to the relevant task specification.

For implementation progress, decisions, and results, refer to the corresponding project-state documents when they are introduced for PantryLuto.
