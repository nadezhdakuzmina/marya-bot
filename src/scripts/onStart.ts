import { Permitions, Sale } from '@modules/users';
import type { Message } from 'node-telegram-bot-api';
import type { Context } from './types';

export function onStart(this: Context, message: Message) {
  const { telegram, users } = this;
  let fullName: string;
  let phone: string;
  let inviteCode: string;
  let birthday: string;
  let sex: string;

  const {
    from: { id: userID },
  } = message;

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

  function getInviteCode(responseMessage: Message) {
    inviteCode = responseMessage.text;
    telegram.sendMessage(message.from.id, 'Напиши фамилию имя отчество');
    return getFio;
  }

  function getPhone(responseMessage: Message) {
    phone = responseMessage.text;
    users.createUser(userID, {
      fullName,
      phone,
      sex,
      birthday,
      bonus: 0,
      permitions: Permitions.user,
      code: inviteCode,
    });

    const sale = users.getUser(userID).sales[0];

    telegram.sendMessage(
      message.from.id,
      `Я записала, тебя зовут ${fullName}, твой номер телефона ${phone}.\nЕсли есть ошибка ты сможешь изменить это в личном кабинете.`
    );

    if (users.getUser(userID).inviter) {
      telegram.sendMessage(
        message.from.id,
        `А также у тебя есть ${sale.name} в размере *${sale.value * 100}* %`
      );
    }
  }

  function checkCode(responseMessage: Message) {
    if (responseMessage.text === 'да') {
      telegram.sendMessage(message.from.id, 'Напишите код');
      return getInviteCode;
    } else {
      telegram.sendMessage(message.from.id, 'Напишите фамилию имя отчество');
      return getFio;
    }
  }

  function getFio(responseMessage: Message) {
    fullName = responseMessage.text;
    telegram.sendMessage(message.from.id, 'Укажите ваш пол', [
      [{ text: 'женщинский' }, { text: 'мужской' }],
    ]);
    return getSex;
  }

  function getSex(responseMessage: Message) {
    sex = responseMessage.text;
    telegram.sendMessage(message.from.id, 'Напишите вашу дату рождения');
    return getBirthday;
  }

  function getBirthday(responseMessage: Message) {
    birthday = responseMessage.text;
    telegram.sendMessage(message.from.id, 'Напиши свой номер телефона');
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
    telegram.sendMessage(message.from.id, 'У вас есть пригласительный код?', [
      [{ text: 'да' }, { text: 'нет' }],
    ]);
    return checkCode;
  }

  telegram.setResponseCallback(message, listenAgreement);
}
