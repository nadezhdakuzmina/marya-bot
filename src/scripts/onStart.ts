import { Permitions } from '@modules/users';
import type { Message } from 'node-telegram-bot-api';
import type { Context } from './types';

export function onStart(this: Context, message: Message) {
  const { telegram, users } = this;
  let fullName: string;
  let phone: string;

  const {
    from: { id: userID },
  } = message;

  if (users.getUser(userID)) {
    telegram.sendMessage(userID, 'Ты уже авторизован!');
    return;
  }

  // Стартуем микро-тред
  telegram.startMicroThread(
    userID,
    'Привет! Меня зовут Романова Мария. Я врач косметолог, а это чат бот, который помогает мне начислять бонусы, дарить скидки и делится уникальными предложениями. Приступим к регистрации?',
    [[{ text: 'да' }]]
  );

  function getPhone(responseMessage: Message) {
    phone = responseMessage.text;
    users.createUser(userID, {
      fullName,
      phone,
      bonus: 0,
      permitions: Permitions.user,
    });

    telegram.sendMessage(
      userID,
      `Я записала, тебя зовут ${fullName}, твой номер телефона ${phone}. Если есть ошибка ты сможешь изменить это в личном кабинете.`
    );

    // Заканчиваем тред
    telegram.endMicroThread(userID, `Регистрация прошла успешно!`);
  }

  function getFio(responseMessage: Message) {
    fullName = responseMessage.text;
    telegram.sendMessage(userID, 'Напиши свой номер телефона');
    return getPhone;
  }

  function listenAgreement(responseMessage: Message) {
    if (responseMessage.text !== 'да') {
      telegram.sendMessage(
        userID,
        'Я тебя не поняла. Если хочешь зарегистрироваться — напиши да',
        [[{ text: 'да' }]]
      );

      return listenAgreement;
    }

    telegram.sendMessage(userID, 'Напиши фамилию имя отчество');
    return getFio;
  }

  telegram.setResponseCallback(message, listenAgreement);
}
