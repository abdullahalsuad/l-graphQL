import { Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { GqlExceptionFilter, GqlContextType } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

@Catch(HttpException)
export class GraphQLErrorFilter implements GqlExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    if (host.getType<GqlContextType>() !== 'graphql') {
      return exception;
    }

    const status = exception.getStatus();
    const response = exception.getResponse();

    // Extract message
    let message = exception.message;
    if (
      typeof response === 'object' &&
      response !== null &&
      'message' in response
    ) {
      const msg = (response as { message: string | string[] }).message;
      message = Array.isArray(msg) ? msg[0] : msg;
    }

    // Determine GraphQL specific code based on HTTP Status
    let code = 'INTERNAL_SERVER_ERROR';
    if (status === 404) code = 'NOT_FOUND';
    if (status === 400) code = 'BAD_USER_INPUT';
    if (status === 401) code = 'UNAUTHENTICATED';
    if (status === 403) code = 'FORBIDDEN';

    return new GraphQLError(message, {
      extensions: {
        code,
        status,
        originalError: response,
      },
    });
  }
}
