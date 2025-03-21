import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Bid, AuctionStatus } from '@prisma/client';

@Injectable()
export class BidsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    amount: number;
    auctionId: string;
    userId: string;
  }): Promise<Bid> {
    const auction = await this.prisma.auction.findUnique({
      where: { id: data.auctionId },
      include: { bids: true },
    });

    if (!auction) {
      throw new NotFoundException(
        `Auction with ID ${data.auctionId} not found`,
      );
    }

    if (auction.status !== AuctionStatus.ACTIVE) {
      throw new BadRequestException('Can only bid on active auctions');
    }

    if (auction.endDate < new Date()) {
      throw new BadRequestException('Auction has ended');
    }

    if (auction.userId === data.userId) {
      throw new BadRequestException('Cannot bid on your own auction');
    }

    const highestBid = auction.bids[0]?.amount || auction.startPrice;
    if (data.amount <= highestBid) {
      throw new BadRequestException(
        'Bid amount must be higher than the current highest bid',
      );
    }

    return this.prisma.bid.create({
      data: {
        amount: data.amount,
        auction: {
          connect: { id: data.auctionId },
        },
        user: {
          connect: { id: data.userId },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }): Promise<Bid[]> {
    const { skip, take, where, orderBy } = params;
    return this.prisma.bid.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findOne(id: string): Promise<Bid> {
    const bid = await this.prisma.bid.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        auction: {
          select: {
            id: true,
            title: true,
            currentPrice: true,
          },
        },
      },
    });

    if (!bid) {
      throw new NotFoundException(`Bid with ID ${id} not found`);
    }

    return bid;
  }

  async getAuctionBids(auctionId: string): Promise<Bid[]> {
    return this.prisma.bid.findMany({
      where: { auctionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        amount: 'desc',
      },
    });
  }
}
