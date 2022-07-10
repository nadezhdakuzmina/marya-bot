import { Permitions } from '@modules/users';
import type { Message } from 'node-telegram-bot-api';
import type { Context } from './types';

export function onStart(this: Context, message: Message) {
  const { telegram, users } = this;
  let fullName: string;
  let phone: string;

  telegram.sendMessage(
    message.from.id,
    'Привет! Меня зовут Романова Мария. Я врач косметолог, а это чат бот, который помогает мне начислять бонусы, дарить скидки и делится уникальными предложениями. Приступим к регистрации?',
    [[{ text: 'да' }]],
  );

  function getPhone(responseMessage: Message) {
    phone = responseMessage.text;
    users.createUser(message.from.id, {
      fullName,
      phone,
      bonus: 0,
      permitions: Permitions.user
    });

    telegram.sendMessage(
      message.from.id,
      `Я записала, тебя зовут ${fullName}, твой номер телефона ${phone}. Если есть ошибка ты сможешь изменить это в личном кабинете.`
    );
  }

  function getFio(responseMessage: Message) {
    fullName = responseMessage.text;
    telegram.sendMessage(message.from.id, 'Напиши свой номер телефона');
    return getPhone;
  }

  function listenAgreement(responseMessage: Message) {
    if (responseMessage.text !== 'да') {
      telegram.sendMessage(
        message.from.id,
        'Я тебя не поняла. Если хочешь зарегистрироваться — напиши да',
        [[{ text: 'да' }]],
      );

      return listenAgreement;
    }

    telegram.sendMessage(message.from.id, 'Напиши фамилию имя отчество');
    return getFio;
  }

  telegram.setResponseCallback(message, listenAgreement);
}
