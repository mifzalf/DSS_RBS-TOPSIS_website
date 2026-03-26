# Backend Structure

This backend uses a singular folder naming convention and keeps the current layout consistent across the codebase.

## Current Structure

- `app.js` - Express app factory responsible for middleware, routes, and error handling only.
- `server.js` - Server and database bootstrap entry point.
- `bin/` - Reserved for executable scripts when needed.
- `config/` - Infrastructure configuration such as database connection.
- `controller/` - Thin HTTP controllers.
- `middleware/` - Authentication, authorization, and request validation middleware.
- `models/` - Sequelize models and associations.
- `routes/` - Route registration and resource-loading helpers.
- `service/` - Business logic and domain services.
- `utils/` - Shared helpers, response utilities, and application errors.
- `validation/` - Centralized request validation schemas.

## Conventions

- Keep controllers thin and push business rules into `service/`.
- Keep request validation in `middleware/validateRequest.js` and `validation/schemas.js`.
- Keep route-level resource loading inside `routes/` helpers or shared route utilities.
- Keep domain-specific algorithms inside `service/DSS/` until the project is large enough to move to a `modules/` structure.

## Future Module-Oriented Direction

When the project grows, migrate incrementally toward domain modules such as:

- `modules/auth/`
- `modules/decision-model/`
- `modules/criteria/`
- `modules/evaluation/`
- `modules/dss/`

Each module can then own its route, controller, service, validation, and model adapters while preserving the current API contract.
