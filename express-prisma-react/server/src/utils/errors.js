import { GraphQLError } from "graphql";

// Custom Error Classes for better error handling

export class AuthenticationError extends GraphQLError {
  constructor(message) {
    super(message, {
      extensions: {
        code: "UNAUTHENTICATED",
      },
    });
  }
}

export class ForbiddenError extends GraphQLError {
  constructor(message) {
    super(message, {
      extensions: {
        code: "FORBIDDEN",
      },
    });
  }
}

export class ValidationError extends GraphQLError {
  constructor(message) {
    super(message, {
      extensions: {
        code: "BAD_USER_INPUT",
      },
    });
  }
}

export class NotFoundError extends GraphQLError {
  constructor(message) {
    super(message, {
      extensions: {
        code: "NOT_FOUND",
      },
    });
  }
}
