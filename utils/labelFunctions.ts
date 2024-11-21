import {
  EnumSkillLevel,
  EnumSubscriptionLevel,
  EnumTrainingFormat,
} from '@prisma/client';

export function getSkillLevelLabel(skill: EnumSkillLevel) {
  switch (skill) {
    case EnumSkillLevel.BEGINNER:
      return 'Начальный';
    case EnumSkillLevel.INTERMEDIATE:
      return 'Продвинутый';
    case EnumSkillLevel.ADVANCED:
      return 'Профессиональный';
  }
}

export function getTrainingFormatLabel(format: EnumTrainingFormat) {
  switch (format) {
    case EnumTrainingFormat.HOME:
      return 'Дома';
    case EnumTrainingFormat.GYM:
      return 'В зале';
    case EnumTrainingFormat.STREET:
      return 'На улице';
  }
}

export function getSubscriptionLevelLabel(level: EnumSubscriptionLevel) {
  switch (level) {
    case EnumSubscriptionLevel.BASIC:
      return 'Минимальная';
    case EnumSubscriptionLevel.MEDIUM:
      return 'Базовая';
    case EnumSubscriptionLevel.VIP:
      return 'VIP';
    case EnumSubscriptionLevel.NONE:
      return 'Нет';
  }
}
