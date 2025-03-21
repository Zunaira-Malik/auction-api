import { Module } from '@nestjs/common';
import { AuctionWebSocketGateway } from './websocket.gateway';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { WsJwtAuthGuard } from '../auth/guards/ws-jwt-auth.guard';
import { WebSocketAdapter } from './ws.adapter';

@Module({
  imports: [ConfigModule, JwtModule.register({})],
  providers: [
    AuctionWebSocketGateway,
    WsJwtAuthGuard,
    {
      provide: WebSocketAdapter,
      useFactory: (configService: ConfigService) => {
        return new WebSocketAdapter(null, configService);
      },
      inject: [ConfigService],
    },
  ],
  exports: [AuctionWebSocketGateway],
})
export class WebSocketModule {}
