import { Module } from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { AuctionsController } from './auctions.controller';
import { AuctionsGateway } from './auctions.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { BidsModule } from '../bids/bids.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { WsJwtAuthGuard } from '../auth/guards/ws-jwt-auth.guard';
import { WebSocketAdapter } from './ws.adapter';

@Module({
  imports: [PrismaModule, BidsModule, ConfigModule, JwtModule.register({})],
  controllers: [AuctionsController],
  providers: [
    AuctionsService,
    AuctionsGateway,
    WsJwtAuthGuard,
    {
      provide: WebSocketAdapter,
      useFactory: (configService: ConfigService) => {
        return new WebSocketAdapter(null, configService);
      },
      inject: [ConfigService],
    },
  ],
  exports: [AuctionsService],
})
export class AuctionsModule {}
