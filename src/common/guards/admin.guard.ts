import { ADMIN_NICKNAMES } from '@common/constants/admin-nicknames.constant';
import { Context } from '@common/types';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TelegrafExecutionContext, TelegrafException } from 'nestjs-telegraf';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const ctx = TelegrafExecutionContext.create(context);
    const { from } = ctx.getContext<Context>();

    const isAdmin = ADMIN_NICKNAMES.includes(from.username);

    if (!isAdmin) {
      throw new TelegrafException(
        `Пользователь с id ${from.id} не имеет прав администратора`,
      );
    }

    return true;
  }
}
