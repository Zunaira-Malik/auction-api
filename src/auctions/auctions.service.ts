import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Auction, AuctionStatus, Prisma } from '@prisma/client';

@Injectable()
export class AuctionsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.AuctionCreateInput): Promise<Auction> {
    if (data.endDate <= new Date()) {
      throw new BadRequestException('End date must be in the future');
    }
    return this.prisma.auction.create({ data });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.AuctionWhereInput;
    orderBy?: Prisma.AuctionOrderByWithRelationInput;
  }): Promise<Auction[]> {
    const { skip, take, where, orderBy } = params;
    return this.prisma.auction.findMany({
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

  async findOne(id: string): Promise<Auction> {
    const auction = await this.prisma.auction.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        bids: {
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
        },
      },
    });

    if (!auction) {
      throw new NotFoundException(`Auction with ID ${id} not found`);
    }

    return auction;
  }

  async update(
    id: string,
    data: Prisma.AuctionUpdateInput,
    userId: string,
  ): Promise<Auction> {
    const auction = await this.findOne(id);

    if (auction.userId !== userId) {
      throw new BadRequestException('You can only update your own auctions');
    }

    if (auction.status !== AuctionStatus.DRAFT) {
      throw new BadRequestException('Can only update draft auctions');
    }

    if (data.endDate && data.endDate <= new Date()) {
      throw new BadRequestException('End date must be in the future');
    }

    return this.prisma.auction.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userId: string): Promise<Auction> {
    const auction = await this.findOne(id);

    if (auction.userId !== userId) {
      throw new BadRequestException('You can only delete your own auctions');
    }

    if (auction.status !== AuctionStatus.DRAFT) {
      throw new BadRequestException('Can only delete draft auctions');
    }

    return this.prisma.auction.delete({
      where: { id },
    });
  }

  async updateStatus(id: string, status: AuctionStatus): Promise<Auction> {
    const auction = await this.findOne(id);

    if (
      status === AuctionStatus.ACTIVE &&
      auction.status !== AuctionStatus.DRAFT
    ) {
      throw new BadRequestException('Can only activate draft auctions');
    }

    if (
      status === AuctionStatus.COMPLETED &&
      auction.status !== AuctionStatus.ACTIVE
    ) {
      throw new BadRequestException('Can only complete active auctions');
    }

    if (status === AuctionStatus.COMPLETED && auction.endDate > new Date()) {
      throw new BadRequestException('Cannot complete auction before end date');
    }

    return this.prisma.auction.update({
      where: { id },
      data: { status },
    });
  }
}
