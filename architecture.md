    # Project Architecture

    This document describes the approved target architecture for PantryLuto.

    The project is currently in planning and has no application implementation. Planned technologies and structures are explicitly identified below. Once implementation begins, the codebase and configuration become the source of truth.

    ---

    # 1. Architecture Overview

    ## Project

    **Name:** PantryLuto

    **Type:** Cross-platform mobile application with a backend API

    **Status:** Planning / Pre-development

    **Purpose:**

    PantryLuto helps users find suitable recipes based on ingredients they already have.

    Users photograph their available ingredients, review and correct the ingredients identified by an open-source vision model, and receive Filipino and international recipe recommendations. The application also identifies missing ingredients and provides reviewed step-by-step cooking instructions.

    Core capabilities include:

    - Ingredient recognition from images
    - Manual ingredient confirmation and correction
    - Filipino and international recipe recommendations
    - Missing ingredient identification
    - Ingredient substitution suggestions
    - Dietary and allergy filtering
    - Step-by-step cooking guidance
    - Saved recipes and scan history
    - English and Filipino content

    ## Architecture Summary

    ```text
    React Native Mobile App
              |
              v
        FastAPI REST API
              |
        +-----+--------------+
        |     |              |
        v     v              v
      Neon   Ollama     External Food APIs
    Postgres Vision     and Recipe Sources
    ```

    The React Native application provides the user interface, camera access, ingredient confirmation, recipe browsing, and cooking guide.

    The FastAPI backend owns request validation, authentication and authorization, ingredient normalization, recipe matching, missing ingredient calculation, AI model communication, database access, and external API access.

    Neon provides PostgreSQL, authentication, and object storage.

    Ollama runs separately from the mobile application and processes ingredient images using a vision-language model.

    Recipe recommendations are selected from structured recipe records using deterministic matching. AI can identify ingredients, explain recommendations, and suggest substitutions, but it is not the trusted source for recipe quantities or cooking instructions.

    ---

    # 2. Technology Stack

    The following stack is approved for the initial implementation.

    ## Frontend

    - **Framework:** React Native with Expo
    - **Language:** TypeScript
    - **Platforms:** Android and iOS
    - **UI library:** To be selected during implementation
    - **Styling:** To be selected during implementation
    - **State management:** To be selected during implementation
    - **Forms:** To be selected during implementation
    - **Validation:** Client validation with authoritative backend validation
    - **Camera:** Expo-compatible camera integration
    - **Image selection:** Expo-compatible image picker
    - **Navigation:** To be selected during implementation

    ## Backend

    - **Runtime:** Python
    - **Framework:** FastAPI
    - **Language:** Python
    - **API style:** REST with JSON requests and responses
    - **Authentication:** Neon Auth
    - **Validation:** FastAPI request and response schemas
    - **Database access:** SQLAlchemy with Psycopg 3
    - **Database migrations:** Alembic
    - **AI integration:** Ollama HTTP API

    ## Database

    - **Database:** PostgreSQL
    - **Hosting:** Neon Serverless Postgres
    - **ORM / Query layer:** SQLAlchemy
    - **PostgreSQL driver:** Psycopg 3
    - **Connection type:** Neon pooled connection with SSL
    - **Migration strategy:** Alembic migrations
    - **Realtime capabilities:** Not required for the MVP

    ## Infrastructure

    - **Mobile builds:** Expo
    - **Backend hosting:** To be selected
    - **Database hosting:** Neon
    - **Authentication:** Neon Auth
    - **Object storage:** Neon Object Storage
    - **AI hosting:** Separate Ollama-compatible server
    - **CDN:** To be selected if required
    - **DNS:** To be selected before production deployment

    ## Development

    - **JavaScript package manager:** To be selected during initialization
    - **Python package manager:** To be selected during initialization
    - **Mobile build tool:** Expo
    - **Backend environment:** Python virtual environment
    - **Testing:** To be defined during implementation
    - **Linting:** To be defined during project initialization
    - **Formatting:** To be defined during project initialization
    - **Version control:** Git

    Technologies marked “to be selected” must not be treated as installed or approved dependencies until they are chosen during implementation.

    ---

    # 3. Project Structure

    ## Current Structure

    The repository currently contains project planning documents and an existing unrelated application. PantryLuto application code has not been created.

    ## Planned Structure

    ```text
    project/
    ├── mobile/
    │   ├── app/
    │   ├── components/
    │   ├── features/
    │   ├── hooks/
    │   ├── services/
    │   ├── types/
    │   └── assets/
    ├── backend/
    │   ├── app/
    │   │   ├── api/
    │   │   ├── core/
    │   │   ├── integrations/
    │   │   ├── models/
    │   │   ├── repositories/
    │   │   ├── schemas/
    │   │   └── services/
    │   ├── migrations/
    │   └── tests/
    ├── data/
    │   ├── source/
    │   ├── normalized/
    │   └── scripts/
    ├── .ai/
    │   ├── architecture.md
    │   ├── context.md
    │   ├── rules.md
    │   ├── workflow.md
    │   └── task/
    └── README.md
    ```

    Planned responsibilities:

    - `mobile/app/` contains application screens and navigation definitions.
    - `mobile/components/` contains reusable interface components.
    - `mobile/features/` contains feature-specific components and logic.
    - `mobile/hooks/` contains reusable React hooks.
    - `mobile/services/` contains backend API client functions.
    - `mobile/types/` contains shared frontend TypeScript types.
    - `mobile/assets/` contains application images, icons, and fonts.
    - `backend/app/api/` contains FastAPI route definitions.
    - `backend/app/core/` contains configuration and shared backend behavior.
    - `backend/app/integrations/` contains Ollama, Neon Storage, and external API clients.
    - `backend/app/models/` contains database models.
    - `backend/app/repositories/` contains database access operations.
    - `backend/app/schemas/` contains API request and response schemas.
    - `backend/app/services/` contains application workflows and business coordination.
    - `backend/migrations/` contains Alembic database migrations.
    - `backend/tests/` contains backend tests.
    - `data/source/` contains approved source datasets.
    - `data/normalized/` contains generated normalized recipe data.
    - `data/scripts/` contains import and validation scripts.

    This structure must be verified and updated after project initialization.

    ---

    # 4. Application Layers

    The planned architecture uses the following layers:

    ```text
    Presentation
         |
         v
    API and Application
         |
         v
    Domain
         |
         v
    Data and Integrations
         |
         v
    Infrastructure
    ```

    ## Presentation Layer

    **Responsibility:**

    - Display screens and components
    - Capture ingredient images
    - Collect user preferences
    - Display loading, success, and error states
    - Allow users to correct detected ingredients
    - Present recipe recommendations and cooking guides

    **Planned location:**

    ```text
    mobile/app/
    mobile/components/
    mobile/features/
    ```

    **Allowed dependencies:** Frontend hooks, frontend services, and shared frontend types.

    **Dependencies to avoid:** Direct database access, direct Ollama access, private credentials, and direct external food API access.

    ## API and Application Layer

    **Responsibility:**

    - Receive and validate API requests
    - Verify authentication
    - Coordinate application workflows
    - Convert domain results into API responses
    - Translate integration failures into safe errors

    **Planned location:**

    ```text
    backend/app/api/
    backend/app/schemas/
    backend/app/services/
    ```

    **Allowed dependencies:** Domain logic, repositories, integration interfaces, and authentication utilities.

    **Dependencies to avoid:** Mobile presentation code and raw provider-specific responses in route handlers.

    ## Domain Layer

    **Responsibility:**

    - Ingredient normalization
    - Ingredient alias resolution
    - Recipe eligibility rules
    - Recommendation scoring
    - Missing ingredient calculation
    - Dietary and allergy filtering
    - Substitution rules

    Domain logic should remain independent of the mobile interface and third-party response formats.

    ## Data and Integration Layer

    **Responsibility:**

    - Neon PostgreSQL access
    - Neon Object Storage access
    - Ollama communication
    - External food API communication
    - Dataset imports
    - Conversion of external data into internal models

    **Planned location:**

    ```text
    backend/app/repositories/
    backend/app/integrations/
    data/
    ```

    ## Infrastructure Layer

    **Responsibility:** Database hosting, authentication, object storage, backend hosting, Ollama hosting, environment configuration, and deployment configuration.

    Credentials must be supplied through secure environment configuration.

    ---

    # 5. Data Flow

    The following flows describe planned behavior. They do not represent implemented functionality yet.

    ## Authentication Flow

    ```text
    User opens authentication screen
                  |
                  v
    Mobile app starts Neon Auth flow
                  |
                  v
    Neon Auth creates or validates session
                  |
                  v
    Mobile app receives session token
                  |
                  v
    Token is included in protected API requests
                  |
                  v
    FastAPI validates identity and permissions
    ```

    ## Ingredient Scan Flow

    ```text
    User captures one or more photos
                  |
                  v
    Mobile app validates and compresses images
                  |
                  v
    Images are uploaded through the backend
                  |
                  v
    Backend stores images temporarily
                  |
                  v
    Backend sends images to Ollama
                  |
                  v
    Vision model returns possible ingredients
                  |
                  v
    Backend normalizes ingredient names
                  |
                  v
    Mobile app displays editable results
                  |
                  v
    User confirms, removes, or adds ingredients
    ```

    The vision model must return confidence information where possible. Low-confidence results must remain editable.

    ## Recipe Recommendation Flow

    ```text
    Confirmed ingredients
              |
              v
    Ingredient normalization
              |
              v
    Dietary and allergy filtering
              |
              v
    Recipe candidate retrieval
              |
              v
    Ingredient coverage calculation
              |
              v
    Missing ingredient calculation
              |
              v
    Recipe ranking
              |
              v
    Optional AI explanation
              |
              v
    Ranked recommendations displayed
    ```

    ## Recipe Reading Flow

    ```text
    User selects recipe
            |
            v
    Mobile app requests recipe details
            |
            v
    Backend reads reviewed recipe record
            |
            v
    Backend returns ingredients and steps
            |
            v
    Mobile app displays cooking guide
    ```

    ## Saving a Recipe

    ```text
    Authenticated user selects Save
                  |
                  v
    Backend verifies authentication
                  |
                  v
    Backend checks recipe identifier
                  |
                  v
    Saved recipe record is created
                  |
                  v
    Mobile app updates saved state
    ```

    ## Notifications and Realtime

    Push notifications and realtime database updates are not included in the initial MVP.

    ---

    # 6. Frontend Architecture

    The mobile frontend will be organized by feature.

    ## Planned Screens

    - Welcome and onboarding
    - Sign in and registration
    - Home
    - Ingredient camera
    - Ingredient confirmation
    - Recipe recommendations
    - Recipe details
    - Cooking mode
    - Saved recipes
    - Scan history
    - User preferences

    ## Component Structure

    ```text
    Screen
      |
      v
    Feature Component
      |
      v
    Hook or Feature Logic
      |
      v
    API Service
      |
      v
    FastAPI Backend
    ```

    ## State Management

    The selected state solution must distinguish between temporary interface state, form state, authentication state, server-fetched data, and persisted user preferences.

    The exact state library has not yet been selected.

    ## Data Fetching

    All application data is requested through typed frontend service functions. Components should not construct backend URLs or authentication headers directly.

    ## Form Handling

    Forms will be used for authentication, manual ingredient entry, ingredient correction, user preferences, dietary restrictions, and allergy settings.

    The form library has not yet been selected.

    ## Validation

    - The mobile app performs immediate user-facing validation.
    - FastAPI performs authoritative validation.
    - Database constraints protect stored data.
    - Invalid AI output must be rejected or normalized before use.

    ## Error Handling

    The mobile app must provide clear error messages, retry actions for recoverable failures, manual ingredient entry when scanning fails, and a usable fallback when AI explanation generation fails.

    ## Loading States

    Loading indicators are required for image uploads, ingredient recognition, recipe recommendations, recipe details, authentication, and saved recipe operations.

    ## UI Conventions

    - Detected ingredients are displayed as editable items.
    - Low-confidence detections are identified clearly.
    - Missing ingredients are separated from available ingredients.
    - Dietary conflicts and allergens are visible before cooking.
    - Destructive actions require confirmation.
    - Primary cooking actions must remain easy to use with one hand.
    - English and Filipino content must be supported.

    ## Client and Server Boundaries

    The mobile client must not contain database credentials, Ollama server credentials, external API secrets, recommendation scoring authority, or trusted recipe-import logic.

    ---

    # 7. Backend Architecture

    The planned backend flow is:

    ```text
    Request
       |
       v
    Middleware
       |
       v
    FastAPI Route
       |
       v
    Application Service
       |
       +-------------+
       |             |
       v             v
    Repository    Integration
       |             |
       v             v
    Neon DB     External Service
       |             |
       +------+------+
              v
           Response
    ```

    ## Routes

    Routes define request and response schemas, apply authentication requirements, validate basic request properties, delegate workflows to services, and avoid containing recommendation or database logic.

    ## Application Services

    Services coordinate image scanning, ingredient confirmation, ingredient normalization, recipe recommendations, missing ingredient calculation, saved recipe management, scan history, and user preferences.

    ## Business Logic

    The backend owns canonical ingredient matching, Filipino and English aliases, recipe eligibility, required versus optional ingredients, allergy exclusions, dietary filtering, recommendation scoring, and missing ingredient calculation.

    ## Middleware

    Planned middleware responsibilities include authentication context, request logging, request identifiers, error handling, file size enforcement, content type validation, and cross-origin configuration where required.

    ## Authentication and Authorization

    Neon Auth identifies users. FastAPI verifies the authenticated identity before protected operations. Authorization must be checked by the backend for every user-owned resource.

    ## Validation

    Validation occurs at three levels:

    1. Mobile input validation
    2. FastAPI schema and service validation
    3. PostgreSQL constraints

    ## Error Handling

    API errors should contain a stable error code, user-safe message, appropriate HTTP status, optional validation details, and a request identifier when available.

    Responses must not expose credentials, stack traces, internal connection strings, raw database errors, or raw third-party errors.

    ## Database Access

    Database operations use repositories backed by SQLAlchemy and Psycopg 3.

    The backend must use a Neon pooled connection string, SSL connections, environment-based credentials, Alembic migrations, and explicit transaction boundaries.

    ## External Integrations

    External integrations must be isolated behind dedicated clients. Planned integrations include Ollama, Neon Object Storage, Open Food Facts, USDA FoodData Central, and an optional international recipe source.

    ---

    # 8. Database Architecture

    ## Technology

    - **Database:** PostgreSQL
    - **Provider:** Neon
    - **ORM:** SQLAlchemy
    - **Driver:** Psycopg 3
    - **Migrations:** Alembic
    - **Connections:** Neon pooled PostgreSQL connection with SSL
    - **Realtime:** Not required for the MVP

    ## Planned Relationships

    ```text
    neon_auth.users
           |
           ├── profiles
           ├── user_preferences
           ├── saved_recipes ───── recipes
           └── ingredient_scans
                       |
                       └── detected_ingredients ─── ingredients

    recipes
       ├── recipe_ingredients ─── ingredients
       └── recipe_steps

    ingredients
       └── ingredient_aliases
    ```

    ## Planned Tables

    ### `profiles`

    Stores application profile information associated with an authenticated user, including the user identifier, display name, preferred language, and timestamps.

    ### `user_preferences`

    Stores cuisine preferences, allergies, dietary restrictions, maximum cooking time, and skill level.

    ### `recipes`

    Stores the recipe name, description, cuisine, Philippine region, preparation time, cooking time, difficulty, servings, source, attribution, and review status.

    ### `ingredients`

    Stores canonical, Filipino, and English ingredient names and the ingredient category.

    ### `ingredient_aliases`

    Maps alternate names to canonical ingredients.

    Examples:

    ```text
    sayote → chayote
    kamote → sweet potato
    pechay → bok choy
    sitaw → yardlong bean
    calamansi → calamondin
    siling labuyo → bird's eye chili
    ```

    ### `recipe_ingredients`

    Connects recipes to ingredients and stores quantity, unit, required or optional status, preparation notes, and display order.

    ### `recipe_steps`

    Stores ordered cooking instructions and optional timer durations.

    ### `ingredient_scans`

    Stores the user reference, image object key, processing status, creation timestamp, and image expiration timestamp.

    ### `detected_ingredients`

    Stores the normalized ingredient reference, raw detected label, confidence, estimated quantity, confirmation status, and user correction.

    ### `saved_recipes`

    Connects users to recipes they have saved.

    ## Keys and Constraints

    - Tables use a consistent primary key format.
    - Foreign keys enforce all documented relationships.
    - Saved recipes are unique by user and recipe.
    - Ingredient aliases are unique within their supported locale.
    - Recipe steps are unique by recipe and step number.
    - Recipe ingredient duplicates are prevented where appropriate.
    - Required names must not be empty.
    - Confidence values remain within an accepted range.
    - User-owned records require a valid authenticated user.

    ## Important Indexes

    Planned indexes include canonical ingredient name, ingredient alias, recipe cuisine, Philippine region, recipe review status, recipe ingredient relationship, saved recipes by user, and scans by user and creation time.

    Search requirements must be measured before adding specialized full-text or vector indexes.

    ## Database Access Pattern

    ```text
    Application Service
            |
            v
    Repository
            |
            v
    SQLAlchemy Session
            |
            v
    Neon PostgreSQL
    ```

    ## Migration Strategy

    - Every schema change requires an Alembic migration.
    - Migrations must be reviewed before production deployment.
    - Direct manual production schema changes should be avoided.
    - Dataset imports remain separate from schema migrations.
    - Development and preview environments should use separate Neon branches where appropriate.

    ---

    # 9. Authentication and Authorization

    ## Authentication Provider

    Neon Auth is the planned authentication provider.

    ## Login Flow

    ```text
    User
      |
      v
    Mobile authentication interface
      |
      v
    Neon Auth
      |
      v
    Authenticated session
      |
      v
    Token included with protected API request
      |
      v
    FastAPI identity validation
      |
      v
    Authorization check
      |
      v
    Protected resource
    ```

    ## Session Handling

    - The mobile app stores session information using secure platform storage.
    - Session tokens are included only with protected backend requests.
    - Expired sessions require refresh or reauthentication.
    - Authentication tokens must never be written to logs.

    ## Roles

    ### Guest

    Can scan ingredients, confirm ingredients, view recommendations, and read recipes.

    Cannot save recipes to an account, store persistent preferences, or access persistent scan history.

    ### Authenticated User

    Can perform guest actions, save recipes, store preferences, access owned scan history, and manage owned saved recipes.

    Administrative recipe management is not included in the initial MVP.

    ## Protected Resources

    Protected resources include user profiles, preferences, saved recipes, private scan history, and private uploaded images.

    ## Database Security

    - Database credentials remain on the backend.
    - The mobile application must not connect directly using privileged credentials.
    - Backend authorization must verify ownership.
    - Database roles follow least-privilege access.
    - Public database access must not be enabled unnecessarily.

    ---

    # 10. API Architecture

    No API endpoints currently exist.

    During implementation, the backend will require API capabilities for authentication context, ingredient image uploads, ingredient detection, ingredient confirmation, recipe recommendations, recipe details, saved recipes, scan history, user preferences, and health checks.

    Exact endpoint paths must be documented only after they are implemented.

    ## Request Format

    - JSON for normal application requests
    - Multipart form data or a signed upload flow for images
    - Bearer token for protected requests

    ## Response Format

    Successful responses use defined response schemas.

    Error responses should follow this structure:

    ```json
    {
      "error": {
        "code": "stable_error_code",
        "message": "User-safe explanation"
      }
    }
    ```

    ## Validation

    The API validates required fields, field formats, image content type, image size, ingredient list limits, recipe identifiers, user ownership, and dietary preference values.

    ## Error Behavior

    - Invalid input returns a validation error.
    - Missing authentication returns an authentication error.
    - Insufficient permission returns an authorization error.
    - Missing records return a not-found error.
    - Ollama failures return a retryable scanning error.
    - External API failures degrade gracefully.
    - Unexpected failures return a generic server error with a request identifier.

    ---

    # 11. External Services

    ## Neon Serverless Postgres

    **Purpose:** Store application, recipe, ingredient, scan, and user-owned data.

    **Used by:** FastAPI backend.

    **Integration location:** Repository and database configuration layer.

    **Authentication method:** Secure connection string stored in backend environment variables.

    **Important limitations:** Connection limits, scale-to-zero wake time, and hosting-plan limits must be monitored.

    **Failure behavior:** Return a temporary service error and avoid partial writes through transactions.

    ## Neon Auth

    **Purpose:** User registration, login, identity, and session management.

    **Used by:** Mobile application and FastAPI backend.

    **Integration location:** Mobile authentication feature and backend authentication utilities.

    **Authentication method:** Neon Auth session tokens.

    **Important limitations:** Mobile integration behavior must be verified during implementation.

    **Failure behavior:** Preserve guest features and report authentication failures clearly.

    ## Neon Object Storage

    **Purpose:** Store ingredient scan images.

    **Used by:** Backend scanning workflow.

    **Integration location:** Backend storage integration.

    **Authentication method:** Backend storage credentials.

    **Important limitations:** Storage quotas, retention, image privacy, and lifecycle behavior must be configured.

    **Failure behavior:** Do not start AI processing when upload integrity cannot be confirmed.

    ## Ollama

    **Purpose:** Analyze ingredient images and generate optional explanations or substitutions.

    **Used by:** Backend ingredient-scanning and explanation services.

    **Integration location:** Backend AI integration.

    **Authentication method:** Private network or infrastructure-level protection.

    **Initial model:** `qwen3-vl:4b`.

    **Important limitations:** Image recognition can be incorrect, hidden ingredients may not be detected, quantity estimates are approximate, and performance depends on server hardware.

    **Failure behavior:** Return a retryable scan error, allow manual ingredient entry, and reject invalid AI output.

    ## Filipino Recipes Dataset

    **Purpose:** Seed the Philippine recipe catalog.

    **Used by:** Data import and enrichment workflow.

    **Integration location:** Data preparation scripts.

    **Authentication method:** None for locally imported data.

    **Important limitations:** Complete quantities or cooking instructions may require enrichment. Records require review before being marked trusted. License and attribution must be verified during import.

    **Failure behavior:** Reject invalid records and record import errors without stopping valid records from being processed.

    ## Open Food Facts

    **Purpose:** Identify packaged products using barcodes.

    **Used by:** Backend product lookup integration.

    **Integration location:** Backend external integration.

    **Authentication method:** According to current service requirements.

    **Important limitations:** Crowdsourced records may be incomplete or inaccurate, and license obligations must be preserved.

    **Failure behavior:** Fall back to OCR, vision recognition, or manual entry.

    ## USDA FoodData Central

    **Purpose:** Provide optional nutrition information.

    **Used by:** Backend nutrition integration.

    **Integration location:** Backend external integration.

    **Authentication method:** API key stored in backend environment variables.

    **Important limitations:** Coverage is stronger for US foods and may not precisely represent Filipino ingredients or preparations.

    **Failure behavior:** Display recipes without nutrition data when the service is unavailable.

    ---

    # 12. Important Architectural Decisions

    ## Mobile Framework

    **Decision:** Use React Native with Expo and TypeScript.

    **Date:** 2026-10-05

    **Reason:** Support Android and iOS from one codebase.

    **Alternatives considered:** Flutter and separate native applications.

    **Why this approach was selected:** Expo provides a practical development workflow and mobile camera support.

    **Impact:** Mobile dependencies must be compatible with the selected Expo version.

    ## Backend Framework

    **Decision:** Use FastAPI with Python.

    **Date:** 2026-10-05

    **Reason:** Python is suitable for AI, data processing, and image-related workflows.

    **Alternatives considered:** Node.js backend.

    **Why this approach was selected:** FastAPI provides typed validation and fits the planned AI integrations.

    **Impact:** The project maintains separate TypeScript and Python environments.

    ## Database

    **Decision:** Use Neon Serverless Postgres.

    **Date:** 2026-10-05

    **Reason:** Use managed PostgreSQL with pooled connections and database branching.

    **Alternatives considered:** Supabase PostgreSQL and separately hosted PostgreSQL.

    **Why this approach was selected:** Neon provides standard PostgreSQL compatibility and managed infrastructure.

    **Impact:** FastAPI must use SSL, pooled connections, migrations, and secure environment configuration.

    ## Authentication

    **Decision:** Use Neon Auth.

    **Date:** 2026-10-05

    **Reason:** Keep user identity integrated with the selected Neon backend.

    **Alternatives considered:** Supabase Auth and a separate authentication provider.

    **Why this approach was selected:** It reduces the number of backend platforms required.

    **Impact:** Mobile authentication and backend token validation must follow Neon Auth requirements.

    ## Object Storage

    **Decision:** Use Neon Object Storage for ingredient scan images.

    **Date:** 2026-10-05

    **Reason:** Keep stored files with the selected Neon backend platform.

    **Alternatives considered:** Supabase Storage and a separate S3-compatible service.

    **Why this approach was selected:** It reduces service fragmentation and supports S3-compatible storage.

    **Impact:** Image lifecycle, privacy, quotas, and retention must be configured.

    ## Vision Model

    **Decision:** Start with `qwen3-vl:4b` through Ollama.

    **Date:** 2026-10-05

    **Reason:** It supports image understanding while remaining suitable for prototype hosting.

    **Alternatives considered:** `qwen3-vl:8b`, `gemma3:4b`, and `llama3.2-vision`.

    **Why this approach was selected:** It provides a practical starting balance between model size and image capability.

    **Impact:** A separate Ollama server is required.

    ## Recommendation Strategy

    **Decision:** Use deterministic recipe matching and ranking.

    **Date:** 2026-10-05

    **Reason:** Recipe eligibility and missing ingredients must be explainable and repeatable.

    **Alternatives considered:** Fully AI-generated recommendations.

    **Why this approach was selected:** Structured matching reduces hallucinations and enables reliable filtering.

    **Impact:** Ingredient normalization and recipe data quality are critical.

    ## Recipe Dataset

    **Decision:** Use the Filipino Recipes Dataset as the initial recipe source.

    **Date:** 2026-10-05

    **Reason:** The application prioritizes Philippine cuisine.

    **Alternatives considered:** Depending entirely on a general-purpose recipe API.

    **Why this approach was selected:** A Philippine-focused dataset better supports the product's primary audience.

    **Impact:** Recipes must be normalized, enriched, reviewed, and attributed before production use.

    ---

    # 13. Architectural Constraints

    - The application must support Android and iOS.
    - The application must prioritize Filipino recipes while supporting other cuisines.
    - Ingredient detections must be editable.
    - Manual ingredient entry must remain available.
    - AI output must not be treated as guaranteed fact.
    - Allergy exclusions must be applied before recommendations are displayed.
    - Trusted quantities and cooking steps must come from reviewed recipe records.
    - The recommendation engine must function when AI explanation generation is unavailable.
    - Ollama must be accessed through the backend.
    - Database, storage, and external API credentials must not be exposed to the mobile application.
    - Recipe licenses and attribution requirements must be preserved.
    - The MVP should minimize paid dependencies.
    - English and Filipino content must be supported.
    - Uploaded ingredient images must have a retention and deletion policy.
    - Realtime updates are not required for the MVP.
    - Saved recipes should support limited offline access when practical.

    ---

    # 14. Important Patterns

    ## Component Pattern

    Screens coordinate page-level behavior. Feature components implement domain-specific UI. Shared components contain reusable presentation behavior.

    ## API Pattern

    ```text
    Mobile Service
          |
          v
    FastAPI Route
          |
          v
    Application Service
    ```

    Mobile components must not call external providers directly.

    ## Database Access Pattern

    ```text
    Application Service
            |
            v
    Repository
            |
            v
    SQLAlchemy
            |
            v
    Neon PostgreSQL
    ```

    Raw queries and provider-specific behavior remain inside the data-access layer.

    ## AI Integration Pattern

    ```text
    Application Service
            |
            v
    AI Integration Interface
            |
            v
    Ollama Client
    ```

    The model name and Ollama connection details must be configuration values.

    ## Recommendation Pattern

    ```text
    Confirmed Ingredients
            |
            v
    Normalized Ingredients
            |
            v
    Eligibility Filters
            |
            v
    Deterministic Scoring
            |
            v
    Ranked Recipes
            |
            v
    Optional AI Explanation
    ```

    AI explanations must not change the recipe selected by the deterministic recommendation result without an explicit future architecture decision.

    ## Error Handling Pattern

    Errors must be converted into stable application error codes and safe messages.

    ## State Management Pattern

    Keep local interface state, form state, authentication state, server-fetched state, and persisted preferences separate.

    ## Naming Conventions

    - **Python:** `snake_case` and PEP 8
    - **TypeScript variables and functions:** `camelCase`
    - **React components:** `PascalCase`
    - **Database objects:** lowercase `snake_case`
    - **Environment variables:** uppercase `SNAKE_CASE`
    - **API JSON fields:** `snake_case` unless the project later standardizes another convention

    ---

    # 15. Known Technical Debt

    The application has not been implemented, so there is no existing code debt. The following anticipated risks must be tracked.

    ## Incomplete Recipe Data

    **Issue:** The Filipino Recipes Dataset may not provide complete ingredient quantities and reviewed cooking steps.

    **Impact:** Recipes cannot safely support complete cooking guides without enrichment.

    **Current workaround:** None.

    **Potential solution:** Create a reviewed recipe enrichment and approval process.

    **Priority:** High.

    ## Ingredient Recognition Accuracy

    **Issue:** A general vision-language model may incorrectly identify ingredients.

    **Impact:** Users may receive irrelevant or unsafe recommendations.

    **Current workaround:** Require ingredient confirmation before recommendation.

    **Potential solution:** Benchmark models using Philippine-market ingredient photos and improve prompting or model selection.

    **Priority:** High.

    ## Ingredient Naming Differences

    **Issue:** Filipino and international ingredient names may not match.

    **Impact:** Valid recipes may receive low scores or be excluded.

    **Current workaround:** Planned ingredient alias table.

    **Potential solution:** Maintain a reviewed multilingual ingredient dictionary.

    **Priority:** High.

    ## Ollama Performance

    **Issue:** Vision inference may be slow on limited hardware.

    **Impact:** Ingredient scans may have long response times.

    **Current workaround:** Start with `qwen3-vl:4b` and compress uploaded images.

    **Potential solution:** Benchmark hardware, queue requests, and consider a larger or faster model when justified.

    **Priority:** Medium.

    ## Mobile Authentication Integration

    **Issue:** Neon Auth behavior with the selected Expo setup has not been implemented or verified.

    **Impact:** Authentication implementation may require additional configuration or an alternative integration.

    **Current workaround:** Guest functionality remains available for core recipe discovery.

    **Potential solution:** Build and verify an authentication proof of concept during initialization.

    **Priority:** High.

    ## Image Retention

    **Issue:** A deletion policy for ingredient scan images has not been finalized.

    **Impact:** Unnecessary storage use and privacy concerns.

    **Current workaround:** None.

    **Potential solution:** Define automatic expiration and user-controlled deletion before production.

    **Priority:** High.

    ---

    # 16. Architecture Change Rules

    Before making an architectural change, the AI should:

    1. Identify the current architecture.
    2. Identify the affected components.
    3. Determine dependencies and side effects.
    4. Explain why the current architecture is insufficient.
    5. Propose the new approach.
    6. Explain trade-offs.
    7. Obtain approval when required by `.ai/rules.md`.
    8. Implement the change.
    9. Verify affected functionality.
    10. Update this document if the architecture changed.

    Do not make significant architectural changes simply to solve a local problem.

    Prefer the smallest architectural change that correctly solves the requirement.

    ---

    # 17. Architecture Documentation Maintenance

    Update this document when:

    - The project is initialized.
    - Planned directories become actual directories.
    - A major technology changes.
    - A frontend state, form, styling, or UI library is selected.
    - A package manager is selected.
    - A new architectural layer is introduced.
    - A significant service is added or removed.
    - Database architecture changes.
    - Authentication architecture changes.
    - API routes are implemented or changed.
    - Deployment providers are selected.
    - Storage behavior changes.
    - The Ollama model changes.
    - Recommendation rules materially change.
    - A major constraint changes.

    Remove planning labels as components are implemented and verified.

    Do not update this document for ordinary implementation details that do not affect architecture.

    ---

    # 18. Source of Truth

    Use the following hierarchy when understanding architecture:

    ```text
    Actual Code
        |
        v
    Current Project Configuration
        |
        v
    Database and Infrastructure Configuration
        |
        v
    .ai/architecture.md
        |
        v
    Other Documentation
    ```

    The application has not been implemented yet, so this document currently records the approved target architecture.

    Once implementation begins, the code and configuration become the primary source of truth.

    If this document conflicts with the implementation:

    1. Inspect the code and configuration.
    2. Determine the actual current architecture.
    3. Identify whether the difference is intentional.
    4. Correct unintended differences.
    5. Update `.ai/architecture.md` when the implemented architecture has changed.

    This document describes the system.

    It does not override the system.
