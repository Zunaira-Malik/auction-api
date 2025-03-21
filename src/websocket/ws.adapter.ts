import { IoAdapter } from '@nestjs/platform-socket.io';
import { ConfigService } from '@nestjs/config';

export class WebSocketAdapter extends IoAdapter {
  constructor(
    private readonly app: any,
    private readonly configService: ConfigService,
  ) {
    super(app);
  }

  createIOServer(port: number, options?: any) {
    const cors = {
      origin:
        this.configService.get<string>('NODE_ENV') === 'development'
          ? this.configService.get<string>('APP_LOCALHOST_URL')
          : this.configService.get<string>('APP_FRONTEND_URL'),
    };

    const optionsWithCORS = {
      ...options,
      cors,
    };

    return super.createIOServer(port, optionsWithCORS);
  }
}
