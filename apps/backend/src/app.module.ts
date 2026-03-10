import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { CategoriesModule } from './categories/categories.module';
import { ListingsModule } from './listings/listings.module';
import { RFQsModule } from './rfqs/rfqs.module';
import { QuotesModule } from './quotes/quotes.module';
import { DealsModule } from './deals/deals.module';
import { RatingsModule } from './ratings/ratings.module';
import { ConversationsModule } from './conversations/conversations.module';
import { AdminModule } from './admin/admin.module';
import { UploadModule } from './upload/upload.module';
import { EmailModule } from './email/email.module';
import { AuditModule } from './audit/audit.module';
import { SearchModule } from './search/search.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { InvoiceModule } from './invoice/invoice.module';
import { MaroofModule } from './maroof/maroof.module';
import { BillingModule } from './billing/billing.module';
import { VerificationModule } from './verification/verification.module';
import { ScoringModule } from './scoring/scoring.module';
import { MarketplaceModule } from './marketplace/marketplace.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),

    // Rate limiting: 100 req/60s default, tighter limits set per-endpoint with @Throttle()
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 100 },
      { name: 'auth', ttl: 60_000, limit: 10 },
      { name: 'write', ttl: 60_000, limit: 30 },
    ]),

    // Redis cache — falls back to in-memory if REDIS_URL not set
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        if (redisUrl) {
          const { redisInsStore } = await import('cache-manager-ioredis-yet');
          const Redis = (await import('ioredis')).default;
          const client = new Redis(redisUrl);
          return { store: redisInsStore(client), ttl: 60_000 };
        }
        // In-memory fallback (for local dev without Redis)
        return { ttl: 60_000, max: 200 };
      },
    }),

    PrismaModule,
    EmailModule,
    AuditModule,
    MaroofModule,
    NotificationsModule,
    BillingModule,
    VerificationModule,
    ScoringModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    CategoriesModule,
    ListingsModule,
    RFQsModule,
    QuotesModule,
    DealsModule,
    RatingsModule,
    ConversationsModule,
    AdminModule,
    UploadModule,
    SearchModule,
    AnalyticsModule,
    PaymentsModule,
    InvoiceModule,
    MarketplaceModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
