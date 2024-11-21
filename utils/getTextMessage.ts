import { BASIC_PRICE, MEDIUM_PRICE, VIP_PRICE } from 'src/constants/pricing';
import {
  getSkillLevelLabel,
  getSubscriptionLevelLabel,
  getTrainingFormatLabel,
} from 'utils/labelFunctions';

export const welcomeMessage = `
🏋️‍♂️ *Приветствую, чемпион!* 🏋️‍♀️

Меня зовут Игорь, и я помогу тебе достичь своих спортивных целей! 💪
Мы вместе будем работать над твоей физической формой, силой и выносливостью. 
Независимо от уровня подготовки — будь ты новичок или опытный спортсмен — здесь ты найдешь все, что нужно для успеха. 

🔹 *Видеоуроки для любого уровня.*
🔹 *Полезные советы и мотивация от тренера.*
🔹 *Фиксация твоих результатов и состояния тела.*

Не забывай, что каждый день — это шаг к лучшему себе. Давай начнем!

Пусть спорт станет твоей привычкой, а успех — твоим постоянным спутником!
`;

export const userProfileMessage = (user) => `
🏋️‍♂️ Профиль пользователя 🏋️‍♀️

👤 Имя пользователя: ${user.username}
🎂 Возраст: ${user.age ? user.age : 'Не указан'}
⚖️ Вес: ${user.weight ? user.weight + ' кг' : 'Не указан'}
💪 Уровень подготовки: ${getSkillLevelLabel(user.skillLevel)}
🏋️‍♂️ Формат тренировок: ${getTrainingFormatLabel(user.trainingFormat)}
📅 Дата регистрации: ${new Date(user.createdAt).toLocaleDateString()}

${
  user.subscription?.isActive
    ? `
🔔 Активная подписка: ${user.subscription.subscriptionUuid}
📅 Дата окончания подписки: ${
        user.subscription.endDate
          ? new Date(user.subscription.endDate).toLocaleDateString()
          : 'Не указана'
      }
`
    : `
❌ Подписка отсутствует. 
✨ Подпишитесь, чтобы получить доступ к эксклюзивным функциям и тренировкам!
`
}

❗️ Обновляйте свой профиль регулярно, чтобы видеть прогресс в тренировках и получать рекомендации, соответствующие вашим параметрам!

Что надо изменить?
`;

export const getSubscriptionMessage = (user: any) => {
  // Если у пользователя нет активной подписки
  if (!user.subscription || user.subscription.level === 'NONE') {
    return `
📅 Подписка отсутствует

❗ Чтобы воспользоваться полным функционалом, рекомендуем оформить подписку. 

💳 Ваш баланс: ${user.account} руб.

Выберите один из уровней подписки и начните свой путь к успеху!
  `;
  }

  // Если подписка активна
  const subscriptionEndDate = new Date(
    user.subscription.endDate,
  ).toLocaleDateString();

  return `
🎉 Ваша подписка активна!

🔑 Уровень подписки: ${getSubscriptionLevelLabel(user.subscription.level)}
📅 Подписка действует до: ${subscriptionEndDate}
💪 Доступ к эксклюзивным тренировкам, урокам и советам тренера.

💳 Ваш баланс: ${user.account} руб.

Благодарим вас за доверие! Поддерживайте форму и достигайте новых высот!
  `;
};

export function getTarifsMessage() {
  return `
📈 Тарифы

🔹 Подписка Минимальная. (${BASIC_PRICE} рублей/месяц)
   -
   -
   -

🔹 Подписка Базовая. (${MEDIUM_PRICE} рублей/месяц)
   -
   -
   -

🔹 Подписка VIP. (${VIP_PRICE} рублей/месяц)
   -
   -
   -
`;
}

export const nameMessage = 'Как тебя зовут?';
export const ageMessage = 'Сколько тебе лет?';
export const trainingFormatMessage = 'Какой формат тренировок тебя интересует?';
export const weightMessage = 'Сколько ты весишь? (кг)';
export const skillLevelMessage = 'Какой у тебя уровень физической подготовки?';
export const amountMessage = 'Введи сумму пополнения';
