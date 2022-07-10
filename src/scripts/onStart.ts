import type { Message } from 'node-telegram-bot-api';

export function onStart(message: Message) {
  this.sendMessage(
    message.from.id,
    'Привет! Меня зовут Романова Мария. Я врач косметолог, '
  );

  this.setResponseCallback(message, function (responseMessage: Message) {
    this.sendMessage(message.from.id, `Тебя зовут ${responseMessage.text}`);
  });
}
