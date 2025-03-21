import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtAuthGuard } from '../auth/guards/ws-jwt-auth.guard';
import { AuctionsService } from './auctions.service';
import { BidsService } from '../bids/bids.service';
import { Auction, Bid, User } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

type AuctionWithHighestBid = Auction & {
  bids: (Bid & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      callback(null, true); // Dynamic CORS will be configured in constructor
    },
    credentials: true,
  },
})
@UseGuards(WsJwtAuthGuard)
export class AuctionsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private connectedClients: Map<string, Set<string>> = new Map(); // auctionId -> Set of socketIds

  constructor(
    private readonly auctionsService: AuctionsService,
    private readonly bidsService: BidsService,
    private readonly configService: ConfigService,
  ) {
    // CORS will be configured after server initialization
  }

  afterInit(server: Server) {
    // Set up CORS after server is initialized
    const origin =
      this.configService.get<string>('NODE_ENV') === 'development'
        ? this.configService.get<string>('APP_LOCALHOST_URL')
        : this.configService.get<string>('APP_FRONTEND_URL');

    // Socket.io correctly applies CORS at this level
    if (this.server && this.server.engine && this.server.engine.opts) {
      this.server.engine.opts.cors = { origin };
    }
  }

  async handleConnection(client: Socket) {
    // The user is already authenticated by WsJwtAuthGuard
    const userId = client.data?.user?.sub;
    console.log(
      `Client connected: ${client.id} (User: ${userId || 'unknown'})`,
    );
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.user?.sub;
    console.log(
      `Client disconnected: ${client.id} (User: ${userId || 'unknown'})`,
    );
    // Remove client from all auction rooms
    this.connectedClients.forEach((clients, auctionId) => {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.connectedClients.delete(auctionId);
      }
    });
  }

  @SubscribeMessage('joinAuction')
  async handleJoinAuction(client: Socket, auctionId: string) {
    const userId = client.data.user.sub;
    client.join(`auction:${auctionId}`);

    // Track connected clients for this auction
    if (!this.connectedClients.has(auctionId)) {
      this.connectedClients.set(auctionId, new Set());
    }
    const clients = this.connectedClients.get(auctionId);
    if (clients) {
      clients.add(client.id);
    }

    // Send current auction state to the new client
    const auction = (await this.auctionsService.findOne(
      auctionId,
    )) as AuctionWithHighestBid;
    client.emit('auctionUpdate', {
      auctionId,
      currentPrice: auction.currentPrice,
      highestBid: auction.bids[0] || null,
    });
  }

  @SubscribeMessage('leaveAuction')
  handleLeaveAuction(client: Socket, auctionId: string) {
    const userId = client.data.user.sub;
    client.leave(`auction:${auctionId}`);

    // Remove client from tracking
    const clients = this.connectedClients.get(auctionId);
    if (clients) {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.connectedClients.delete(auctionId);
      }
    }
  }

  // Method to broadcast auction updates to all connected clients
  async broadcastAuctionUpdate(auctionId: string) {
    const auction = (await this.auctionsService.findOne(
      auctionId,
    )) as AuctionWithHighestBid;
    this.server.to(`auction:${auctionId}`).emit('auctionUpdate', {
      auctionId,
      currentPrice: auction.currentPrice,
      highestBid: auction.bids[0] || null,
    });
  }
}
