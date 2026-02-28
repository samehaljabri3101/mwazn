import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    EmailModule,
    AuditModule,
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
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
