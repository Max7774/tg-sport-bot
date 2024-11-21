import { Injectable, OnModuleInit } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { PrismaService } from 'src/prisma/prisma.service';
import * as path from 'path';
import {
  EnumRoleOfUser,
  EnumSkillLevel,
  EnumSubscriptionLevel,
  EnumTrainingFormat,
  User,
} from '@prisma/client';
import { uuidGen } from 'utils/uuidGen';
import { PaymentService } from 'src/payment/payment.service';
import { getSubscriptionLevelLabel } from 'utils/labelFunctions';
import {
  ageMessage,
  amountMessage,
  getSubscriptionMessage,
  getTarifsMessage,
  nameMessage,
  skillLevelMessage,
  trainingFormatMessage,
  userProfileMessage,
  weightMessage,
  welcomeMessage,
} from 'utils/getTextMessage';
import { BASIC_PRICE, MEDIUM_PRICE, VIP_PRICE } from 'src/constants/pricing';
import { addMonths } from 'utils/addMonths';
import { Request, Response } from 'express';

@Injectable()
export class TelegramService implements OnModuleInit {
  private bot: TelegramBot;
  private userSteps: {
    [key: string]: { messageId: number; step: string };
  } = {};

  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService,
  ) {
    this.bot = new TelegramBot(process.env.TELEGRAM_TOKEN, {
      polling: true,
    });
  }

  onModuleInit() {
    this.bot.on('message', (msg) => this.handleMessage(msg));
    this.bot.on('callback_query', (query) => this.handleCallbackQuery(query));
  }

  async getNotification(req: Request, res: Response) {
    const { label, withdraw_amount } = req.body;

    console.log(req.body);

    const parts = label.split('/');

    const chatId = parts[0];
    const userUuid = parts[1];

    if (!req.body) {
      await this.getPaymentError(chatId);
      throw new Error('Invalid yoo money notification');
    }

    const { account } = await this.prisma.user.findUnique({
      where: {
        uuid: userUuid,
      },
      select: {
        account: true,
      },
    });

    await this.prisma.user.update({
      where: {
        uuid: userUuid,
      },
      data: {
        account: account + Number(withdraw_amount),
      },
    });

    await this.getPaymentSuccess(label);
    return res.sendStatus(200);
  }

  async getPaymentError(chatId: number) {
    await this.bot.sendMessage(chatId, 'Ошибка сервиса оплаты!');
  }

  async getPaymentSuccess(chatId: number) {
    await this.bot.sendMessage(chatId, 'Оплата прошла успешно!');
  }

  private async handleMessage(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();

    const step = this.userSteps[userId]?.step;

    if (step === 'askName') {
      const res = await this.saveUserName(userId, msg.text);
      if (res !== 'error') {
        await this.askAge(chatId);
      }
    } else if (step === 'askAge') {
      const res = await this.saveUserAge(userId, msg.text);
      if (res !== 'error') {
        await this.askWeight(chatId);
      }
    } else if (step === 'askWeight') {
      await this.saveUserWeight(userId, msg.text);
      await this.askTrainingFormat(chatId);
    } else if (msg.text === '/start') {
      const res = await this.createUserIfNotExist(userId, msg.from.username);
      if (res === 'exist') {
        await this.finishRegistration(chatId);
      } else {
        await this.sendWelcomeMessage(chatId);
      }
    }
  }

  // Отправка приветственного сообщения с кнопками
  private async sendWelcomeMessage(chatId: number) {
    const options = {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Начать менять свою жизнь!', callback_data: 'register' }],
        ],
      },
      contentType: 'image/jpeg',
    };

    const imagePath = path.resolve(__dirname, '../../../uploads/welcome.jpg');

    this.bot.sendPhoto(chatId, imagePath, {
      caption: welcomeMessage,
      ...options,
    });
  }

  // Создание пользователя, если его нет в базе
  private async createUserIfNotExist(userId: string, username?: string) {
    const oldUser = await this.prisma.user.findUnique({
      where: { userId },
    });

    if (!oldUser) {
      const user = await this.prisma.user.create({
        data: {
          uuid: uuidGen(),
          createdAt: new Date(),
          updatedAt: new Date(),
          userId,
          username: username || 'Неизвестный',
          skillLevel: EnumSkillLevel.BEGINNER,
          trainingFormat: EnumTrainingFormat.HOME,
          role: EnumRoleOfUser.DEFAULT_USER,
          age: 0,
          weight: 0,
        },
      });

      const { uuid } = await this.prisma.subscription.create({
        data: {
          uuid: uuidGen(),
          createdAt: new Date(),
          updatedAt: new Date(),
          userUuid: user.uuid,
          startDate: new Date(),
          endDate: new Date(),
          isActive: false,
          level: EnumSubscriptionLevel.NONE,
        },
      });

      await this.prisma.user.update({
        where: { userId },
        data: {
          subscriptionUuid: uuid,
        },
      });

      return null;
    } else {
      return 'exist';
    }
  }

  // Обработчик нажатий на кнопки
  private async handleCallbackQuery(query: TelegramBot.CallbackQuery) {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const userId = query.from.id.toString();

    console.log('query', query.data);

    if (query.data) {
      if (query.data === 'register') {
        await this.registerUser(chatId, messageId, userId);
      } else if (
        (query.data as EnumTrainingFormat) === EnumTrainingFormat.GYM ||
        (query.data as EnumTrainingFormat) === EnumTrainingFormat.STREET ||
        (query.data as EnumTrainingFormat) === EnumTrainingFormat.HOME
      ) {
        await this.updateTrainingFormat(
          chatId,
          messageId,
          userId,
          query.data as EnumTrainingFormat,
        );
        await this.askSkillLevel(chatId);
      } else if (
        (query.data as EnumSkillLevel) === EnumSkillLevel.ADVANCED ||
        (query.data as EnumSkillLevel) === EnumSkillLevel.BEGINNER ||
        (query.data as EnumSkillLevel) === EnumSkillLevel.INTERMEDIATE
      ) {
        await this.updateSkillLevel(
          chatId,
          messageId,
          userId,
          query.data as EnumSkillLevel,
        );
        await this.finishRegistration(chatId);
      } else if (query.data === 'main') {
        await this.getMainMenu(chatId, userId);
      } else if (query.data === 'profile') {
        await this.getProfile(chatId, messageId, userId);
      } else if (query.data === 'subscription') {
        await this.getSubcribtion(chatId, messageId, userId);
      } else if (query.data === 'tarif') {
        await this.getTarifs(chatId, messageId, userId);
      } else if (query.data === 'add_balance') {
        await this.setAmount(chatId, messageId, userId);
      } else if (query.data.includes('get_subscribe')) {
        const subscription = query.data.split('/')[1] as EnumSubscriptionLevel;
        await this.getSubscribe(chatId, messageId, userId, subscription);
      } else if (query.data.includes('subscribe_pay')) {
        await this.setSubcribtion(chatId, messageId, userId, query.data);
      } else if (query.data.includes('change_profile')) {
        const queryData = query.data.split('/');
        const changeKey = queryData[1] as keyof User;
        await this.changeProfile(chatId, messageId, userId, changeKey);
      } else if (query.data === 'start_training') {
        await this.startTraining(chatId, messageId);
      }
    } else {
      this.bot.sendMessage(chatId, 'Неизвестная команда');
    }

    this.bot.answerCallbackQuery(query.id);
  }

  // Обработка подписки пользователя
  private async registerUser(
    chatId: number,
    message_id: number,
    userId: string,
  ) {
    await this.bot.sendMessage(chatId, nameMessage);

    this.userSteps[userId] = {
      messageId: message_id,
      step: 'askName',
    };
  }

  // Сохраняем имя пользователя и переходим к вопросу о возрасте
  private async saveUserName(userId: string, name: string) {
    const namePattern = /^[a-zA-Zа-яА-ЯёЁ\s-]+$/;

    if (!namePattern.test(name)) {
      await this.bot.sendMessage(userId, 'Имя должно быть строкой');
      return 'error';
    }

    await this.prisma.user.update({
      where: { userId },
      data: { username: name },
    });

    this.userSteps[userId] = {
      messageId: this.userSteps[userId].messageId,
      step: 'askAge',
    };
  }

  // Спрашиваем возраст пользователя
  private async askAge(chat_id: number) {
    await this.bot.sendMessage(chat_id, ageMessage);
  }

  // Сохраняем возраст и переходим к следующему шагу
  private async saveUserAge(userId: string, age: string) {
    const numberPattern = /^-?\d+$/;

    if (!numberPattern.test(age)) {
      await this.bot.sendMessage(userId, 'Неправильно введен возраст');
      return 'error';
    }

    await this.prisma.user.update({
      where: { userId },
      data: { age: parseInt(age, 10) },
    });
    // Обновляем шаг на следующий
    this.userSteps[userId] = {
      messageId: this.userSteps[userId].messageId,
      step: 'askWeight',
    };
  }

  // Спрашиваем вес пользователя
  private async askWeight(chat_id: number) {
    await this.bot.sendMessage(chat_id, weightMessage);
  }

  // Сохраняем вес и завершаем регистрацию
  private async saveUserWeight(userId: string, weight: string) {
    await this.prisma.user.update({
      where: { userId },
      data: { weight: parseInt(weight, 10) },
    });
    // Завершаем регистрацию
    // delete this.userSteps[userId]; // Убираем пользователя из состояния
    this.userSteps[userId] = {
      messageId: this.userSteps[userId].messageId,
      step: 'askTrainingFormat',
    };
  }

  // Завершаем регистрацию и отправляем сообщение
  private async finishRegistration(chatId: number) {
    const options = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Войти на главную',
              callback_data: 'main',
            },
          ],
        ],
      },
    };
    await this.bot.sendMessage(
      chatId,
      'Регистрация завершена! Добро пожаловать!',
      options,
    );
  }

  private async askTrainingFormat(chat_id: number) {
    const options = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Домашние',
              callback_data: EnumTrainingFormat.HOME,
            },
            {
              text: 'Улица',
              callback_data: EnumTrainingFormat.STREET,
            },
            {
              text: 'В зале',
              callback_data: EnumTrainingFormat.GYM,
            },
          ],
        ],
      },
    };
    await this.bot.sendMessage(chat_id, trainingFormatMessage, {
      ...options,
    });
  }

  private async updateTrainingFormat(
    chatId: number,
    messageId: number,
    userId: string,
    format: EnumTrainingFormat,
  ) {
    await this.prisma.user.update({
      where: { userId },
      data: { trainingFormat: format },
    });

    this.userSteps[userId] = {
      messageId: messageId,
      step: 'askTrainingFormat',
    };
  }

  private async askSkillLevel(chatId: number) {
    const options = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Начальный (0-1 года)',
              callback_data: EnumSkillLevel.BEGINNER,
            },
          ],
          [
            {
              text: 'Продвинутый (1-3 года)',
              callback_data: EnumSkillLevel.INTERMEDIATE,
            },
          ],
          [
            {
              text: 'Профессиональный (от 3-х лет)',
              callback_data: EnumSkillLevel.ADVANCED,
            },
          ],
        ],
      },
    };
    await this.bot.sendMessage(chatId, skillLevelMessage, {
      ...options,
    });
  }

  private async updateSkillLevel(
    chatId: number,
    messageId: number,
    userId: string,
    level: EnumSkillLevel,
  ) {
    await this.prisma.user.update({
      where: { userId },
      data: { skillLevel: level },
    });

    this.userSteps[userId] = {
      messageId: messageId,
      step: 'askSkillLevel',
    };
  }

  private async getMainMenu(chatId: number, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
    });
    const buttons = [
      [
        {
          text: '>>>> Начать тренировку <<<<',
          callback_data: 'start_training',
        },
      ],
      [
        {
          text: 'Мой профиль',
          callback_data: 'profile',
        },
      ],
      [
        {
          text: 'Отчеты',
          web_app: {
            url: 'https://change-life-sport-bot.ru/main',
          },
        },
      ],
      [
        {
          text: 'Поддержка',
          url: 'https://t.me/Max_Grush',
        },
        {
          text: 'Подписка',
          callback_data: 'subscription',
        },
      ],
    ];

    if (user.role === EnumRoleOfUser.ADMIN) {
      buttons.push([
        {
          text: 'Админ панель',
          callback_data: 'admin',
        },
      ]);
    }

    const options = {
      reply_markup: {
        inline_keyboard: [...buttons],
      },
      contentType: 'image/jpeg',
    };
    const imagePath = path.resolve(__dirname, '../../../uploads/welcome.jpg');

    await this.bot.sendPhoto(chatId, imagePath, {
      ...options,
    });
  }

  private async getProfile(chatId: number, messageId: number, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
    });
    const options = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Имя',
              callback_data: 'change_profile/name',
            },
            {
              text: 'Возраст',
              callback_data: 'change_profile/age',
            },
            {
              text: 'Вес',
              callback_data: 'change_profile/weight',
            },
          ],
          [
            {
              text: 'Формат тренировок',
              callback_data: 'change_profile/trainingFormat',
            },
          ],
          [
            {
              text: 'Уровень навыков',
              callback_data: 'change_profile/skillLevel',
            },
          ],
          [
            {
              text: 'Назад',
              callback_data: 'main',
            },
          ],
        ],
      },
    };

    const profileCaption = userProfileMessage(user);

    await this.bot.editMessageCaption(profileCaption, {
      chat_id: chatId,
      message_id: messageId,
      ...options,
    });
  }

  private async getSubcribtion(
    chatId: number,
    messageId: number,
    userId: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: {
        subscription: true,
        account: true,
      },
    });

    const options = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Пополнить баланс',
              callback_data: 'add_balance',
            },
          ],
        ],
      },
    };

    if (user.subscription.level !== EnumSubscriptionLevel.VIP) {
      options.reply_markup.inline_keyboard.push(
        [
          {
            text: 'Тарифы',
            callback_data: 'tarif',
          },
        ],
        [
          {
            text: 'Назад',
            callback_data: 'main',
          },
        ],
      );
    } else {
      options.reply_markup.inline_keyboard.push([
        {
          text: 'Назад',
          callback_data: 'main',
        },
      ]);
    }

    const profileCaption = getSubscriptionMessage(user);

    await this.bot.editMessageCaption(profileCaption, {
      chat_id: chatId,
      message_id: messageId,
      ...options,
    });
  }

  private async getTarifs(chatId: number, messageId: number, userId: string) {
    const {
      subscription: { level },
    } = await this.prisma.user.findUnique({
      where: { userId },
      select: {
        subscription: {
          select: {
            level: true,
          },
        },
      },
    });

    const options = {
      reply_markup: {
        inline_keyboard: [],
      },
    };

    if (level === EnumSubscriptionLevel.NONE) {
      options.reply_markup.inline_keyboard.push(
        [
          {
            text: `Подписка ${getSubscriptionLevelLabel(
              EnumSubscriptionLevel.BASIC,
            )}`,
            callback_data: `get_subscribe/${EnumSubscriptionLevel.BASIC}`,
          },
        ],
        [
          {
            text: `Подписка ${getSubscriptionLevelLabel(
              EnumSubscriptionLevel.MEDIUM,
            )}`,
            callback_data: `get_subscribe/${EnumSubscriptionLevel.MEDIUM}`,
          },
        ],
        [
          {
            text: `Подписка ${getSubscriptionLevelLabel(
              EnumSubscriptionLevel.VIP,
            )}`,
            callback_data: `get_subscribe/${EnumSubscriptionLevel.VIP}`,
          },
        ],
        [
          {
            text: 'Назад',
            callback_data: 'main',
          },
        ],
      );
    }

    if (level === EnumSubscriptionLevel.BASIC) {
      options.reply_markup.inline_keyboard.push(
        [
          {
            text: `Подписка ${getSubscriptionLevelLabel(
              EnumSubscriptionLevel.MEDIUM,
            )}`,
            callback_data: `get_subscribe/${EnumSubscriptionLevel.MEDIUM}`,
          },
        ],
        [
          {
            text: `Подписка ${getSubscriptionLevelLabel(
              EnumSubscriptionLevel.VIP,
            )}`,
            callback_data: `get_subscribe/${EnumSubscriptionLevel.VIP}`,
          },
        ],
        [
          {
            text: 'Назад',
            callback_data: 'main',
          },
        ],
      );
    }

    if (level === EnumSubscriptionLevel.MEDIUM) {
      options.reply_markup.inline_keyboard.push(
        [
          {
            text: `Подписка ${getSubscriptionLevelLabel(
              EnumSubscriptionLevel.VIP,
            )}`,
            callback_data: `get_subscribe/${EnumSubscriptionLevel.VIP}`,
          },
        ],
        [
          {
            text: 'Назад',
            callback_data: 'main',
          },
        ],
      );
    }

    const profileCaption = getTarifsMessage();

    await this.bot.editMessageCaption(profileCaption, {
      chat_id: chatId,
      message_id: messageId,
      ...options,
    });
  }

  private async setAmount(chatId: number, messageId: number, userId: string) {
    await this.bot.sendMessage(chatId, amountMessage);

    this.bot.once('message', async (msg) => {
      const amount = parseInt(msg.text, 10);

      if (isNaN(amount) || amount <= 0) {
        await this.bot.sendMessage(
          chatId,
          'Пожалуйста, введите корректную сумму.',
        );
        await this.setAmount(chatId, messageId, userId);
      } else {
        const { uuid } = await this.prisma.user.findUnique({
          where: { userId },
        });
        const { paymentLink } = await this.paymentService.generatePaymentLink(
          amount,
          chatId.toString(),
          uuid,
        );

        const options = {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: `Оплатить ${amount} руб.`,
                  url: paymentLink,
                },
              ],
            ],
          },
        };

        await this.bot.sendMessage(chatId, `Ссылка на оплату ${paymentLink}`, {
          ...options,
        });
      }
    });
  }

  private async getSubscribe(
    chatId: number,
    messageId: number,
    userId: string,
    subscription: EnumSubscriptionLevel,
  ) {
    if (subscription === EnumSubscriptionLevel.BASIC) {
      await this.bot.editMessageCaption(`Оплатить ${BASIC_PRICE} рублей?`, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Оплатить',
                callback_data: `subscribe_pay/${BASIC_PRICE}/${EnumSubscriptionLevel.BASIC}`,
              },
            ],
          ],
        },
      });
    } else if (subscription === EnumSubscriptionLevel.MEDIUM) {
      await this.bot.editMessageCaption(`Оплатить ${MEDIUM_PRICE} рублей?`, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Оплатить',
                callback_data: `subscribe_pay/${MEDIUM_PRICE}/${EnumSubscriptionLevel.MEDIUM}`,
              },
            ],
          ],
        },
      });
    } else if (subscription === EnumSubscriptionLevel.VIP) {
      await this.bot.editMessageCaption(`Оплатить ${VIP_PRICE} рублей?`, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Оплатить',
                callback_data: `subscribe_pay/${VIP_PRICE}/${EnumSubscriptionLevel.VIP}`,
              },
            ],
          ],
        },
      });
    }
  }

  private async setSubcribtion(
    chatId: number,
    messageId: number,
    userId: string,
    data: string,
  ) {
    const parts = data.split('/');

    const price = parts[1] as string;
    const subscribeLevel = parts[2] as EnumSubscriptionLevel;

    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: {
        subscription: {
          select: {
            endDate: true,
          },
        },
        uuid: true,
        account: true,
      },
    });

    if (user.account < Number(price)) {
      await this.bot.sendMessage(chatId, 'Недостаточно средств!');
    } else {
      if (!subscribeLevel) {
        await this.bot.sendMessage(
          chatId,
          'Ошибка: уровень подписки не указан.',
        );
        return;
      }
    }

    const currentExpireDate = user.subscription?.endDate || new Date();
    const newExpireDate = addMonths(currentExpireDate, 1);

    await this.prisma.user.update({
      where: { userId },
      data: {
        account: {
          decrement: Number(price),
        },
        subscription: {
          connect: {
            userUuid: user.uuid,
          },
          update: {
            level: subscribeLevel,
            isActive: true,
            endDate: newExpireDate,
          },
        },
      },
    });
    await this.bot.sendMessage(chatId, 'Подписка оформлена!', {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Назад',
              callback_data: 'main',
            },
          ],
        ],
      },
    });
  }

  private async changeProfile(
    chatId: number,
    messageId: number,
    userId: string,
    changeKey: keyof User,
  ) {
    if (changeKey === 'skillLevel') {
      const options = {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Начальный (0-1 года)',
                callback_data: `edit_${EnumSkillLevel.BEGINNER}`,
              },
            ],
            [
              {
                text: 'Продвинутый (1-3 года)',
                callback_data: `edit_${EnumSkillLevel.INTERMEDIATE}`,
              },
            ],
            [
              {
                text: 'Профессиональный (от 3-х лет)',
                callback_data: `edit_${EnumSkillLevel.ADVANCED}`,
              },
            ],
          ],
        },
      };
      await this.bot.editMessageCaption('Выберите новое значение:', {
        chat_id: chatId,
        message_id: messageId,
        ...options,
      });
    } else if (changeKey === 'trainingFormat') {
      const options = {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Домашние',
                callback_data: `edit_${EnumTrainingFormat.HOME}`,
              },
              {
                text: 'Улица',
                callback_data: `edit_${EnumTrainingFormat.STREET}`,
              },
              {
                text: 'В зале',
                callback_data: `edit_${EnumTrainingFormat.GYM}`,
              },
            ],
          ],
        },
      };
      await this.bot.editMessageCaption('Выберите новое значение:', {
        chat_id: chatId,
        message_id: messageId,
        ...options,
      });
    } else {
      await this.bot.editMessageCaption('Введете новое значение:', {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Назад',
                callback_data: 'main',
              },
            ],
          ],
        },
      });
    }

    const parseValue = (key: keyof User, value: string): any => {
      switch (key) {
        case 'age':
          return parseInt(value, 10);
        case 'weight':
          return parseInt(value, 10);
        case 'skillLevel':
        case 'trainingFormat':
          return value as EnumSkillLevel | EnumTrainingFormat;
        default:
          return value;
      }
    };

    this.bot.on('callback_query', async (query) => {
      const { data } = query;

      if (data.includes('edit_')) {
        const parts = data.split('_');
        const newValue = parts[1] as EnumSkillLevel | EnumTrainingFormat;

        await this.prisma.user.update({
          where: { userId },
          data: {
            [changeKey]: newValue,
          },
        });

        await this.bot.sendMessage(chatId, 'Значение изменено!', {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Назад',
                  callback_data: 'main',
                },
              ],
            ],
          },
        });
      }
    });

    this.bot.on('message', async (msg) => {
      const { text } = msg;

      const parsedValue = parseValue(changeKey, text);

      await this.prisma.user.update({
        where: { userId },
        data: {
          [changeKey]: parsedValue,
        },
      });

      await this.bot.sendMessage(chatId, 'Значение изменено!', {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Назад',
                callback_data: 'main',
              },
            ],
          ],
        },
      });
    });
  }

  private async startTraining(chatId: number, messageId: number) {
    await this.bot.editMessageCaption('Какую группу мышц выберем?', {
      chat_id: chatId,
      message_id: messageId,
    });
  }
}
