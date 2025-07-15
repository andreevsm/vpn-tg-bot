import { ADMIN_IDS } from '@common/constants/admin-ids.constant';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TelegrafExecutionContext, TelegrafException } from 'nestjs-telegraf';
import { Scenes } from 'telegraf';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const ctx = TelegrafExecutionContext.create(context);
    const { from } = ctx.getContext<Scenes.SceneContext>();

    const isAdmin = ADMIN_IDS.includes(from.id);

    if (!isAdmin) {
      throw new TelegrafException(
        `Пользователь с id ${from.id} не имеет прав администратора`,
      );
    }

    return true;
  }
}
