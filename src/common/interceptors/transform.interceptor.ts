import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;

    // Define success messages based on endpoint
    const messages = {
      'POST /api/auth/login': 'User logged in successfully',
      'POST /api/auth/register': 'User registered successfully',
      'GET /api/users/me': 'Current user retrieved successfully',
      GET: 'Data retrieved successfully',
      POST: 'Data created successfully',
      PUT: 'Data updated successfully',
      PATCH: 'Data updated successfully',
      DELETE: 'Data deleted successfully',
    };

    const message =
      messages[`${method} ${url}`] ||
      messages[method] ||
      'Operation completed successfully';

    return next.handle().pipe(
      map((data) => ({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
